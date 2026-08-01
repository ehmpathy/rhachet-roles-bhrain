import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';

import { genTempDirForRhachet } from './invokeReviewSkill';

export const execAsync = promisify(exec);

/**
 * .what = the demo target role slug review.by runs its rubrics for
 * .why = the acceptance fixtures declare a self-contained role (not a real ehmpathy role) so the
 *        tests never depend on rubrics.yml files shipped elsewhere.
 */
export const DEMO_ROLE = 'demo';

/**
 * .what = writes a rubrics.yml (and its rule files) into a fixture role dir
 * .why = each error/boundary case needs a different rubrics.yml; a helper keeps the setup terse and
 *        colocates the role layout the review.by communicator globs for. the role slug defaults to
 *        the demo role, but a case may name a different one (e.g. mechanic, behaver) to prove the
 *        rubrics.yml → render roundtrip for a NAMED role — the review.by communicator globs
 *        `.agent/repo=*​/role=$role/…`, so any slug the fixture writes here is discoverable.
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
 * .why = every case starts from the same hermetic layout: a git repo with node_modules symlinks and
 *        the reviewer role linked so `rhx review` (dispatched per rubric) finds its skill. some
 *        cases review a REAL shipped role (e.g. learner), whose rubrics.yml points at rule files
 *        under `.agent/repo=bhrain/role=<role>/briefs/…`; those globs only match once that role is
 *        linked too, so the caller may name extra roles to link beside reviewer.
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
 * .what = sanitizes review.by stdout so a negative-path / journey snapshot is stable
 * .why = strips only the machine-specific noise — ANSI control bytes and the volatile temp-dir
 *        prefix — so the snapshot captures the legible contract text a human would see. the
 *        blocker/nitpick COUNTS are left intact: the demo fixture drives one unambiguous
 *        violation, so the review verdict is deterministic (1 blocker, 0 nitpicks) and the real
 *        counts belong in the snapshot (rule.forbid.snapshot-visual-blemishes — no placeholder).
 *        when.repeatably(EVERY) locally proves the count holds across attempts. this mirrors the
 *        repo's sanitizeTimeForSnapshot pattern (mask only the non-deterministic noise).
 */
export const sanitizeReviewByOutputForSnapshot = (output: string): string => {
  return (
    output
      // strip ANSI color/style escape codes (visual blemishes in a snapshot)
      // biome-ignore lint/suspicious/noControlCharactersInRegex: the ESC control byte is the intended target
      .replace(/\x1b\[[0-9;]*m/g, '')
      // strip EVERY `🪨 run solid skill …` rhx dispatch banner line — machine noise the harness
      // stamps for each `rhx <skill>` dispatch. when review.by is invoked through the REAL rhx
      // layer (the dispatch + wrapper suites), the parent-process banner interleaves with the
      // child's stdout non-deterministically: on a cold attempt it can land in a spot the
      // mascot-strip below does not catch, so a byte snapshot flakes. an explicit global strip
      // makes the banner's removal deterministic regardless of interleave order. (the aggregate
      // tree carries no banner of its own — review.by never stamps one — so this only ever removes
      // the harness's dispatch line.)
      .replace(/^[ \t]*🪨 run solid skill[^\n]*\n?/gm, '')
      // strip the transient LIVE-STREAM block that precedes the settled tree. review.by streams
      // each rubric as an incremental peer-style row (formatGuardReviewerTree) as it runs, then
      // prints the settled tree below it — the same "progress then settled tree" shape
      // route.stone.set has. the streamed block is ephemeral status feedback
      // (rule.require.status-feedback), not the contract payload a snapshot vibechecks, and its
      // spinner/duration are run-order noise. so drop all lines up to the settled mascot header.
      // the anchor is GLYPH-AGNOSTIC: it does not name the mascot emoji (which a vibe override can
      // swap to any glyph — 🦉, 🐢, 🦫, …) but the settled tree's invariant SHAPE — a mascot-phrase
      // line, a blank, then the `<artifact> review.by --role <role>` line whose next line opens the
      // `rubrics` bucket. the streamed block's own `review.by --role` line is followed by a bare
      // pipe, never `rubrics`, so only the settled header matches. an explicit
      // `.toContain('r1: <slug>')` assertion proves the stream renders peer-style. an error case has
      // no settled tree, so this no-ops there and the error message is preserved.
      .replace(
        /^[\s\S]*\n(?=\S[^\n]*\n\n\S[^\n]* review\.by --role [^\n]*\n {3}[└├]─ rubrics)/,
        '',
      )
      // collapse the volatile temp-dir prefix; keep the stable suffix
      .replace(/\/tmp\/test-fns\/[^/]+\/\.temp\/[^/]+\//g, '[TEMP]/')
  );
};

/**
 * .what = sanitizes a DISINTERMEDIATED raw base-review stdout so a `--for` snapshot is stable
 * .why = a `--for` run disintermediates to the base `rhx review` stdout (no review.by tree), and
 *        that stdout carries volatile telemetry — token counts, cost, latency, timestamped log
 *        paths, AND (for a human streamed run) the live progress spinner — that a byte-exact snapshot
 *        would fight (rule.require.repeatable-for-llm-tests). the base review emits its telemetry in
 *        blank-line-separated blocks (see genReviewOutputStdout / stepReview), so we drop the volatile
 *        blocks (`🔭 metrics.expected`, `🪵 logs`, `✨ metrics.realized`, and the `elapsed:` spinner
 *        block), the single volatile `logs:` child line, then mask the temp-dir prefix. what remains
 *        is the DETERMINISTIC contract chrome the snapshot vibechecks: the `🦉 let's review` scope
 *        block, the verdict header, the `review:` output path, and the `summary` counts — the exact
 *        shape that proves disintermediation (a plain review, never a review.by tree). the demo
 *        fixture drives one unambiguous verdict, so the counts are stable and belong in the snapshot
 *        (rule.forbid.snapshot-visual-blemishes — real counts, no placeholder); when.repeatably(EVERY)
 *        proves they hold across attempts. mirrors sanitizeReviewByOutputForSnapshot (mask only noise).
 * .note = the spinner block is present ONLY on a streamed human `--for` run (the child review runs
 *         without guard context, so it emits its live `🔍 <phrase>` + `elapsed:` spinner). a buffered
 *         run has no spinner block, so the `elapsed:` filter simply no-ops there. on a real terminal
 *         the spinner's `\r` frames overwrite in place; a buffered test capture holds every frame, so
 *         we drop the whole block rather than snapshot hundreds of volatile ticks.
 */
export const sanitizeRawReviewForSnapshot = (output: string): string => {
  const cleaned = output
    // strip ANSI color/style escape codes (visual blemishes in a snapshot)
    // biome-ignore lint/suspicious/noControlCharactersInRegex: the ESC control byte is the intended target
    .replace(/\x1b\[[0-9;]*m/g, '')
    // collapse the volatile temp-dir prefix; keep the stable suffix
    .replace(/\/tmp\/test-fns\/[^/]+\/\.temp\/[^/]+\//g, '[TEMP]/');

  // drop the volatile telemetry BLOCKS (blank-line separated) — the metrics/logs blocks AND the
  // live-spinner block (the only block that carries `elapsed:`) — plus the `logs:` child line, keep
  // the deterministic contract chrome. a review with no findings echoes no body here (the findings
  // live in the review FILE, not stdout), so what remains is stable across runs.
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
 * .what = invokes a role's OWN review.by via the clean `rhx review.by --role <role>` form
 * .why = this is the ergonomic, everyday form a human types — rhachet resolves the review.by skill
 *        OWNED BY that role (its wrapper), which then delegates to the base. it proves the wrapper
 *        pattern end to end: the role must ship its own review.by skill, or this fails with
 *        `no skill "review.by" found with --role <role>`. distinct from invokeReviewByViaRhx (which
 *        targets the base directly) and invokeReviewByWrapper (which bashes the wrapper file).
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
    // allowlist the EXPECTED fault: exec rejects a non-zero exit with an ExecException that holds
    // stdout/stderr/code — the boundary cases (exit 1/2) land here. any error WITHOUT those fields
    // is an unexpected fault (spawn ENOENT, a bug) and must fail loud (rule.forbid.failhide).
    if (
      !error ||
      typeof error !== 'object' ||
      !('stdout' in error || 'stderr' in error || 'code' in error)
    )
      throw error;
    // .cast = @types/node does not export ExecException as a narrowable type; the `in` guard above
    //         proves the shape. removable once @types/node exports ExecException (rule.forbid.as-cast).
    const execError = error as {
      stdout?: string;
      stderr?: string;
      code?: number;
    };
    return {
      stdout: execError.stdout ?? '',
      stderr: execError.stderr ?? '',
      code: execError.code ?? 1,
    };
  }
};

/**
 * .what = invokes the base review.by skill via the REAL `rhx` dispatch layer
 * .why = the shell-entry harness (invokeReviewBySkill) invokes review.by.sh directly, BELOW the
 *        rhachet dispatch — so it never exercises how `rhx review.by --repo bhrain --role reviewer`
 *        forwards --repo/--role/--skill into the skill's argv. that forward is exactly what a real
 *        user (and a role's own review.by wrapper) hits, and it broke the base until the parser
 *        learned to tolerate the dispatch flags. this harness closes that blind spot: it dispatches
 *        through `rhx` so the forwarded flags reach the base's parser for real.
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
    // allowlist the EXPECTED fault: exec rejects a non-zero exit with an ExecException that holds
    // stdout/stderr/code — the boundary cases (exit 1/2) land here. any error WITHOUT those fields
    // is an unexpected fault (spawn ENOENT, a bug) and must fail loud (rule.forbid.failhide).
    if (
      !error ||
      typeof error !== 'object' ||
      !('stdout' in error || 'stderr' in error || 'code' in error)
    )
      throw error;
    // .cast = @types/node does not export ExecException as a narrowable type; the `in` guard above
    //         proves the shape. removable once @types/node exports ExecException (rule.forbid.as-cast).
    const execError = error as {
      stdout?: string;
      stderr?: string;
      code?: number;
    };
    return {
      stdout: execError.stdout ?? '',
      stderr: execError.stderr ?? '',
      code: execError.code ?? 1,
    };
  }
};

/**
 * .what = invokes a ROLE's OWN review.by wrapper, which delegates to the bhrain base
 * .why = the real extension usecase: a role ships its own thin review.by that bakes in its role and
 *        calls the base via `rhx review.by --repo bhrain --role reviewer -- --role <role>`. this
 *        harness invokes the demo role's wrapper (a fixture asset) with the SAME forwarded dispatch
 *        flags rhachet injects (--skill/--role), so the whole chain runs for real:
 *        wrapper → base → the demo role's rubrics. it maximally reproduces the real invocation
 *        without a full role-package registration: `rhx` is put on PATH (as a global alias is), and
 *        the wrapper's own nested `rhx review.by ...` resolves the base linked in the fixture.
 */
export const invokeReviewByWrapper = async (input: {
  /** the role whose wrapper to invoke; its wrapper bakes this in and delegates to the base */
  role: string;
  paths?: string;
  brain?: string;
  /** raw user args (e.g. --for slug) appended after the simulated dispatch flags */
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
      // put the fixture's node_modules/.bin on PATH so the wrapper's bare `rhx` resolves, the way a
      // global rhx alias resolves for a real role author.
      env: { ...process.env, PATH: `${binDir}:${process.env.PATH ?? ''}` },
    });
    return { ...result, code: 0 };
  } catch (error) {
    // allowlist the EXPECTED fault: exec rejects a non-zero exit with an ExecException that holds
    // stdout/stderr/code — the boundary cases (exit 1/2) land here. any error WITHOUT those fields
    // is an unexpected fault (spawn ENOENT, a bug) and must fail loud (rule.forbid.failhide).
    if (
      !error ||
      typeof error !== 'object' ||
      !('stdout' in error || 'stderr' in error || 'code' in error)
    )
      throw error;
    // .cast = @types/node does not export ExecException as a narrowable type; the `in` guard above
    //         proves the shape. removable once @types/node exports ExecException (rule.forbid.as-cast).
    const execError = error as {
      stdout?: string;
      stderr?: string;
      code?: number;
    };
    return {
      stdout: execError.stdout ?? '',
      stderr: execError.stderr ?? '',
      code: execError.code ?? 1,
    };
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
    // allowlist the EXPECTED fault: node's exec rejects a non-zero exit with an ExecException
    // that carries stdout/stderr/code — the fail-fast boundary cases (exit 1/2) land here. any
    // error WITHOUT those fields is an unexpected fault (a spawn ENOENT, a bug) and must fail
    // loud, never masquerade as code:1 (rule.forbid.failhide).
    if (
      !error ||
      typeof error !== 'object' ||
      !('stdout' in error || 'stderr' in error || 'code' in error)
    )
      throw error;
    // .cast = @types/node does not export ExecException as a narrowable type; the `in` guard
    //         above proves it is that shape. the `??` fallbacks make each field safe if absent
    //         (rule.forbid.as-cast: an external-boundary cast, removable once @types/node exports
    //         ExecException).
    const execError = error as {
      stdout?: string;
      stderr?: string;
      code?: number;
    };
    return {
      stdout: execError.stdout ?? '',
      stderr: execError.stderr ?? '',
      code: execError.code ?? 1,
    };
  }
};
