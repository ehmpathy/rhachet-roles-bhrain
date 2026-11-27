import { readdirSync, readFileSync } from 'fs';
import { given, then, useThen, when } from 'test-fns';

import {
  INSTINCT_REPLY_LABELS,
  INSTINCT_SAMPLE_JUDGMENTS,
} from './instinctReplyLabels.fixture';

/**
 * .what = rescores the logged replay runs on the stated-basis criterion; no live ask is made
 * .why = seed S020 defines the instinct's job: flag a claim that is not skepticized, or states no basis, from the reply text alone.
 *        a claim that a turn read backs, but the reply does not state, is a right flag
 *
 * .note = a flag lands on a labeled claim by the `match` fragments of the labels fixture.
 *         a flag that lands on none is unjudged; a seeded sample of those carries hand judgments (INSTINCT_SAMPLE_JUDGMENTS)
 * .note = a replay, not a test: its input is the local, gitignored `.log/` of 2026-11-26, absent in ci.
 *         run by hand: npx jest --testRegex 'instinctFlagRateRescore\.replay\.ts$'
 */
const LOG_DIR = '.log/role=mechanic/skill=git.repo.test/what=integration';
const LOG_DAY = '2026-11-26'; // the replay runs: the stdout logs of that day that hold scored rows, in order
const LOGS = readdirSync(LOG_DIR)
  .filter((f) => f.startsWith(LOG_DAY) && f.endsWith('.stdout.log'))
  .sort()
  .map((f) => `${LOG_DIR}/${f}`)
  .filter((p) => readFileSync(p, 'utf8').includes('"scored"'));
const SAMPLE_EVERY = 6; // every 6th unjudged flag, per run

interface LoggedFlag {
  claim: string;
  concern: string;
}
interface LoggedRow {
  id: string;
  scored: LoggedFlag[];
}
interface LoggedRun {
  tag: string;
  rows: LoggedRow[];
}

const parseRuns = (path: string, prefix: string): LoggedRun[] => {
  const lines = readFileSync(path, 'utf8').split('\n');
  const runs: LoggedRun[] = [];
  let buf: string[] | null = null;
  for (const line of lines) {
    if (buf === null && line === '    {') buf = [line];
    else if (buf !== null) {
      buf.push(line);
      if (line === '    }') {
        const parsed = JSON.parse(buf.join('\n'));
        runs.push({
          tag: `${prefix}${parsed.variant ?? 'v1'}#${runs.length}`,
          rows: parsed.rows,
        });
        buf = null;
      }
    }
  }
  return runs;
};

describe('instinctFlagRateRescore', () => {
  given('[case1] the logged runs and the stated-basis labels', () => {
    when('[t0] each run is rescored', () => {
      const result = useThen('the logs parse', async () => {
        const runs = [
          ...parseRuns(LOGS[0]!, 'first:'),
          ...parseRuns(LOGS[1]!, 'rerun:'),
        ];
        const claimsAll = Object.values(INSTINCT_REPLY_LABELS).flat();
        const unstatedLabeled = claimsAll.filter(
          (c) => c.basis !== 'states-basis',
        ).length;

        const report = runs.map((run) => {
          let right = 0;
          let wrong = 0;
          let unjudged = 0;
          let sRight = 0;
          let sWrong = 0;
          let sTotal = 0;
          let flagsTotal = 0;
          let missed = 0;
          const sample: string[] = [];
          let unjudgedSeen = 0;
          for (const row of run.rows) {
            const labels = INSTINCT_REPLY_LABELS[row.id] ?? [];
            row.scored.forEach((f, idx) => {
              flagsTotal += 1;
              const hit = labels.find((l) =>
                l.match.some((m) => f.claim.toLowerCase().includes(m)),
              );
              if (hit) {
                if (hit.basis === 'states-basis') wrong += 1;
                else right += 1;
                return;
              }
              unjudged += 1;
              unjudgedSeen += 1;
              const key = `${run.tag}|${row.id}|${idx}`;
              const j = INSTINCT_SAMPLE_JUDGMENTS[key];
              if (j) {
                sTotal += 1;
                if (j === 'states-basis') sWrong += 1;
                else sRight += 1;
              }
              if (unjudgedSeen % SAMPLE_EVERY === 0)
                sample.push(`${key} :: ${f.claim} :: ${f.concern}`);
            });
            missed += labels.filter(
              (l) =>
                l.basis !== 'states-basis' &&
                !row.scored.some((f) =>
                  l.match.some((m) => f.claim.toLowerCase().includes(m)),
                ),
            ).length;
          }
          return {
            tag: run.tag,
            replies: run.rows.length,
            flagsTotal,
            flagsPerReply: flagsTotal / run.rows.length,
            unstatedLabeledPerReply: unstatedLabeled / run.rows.length,
            labeled: { right, wrong },
            precisionLabeledOnly: right / (right + wrong || 1),
            missed: `${missed} of ${unstatedLabeled}`,
            unjudged,
            sample: {
              judged: sTotal,
              right: sRight,
              wrong: sWrong,
              precision: sRight / (sTotal || 1),
              unjudgedPrecisionEstimate: sTotal ? sRight / sTotal : null,
            },
            sampleToJudge: sample,
          };
        });
        console.log(
          JSON.stringify(
            {
              labeledClaims: claimsAll.length,
              unstatedLabeled,
              stated: claimsAll.length - unstatedLabeled,
              report,
            },
            null,
            2,
          ),
        );
        return { report };
      });

      then('every run parses', () => {
        expect(result.report.length).toBeGreaterThan(0);
      });
    });
  });
});
