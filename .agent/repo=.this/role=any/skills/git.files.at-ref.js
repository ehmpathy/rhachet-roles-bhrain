/**
 * .what = write the tracked files a pathspec names, as they stand at a git ref, under
 *         `.temp/ref=<slug>/`, so any on-disk skill (a census, a glob) can read the old tree
 * .why  = a before/after census (cue counts on main vs head) needs the old files on disk, and a
 *         redirect of `git show` per file is the tactic this replaces
 *
 * usage:
 *   rhx git.files.at-ref --ref origin/main --path 'src/domain.roles/learner/briefs'
 *   rhx git.files.at-ref --ref origin/main --path 'src/domain.roles/*\/briefs' --path '...'
 *
 * guarantee:
 *   - writes only under `.temp/ref=<slug>/`; the dir is emptied first, so a rerun converges
 *   - each file keeps its repo-relative path; a symlink at the ref is skipped
 *   - exit 2 on bad input (no --ref, no --path, an unknown ref, a pathspec that names no file)
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// read the flags
const args = process.argv.slice(2);
const refs = [];
const paths = [];
for (let index = 0; index < args.length; index += 1) {
  const flag = args[index];
  const value = args[index + 1];
  if (flag === '--ref' && value) {
    refs.push(value);
    index += 1;
    continue;
  }
  if (flag === '--path' && value) {
    paths.push(value);
    index += 1;
    continue;
  }
  // the flags rhx passes to name the skill it ran
  if (['--skill', '--repo', '--role'].includes(flag) && value) {
    index += 1;
    continue;
  }
  if (flag === '--help' || flag === '-h') {
    console.log('usage: rhx git.files.at-ref --ref <ref> --path <pathspec> [--path …]');
    process.exit(0);
  }
  console.error(`✋ ConstraintError: unknown flag or absent value: ${flag}`);
  process.exit(2);
}
if (refs.length !== 1 || paths.length === 0) {
  console.error('✋ ConstraintError: one --ref and at least one --path are required');
  console.error('   └─ e.g. rhx git.files.at-ref --ref origin/main --path src/domain.roles/learner/briefs');
  process.exit(2);
}
const ref = refs[0];

// the repo root and the out dir
const root = execFileSync('git', ['rev-parse', '--show-toplevel']).toString().trim();
const slug = ref.replace(/[^A-Za-z0-9_-]+/g, '.');
const outDir = path.join(root, '.temp', `ref=${slug}`);

// reject an unknown ref before any write
try {
  execFileSync('git', ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], { cwd: root });
} catch {
  console.error(`✋ ConstraintError: no commit at ref ${ref}`);
  process.exit(2);
}

// list the files at the ref, with their modes, so a symlink (120000) is skipped
const listed = execFileSync(
  'git',
  ['ls-tree', '-r', '-z', '--full-tree', ref, '--', ...paths],
  { cwd: root, maxBuffer: 256 * 1024 * 1024 },
)
  .toString()
  .split('\0')
  .filter((line) => line.length > 0)
  .map((line) => {
    const [meta, file] = line.split('\t');
    const [mode, kind, sha] = meta.split(' ');
    return { mode, kind, sha, file };
  })
  .filter((entry) => entry.kind === 'blob' && entry.mode !== '120000');
if (listed.length === 0) {
  console.error(`✋ ConstraintError: the pathspec names no file at ${ref}`);
  console.error(`   └─ paths: ${paths.join(' · ')}`);
  process.exit(2);
}

// empty the out dir, then write each blob at its repo-relative path
fs.rmSync(outDir, { recursive: true, force: true });
listed.forEach((entry) => {
  const at = path.join(outDir, entry.file);
  fs.mkdirSync(path.dirname(at), { recursive: true });
  fs.writeFileSync(
    at,
    execFileSync('git', ['cat-file', 'blob', entry.sha], { cwd: root, maxBuffer: 64 * 1024 * 1024 }),
  );
});

// report
console.log('🦉 the old tree, set down beside the new');
console.log('');
console.log('🐚 git.files.at-ref');
console.log(`   ├─ ref: ${ref}`);
console.log(`   ├─ paths: ${paths.join(' · ')}`);
console.log(`   ├─ files: ${listed.length}`);
console.log(`   └─ into: ${path.relative(root, outDir)}/`);
