import * as fs from 'fs';
import * as path from 'path';
import { UnexpectedCodePathError } from 'helpful-errors';
import { given, then, useBeforeAll, useThen, useWhen, when } from 'test-fns';

import {
  getRouteGuardReviewPeerPathTaken,
  isRouteGuardReviewPeerGivenPath,
} from '../src/domain.operations/route/guard/review/peer/getRouteGuardReviewPeerPathTaken';
import { asRedactedOutput } from './.test/asRedactedOutput';
import { concedeEveryPeerConcern } from './.test/concedeEveryPeerConcern';
import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-partition-journey');
const ROUTE = '.behavior/v2027_01_01.demo';
const STONE = '1.execute';
const SLUG = 'xyzzy';

const REPEATABLE_CONFIG = {
  attempts: 3,
  criteria: process.env.CI ? 'SOME' : 'EVERY',
} as const;

/**
 * .what = the chars each domain's mass holds — enough that the two together overrun 75% of
 *         the lane's window, and either alone sits well under it
 * .why = the lane's brain (the review's default) holds 1M tokens; review estimates
 *        tokens as chars/4, so the refusal fires above ~3.0M chars of prompt. two domains of
 *        ~1.6M chars each (~400k tokens, ~40% of the window) overflow together and fit apart.
 *        an ADDED body is all diff (seed S33), so the refusal's lever is the partition, never
 *        a bind cut
 */
const CHARS_PER_DOMAIN = 1_600_000;
const FILES_PER_DOMAIN = 4;

/**
 * .what = one filler line, free of the word the rule forbids
 * .why = the mass must carry no defect under the rubric, so the split's merged verdict is
 *        about the split and never about the content
 */
const asFillerLine = (input: {
  domain: string;
  index: number;
  word: 'plain' | 'fresh';
}): string =>
  `export const ${input.domain}Value${input.index} = 'the ${input.domain} domain holds a ${input.word} value at slot ${input.index}';\n`;

/**
 * .what = writes `FILES_PER_DOMAIN` files under `src/<domain>/` that hold ~CHARS_PER_DOMAIN
 * .note = `word` sets the one word every line carries. a rewrite with the other word
 *         changes every line, so a settled file becomes a whole-body EDIT — its hunks carry
 *         the mass, as an addition's diff does
 */
const setDomainMass = (input: {
  tempDir: string;
  domain: string;
  word?: 'plain' | 'fresh';
}): void => {
  const word = input.word ?? 'plain';
  const charsPerFile = Math.ceil(CHARS_PER_DOMAIN / FILES_PER_DOMAIN);
  const sample = asFillerLine({ domain: input.domain, index: 0, word });
  const linesPerFile = Math.ceil(charsPerFile / sample.length);
  Array.from({ length: FILES_PER_DOMAIN }).map((_, fileIndex) => {
    const content = Array.from({ length: linesPerFile })
      .map((__, lineIndex) =>
        asFillerLine({
          domain: input.domain,
          index: fileIndex * linesPerFile + lineIndex,
          word,
        }),
      )
      .join('');
    const absolute = path.join(
      input.tempDir,
      'src',
      input.domain,
      `${input.domain}Part${fileIndex}.ts`,
    );
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, content);
  });
};

/**
 * .what = a temp repo from the fixture: roles linked, the route settled on main, and a
 *         feature branch checked out — so only what the test writes reads as changed
 */
const genRepoOnBranch = async (input: {
  slug: string;
  /** the domains whose mass is settled on main, so the branch can only EDIT them */
  settled?: string[];
}): Promise<string> => {
  const tempDir = genTempDirForRhachet({ slug: input.slug, clone: ASSETS_DIR });
  await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
  await execAsync('npx rhachet roles link --role reviewer', { cwd: tempDir });
  (input.settled ?? []).map((domain) => setDomainMass({ tempDir, domain }));
  await execAsync('git add -A && git commit -m "settle route" --no-verify', {
    cwd: tempDir,
  });
  await execAsync('git checkout -b vlad/test-partition-journey', {
    cwd: tempDir,
  });
  return tempDir;
};

/**
 * .what = the driver arrives at the stone, which runs its guard
 */
const setStoneArrived = (input: { tempDir: string }) =>
  invokeRouteSkill({
    skill: 'route.stone.set',
    args: { stone: STONE, route: ROUTE, as: 'arrived' },
    cwd: input.tempDir,
  });

/**
 * .what = every file the lane's peer dir holds, by name, sorted
 * .why = a refusal at the entrance must leave this list unchanged — no lane, no given
 */
const getAllPeerFileNames = (input: { tempDir: string }): string[] => {
  const dir = path.join(input.tempDir, ROUTE, '.reviews', 'peer');
  if (!fs.existsSync(dir)) return [];
  return [...fs.readdirSync(dir)].sort();
};

/**
 * .what = the content of the newest given the lane wrote for SLUG
 */
const getOneLatestGiven = (input: { tempDir: string }): string => {
  const dir = path.join(input.tempDir, ROUTE, '.reviews', 'peer');
  const names = getAllPeerFileNames(input).filter(
    (name) => name.includes(`_.given.by_peer.${SLUG}`) && !name.endsWith('.report.md'),
  );
  const latest = names[names.length - 1];
  if (!latest)
    throw new UnexpectedCodePathError(`no given by ${SLUG} found`, {
      dir,
      hint: 'the guard wrote no given for this lane; read the arrive stdout for why the lane did not run',
    });
  return fs.readFileSync(path.join(dir, latest), 'utf-8');
};

/**
 * .what = the content of the newest review report the lane wrote for SLUG
 */
const getOneLatestReport = (input: { tempDir: string }): string => {
  const dir = path.join(input.tempDir, ROUTE, '.reviews', 'peer');
  const names = getAllPeerFileNames(input).filter(
    (name) => name.includes(`_.given.by_peer.${SLUG}`) && name.endsWith('.report.md'),
  );
  const latest = names[names.length - 1];
  if (!latest)
    throw new UnexpectedCodePathError(`no report by ${SLUG} found`, {
      dir,
      holds: getAllPeerFileNames(input),
      hint: 'the lane wrote no .report.md; check that the review ran to a verdict rather than a refusal',
    });
  return fs.readFileSync(path.join(dir, latest), 'utf-8');
};

/**
 * .what = every log artifact the review wrote, as a sorted list of paths relative to the
 *         repo, with the per-run timestamp dir masked
 * .why = progressive enhancement is judged on the SET of artifacts a run leaves: a declared
 *        set that the lane never needed must add no file
 */
const getAllLogArtifacts = (input: { tempDir: string }): string[] => {
  const root = path.join(input.tempDir, '.log');
  if (!fs.existsSync(root)) return [];
  const entries = fs.readdirSync(root, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) =>
      // mask only the per-run dir segment, so each artifact's own name stays compared
      sanitizeTimeForSnapshot(
        path.relative(input.tempDir, path.join(entry.parentPath, entry.name)),
      ),
    )
    .sort();
};

/**
 * .what = masks every per-run value in guard stdout or a review body
 * .why = the two runs of arc B differ in temp dir, timestamps, durations, and the cents a
 *        brain's reply cost — none of which a declared set should be blamed for. the masks
 *        reuse the two extant normalizers, then fold the cost and token figures
 */
const asNormalized = (raw: string): string =>
  asRedactedOutput(sanitizeTimeForSnapshot(raw))
    .replace(/\$\d+(\.\d+)?/g, '$[COST]')
    .replace(/\d[\d,]*(\.\d+)?[kM]? tokens/g, '[N] tokens')
    .replace(/\.i\d+\.[0-9a-f]{6,}\./g, '.i[N].[HASH].');

/**
 * .what = masks the blocker and nitpick counts a brain's verdict sets
 * .why = arc B compares two real reviews of one small change. the counts a brain returns may
 *        differ by one between two calls whether or not a set is declared, so the comparison
 *        that blames the set must not blame the brain
 */
const asVerdictMasked = (raw: string): string =>
  raw.replace(/\d+ (blocker|nitpick)s?\b/g, '[N] $1s');

/**
 * .what = the head of a review report — every line above its first `---` rule
 * .why = the head is composed by the tool (logs, review path, summary); the body below the
 *        rule is brain prose
 */
const asReportHead = (report: string): string => report.split('\n---')[0] ?? '';

/**
 * .what = the repair command the entrance refusal printed, lifted from stdout verbatim
 * .why = the journey's claim is that a driver can paste what the refusal prints. so the
 *        test reads the command off stdout, exactly as a driver would, and joins only the
 *        shell line continuations the render wrapped it with
 */
const asRepairCommandFromStdout = (input: { stdout: string }): string => {
  const lines = input.stdout.split('\n');
  const start = lines.findIndex((line) =>
    line.includes('rhx route.guard.partition'),
  );
  if (start === -1)
    throw new UnexpectedCodePathError(
      'no `rhx route.guard.partition` command in stdout',
      {
        stdout: input.stdout,
        hint: 'the entrance refusal must print its repair command; check the partition gap render',
      },
    );
  const collected = lines.slice(start).reduce<{ parts: string[]; open: boolean }>(
    (acc, line) => {
      if (!acc.open) return acc;
      const text = line.replace(/^[\s│]*/, '').replace(/\s+$/, '');
      const isContinued = text.endsWith('\\');
      return {
        parts: [...acc.parts, isContinued ? text.slice(0, -1).trimEnd() : text],
        open: isContinued,
      };
    },
    { parts: [], open: true },
  );
  return collected.parts.join(' ').replace(/^.*?(rhx route\.guard\.partition)/, '$1');
};

/**
 * .what = journey acceptance test for guarded review partitions, end to end through the CLI
 * .why = partitions are a progressive enhancement of a guarded peer lane. two claims, and
 *        only the spawned skills can show either:
 *        - arc A: a lane that overflows names the partition lever; a declared set that a later
 *          edit outgrows is refused ONCE at the stone's entrance, with a paste-ready repair;
 *          the pasted repair lets the lane split, and the guard reads one merged tally under
 *          the lane's own slug
 *        - arc B: a lane that fits behaves byte-for-byte the same whether or not a set is
 *          declared — the set adds no output, no body line, no artifact
 *
 * .note = overflow and fit are forced by MASS, never by a stub: the lane is the real review
 *         skill on a 1M-token brain, and the test writes ~3.2M chars to overflow it or one
 *         small file to fit it. the overflow refusal and the entrance refusal both fire
 *         before any brain call; only arc A's split and arc B's two runs spend tokens
 * .note = arc A is one stateful journey, so only its brain-bound step is repeatable; a retry
 *         of that step re-arrives on the same branch and asserts structure, never verdict
 */
describe('driver.route.partition-journey.acceptance', () => {
  given('[case1] a guarded stone whose lane overflows (arc A)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = await genRepoOnBranch({ slug: 'route-partition-journey' });
      return { tempDir };
    });

    when('[t0] the driver adds two heavy domains', () => {
      const result = useThen('the mass is written', async () => {
        setDomainMass({ tempDir: scene.tempDir, domain: 'alpha' });
        setDomainMass({ tempDir: scene.tempDir, domain: 'beta' });
        const status = await execAsync('git status --porcelain --untracked-files=all', {
          cwd: scene.tempDir,
        });
        return { status: status.stdout };
      });

      then('both domains read as added on the branch', () => {
        expect(result.status).toContain('src/alpha/alphaPart0.ts');
        expect(result.status).toContain('src/beta/betaPart0.ts');
      });

      then('no partition set is declared yet', () => {
        expect(
          fs.existsSync(path.join(scene.tempDir, ROUTE, '.route', 'partitions.json')),
        ).toEqual(false);
      });

      then('the branch status matches snapshot', () => {
        expect(result.status).toMatchSnapshot();
      });
    });

    when('[t1] the driver arrives; the lane overflows', () => {
      const result = useThen('the guard runs the lane, which refuses', async () => {
        const invoked = await setStoneArrived({ tempDir: scene.tempDir });
        const given = getOneLatestGiven({ tempDir: scene.tempDir });
        return { invoked, given };
      });

      then('the stone does not pass (exit 2)', () => {
        expect(result.invoked.code).toEqual(2);
      });

      then('the lane is shown as a constraint under its slug', () => {
        // an overflow is a refusal the driver can lift (the review exits 2), never a crash
        expect(result.invoked.stdout).toContain(`r1: ${SLUG} (l1, 0/9)`);
        expect(result.invoked.stdout).toContain('constraint ✋');
        expect(result.invoked.stdout).toContain('reason = reviewer constraint');
      });

      then('the halt points the driver at the given that names the lever', () => {
        expect(result.invoked.stdout).toMatch(
          new RegExp(`given: ${ROUTE.replace(/\./g, '\\.')}/\\.reviews/peer/\\S+\\.given\\.by_peer\\.${SLUG}\\.md`),
        );
      });

      then('the lane names the overflow', () => {
        expect(result.given).toContain('prompt exceeds 75% of context window');
      });

      then('the lane names the partition lever, since the mass is added', () => {
        expect(result.given).toContain('partition what the rubric grades');
        // 🔴 the overlap is expected, and cheap — graded once, read from cache
        expect(result.given).toContain(
          'list the shared context in every partition that reads it too — route yields, briefs, shared types',
        );
        expect(result.given).toContain('the overlap is graded once');
        expect(result.given).toContain('every partition reads it from cache');
        expect(result.given).toContain(`--partition 'alpha=src/alpha/**,${ROUTE}/**'`);
        expect(result.given).toContain(`--partition 'beta=src/beta/**,${ROUTE}/**'`);
        expect(result.given).toContain('rhx route.guard.partition --for review --peer @all');
      });

      then('the lane names the bind lever too, for mass the rubric does not grade', () => {
        // the two levers answer one question — does the rubric grade this mass? — so both are
        // named, whatever kind of mass leads
        expect(result.given).toContain("--paths-wout '<subtree>/**'");
        expect(result.given).toContain('or cut a subtree the rubric does not grade');
      });

      then('stdout matches snapshot', () => {
        expect(asNormalized(result.invoked.stdout)).toMatchSnapshot('stdout');
      });

      then('the given matches snapshot', () => {
        expect(asNormalized(result.given)).toMatchSnapshot('given');
      });
    });

    when('[t2] the driver declares the set the lever named', () => {
      const result = useThen('the write succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.guard.partition',
          args: {
            route: ROUTE,
            for: 'review',
            peer: '@all',
            partition: [
              `alpha={src/alpha/**,${ROUTE}/**}`,
              `beta={src/beta/**,${ROUTE}/**}`,
            ],
            mode: 'apply',
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect({ code: result.code, stderr: result.stderr }).toEqual({
          code: 0,
          stderr: '',
        });
      });

      then('the set claims every changed file — the review logs of t1 are not owed a partition', () => {
        expect(result.stdout).toContain('🦉 partitions declared');
        expect(result.stdout).toContain('unclaimed: 0');
        expect(result.stdout).toContain('alpha: 4 narrow targets');
        expect(result.stdout).toContain('beta: 4 narrow targets');
      });

      then('the declaration holds the set under @all', () => {
        const json = JSON.parse(
          fs.readFileSync(
            path.join(scene.tempDir, ROUTE, '.route', 'partitions.json'),
            'utf-8',
          ),
        );
        expect(json).toEqual({
          all: [`alpha={src/alpha/**,${ROUTE}/**}`, `beta={src/beta/**,${ROUTE}/**}`],
          byPeer: {},
        });
      });

      then('stdout matches snapshot', () => {
        expect(asNormalized(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2.1] the driver answers the overflowed lane', () => {
      const result = useThen('the answer is recorded', async () => {
        // the refused lane's given gates the next round, exactly as any given does
        // (rule.always.diagnose-reviewer-malfunctions), so the driver writes its .taken
        const given = getAllPeerFileNames({ tempDir: scene.tempDir }).find(
          (name) =>
            name.endsWith(`._.given.by_peer.${SLUG}.md`) &&
            isRouteGuardReviewPeerGivenPath({ pathGiven: name }),
        );
        if (!given)
          throw new UnexpectedCodePathError(`no given by ${SLUG} to answer`, {
            hint: 'the overflowed lane must write its given before the driver answers; check the [t2] arrive stdout',
          });
        const taken = getRouteGuardReviewPeerPathTaken({ pathGiven: given });
        fs.writeFileSync(
          path.join(scene.tempDir, ROUTE, '.reviews', 'peer', taken),
          '[REPAIR] the lane overflowed; the set its lever named is now declared\n',
        );
        await concedeEveryPeerConcern({
          cwd: scene.tempDir,
          stone: STONE,
          route: path.join(scene.tempDir, ROUTE),
        });
        const absorbed = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: STONE, route: ROUTE, as: 'absorbed', that: SLUG },
          cwd: scene.tempDir,
        });
        return { taken, absorbed };
      });

      then('the absorption is accepted', () => {
        expect(result.absorbed.code).toEqual(0);
      });

      then('the ack names the lane it absorbed', () => {
        expect(result.absorbed.stdout).toContain(SLUG);
      });

      then('the ack matches snapshot', () => {
        // every journey step is pinned (rule.require.snapshot-every-journey-step)
        expect(asNormalized(result.absorbed.stdout)).toMatchSnapshot('absorbed');
      });

      then('the .taken sits beside the given', () => {
        expect(getAllPeerFileNames({ tempDir: scene.tempDir })).toContain(
          result.taken,
        );
      });
    });

    when('[t3] the driver adds a file in a dir the set does not list', () => {
      const result = useThen('the file is written', async () => {
        const absolute = path.join(scene.tempDir, 'src', 'gamma', 'getGamma.ts');
        fs.mkdirSync(path.dirname(absolute), { recursive: true });
        fs.writeFileSync(absolute, 'export const getGamma = () => 3;\n');
        const status = await execAsync('git status --porcelain --untracked-files=all', {
          cwd: scene.tempDir,
        });
        return { status: status.stdout };
      });

      then('the file reads as added on the branch', () => {
        expect(result.status).toContain('src/gamma/getGamma.ts');
      });

      then('the branch status matches snapshot', () => {
        // mask only the per-run log dir, so each log file's own name stays pinned
        expect(sanitizeTimeForSnapshot(result.status)).toMatchSnapshot();
      });
    });

    const refusal = useWhen('[t4] the driver arrives; the entrance refuses the set', () => {
      const result = useThen('the stone refuses before any lane', async () => {
        const peerBefore = getAllPeerFileNames({ tempDir: scene.tempDir });
        const invoked = await setStoneArrived({ tempDir: scene.tempDir });
        const peerAfter = getAllPeerFileNames({ tempDir: scene.tempDir });
        const passage = fs.readFileSync(
          path.join(scene.tempDir, ROUTE, '.route', 'passage.jsonl'),
          'utf-8',
        );
        return { invoked, peerBefore, peerAfter, passage };
      });

      then('the stone does not pass (exit 2)', () => {
        expect(result.invoked.code).toEqual(2);
      });

      then('the refusal says no lane runs until the partitions cover', () => {
        expect(result.invoked.stdout).toContain(
          '🦉 the partitions would leave changed files unreviewed — no lane runs until they cover them',
        );
        expect(result.invoked.stdout).toContain(
          `🗿 route.guard.partition, on stone ${STONE}`,
        );
      });

      then('the refusal names the unclaimed file and where the repair puts it', () => {
        expect(result.invoked.stdout).toContain('1 changed file sits in no partition');
        expect(result.invoked.stdout).toMatch(/src\/gamma\/getGamma\.ts → \S+ \(\+ src\/gamma\/\*\*\)/);
      });

      then('the refusal prints the repair command', () => {
        expect(result.invoked.stdout).toContain('repair — run this, then re-arrive');
        expect(result.invoked.stdout).toContain(
          `rhx route.guard.partition --route ${ROUTE} --for review --peer @all`,
        );
        expect(result.invoked.stdout).toContain('--mode apply');
      });

      then('the blocker recorded is review.peer.malpartitioned', () => {
        const rows = result.passage
          .trim()
          .split('\n')
          .map((line) => JSON.parse(line) as { status: string; blocker?: string });
        const latest = rows[rows.length - 1];
        expect(latest?.status).toEqual('blocked');
        expect(latest?.blocker).toEqual('review.peer.malpartitioned');
      });

      then('no lane ran — the peer dir is unchanged', () => {
        expect(result.peerAfter).toEqual(result.peerBefore);
      });

      then('stdout matches snapshot', () => {
        expect(asNormalized(result.invoked.stdout)).toMatchSnapshot();
      });

      return result;
    });

    when('[t5] the driver runs the printed command verbatim', () => {
      const result = useThen('the repair is written', async () => {
        const command = asRepairCommandFromStdout({
          stdout: refusal.invoked.stdout,
        });
        const ran = await execAsync(command, {
          cwd: scene.tempDir,
          env: {
            ...process.env,
            PATH: `${path.join(scene.tempDir, 'node_modules', '.bin')}${path.delimiter}${process.env.PATH ?? ''}`,
          },
        });
        const json = JSON.parse(
          fs.readFileSync(
            path.join(scene.tempDir, ROUTE, '.route', 'partitions.json'),
            'utf-8',
          ),
        ) as { all: string[] | null; byPeer: Record<string, string[]> };
        return { command, ran, json };
      });

      then('the command lifted from stdout is the one route.guard.partition apply', () => {
        expect(result.command.startsWith('rhx route.guard.partition')).toEqual(true);
        expect(result.command).toContain('--mode apply');
        expect(result.command).not.toContain('\\');
      });

      then('the declaration now claims the new dir, beside the two prior', () => {
        expect(result.json.all).toContain(`alpha=src/alpha/**,${ROUTE}/**`);
        expect(result.json.all).toContain(`beta=src/beta/**,${ROUTE}/**`);
        expect(result.json.all).toContain(`gamma=src/gamma/**,${ROUTE}/**`);
        expect(
          result.json.all?.every((value) => value.includes(`${ROUTE}/**`)),
        ).toEqual(true);
      });

      then('the command and its stdout match snapshot', () => {
        expect({
          command: result.command,
          stdout: asNormalized(result.ran.stdout),
        }).toMatchSnapshot();
      });
    });

    when.repeatably(REPEATABLE_CONFIG)(
      '[t6] the driver arrives; the lane splits and the guard reads one tally',
      () => {
        const result = useThen('the guard runs the split lane', async () => {
          const invoked = await setStoneArrived({ tempDir: scene.tempDir });
          const given = getOneLatestGiven({ tempDir: scene.tempDir });
          const report = getOneLatestReport({ tempDir: scene.tempDir });
          const peer = getAllPeerFileNames({ tempDir: scene.tempDir });
          return { invoked, given, report, peer };
        });

        then('the entrance no longer refuses', () => {
          expect(result.invoked.stdout).not.toContain(
            'the partitions would leave changed files unreviewed',
          );
        });

        then('the lane is not a malfunction', () => {
          expect(result.invoked.stdout.toLowerCase()).not.toContain('malfunction');
          expect(result.given).not.toContain('prompt exceeds 75% of context window');
        });

        then('the lane split into the declared partitions — the two prior and the repair', () => {
          expect(result.report).toContain('## partition: alpha');
          expect(result.report).toContain('## partition: beta');
          expect(result.report).toContain('## partition: gamma');
        });

        then('every partition returned a verdict — none failed', () => {
          expect(result.report).not.toContain('this partition did not review');
        });

        then('every given is under the lane slug — no partition minted its own', () => {
          const givens = result.peer.filter(
            (name) => name.includes('_.given.by_peer.') && !name.endsWith('.report.md'),
          );
          expect(givens.length).toBeGreaterThan(0);
          expect(
            givens.every((name) => name.endsWith(`_.given.by_peer.${SLUG}.md`)),
          ).toEqual(true);
        });

        then('the merged tally carries both numeric counts', () => {
          expect(result.given).toMatch(/\d+ blockers?/);
          expect(result.given).toMatch(/\d+ nitpicks?/);
        });

        then('the report skeleton matches snapshot', () => {
          // the verdict a brain returns varies run to run; the split's shape does not. so the
          // snapshot holds each partition's header and its target line, never the verdict
          const skeleton = result.report
            .split('\n')
            .filter((line) => line.startsWith('## partition:') || line.startsWith('- targets:'))
            .join('\n');
          expect(skeleton).toMatchSnapshot();
        });
      },
    );
  });

  given('[case2] a guarded stone whose lane fits (arc B)', () => {
    when.repeatably(REPEATABLE_CONFIG)(
      '[t0] the same small change is arrived at twice — once bare, once with a declared set',
      () => {
        const result = useThen('both runs complete', async () => {
          const runOnce = async (input: { slug: string; declare: boolean }) => {
            const tempDir = await genRepoOnBranch({ slug: input.slug });
            const absolute = path.join(tempDir, 'src', 'alpha', 'getAlpha.ts');
            fs.mkdirSync(path.dirname(absolute), { recursive: true });
            fs.writeFileSync(absolute, 'export const getAlpha = () => 1;\n');
            const declared = input.declare
              ? await invokeRouteSkill({
                  skill: 'route.guard.partition',
                  args: {
                    route: ROUTE,
                    for: 'review',
                    peer: '@all',
                    partition: [
                      `alpha={src/alpha/**,${ROUTE}/**}`,
                      `beta={src/beta/**,${ROUTE}/**}`,
                    ],
                    mode: 'apply',
                  },
                  cwd: tempDir,
                })
              : null;
            const invoked = await setStoneArrived({ tempDir });
            if (!getAllPeerFileNames({ tempDir }).some((name) => name.endsWith('.report.md')))
              throw new UnexpectedCodePathError(
                `the ${input.slug} run wrote no report`,
                {
                  stdout: invoked.stdout,
                  stderr: invoked.stderr,
                  hint: 'the small change must fit the lane whole; read the guard stdout for a refusal or a malfunction',
                },
              );
            return {
              declared,
              invoked,
              report: getOneLatestReport({ tempDir }),
              logs: getAllLogArtifacts({ tempDir }),
            };
          };
          const bare = await runOnce({ slug: 'route-partition-fit-bare', declare: false });
          const declared = await runOnce({
            slug: 'route-partition-fit-declared',
            declare: true,
          });
          return { bare, declared };
        });

        then('the declaration was written in the declared run', () => {
          expect(result.declared.declared?.code).toEqual(0);
        });

        then('both runs exit alike', () => {
          expect(result.declared.invoked.code).toEqual(result.bare.invoked.code);
        });

        then('the declared run never split', () => {
          expect(result.declared.report).not.toMatch(/split into \d+ partitions/);
        });

        then('guard stdout is identical, verdict counts aside', () => {
          expect(asVerdictMasked(asNormalized(result.declared.invoked.stdout))).toEqual(
            asVerdictMasked(asNormalized(result.bare.invoked.stdout)),
          );
        });

        then('the review report head is identical, verdict counts aside', () => {
          // the body under the head is brain prose, which varies run to run whether or not
          // a set is declared; the head is what the tool composes
          expect(asVerdictMasked(asNormalized(asReportHead(result.declared.report)))).toEqual(
            asVerdictMasked(asNormalized(asReportHead(result.bare.report))),
          );
        });

        then('neither report carries a partition section', () => {
          expect(result.bare.report).not.toContain('## partition:');
          expect(result.declared.report).not.toContain('## partition:');
        });

        then('the set of log artifacts is identical', () => {
          expect(result.declared.logs).toEqual(result.bare.logs);
        });

        then('the bare run matches snapshot', () => {
          expect({
            stdout: asVerdictMasked(asNormalized(result.bare.invoked.stdout)),
            logs: result.bare.logs,
          }).toMatchSnapshot();
        });
      },
    );
  });

  /**
   * .what = an overflow whose mass is EDITED — the heavy files are settled on main, and the
   *         branch rewrites them
   * .why = the refusal reads edited mass apart from added mass, and a driver whose rubric
   *        grades the edited subtree must still be handed a lever that keeps it graded. both
   *        levers must render here, not only the cut
   */
  given('[case3] a guarded stone whose lane overflows on EDITED mass', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = await genRepoOnBranch({
        slug: 'route-partition-edited',
        settled: ['alpha', 'beta'],
      });
      return { tempDir };
    });

    when('[t0] the driver edits the two heavy domains and arrives', () => {
      const result = useThen('the guard runs the lane, which refuses', async () => {
        // a rewrite of every line of each settled file reads as a modification, never an
        // addition, and its hunks carry the whole body
        setDomainMass({ tempDir: scene.tempDir, domain: 'alpha', word: 'fresh' });
        setDomainMass({ tempDir: scene.tempDir, domain: 'beta', word: 'fresh' });
        const status = await execAsync('git status --porcelain --untracked-files=all', {
          cwd: scene.tempDir,
        });
        const invoked = await setStoneArrived({ tempDir: scene.tempDir });
        const given = getOneLatestGiven({ tempDir: scene.tempDir });
        return { status: status.stdout, invoked, given };
      });

      then('the heavy files read as modified, never added', () => {
        expect(result.status).toContain(' M src/alpha/alphaPart0.ts');
        expect(result.status).not.toContain('?? src/alpha/');
      });

      then('the stone does not pass (exit 2)', () => {
        expect(result.invoked.code).toEqual(2);
      });

      then('the lane names the overflow, led by the edited mass', () => {
        expect(result.given).toContain('prompt exceeds 75% of context window');
        expect(result.given).toMatch(/src\/alpha\s+\S+ bodies · \S+ edits/);
      });

      then('🔴 the lane names the partition lever, so graded mass stays graded', () => {
        expect(result.given).toContain('partition what the rubric grades');
        expect(result.given).toContain('rhx route.guard.partition --for review --peer @all');
      });

      then('the lane names the bind lever as the alternative, and names no heavy subtree', () => {
        expect(result.given).toContain("--paths-wout '<subtree>/**'");
        expect(result.given).not.toContain("--paths-wout 'src/alpha/**'");
      });

      then('the given matches snapshot', () => {
        expect(asNormalized(result.given)).toMatchSnapshot('given');
      });
    });
  });

  /**
   * .what = a declared set one of whose partitions is still too heavy to fit alone
   * .why = the tool never splits a partition again, so the driver must be told at the
   *        cheapest moment — before any brain is paid — which partition to narrow
   */
  given('[case4] a guarded stone whose declared partition still overflows alone', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = await genRepoOnBranch({ slug: 'route-partition-heavy' });
      return { tempDir };
    });

    when('[t0] the driver declares a partition that holds both heavy domains, and arrives', () => {
      const result = useThen('the lane refuses before any brain call', async () => {
        setDomainMass({ tempDir: scene.tempDir, domain: 'alpha' });
        setDomainMass({ tempDir: scene.tempDir, domain: 'beta' });
        const absolute = path.join(scene.tempDir, 'src', 'gamma', 'getGamma.ts');
        fs.mkdirSync(path.dirname(absolute), { recursive: true });
        fs.writeFileSync(absolute, 'export const getGamma = () => 3;\n');
        const declared = await invokeRouteSkill({
          skill: 'route.guard.partition',
          args: {
            route: ROUTE,
            for: 'review',
            peer: '@all',
            partition: [
              `heavy={src/alpha/**,src/beta/**,${ROUTE}/**}`,
              `gamma={src/gamma/**,${ROUTE}/**}`,
            ],
            mode: 'apply',
          },
          cwd: scene.tempDir,
        });
        const invoked = await setStoneArrived({ tempDir: scene.tempDir });
        const given = getOneLatestGiven({ tempDir: scene.tempDir });
        return { declared, invoked, given };
      });

      then('the set was declared', () => {
        expect(result.declared.code).toEqual(0);
      });

      then('the stone does not pass (exit 2)', () => {
        expect(result.invoked.code).toEqual(2);
      });

      then('the lane names the partition that still overflows alone', () => {
        expect(result.given).toContain('1 partition still overflows alone');
        expect(result.given).toMatch(/heavy: ~\S+ tokens, 8 files/);
      });

      then('the lane names the fix — narrow it, or split it in two', () => {
        expect(result.given).toContain(
          'fix: narrow that partition, or split it in two — the tool never splits a partition again',
        );
      });

      then('the lane names the guard command that redeclares the set', () => {
        expect(result.given).toContain('rhx route.guard.partition --for review --peer @all');
      });

      then('the given matches snapshot', () => {
        expect(asNormalized(result.given)).toMatchSnapshot('given');
      });
    });
  });

  /**
   * .what = 🔴 CLAMP. a written set that holds a stale glob, cured by the one paste it prints
   * .why = a glob goes stale when its files move or merge away, and its only drop lever once was
   *        a re-declaration of every partition. the applied tree now closes the flag on an
   *        `--prune` command, and that command must run verbatim. brain-free: no stone arrives
   */
  given('[case5] a declared set that holds a glob no changed file matches', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = await genRepoOnBranch({ slug: 'route-partition-prune' });
      const absolute = path.join(tempDir, 'src', 'alpha', 'getAlpha.ts');
      fs.mkdirSync(path.dirname(absolute), { recursive: true });
      fs.writeFileSync(absolute, 'export const getAlpha = () => 1;\n');
      return { tempDir };
    });

    const declared = useWhen('[t0] the driver declares a set with a stale glob', () => {
      const result = useThen('the write succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.guard.partition',
          args: {
            route: ROUTE,
            for: 'review',
            peer: '@all',
            partition: [`alpha=src/alpha/**,src/gone/**,${ROUTE}/**`],
            mode: 'apply',
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('the stale glob is flagged, and the flag closes on its prune', () => {
        expect(result.stdout).toContain('alpha: src/gone/**');
        expect(result.stdout).toContain(
          `stale? drop them: rhx route.guard.partition --route ${ROUTE} --for review --peer @all --prune 'src/gone/**' --mode apply`,
        );
      });

      then('stdout matches snapshot', () => {
        expect(asNormalized(result.stdout)).toMatchSnapshot();
      });

      return result;
    });

    when('[t1] the driver runs the printed prune verbatim', () => {
      const result = useThen('the prune is written', async () => {
        const line = declared.stdout
          .split('\n')
          .find((one) => one.includes('stale? drop them: '));
        if (!line)
          throw new UnexpectedCodePathError('no prune command in stdout', {
            stdout: declared.stdout,
            hint: 'the applied tree must close a stale-glob flag on its --prune command',
          });
        const command = line.slice(
          line.indexOf('stale? drop them: ') + 'stale? drop them: '.length,
        );
        const ran = await execAsync(command, {
          cwd: scene.tempDir,
          env: {
            ...process.env,
            PATH: `${path.join(scene.tempDir, 'node_modules', '.bin')}${path.delimiter}${process.env.PATH ?? ''}`,
          },
        });
        const json = JSON.parse(
          fs.readFileSync(
            path.join(scene.tempDir, ROUTE, '.route', 'partitions.json'),
            'utf-8',
          ),
        ) as { all: string[] | null; byPeer: Record<string, string[]> };
        return { command, ran, json };
      });

      then('the stale glob is gone, and the rest of the set stands', () => {
        expect(result.json.all).toEqual([`alpha=src/alpha/**,${ROUTE}/**`]);
      });

      then('the tree names the prune, and flags no stale glob', () => {
        expect(result.ran.stdout).toContain('prunes: 1 glob, every other partition kept as held');
        expect(result.ran.stdout).toContain('src/gone/** ← wherever held');
        expect(result.ran.stdout).not.toContain('matched no changed file');
      });

      then('the command and its stdout match snapshot', () => {
        expect({
          command: result.command,
          stdout: asNormalized(result.ran.stdout),
        }).toMatchSnapshot();
      });
    });

    when('[t2] the driver prunes a glob the set does not hold', () => {
      const result = useThen('the prune refuses', async () => {
        const before = fs.readFileSync(
          path.join(scene.tempDir, ROUTE, '.route', 'partitions.json'),
          'utf-8',
        );
        const invoked = await invokeRouteSkill({
          skill: 'route.guard.partition',
          args: {
            route: ROUTE,
            for: 'review',
            peer: '@all',
            prune: 'src/alpa/**',
            mode: 'apply',
          },
          cwd: scene.tempDir,
        });
        const after = fs.readFileSync(
          path.join(scene.tempDir, ROUTE, '.route', 'partitions.json'),
          'utf-8',
        );
        return { invoked, before, after };
      });

      then('exit code is 2', () => {
        expect(result.invoked.code).toEqual(2);
      });

      then('it names the glob, and lists what each partition holds', () => {
        const output = result.invoked.stdout + result.invoked.stderr;
        expect(output).toContain('--prune src/alpa/**');
        expect(output).toContain('src/alpha/**');
      });

      then('a refusal writes naught', () => {
        expect(result.after).toEqual(result.before);
      });

      then('the refusal matches snapshot', () => {
        expect(
          asNormalized(result.invoked.stdout + result.invoked.stderr),
        ).toMatchSnapshot();
      });
    });
  });
});
