import * as fs from 'fs/promises';
import * as path from 'path';

import { asExecResultOrThrow } from './asExecResultOrThrow';
import { genTempDirForRhachet } from './invokeReviewSkill';

export { execAsync } from './execAsync';
import { execAsync } from './execAsync';

/**
 * .what = the demo target role slug review.by runs its rubrics for
 * .why = a self-contained fixture role, not a real ehmpathy role, so tests never depend on
 *        rubrics.yml files shipped elsewhere
 */
export const DEMO_ROLE = 'demo';

/**
 * .what = writes a rubrics.yml (and its rule files) into a fixture role dir
 * .why = each case needs a different rubrics.yml; a role slug defaults to the demo role, but a
 *        case may name another (e.g. mechanic, behaver) to prove the rubrics.yml → render
 *        roundtrip for a named role — review.by globs `.agent/repo=*​/role=$role/…`
 */
export const setDemoRoleRubrics = async (input: {
  cwd: string;
  rubricsYml: string;
  /** target role slug; defaults to the demo role */
  role?: string;
  /** rule files to write under the role, keyed by repo-relative path */
  ruleFiles?: Record<string, string>;
}): Promise<void> => {
  const role = input.role ?? DEMO_ROLE;
  const reviewsDir = path.join(
    input.cwd,
    '.agent',
    'repo=demo',
    `role=${role}`,
    'briefs',
    'reviews',
  );
  await fs.mkdir(reviewsDir, { recursive: true });
  await fs.writeFile(path.join(reviewsDir, 'rubrics.yml'), input.rubricsYml);

  for (const [relPath, content] of Object.entries(input.ruleFiles ?? {})) {
    const absPath = path.join(input.cwd, relPath);
    await fs.mkdir(path.dirname(absPath), { recursive: true });
    await fs.writeFile(absPath, content);
  }
};

/**
 * .what = clones the review-by fixture, links the requested roles, returns the temp cwd
 * .why = a hermetic git repo with node_modules symlinks and the reviewer role linked, so
 *        `rhx review` finds its skill. a case reviewing a real shipped role (e.g. learner) needs
 *        that role linked too, since its rubrics.yml globs `.agent/repo=bhrain/role=<role>/…`
 */
export const genReviewByFixture = async (input: {
  slug: string;
  clone: string;
  /** roles to link beyond reviewer (e.g. 'learner' so its rubrics.yml rule globs match) */
  linkRoles?: string[];
}): Promise<string> => {
  const cwd = genTempDirForRhachet({ slug: input.slug, clone: input.clone });
  const roles = ['reviewer', ...(input.linkRoles ?? [])];
  for (const role of roles)
    await execAsync(`npx rhachet roles link --role ${role}`, { cwd });
  return cwd;
};

/**
 * .what = the error header line of a captured stderr — the human-readable message
 * .why = a fail-fast error prints `✋ <message>` (or `💥 <message>`), then a metadata block
 *        carrying the run's non-deterministic tempdir cwd. the header line is deterministic, so
 *        a drift snapshot captures it and only it.
 * .note = found by its glyph, never by position — a run dispatched through `rhx` leads stderr
 *         with rhachet's own banner, so the first non-empty line is not the message. ansi
 *         escapes are stripped first; a header-less stderr falls back to its first non-empty line.
 */
export const asStderrMessageLine = (input: { stderr: string }): string => {
  const lines = input.stderr
    // eslint-disable-next-line no-control-regex
    .replace(/\u001b\[[0-9;]*m/g, '')
    .split('\n')
    .filter((line) => line.trim() !== '');
  const header = lines.find((line) => /^\s*(✋|💥)/u.test(line));
  return (header ?? lines[0] ?? '').trim();
};

/**
 * .what = sanitizes review.by stdout so a negative-path / journey snapshot is stable
 * .why = strips only machine-specific noise — ansi bytes, the volatile temp-dir prefix, the
 *        harness's dispatch banner, and the transient live-stream block — so the snapshot
 *        captures the contract text a human sees. blocker/nitpick counts stay real
 *        (rule.forbid.snapshot-visual-blemishes); when.repeatably(EVERY) proves them stable.
 */
export const sanitizeReviewByOutputForSnapshot = (output: string): string => {
  return (
    output
      // strip ANSI color/style escape codes
      // biome-ignore lint/suspicious/noControlCharactersInRegex: the ESC control byte is the intended target
      .replace(/\x1b\[[0-9;]*m/g, '')
      // strip every `🪨 run solid skill …` rhx dispatch banner line — a real `rhx <skill>` dispatch
      // interleaves this parent-process banner with the child's stdout non-deterministically, so
      // an explicit global strip makes its removal deterministic regardless of interleave order
      .replace(/^[ \t]*🪨 run solid skill[^\n]*\n?/gm, '')
      // strip the transient live-stream block that precedes the settled tree. review.by streams
      // each rubric as an incremental row as it runs, then prints the settled tree — ephemeral
      // status feedback, not the contract payload a snapshot vibechecks. the anchor is
      // glyph-agnostic: it matches the settled tree's shape (a mascot line, a blank, then the
      // `<artifact> review.by --role <role>` line followed by `rubrics`), never the live block's
      // own header (followed by a bare pipe). an error case has no settled tree, so this no-ops.
      .replace(
        /^[\s\S]*\n(?=\S[^\n]*\n\n\S[^\n]* review\.by --role [^\n]*\n {3}[└├]─ rubrics)/,
        '',
      )
      // collapse the volatile temp-dir prefix; keep the stable suffix
      .replace(/\/tmp\/test-fns\/[^/]+\/\.temp\/[^/]+\//g, '[TEMP]/')
  );
};

/**
 * .what = sanitizes a disintermediated raw base-review stdout so a `--for` snapshot is stable
 * .why = a `--for` run disintermediates to the base `rhx review` stdout, which carries volatile
 *        telemetry (token counts, cost, latency, timestamped log paths, and — for a streamed
 *        human run — a live spinner) a byte-exact snapshot would fight
 *        (rule.require.repeatable-for-llm-tests). drop the volatile blank-line-separated
 *        blocks and the `logs:` child line; mask the temp-dir prefix. what remains is the
 *        deterministic contract chrome that proves disintermediation. counts stay real
 *        (rule.forbid.snapshot-visual-blemishes); when.repeatably(EVERY) proves them stable.
 * .note = the spinner block appears only on a streamed human `--for` run (a guardless child
 *         review emits a live spinner); a buffered run has none, so the filter simply no-ops.
 */
export const sanitizeRawReviewForSnapshot = (output: string): string => {
  const cleaned = output
    // strip ANSI color/style escape codes
    // biome-ignore lint/suspicious/noControlCharactersInRegex: the ESC control byte is the intended target
    .replace(/\x1b\[[0-9;]*m/g, '')
    // collapse the volatile temp-dir prefix; keep the stable suffix
    .replace(/\/tmp\/test-fns\/[^/]+\/\.temp\/[^/]+\//g, '[TEMP]/');

  // drop the volatile telemetry blocks (metrics/logs, and the spinner block via `elapsed:`) plus
  // the `logs:` child line, keep the deterministic contract chrome. a review with no findings
  // echoes an empty body here (findings live in the review file, not stdout).
  return cleaned
    .split(/\n\s*\n/)
    .filter((block) => !/^\s*(🔭 metrics|🪵 logs|✨ metrics)/.test(block))
    .filter((block) => !/elapsed:/.test(block))
    .map((block) =>
      block
        .split('\n')
        .filter((line) => !/^\s*├─ logs:/.test(line))
        .join('\n'),
    )
    .join('\n\n')
    .trim();
};

/**
 * .what = the `🔭 metrics.expected` block of a raw review stdout, alone
 * .why = that block is computed before the brain is called — from the fixture, the flags, and
 *        the rate card — so it is deterministic on an llm-run suite whose verdict is not. a
 *        snapshot of it pins the scope tree (rules, refs, targets) and the estimate a caller
 *        reads, where `sanitizeRawReviewForSnapshot` drops it as telemetry
 * .note = ansi bytes are stripped first; an absent block yields '' so the snapshot fails loud
 */
export const asReviewMetricsExpectedBlock = (input: { stdout: string }): string =>
  input.stdout
    // biome-ignore lint/suspicious/noControlCharactersInRegex: the ESC control byte is the intended target
    .replace(/\x1b\[[0-9;]*m/g, '')
    .split(/\n\s*\n/)
    .find((block) => /^\s*🔭 metrics\.expected/.test(block))
    ?.trim() ?? '';

/**
 * .what = invokes a role's own review.by via the clean `rhx review.by --role <role>` form
 * .why = the everyday human form — rhachet resolves the review.by skill owned by that role,
 *        which delegates to the base. proves the wrapper pattern end to end: a role must ship
 *        its own review.by skill, or this fails with `no skill "review.by" found with --role
 *        <role>`. distinct from invokeReviewByViaRhx (targets the base directly) and
 *        invokeReviewByWrapper (bashes the wrapper file).
 */
export const invokeReviewByRoleViaRhx = async (input: {
  role: string;
  for?: string;
  paths?: string;
  brain?: string;
  cwd: string;
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  const rhxPath = path.join(input.cwd, 'node_modules/.bin/rhx');

  const args = [
    'review.by',
    `--role ${input.role}`,
    input.for ? `--for "${input.for}"` : '',
    input.paths ? `--paths "${input.paths}"` : '',
    input.brain ? `--brain "${input.brain}"` : '',
  ].filter(Boolean);

  const cmd = [`"${rhxPath}"`, ...args].join(' ');

  try {
    const result = await execAsync(cmd, {
      cwd: input.cwd,
      env: { ...process.env },
    });
    return { ...result, code: 0 };
  } catch (error) {
    // a nonzero exit is a skill result; any other fault rethrows (rule.forbid.failhide)
    return asExecResultOrThrow({ error });
  }
};

/**
 * .what = invokes the base review.by skill via the real `rhx` dispatch layer
 * .why = the shell-entry harness invokes review.by.sh directly, below rhachet dispatch, so it
 *        never exercises how `rhx review.by --repo bhrain --role reviewer` forwards
 *        --repo/--role/--skill into the skill's argv — exactly what a real human (and a role's own
 *        wrapper) hits. this harness dispatches through `rhx` so the forwarded flags reach the
 *        base's parser for real.
 *
 * the `--` separates rhachet's dispatch args from the skill's own args: rhachet forwards
 * --repo/--role/--skill regardless, and the tokens after `--` are the target-role args the base
 * parses (with --role last-wins, so a `-- --role demo` overrides the forwarded dispatch --role).
 */
export const invokeReviewByViaRhx = async (input: {
  /** the target role whose rubrics to run, passed after `--` (last-wins over the dispatch role) */
  targetRole?: string;
  for?: string;
  paths?: string;
  brain?: string;
  /** extra raw args appended after `--` (e.g. a typo for the unknown-flag boundary) */
  extraArgs?: string[];
  cwd: string;
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  const rhxPath = path.join(input.cwd, 'node_modules/.bin/rhx');

  // dispatch args: rhachet resolves the base skill by repo+role and forwards these into argv
  const dispatchArgs = ['review.by', '--repo', 'bhrain', '--role', 'reviewer'];

  // skill args: the tokens after `--` the base parses as its own (target role, scope, brain)
  const skillArgs = [
    input.targetRole ? `--role "${input.targetRole}"` : '',
    input.for ? `--for "${input.for}"` : '',
    input.paths ? `--paths "${input.paths}"` : '',
    input.brain ? `--brain "${input.brain}"` : '',
    ...(input.extraArgs ?? []),
  ].filter(Boolean);

  const cmd = [`"${rhxPath}"`, ...dispatchArgs, '--', ...skillArgs].join(' ');

  try {
    const result = await execAsync(cmd, {
      cwd: input.cwd,
      env: { ...process.env },
    });
    return { ...result, code: 0 };
  } catch (error) {
    // a nonzero exit is a skill result; any other fault rethrows (rule.forbid.failhide)
    return asExecResultOrThrow({ error });
  }
};

/**
 * .what = invokes a role's own review.by wrapper, which delegates to the bhrain base
 * .why = the real extension usecase: a role ships a thin review.by that loads the base cli
 *        node-direct — `exec node -e "import('rhachet-roles-bhrain/cli/review.by')…" -- "$@"`,
 *        the one shape rule.require.review-by-wrapper-pattern prescribes (a second `rhx`
 *        dispatch would print a doubled banner). this harness invokes the demo role's wrapper
 *        with the same forwarded dispatch flags rhachet injects (--skill/--role), so the whole
 *        chain runs for real: wrapper → base cli → the demo role's rubrics. the forwarded
 *        `--role <role>` is what names the role; the wrapper adds none of its own.
 */
export const invokeReviewByWrapper = async (input: {
  /** the role whose wrapper to invoke; it picks the wrapper path, and reaches the base through the forwarded --role, never the wrapper */
  role: string;
  paths?: string;
  brain?: string;
  /** raw human args (e.g. --for slug) appended after the simulated dispatch flags */
  extraArgs?: string[];
  cwd: string;
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  const wrapperPath = path.join(
    input.cwd,
    `.agent/repo=demo/role=${input.role}/skills/review.by.sh`,
  );
  const binDir = path.join(input.cwd, 'node_modules/.bin');

  // simulate what rhachet forwards into the wrapper's argv when a user runs
  // `rhx review.by --role demo ...`: the dispatch flags land in the wrapper's "$@" ahead of the
  // user's scope flags. the wrapper passes them through to the base, which must tolerate them.
  const forwardedDispatchArgs = ['--skill', 'review.by', '--role', input.role];

  const userArgs = [
    input.paths ? `--paths "${input.paths}"` : '',
    input.brain ? `--brain "${input.brain}"` : '',
    ...(input.extraArgs ?? []),
  ].filter(Boolean);

  const cmd = [
    `bash "${wrapperPath}"`,
    ...forwardedDispatchArgs,
    ...userArgs,
  ].join(' ');

  try {
    const result = await execAsync(cmd, {
      cwd: input.cwd,
      // put the fixture's node_modules/.bin on PATH, the way a real role author's shell has it.
      // the node-direct wrapper reaches the base through the fixture's node_modules, not via rhx
      env: { ...process.env, PATH: `${binDir}:${process.env.PATH ?? ''}` },
    });
    return { ...result, code: 0 };
  } catch (error) {
    // a nonzero exit is a skill result; any other fault rethrows (rule.forbid.failhide)
    return asExecResultOrThrow({ error });
  }
};

/**
 * .what = invokes the review.by skill via its shell entrypoint
 * .why = enables blackbox acceptance tests against the skill as invoked by rhachet. invokes the
 *        shell entry directly (same code path rhachet runs) since temp fixtures lack the full
 *        .agent tree that `npx rhachet run` expects.
 */
export const invokeReviewBySkill = async (input: {
  role?: string;
  for?: string;
  paths?: string;
  diffs?: string;
  mode?: string;
  brain?: string;
  output?: string;
  extraArgs?: string[];
  cwd: string;
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  const skillPath = path.join(
    input.cwd,
    '.agent/repo=bhrain/role=reviewer/skills/review.by.sh',
  );

  const cmd = [
    `bash "${skillPath}"`,
    input.role ? `--role "${input.role}"` : '',
    input.for ? `--for "${input.for}"` : '',
    input.paths ? `--paths "${input.paths}"` : '',
    input.diffs ? `--diffs "${input.diffs}"` : '',
    input.mode ? `--mode ${input.mode}` : '',
    input.brain ? `--brain "${input.brain}"` : '',
    input.output ? `--output "${input.output}"` : '',
    // arbitrary raw args (e.g. a typo'd --rool) for the unknown-flag boundary test
    ...(input.extraArgs ?? []),
  ]
    .filter(Boolean)
    .join(' ');

  try {
    const result = await execAsync(cmd, {
      cwd: input.cwd,
      env: { ...process.env },
    });
    return { ...result, code: 0 };
  } catch (error) {
    // a nonzero exit is a skill result; any other fault rethrows (rule.forbid.failhide)
    return asExecResultOrThrow({ error });
  }
};
