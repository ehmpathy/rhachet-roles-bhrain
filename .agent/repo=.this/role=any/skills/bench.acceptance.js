#!/usr/bin/env node
// .what = measure the acceptance suite: wall clock, build-vs-jest split, per-file cost,
//         and the exact pass/fail set of every test case.
//
// .why  = a speedup with no measured before-and-after is a guess dressed as a tune, and a
//         faster suite that proves LESS is a regression. one instrument must answer both
//         questions or the two answers come from two rules nobody wrote down:
//           1. where does the wall clock actually go?      -> phases + per-file cost
//           2. did every case that passed before pass now? -> the case-level verdict set
//
//         a stopwatch alone answers 1 and licenses a test deletion to win. a case count
//         alone answers 2 and hides where the time sits. so they ship together.
//
// usage:
//   bench.acceptance.js run     --label before            # build+jest, split + per-file + verdicts
//   bench.acceptance.js run     --label after  --no-build # reuse an extant dist
//   bench.acceptance.js gate    --label bar               # time the PAVED `npm run test:acceptance`
//   bench.acceptance.js report  --label before            # print one run
//   bench.acceptance.js compare --before before --after after
//   bench.acceptance.js --help
//
// artifacts: .log/bench.acceptance/<label>.json
//
// exit:
//   run/gate/report = 0 always (they measure, they do not gate)
//   compare         = 0 if no regression, 2 if a case that PASSED before no longer passes

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const cmd = argv[0];
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};
const has = (name) => argv.includes(`--${name}`);

const REPO = process.cwd();
const OUT_DIR = path.join(REPO, '.log/bench.acceptance');

const HELP = `
🦉 bench.acceptance — measure the acceptance suite honestly

  usage:
    bench.acceptance.js run     --label <name> [--no-build] [--workers N] [--scope <regex>]
    bench.acceptance.js gate    --label <name>
    bench.acceptance.js report  --label <name>
    bench.acceptance.js compare --before <name> --after <name>

  commands:
    run       build (timed) + jest (timed, --json) -> phases, per-file cost, per-case verdicts
    gate      time the paved \`npm run test:acceptance\` end to end — THE bar, no instrument
    report    print a recorded run as a tree
    compare   diff two runs: wall clock delta + any case that PASSED before and does not now

  options:
    --label     name this measurement                      (required for run/gate/report)
    --no-build  skip the build phase, reuse extant dist/   (default: build)
    --workers   jest maxWorkers override                   (default: config, = 1)
    --scope     jest testPathPattern regex                 (default: all)

  artifacts:
    .log/bench.acceptance/<label>.json
`;

if (has('help') || has('h') || !cmd) {
  console.log(HELP);
  process.exit(0);
}

/** .what = run a command, return its wall clock in ms plus its exit code */
const timeIt = (bin, args, opts = {}) => {
  const began = Date.now();
  const res = spawnSync(bin, args, {
    cwd: REPO,
    stdio: opts.quiet ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    env: { ...process.env, ...opts.env },
    maxBuffer: 1024 * 1024 * 512,
  });
  return {
    ms: Date.now() - began,
    code: res.status ?? 1,
    stdout: res.stdout ? res.stdout.toString() : '',
    stderr: res.stderr ? res.stderr.toString() : '',
  };
};

const asMinSec = (ms) => {
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  return `${Math.floor(s / 60)}m${(s % 60).toFixed(0).padStart(2, '0')}s`;
};

const saveRun = (label, payload) => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const at = path.join(OUT_DIR, `${label}.json`);
  fs.writeFileSync(at, JSON.stringify(payload, null, 2));
  return at;
};

const loadRun = (label) => {
  const at = path.join(OUT_DIR, `${label}.json`);
  if (!fs.existsSync(at)) {
    console.error(`🦉 no run recorded at ${at}`);
    console.error(`   fix: bench.acceptance.js run --label ${label}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(at, 'utf8'));
};

/**
 * .what = flatten a jest --json result into per-file cost + per-case verdict
 * .why  = per-file cost says WHERE the time is; per-case verdict is the only record that can
 *         prove a faster suite still proves the same amount. a file-level pass/fail cannot —
 *         a file that drops half its cases still reads "passed".
 */
const asRunShape = (jestJson) => {
  const files = [];
  const cases = {};
  for (const tr of jestJson.testResults ?? []) {
    const rel = path.relative(REPO, tr.testFilePath ?? tr.name ?? '');
    files.push({
      file: rel,
      // .note = jest 30's --json payload has NO perfStats key at all (verified via
      //         `bench.acceptance shape`: keys are assertionResults, endTime, message,
      //         name, startTime, status, summary). endTime-startTime is the only
      //         per-file duration on offer. the old perfStats.runtime read silently
      //         yielded 0 for every file.
      ms:
        tr.perfStats?.runtime ??
        (tr.endTime ?? 0) - (tr.startTime ?? 0),
      status: tr.status ?? 'unknown',
    });
    for (const a of tr.assertionResults ?? []) {
      cases[`${rel} :: ${a.fullName}`] = a.status; // passed | failed | pending | todo
    }
  }
  files.sort((a, b) => b.ms - a.ms);
  return {
    files,
    cases,
    totals: {
      suites: jestJson.numTotalTestSuites ?? 0,
      suitesPassed: jestJson.numPassedTestSuites ?? 0,
      suitesFailed: jestJson.numFailedTestSuites ?? 0,
      cases: jestJson.numTotalTests ?? 0,
      casesPassed: jestJson.numPassedTests ?? 0,
      casesFailed: jestJson.numFailedTests ?? 0,
      casesSkipped:
        (jestJson.numPendingTests ?? 0) + (jestJson.numTodoTests ?? 0),
    },
  };
};

const printRun = (run) => {
  console.log(`\n🦉 bench.acceptance — ${run.label}`);
  console.log(`   └─ measured ${run.at}`);
  console.log(`\n   phases`);
  for (const [name, ms] of Object.entries(run.phases)) {
    console.log(`   ├─ ${name.padEnd(16)} ${asMinSec(ms).padStart(9)}`);
  }
  console.log(`   └─ ${'TOTAL'.padEnd(16)} ${asMinSec(run.wallMs).padStart(9)}`);

  if (run.totals) {
    const t = run.totals;
    console.log(`\n   verdicts`);
    console.log(
      `   ├─ suites    ${t.suitesPassed}/${t.suites} passed, ${t.suitesFailed} failed`,
    );
    console.log(
      `   └─ cases     ${t.casesPassed}/${t.cases} passed, ${t.casesFailed} failed, ${t.casesSkipped} skipped`,
    );
  }

  if (run.files?.length) {
    const summed = run.files.reduce((s, f) => s + f.ms, 0);
    const top = run.files.slice(0, 20);
    console.log(
      `\n   slowest files (top 20 of ${run.files.length}; summed file time ${asMinSec(summed)})`,
    );
    for (const f of top) {
      const pct = ((f.ms / summed) * 100).toFixed(1);
      console.log(
        `   ├─ ${asMinSec(f.ms).padStart(8)}  ${pct.padStart(4)}%  ${f.file.replace('blackbox/', '')}`,
      );
    }
    const rest = run.files.slice(20).reduce((s, f) => s + f.ms, 0);
    console.log(
      `   └─ ${asMinSec(rest).padStart(8)}  ${((rest / summed) * 100).toFixed(1).padStart(4)}%  (the other ${run.files.length - top.length} files)`,
    );
  }
  console.log('');
};

// -- run -----------------------------------------------------------------------
if (cmd === 'run') {
  const label = flag('label', null);
  if (!label) {
    console.error('🦉 --label is required.  fix: run --label before');
    process.exit(1);
  }
  const phases = {};
  const wallBegan = Date.now();

  if (!has('no-build')) {
    console.log('🦉 phase: build ...');
    const b = timeIt('npm', ['run', 'build']);
    phases.build = b.ms;
    if (b.code !== 0) {
      console.error('🦉 build failed — measurement aborted');
      process.exit(1);
    }
  }

  const jsonAt = path.join(OUT_DIR, `${label}.jest.json`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const jestArgs = [
    'jest',
    '-c',
    './jest.acceptance.config.ts',
    '--forceExit',
    '--passWithNoTests',
    '--json',
    `--outputFile=${jsonAt}`,
  ];
  // mirror the paved `test:acceptance` command exactly — it passes --runInBand, which is
  // NOT the same as maxWorkers:1 (in-band runs in the main process, no worker spawn).
  // a before/after that differs on this measures two different things.
  if (has('in-band')) jestArgs.push('--runInBand');
  const workers = flag('workers', null);
  if (workers) jestArgs.push(`--maxWorkers=${workers}`);
  const scope = flag('scope', null);
  if (scope) jestArgs.push('--testPathPatterns', scope);

  // the two switches that select which side of the before/after is measured
  const env = {};
  if (has('link-cache-off')) env.ACCEPTANCE_LINK_CACHE = 'off';
  if (workers) env.ACCEPTANCE_WORKERS = String(workers);

  console.log(
    `🦉 phase: jest ... (npx ${jestArgs.join(' ')}) env=${JSON.stringify(env)}`,
  );
  const j = timeIt('npx', jestArgs, { quiet: true, env });
  phases.jest = j.ms;

  const wallMs = Date.now() - wallBegan;

  if (!fs.existsSync(jsonAt)) {
    console.error('🦉 jest wrote no json — cannot attribute cost');
    console.error(j.stderr.slice(-4000));
    process.exit(1);
  }
  const shape = asRunShape(JSON.parse(fs.readFileSync(jsonAt, 'utf8')));

  // record the exact knobs — a wall clock with no config beside it is unfalsifiable
  const run = {
    label,
    at: new Date().toISOString(),
    config: { jestArgs, env, cpus: require('os').cpus().length },
    wallMs,
    phases,
    ...shape,
    jestExit: j.code,
  };
  const saved = saveRun(label, run);
  printRun(run);
  console.log(`🦉 saved ${path.relative(REPO, saved)}\n`);
  process.exit(0);
}

// -- gate ----------------------------------------------------------------------
if (cmd === 'gate') {
  const label = flag('label', null);
  if (!label) {
    console.error('🦉 --label is required.  fix: gate --label bar');
    process.exit(1);
  }
  console.log('🦉 time the PAVED `npm run test:acceptance` end to end ...');
  const g = timeIt('npm', ['run', 'test:acceptance']);
  const run = {
    label,
    at: new Date().toISOString(),
    wallMs: g.ms,
    phases: { 'test:acceptance': g.ms },
    paved: true,
    exit: g.code,
  };
  saveRun(label, run);
  printRun(run);
  console.log(
    `🦉 paved wall clock = ${asMinSec(g.ms)}   exit=${g.code}   bar = under 5m00s\n`,
  );
  process.exit(0);
}

// -- probe ---------------------------------------------------------------------
// .why = the levers left are estimates until each is priced. a lever with a guessed
//        size gets chosen by how easy it is to fix, never by what it costs.
if (cmd === 'probe') {
  const reps = Number(flag('reps', 20));
  const os = require('os');
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-probe-'));
  const quiet = { stdio: 'ignore' };

  /** .what = the git work genTempDir does per fixture: init + 2 commits */
  const timeGitFixture = () => {
    const began = Date.now();
    for (let i = 0; i < reps; i++) {
      const at = path.join(scratch, `g${i}`);
      fs.mkdirSync(at, { recursive: true });
      spawnSync('git', ['init', '-q'], { cwd: at, ...quiet });
      spawnSync('git', ['config', 'user.email', 't@t.t'], { cwd: at, ...quiet });
      spawnSync('git', ['config', 'user.name', 't'], { cwd: at, ...quiet });
      spawnSync('git', ['commit', '-q', '--allow-empty', '-m', 'began'], {
        cwd: at,
        ...quiet,
      });
      fs.writeFileSync(path.join(at, 'f.txt'), 'x');
      spawnSync('git', ['add', '-A'], { cwd: at, ...quiet });
      spawnSync('git', ['commit', '-q', '-m', 'fixture'], { cwd: at, ...quiet });
    }
    return Date.now() - began;
  };

  /** .what = time N reps of one command shape */
  const timeCmd = (bin, args) => {
    const began = Date.now();
    for (let i = 0; i < reps; i++)
      spawnSync(bin, args, { cwd: REPO, ...quiet });
    return (Date.now() - began) / reps;
  };

  const row = (label, ms, note = '') =>
    console.log(`   ├─ ${label.padEnd(38)} ${ms.toFixed(0).padStart(6)} ms  ${note}`);

  console.log(`\n🦉 probe — ${reps} reps each\n`);

  const git = timeGitFixture() / reps;
  row(
    'genTempDir git (init + 2 commits)',
    git,
    `× 457 = ${((git * 457) / 1000).toFixed(1)}s total`,
  );

  // the split that decides the fix: how much of a skill call is npx TAX vs binary BOOT?
  const viaNpx = timeCmd('npx', ['rhx', '--help']);
  const viaBin = timeCmd('./node_modules/.bin/rhx', ['--help']);
  const viaBash = timeCmd('bash', ['-c', 'true']);
  row('rhx via npx', viaNpx, '(what fixtures pay today)');
  row('rhx via ./node_modules/.bin', viaBin, '(same work, no npx lookup)');
  row('bash -c true (floor)', viaBash, '(pure spawn cost)');
  console.log(
    `   └─ npx tax = ${(viaNpx - viaBin).toFixed(0)} ms/call — removable with no behavior change\n`,
  );
  fs.rmSync(scratch, { recursive: true, force: true });
  process.exit(0);
}

// -- shape ---------------------------------------------------------------------
// .why = the cicd slow-test report filters on `.perfStats.runtime != null`. if jest no
//        longer emits that key, the report yields zero rows and nobody notices — a dead
//        instrument reads exactly like a fast suite.
if (cmd === 'shape') {
  const label = flag('label', 'after8');
  const jsonAt = path.join(OUT_DIR, `${label}.jest.json`);
  const raw = JSON.parse(fs.readFileSync(jsonAt, 'utf8'));
  const one = (raw.testResults ?? [])[0] ?? {};
  console.log(`\n🦉 jest json shape — ${label}`);
  console.log(`   ├─ testResult keys: ${Object.keys(one).join(', ')}`);
  console.log(`   ├─ perfStats: ${JSON.stringify(one.perfStats)}`);
  console.log(`   ├─ startTime: ${one.startTime}  endTime: ${one.endTime}`);
  const withRuntime = (raw.testResults ?? []).filter(
    (t) => t.perfStats?.runtime != null && t.perfStats.runtime > 0,
  ).length;
  console.log(
    `   └─ files with a non-zero perfStats.runtime: ${withRuntime}/${(raw.testResults ?? []).length}\n`,
  );
  process.exit(0);
}

// -- failures ------------------------------------------------------------------
// .why = a run that goes red needs its CAUSE named, not its count. 595 failures with
//        one shared root cause and 595 with 595 causes look identical in a total.
if (cmd === 'failures') {
  const label = flag('label', 'after');
  const jsonAt = path.join(OUT_DIR, `${label}.jest.json`);
  if (!fs.existsSync(jsonAt)) {
    console.error(`🦉 no jest json at ${jsonAt}`);
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(jsonAt, 'utf8'));
  const limit = Number(flag('limit', 3));

  // group by the first line of the failure message — a shared root cause collapses
  const byCause = {};
  for (const tr of raw.testResults ?? []) {
    const rel = path.relative(REPO, tr.testFilePath ?? tr.name ?? '');
    if (tr.message && (tr.assertionResults ?? []).length === 0) {
      const head = tr.message.split('\n').find((l) => l.trim()) ?? 'unknown';
      (byCause[head.trim().slice(0, 160)] ??= []).push(`${rel} (suite)`);
    }
    for (const a of tr.assertionResults ?? []) {
      if (a.status !== 'failed') continue;
      const head =
        (a.failureMessages ?? [])[0]?.split('\n').find((l) => l.trim()) ??
        'unknown';
      (byCause[head.trim().slice(0, 160)] ??= []).push(`${rel} :: ${a.fullName}`);
    }
  }

  const causes = Object.entries(byCause).sort((a, b) => b[1].length - a[1].length);
  console.log(`\n🦉 failures — ${label}  (${causes.length} distinct cause head(s))\n`);
  for (const [head, where] of causes) {
    console.log(`   ⛈️  ${where.length}x  ${head}`);
    for (const w of where.slice(0, limit)) console.log(`      · ${w}`);
    if (where.length > limit) console.log(`      … +${where.length - limit} more`);
    console.log('');
  }
  process.exit(0);
}

// -- env -----------------------------------------------------------------------
if (cmd === 'env') {
  const os = require('os');
  console.log(`\n🦉 machine facts`);
  console.log(`   ├─ cpus      ${os.cpus().length}`);
  console.log(`   ├─ model     ${os.cpus()[0]?.model ?? 'unknown'}`);
  console.log(
    `   ├─ memory    ${(os.totalmem() / 1024 ** 3).toFixed(1)} GiB total, ${(os.freemem() / 1024 ** 3).toFixed(1)} GiB free`,
  );
  console.log(`   ├─ loadavg   ${os.loadavg().map((n) => n.toFixed(2)).join('  ')}`);
  console.log(`   ├─ node      ${process.version}`);
  console.log(`   └─ platform  ${os.platform()} ${os.arch()}\n`);
  process.exit(0);
}

// -- report --------------------------------------------------------------------
// .why = re-derives the per-file cost from the RAW jest payload rather than trust the
//        summary saved at run time. a parse defect (as with the absent perfStats) then
//        gets fixed once and every past run is re-readable, instead of a re-run per bug.
if (cmd === 'report') {
  const label = flag('label', null) ?? 'before';
  const run = loadRun(label);
  const rawAt = path.join(OUT_DIR, `${label}.jest.json`);
  if (fs.existsSync(rawAt)) {
    const fresh = asRunShape(JSON.parse(fs.readFileSync(rawAt, 'utf8')));
    run.files = fresh.files;
    run.totals = fresh.totals;
  }
  printRun(run);
  process.exit(0);
}

// -- compare -------------------------------------------------------------------
if (cmd === 'compare') {
  const before = loadRun(flag('before', 'before'));
  const after = loadRun(flag('after', 'after'));

  console.log(`\n🦉 bench.acceptance compare`);
  console.log(`   ├─ before  ${before.label}  ${asMinSec(before.wallMs)}`);
  console.log(`   ├─ after   ${after.label}  ${asMinSec(after.wallMs)}`);
  const delta = before.wallMs - after.wallMs;
  const speedup = before.wallMs / after.wallMs;
  console.log(
    `   └─ delta   ${asMinSec(Math.abs(delta))} ${delta > 0 ? 'faster' : 'SLOWER'}  (${speedup.toFixed(2)}x)`,
  );

  const bt = before.totals;
  const at = after.totals;
  if (bt && at) {
    console.log(`\n   coverage`);
    console.log(`   ├─ cases before  ${bt.cases} (${bt.casesPassed} passed)`);
    console.log(`   └─ cases after   ${at.cases} (${at.casesPassed} passed)`);
  }

  // the regression guard: every case that PASSED before must pass now.
  const lost = [];
  const weaker = [];
  for (const [name, status] of Object.entries(before.cases ?? {})) {
    if (status !== 'passed') continue;
    const now = after.cases?.[name];
    if (now === undefined) lost.push(name);
    else if (now !== 'passed') weaker.push(`${name}  [${now}]`);
  }

  const passedBefore = Object.values(before.cases ?? {}).filter(
    (s) => s === 'passed',
  ).length;

  if (lost.length === 0 && weaker.length === 0) {
    console.log(
      `\n   ✅ no regression — all ${passedBefore} cases that passed before still pass\n`,
    );
    process.exit(0);
  }

  console.log(`\n   ⛈️  REGRESSION`);
  if (lost.length) {
    console.log(`   ├─ ${lost.length} case(s) PASSED before and are now ABSENT:`);
    for (const n of lost.slice(0, 40)) console.log(`   │  · ${n}`);
    if (lost.length > 40) console.log(`   │  ... +${lost.length - 40} more`);
  }
  if (weaker.length) {
    console.log(
      `   └─ ${weaker.length} case(s) PASSED before and no longer pass:`,
    );
    for (const n of weaker.slice(0, 40)) console.log(`      · ${n}`);
    if (weaker.length > 40) console.log(`      ... +${weaker.length - 40} more`);
  }
  console.log('');
  process.exit(2);
}

console.error(`🦉 unknown command "${cmd}"`);
console.log(HELP);
process.exit(1);
