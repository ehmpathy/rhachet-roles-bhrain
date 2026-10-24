import * as fs from 'node:fs';
import * as path from 'node:path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { execAsync } from './.test/execAsync';
import { genTempDirForRhachet } from './.test/genTempDirForRhachet';

// .note = js-yaml ships no types; required as the rest of src does (asReviewRubricsConfig.ts)
const yaml = require('js-yaml');

const ASSETS_DIR = path.join(__dirname, '.test/assets/roles-boot-consumer');

// the roles whose boot is clamped to a budget (src/domain.roles/roleBootClamps.integration.test.ts)
const ROLES_BUDGETED = ['learner', 'driver', 'librarian'] as const;

// the one line each budgeted role's readme carries: the pointer from a booted cue to its argument
const LINE_OF_MIN_CONVENTION =
  'each `X.md.min` here condenses the `X.md` beside it. read the `.md` for the argument.';

// transformer: the briefs a boot emitted at say, one `<brief.say path>` tag each
const asPathsOfBriefSay = (input: { stdout: string }): string[] =>
  [...input.stdout.matchAll(/<brief\.say path="([^"]+)"/g)].map(
    (match) => match[1]!,
  );

// transformer: the skills a boot emitted at say, one `<skill.say path>` tag each
const asPathsOfSkillSay = (input: { stdout: string }): string[] =>
  [...input.stdout.matchAll(/<skill\.say path="([^"]+)"/g)].map(
    (match) => match[1]!,
  );

// transformer: the payload and budget a boot rendered in its stats (`budget = 20,003 / 20,250 tokens`)
const asBudgetStatsOfBoot = (input: {
  stdout: string;
}): { payload: number; budget: number } | null => {
  const match = input.stdout.match(/budget = ([\d,]+) \/ ([\d,]+) tokens/);
  if (!match) return null;
  return {
    payload: Number(match[1]!.replace(/,/g, '')),
    budget: Number(match[2]!.replace(/,/g, '')),
  };
};

// transformer: the stats tree a boot renders, from its root line through its `budget = ` leaf
const asStatsBlockOfBoot = (input: { stdout: string }): string | null => {
  const lines = input.stdout.split('\n');
  const indexOfBudget = lines.findIndex((line) => /budget = /.test(line));
  if (indexOfBudget < 0) return null;
  const indicesOfRoot = lines
    .slice(0, indexOfBudget)
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.trim() && !/^\s*[├└│]/.test(line))
    .map(({ index }) => index);
  const indexOfRoot = indicesOfRoot.pop();
  if (indexOfRoot === undefined) return null;
  return lines.slice(indexOfRoot, indexOfBudget + 1).join('\n');
};

// transformer: the one roster row `roles cost --all` renders for a spec
const asRowOfCostRoster = (input: {
  stdout: string;
  spec: string;
}): string | null =>
  input.stdout
    .split('\n')
    .find((line) => line.includes(input.spec))
    ?.replace(/^[\s├└│─]+/, '')
    .trimEnd() ?? null;

/**
 * .what = each budgeted role, linked from the built package into a consumer repo, boots dense
 * .why  = the clamp test boots `src`; a consumer boots `dist` through `roles link`. this proves
 *         the seam: the build ships every min's `.md` beside it, the readme line reaches the
 *         boot, and the linked boot stays under the budget it declares
 */
describe('roles.boot.consumer-seat.acceptance', () => {
  ROLES_BUDGETED.forEach((slug, index) => {
    given(`[case${index + 1}] a consumer repo that links the ${slug} role`, () => {
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDirForRhachet({
          slug: `roles-boot-consumer-${slug}`,
          clone: ASSETS_DIR,
        });
        await execAsync(`npx rhachet roles link --role ${slug}`, {
          cwd: tempDir,
        });
        return { tempDir };
      });

      when('[t0] the consumer boots the linked role', () => {
        const result = useBeforeAll(async () => {
          // .note = stdout lands in a file, never a pipe: a pipe capture of this boot was
          //         seen to drop a run of brief tags mid-stream (payload intact, tags absent),
          //         and a file write cannot be partially read
          const fileOut = path.join(scene.tempDir, 'boot.stdout.txt');
          const { stderr } = await execAsync(
            `npx rhachet roles boot --what .agent/repo=bhrain/role=${slug}/boot.yml > ${fileOut}`,
            { cwd: scene.tempDir },
          );
          return { stdout: fs.readFileSync(fileOut, 'utf8'), stderr };
        });

        then('it boots under its budget, with no over-budget warn', () => {
          expect(result.stderr).not.toContain('over budget');
          const stats = asBudgetStatsOfBoot({ stdout: result.stdout });
          expect(stats).not.toBeNull();
          expect(stats!.payload).toBeLessThanOrEqual(stats!.budget);
        });

        then('every booted min has its `.md` beside it in the package', () => {
          const mins = asPathsOfBriefSay({ stdout: result.stdout }).filter(
            (file) => file.endsWith('.md.min'),
          );
          expect(mins.length).toBeGreaterThan(0);
          const absent = mins.filter(
            (min) =>
              !fs.existsSync(
                path.join(scene.tempDir, min.replace(/\.min$/, '')),
              ),
          );
          expect(absent).toEqual([]);
        });

        then('its boot carries the readme line that points each min to its `.md`', () => {
          expect(result.stdout).toContain(LINE_OF_MIN_CONVENTION);
        });

        then('every brief its linked boot.yml declares at say is booted', () => {
          // a dangled link in the package drops a brief with no error and a lower payload, so
          // only a declared-vs-emitted check sees it
          const roleDir = `.agent/repo=bhrain/role=${slug}`;
          const spec = yaml.load(
            fs.readFileSync(path.join(scene.tempDir, roleDir, 'boot.yml'), 'utf8'),
          );
          const declared: string[] = spec.always.briefs.say;
          const emitted = new Set(asPathsOfBriefSay({ stdout: result.stdout }));
          const absent = declared.filter(
            (entry) =>
              !emitted.has(path.join(roleDir, entry)) &&
              !emitted.has(`${path.join(roleDir, entry)}.min`),
          );
          expect(declared.length).toBeGreaterThan(0);
          expect(absent).toEqual([]);
        });

        then('its booted say paths, briefs and skills, match the snapshot', () => {
          expect({
            briefs: asPathsOfBriefSay({ stdout: result.stdout }),
            skills: asPathsOfSkillSay({ stdout: result.stdout }),
          }).toMatchSnapshot();
        });

        then('its stats block, as the consumer reads it, matches the snapshot', () => {
          const block = asStatsBlockOfBoot({ stdout: result.stdout });
          expect(block).toContain('% used)');
          expect(block).toMatchSnapshot();
        });
      });

      when('[t1] the consumer costs its boot specs', () => {
        const result = useBeforeAll(async () =>
          execAsync('npx rhachet roles cost --all', { cwd: scene.tempDir }),
        );

        then('the linked spec reads as linked, under its budget', () => {
          const row = asRowOfCostRoster({
            stdout: result.stdout,
            spec: `.agent/repo=bhrain/role=${slug}/boot.yml`,
          });
          expect(row).toMatch(/ \(linked\)$/);
          const match = row!.match(/^([\d,]+) \/ ([\d,]+) tokens \(\d+%\)/);
          expect(match).not.toBeNull();
          expect(Number(match![1]!.replace(/,/g, ''))).toBeLessThanOrEqual(
            Number(match![2]!.replace(/,/g, '')),
          );
          expect(row).toMatchSnapshot();
        });
      });
    });
  });
});
