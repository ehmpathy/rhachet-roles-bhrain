import { given, then, useThen, when } from 'test-fns';

import { computeBlockRemedyGroups } from '@src/domain.operations/route/guard/tree/formatBlockRemedyGroups';

import { routeDrive } from './route';

/**
 * .what = pins `route.drive --help` against the remedy labels the halt actually renders
 * .why = the help prose names the two budget-halt remedies and their owners verbatim, which makes
 *        it a FIFTH place those labels appear. it is documentation rather than a render path, so
 *        `rule.forbid.duplicate-format-tree-operations` does not reach it — but the drift hazard is
 *        identical, and a reader told one story by `--help` and another by the halt is exactly the
 *        confusion `rule.forbid.domain-term-inconsistency` forbids. so the prose stays readable and
 *        the LABELS are pinned to their one source instead.
 *
 * .note = `--help` short-circuits before any i/o (`route.ts:570-573`), so this stays a unit test —
 *         no filesystem, no route, no boundary crossed
 *         (`rule.forbid.unit.remote-boundaries`).
 */
const captureOutput = async (fn: () => Promise<void>): Promise<string> => {
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]): number => logs.push(args.join(' '));
  try {
    await fn();
  } finally {
    console.log = originalLog;
  }
  return logs.join('\n');
};

describe('route.drive --help', () => {
  given('[case1] the help names the budget-halt remedies', () => {
    when('[t0] help is printed', () => {
      // 🔴 the ACT lives in the `when` that names it, never inside a `then`.
      //    `useThen` is the paved way to hoist it and share the result
      //    (`rule.require.useThen-useWhen-for-shared-results`), so every `then`
      //    below only asserts. with the act inside a `then`, a
      //    `--testNamePattern` that skipped that one step would leave the help
      //    unprinted and the suite green.
      const result = useThen('it prints without a throw', async () => {
        const argvOriginal = process.argv;
        process.argv = ['node', 'rhx', 'route.drive', '--help'];
        const output = await captureOutput(() => routeDrive()).finally(() => {
          process.argv = argvOriginal;
        });
        return { output };
      });

      then('every label it quotes comes from the shared remedy source', () => {
        const labels = computeBlockRemedyGroups({
          stone: '1.vision',
          passage: 'blocked',
          reason: 'peer reviewer budget exhausted',
        }).map((group) => group.label);

        // both remedies of a budget halt are quoted in the help, so both must match
        expect(labels).toHaveLength(2);
        for (const label of labels) expect(result.output).toContain(label);
      });

      then('the whole help surface is pinned, as a driver reads it', () => {
        // 🔴 the label assertions above pin the two words that MUST agree with the
        //    halt tree; they pin no part of the prose around them. so a reword that
        //    happened to keep both labels — a changed usage line, a dropped flag, a
        //    reordered section — would stay green with no diff for a reviewer to see.
        //    `rule.require.contract-snapshot-exhaustiveness` names `--help` as a cli
        //    variant that owes stdout coverage, and this is that coverage
        //    (r2 ergo-contract-snapshots, blocker.1, i019).
        //
        // .why no mask = `--help` short-circuits before any i/o (`route.ts:570-573`),
        //    so the text is static. there is no clock, path, or cost in it to mask.
        expect(result.output).toMatchSnapshot();
      });
    });
  });
});
