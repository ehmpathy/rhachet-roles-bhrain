import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * .what = links a rhachet role into a fixture temp dir, served from a run-scoped cache
 * .why  = `npx rhachet roles link` is the single largest fixture cost in this suite. each
 *         call pays an npx lookup, then a node JIT boot of the whole rhachet cli —
 *         `bin/run` routes `roles link` to `run.jit`, NOT to the compiled bun binary that
 *         `roles boot|cost` gets. the suite pays that 322 times for output that is
 *         identical every time.
 *
 *         identical because of what the link actually writes: a tree of RELATIVE symlinks
 *         into node_modules/rhachet-roles-bhrain (see rhachet's symlinkFile — it stores
 *         `relative(targetDir, source)`), plus two small templated readmes. every fixture
 *         temp dir is created by genTempDir at the same depth under /tmp/test-fns/<repo>/
 *         .temp/, and each symlinks the same node_modules. so one real link is valid in
 *         all of them.
 *
 * .note = the cache is POPULATED by a real `npx rhachet roles link`. the cli is still
 *         exercised once per role per run — what is dropped is the 321 redundant
 *         re-proofs, never the proof itself.
 */

/**
 * .what = the cache key for a role's linked tree
 * .why  = the cached tree is a set of symlinks whose SHAPE tracks what is in dist/.
 *         content is always current (the links are relative and point through
 *         node_modules into the live dist), but the file SET changes when a brief or
 *         skill is added or removed. `npm run build` regenerates rhachet.repo.yml on
 *         every run, so its mtime is a cheap, sound stamp for that set.
 */
const asCacheKey = (input: { role: string; repo?: string }): string => {
  const manifest = path.resolve(process.cwd(), 'rhachet.repo.yml');
  const stamp = fs.existsSync(manifest)
    ? String(Math.floor(fs.statSync(manifest).mtimeMs))
    : 'no-manifest';
  const repo = input.repo ?? 'default';
  return `${input.role}.${repo}.${stamp}`;
};

/** .what = the dir that holds cached role trees, beside the fixture temp dirs */
const getCacheRoot = (): string => {
  const root = path.join(
    path.parse(process.cwd()).root,
    'tmp',
    'test-fns',
    '.agent-cache',
    path.basename(process.cwd()),
  );
  fs.mkdirSync(root, { recursive: true });
  return root;
};

/** .what = every path under a dir, relative, dirs included; [] if the dir is absent */
const getAllPathsUnder = (dir: string): string[] => {
  if (!fs.existsSync(dir)) return [];
  const found: string[] = [];
  const walk = (at: string, prefix: string): void => {
    for (const entry of fs.readdirSync(at, { withFileTypes: true })) {
      const rel = path.join(prefix, entry.name);
      found.push(rel);
      // do NOT descend through symlinks — they point into node_modules and the
      // link itself is the artifact we care about, not its target's contents
      if (entry.isDirectory() && !entry.isSymbolicLink())
        walk(path.join(at, entry.name), rel);
    }
  };
  walk(dir, '');
  return found;
};

/**
 * .what = copies the exact set of relative paths from one tree into another
 * .why  = a role link ADDS to .agent/ rather than replaces it, so a fixture that links
 *         two roles must end with both. a cache of the whole .agent/ would let the second
 *         role's copy clobber the first. a cache of only the delta keeps accumulation
 *         correct.
 */
const copyPaths = (input: {
  from: string;
  into: string;
  paths: string[];
}): void => {
  for (const rel of input.paths) {
    const src = path.join(input.from, rel);
    const dest = path.join(input.into, rel);
    const stat = fs.lstatSync(src);
    if (stat.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      continue;
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (fs.lstatSync(dest, { throwIfNoEntry: false }))
      fs.rmSync(dest, { force: true, recursive: true });
    if (stat.isSymbolicLink()) {
      fs.symlinkSync(fs.readlinkSync(src), dest);
      continue;
    }
    fs.copyFileSync(src, dest);
  }
};

/**
 * .what = runs the real cli link, then donates its result to the cache
 * .why  = the first fixture that needs a role pays the true cost and every later one
 *         reuses it. no separate scaffold dir is needed, which also guarantees the
 *         cached relative symlinks were computed at the same depth they get used at.
 */
const linkRoleForReal = (input: {
  role: string;
  repo?: string;
  cwd: string;
  cacheAt: string;
}): void => {
  const agentDir = path.join(input.cwd, '.agent');
  const before = new Set(getAllPathsUnder(agentDir));

  const repoFlag = input.repo ? ` --repo ${input.repo}` : '';
  execSync(`npx rhachet roles link --role ${input.role}${repoFlag}`, {
    cwd: input.cwd,
    stdio: 'pipe',
  });

  const after = getAllPathsUnder(agentDir);
  const delta = after.filter((rel) => !before.has(rel));

  // publish atomically: build beside the target, then rename. a parallel worker that
  // lost the race finds the dir present and discards its own copy.
  const staged = `${input.cacheAt}.staged.${process.pid}.${Math.random().toString(36).slice(2, 8)}`;
  try {
    fs.mkdirSync(staged, { recursive: true });
    copyPaths({ from: agentDir, into: staged, paths: delta });
    fs.writeFileSync(
      path.join(staged, '.delta.json'),
      JSON.stringify(delta, null, 2),
    );
    fs.renameSync(staged, input.cacheAt);
  } catch (error) {
    const code = (error as { code?: string }).code;
    // ENOTEMPTY/EEXIST = another worker published first; that result is equivalent
    if (code !== 'ENOTEMPTY' && code !== 'EEXIST') throw error;
  } finally {
    fs.rmSync(staged, { recursive: true, force: true });
  }
};

/**
 * .what = links a role into a fixture temp dir
 * .why  = drop-in for `execAsync('npx rhachet roles link --role X', { cwd })`, minus the
 *         repeated npx + JIT boot
 */
export const linkRole = async (input: {
  role: string;
  repo?: string;
  cwd: string;
}): Promise<void> => {
  const cacheAt = path.join(getCacheRoot(), asCacheKey(input));

  // cache miss: pay the real cli cost once, which also writes into cwd directly
  if (!fs.existsSync(cacheAt)) {
    linkRoleForReal({ ...input, cacheAt });
    return;
  }

  const delta: string[] = JSON.parse(
    fs.readFileSync(path.join(cacheAt, '.delta.json'), 'utf8'),
  );
  copyPaths({
    from: cacheAt,
    into: path.join(input.cwd, '.agent'),
    paths: delta,
  });
};
