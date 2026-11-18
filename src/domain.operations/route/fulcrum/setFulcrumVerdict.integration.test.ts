import * as fs from 'fs/promises';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';
import { genTempDir, getError, given, then, useThen, when } from 'test-fns';

import type { FulcrumVerdictRow } from '@src/domain.objects/Driver/FulcrumVerdictRow';

import { asFulcrumFrontmatter } from './asFulcrumFrontmatter';
import { getAllFulcrumVerdictRows } from './getAllFulcrumVerdictRows';
import { getOneRouteFulcrumDisputeState } from './getOneRouteFulcrumDisputeState';
import { setFulcrumVerdict } from './setFulcrumVerdict';
import { setFulcrumVerdictRow } from './setFulcrumVerdictRow';

/**
 * .what = writes one fulcrum entry into a temp route
 */
const genRouteWithFulcrum = async (input: {
  slug: string;
  owed: 'human' | 'reflect' | 'none';
  verdict: string;
  frontmatterCase?: string;
}): Promise<{ route: string; file: string }> => {
  const route = genTempDir({ slug: input.slug });
  const dir = path.join(route, '.fulcrums');
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, 'inventory.of=fulcrums.case=F44-rename-table.md');
  await fs.writeFile(
    file,
    [
      '---',
      `case: ${input.frontmatterCase ?? 'F44'}`,
      'rework: clean',
      'ground: wrong',
      'confidence: 0.65',
      'status: open',
      `owed: ${input.owed}`,
      ...(input.owed === 'reflect' ? ['reflect: ehmpathy/demo#1'] : []),
      'holds:',
      '  - rules/i003/blocker.2',
      "# the driver's note, which the verdict write must keep",
      'lean: keep the table as written',
      `verdict: ${input.verdict}`,
      '---',
      '',
      '# F44 · rename-table',
      '',
      'the body stays as written.',
      '',
    ].join('\n'),
  );
  return { route, file };
};

/**
 * .what = a refusal's message with its temp route masked
 * .why = helpful-errors appends the metadata bag into the message, and the bag carries the route
 */
const asStableRefusal = (input: { error: Error; route: string }): string =>
  input.error.message.split(input.route).join('<route>');

describe('setFulcrumVerdict', () => {
  given('[case1] an open human-owed dispute', () => {
    when('[t0] a human rules it upheld', () => {
      const result = useThen('it writes the verdict', async () => {
        const scene = await genRouteWithFulcrum({
          slug: 'fulcrum-verdict-human',
          owed: 'human',
          verdict: 'null',
        });
        const outcome = await setFulcrumVerdict(
          { route: scene.route, case: 'F44', ruled: 'upheld' },
          { isTTY: true },
        );
        const content = await fs.readFile(scene.file, 'utf8');
        const rows = await getAllFulcrumVerdictRows({ route: scene.route });
        const state = await getOneRouteFulcrumDisputeState({
          route: scene.route,
        });
        const again = await setFulcrumVerdict(
          { route: scene.route, case: 'F44', ruled: 'upheld' },
          { isTTY: true },
        );
        const rowsAfterAgain = await getAllFulcrumVerdictRows({
          route: scene.route,
        });
        return { outcome, content, rows, state, again, rowsAfterAgain };
      });

      then('the yaml carries status ruled and the human verdict', () => {
        const parse = asFulcrumFrontmatter({ content: result.content });
        expect(parse.kind).toEqual('valid');
        if (parse.kind !== 'valid')
          throw new UnexpectedCodePathError(
            'the ruled fulcrum should parse valid',
            { parse, hint: 'the verdict write broke the frontmatter block' },
          );
        expect(parse.frontmatter.status).toEqual('ruled');
        expect(parse.frontmatter.verdict?.ruled).toEqual('upheld');
        expect(parse.frontmatter.verdict?.by).toEqual('human');
      });

      then('the body stays intact', () => {
        expect(result.content).toContain('the body stays as written.');
      });

      then(
        '🔴 every line but status and verdict stays as written, comments and key order included',
        () => {
          expect(result.content).toContain(
            "holds:\n  - rules/i003/blocker.2\n# the driver's note, which the verdict write must keep\nlean: keep the table as written",
          );
          expect(result.content).toMatchSnapshot();
        },
      );

      then(
        'the ledger row binds the verdict to the content the human read',
        () => {
          const parse = asFulcrumFrontmatter({ content: result.content });
          if (parse.kind !== 'valid')
            throw new UnexpectedCodePathError(
              'the ruled fulcrum should parse valid',
              { parse, hint: 'the verdict write broke the frontmatter block' },
            );
          expect(result.rows[0]?.seen).toEqual(parse.seen);
        },
      );

      then('the ledger holds one row for the case', () => {
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0]).toMatchObject({ case: 'F44', ruled: 'upheld' });
      });

      then('the dispute state reads it as ruled, and no longer owed', () => {
        expect(result.state.owedHuman).toHaveLength(0);
        expect(result.state.ruled.map((e) => e.frontmatter.case)).toEqual([
          'F44',
        ]);
        expect(result.state.forged).toHaveLength(0);
      });

      then('a second identical verdict is a no-op', () => {
        expect(result.outcome.outcome).toEqual('ruled');
        expect(result.again.outcome).toEqual('unchanged');
        expect(result.rowsAfterAgain).toHaveLength(1);
      });
    });

    when('[t1] a caller with no tty tries to rule it', () => {
      const result = useThen('it is refused', async () => {
        const scene = await genRouteWithFulcrum({
          slug: 'fulcrum-verdict-clone',
          owed: 'human',
          verdict: 'null',
        });
        const error = await getError(
          setFulcrumVerdict(
            { route: scene.route, case: 'F44', ruled: 'upheld' },
            { isTTY: false },
          ),
        );
        const rows = await getAllFulcrumVerdictRows({ route: scene.route });
        const content = await fs.readFile(scene.file, 'utf8');
        return { error, rows, content };
      });

      then('the refusal names that only a human can rule', () => {
        expect(result.error.message).toContain('only a human');
      });

      then('no ledger row and no yaml verdict are written', () => {
        expect(result.rows).toHaveLength(0);
        expect(result.content).toContain('verdict: null');
      });
    });
  });

  given('[case2] a yaml verdict written by hand, with no ledger row', () => {
    when('[t0] the dispute state is read', () => {
      const result = useThen('it reads the state', async () => {
        const scene = await genRouteWithFulcrum({
          slug: 'fulcrum-verdict-forged',
          owed: 'human',
          verdict: '{ by: human, at: 2026-11-17, ruled: upheld }',
        });
        return getOneRouteFulcrumDisputeState({ route: scene.route });
      });

      then('the entry is forged', () => {
        expect(result.forged.map((e) => e.frontmatter.case)).toEqual(['F44']);
      });

      then('the entry still owes the human', () => {
        expect(result.owedHuman.map((e) => e.frontmatter.case)).toEqual([
          'F44',
        ]);
      });
    });
  });

  given('[case3] a fulcrum that owes reflect, not a human', () => {
    when('[t0] a human overturns the sure dispute', () => {
      const result = useThen('it writes the verdict', async () => {
        const scene = await genRouteWithFulcrum({
          slug: 'fulcrum-verdict-reflect',
          owed: 'reflect',
          verdict: 'null',
        });
        const outcome = await setFulcrumVerdict(
          { route: scene.route, case: 'F44', ruled: 'conceded' },
          { isTTY: true },
        );
        const state = await getOneRouteFulcrumDisputeState({
          route: scene.route,
        });
        return { outcome, state };
      });

      then(
        '🔴 a human may rule a reflect-owed dispute; the 0.90 line is the driver grade',
        () => {
          expect(result.outcome.outcome).toEqual('ruled');
        },
      );

      then('the entry reads as ruled, no longer as reflected', () => {
        expect(result.state.ruled.map((e) => e.frontmatter.case)).toEqual([
          'F44',
        ]);
        expect(result.state.reflected).toHaveLength(0);
      });
    });
  });

  given('[case10] a ruled fulcrum the driver edits afterward', () => {
    when('[t0] a concern is added to holds, then the state is read', () => {
      const result = useThen('it reads the state', async () => {
        const scene = await genRouteWithFulcrum({
          slug: 'fulcrum-verdict-reopened',
          owed: 'human',
          verdict: 'null',
        });
        await setFulcrumVerdict(
          { route: scene.route, case: 'F44', ruled: 'upheld' },
          { isTTY: true },
        );
        const content = await fs.readFile(scene.file, 'utf8');
        await fs.writeFile(
          scene.file,
          content.replace(
            '  - rules/i003/blocker.2',
            '  - rules/i003/blocker.2\n  - rules/i004/blocker.1',
          ),
        );
        const state = await getOneRouteFulcrumDisputeState({
          route: scene.route,
        });
        const again = await setFulcrumVerdict(
          { route: scene.route, case: 'F44', ruled: 'upheld' },
          { isTTY: true },
        );
        const rows = await getAllFulcrumVerdictRows({ route: scene.route });
        const stateAfter = await getOneRouteFulcrumDisputeState({
          route: scene.route,
        });
        return { state, again, rows, stateAfter };
      });

      then(
        '🔴 the new concern reaches a human: the entry owes again, read as reopened',
        () => {
          expect(result.state.owedHuman.map((e) => e.frontmatter.case)).toEqual(
            ['F44'],
          );
          expect(result.state.reopened.map((e) => e.frontmatter.case)).toEqual([
            'F44',
          ]);
          expect(result.state.forged).toHaveLength(0);
          expect(result.state.ruled).toHaveLength(0);
        },
      );

      then(
        'a re-rule on the edited content appends a row and proves it',
        () => {
          expect(result.again.outcome).toEqual('ruled');
          expect(result.rows).toHaveLength(2);
          expect(result.stateAfter.owedHuman).toHaveLength(0);
          expect(
            result.stateAfter.ruled.map((e) => e.frontmatter.case),
          ).toEqual(['F44']);
        },
      );
    });
  });

  given(
    '[case4] a fulcrum whose frontmatter case differs from its file case id',
    () => {
      when('[t0] a human tries to rule it', () => {
        const result = useThen('it is refused', async () => {
          const scene = await genRouteWithFulcrum({
            slug: 'fulcrum-verdict-file-case',
            owed: 'human',
            verdict: 'null',
            frontmatterCase: 'F44-rename-table',
          });
          const error = await getError(
            setFulcrumVerdict(
              { route: scene.route, case: 'F44', ruled: 'upheld' },
              { isTTY: true },
            ),
          );
          const rows = await getAllFulcrumVerdictRows({ route: scene.route });
          return { error, rows, route: scene.route };
        });

        then(
          '🔴 the entry is unreadable until its case equals the file id',
          () => {
            expect(result.error.message).toContain('unreadable frontmatter');
            expect(result.error.message).toContain(
              'case (equal to the file id, F44)',
            );
          },
        );

        then('no ledger row is written', () => {
          expect(result.rows).toHaveLength(0);
        });

        then('the refusal a human reads is pinned', () => {
          expect(asStableRefusal(result)).toMatchSnapshot();
        });
      });
    },
  );

  given('[case9] a fulcrum with no frontmatter at all', () => {
    when('[t0] a human tries to rule it', () => {
      const result = useThen('it is refused', async () => {
        const scene = await genRouteWithFulcrum({
          slug: 'fulcrum-verdict-absent',
          owed: 'human',
          verdict: 'null',
        });
        await fs.writeFile(scene.file, '# F44 · rename-table\n\nprose only.\n');
        const error = await getError(
          setFulcrumVerdict(
            { route: scene.route, case: 'F44', ruled: 'upheld' },
            { isTTY: true },
          ),
        );
        const rows = await getAllFulcrumVerdictRows({ route: scene.route });
        return { error, rows, route: scene.route };
      });

      then('🔴 the refusal names every field as absent', () => {
        expect(result.error.message).toContain('unreadable frontmatter');
        expect(result.error.message).toContain('├─ absent');
        expect(result.error.message).toContain('owed: none');
      });

      then('no ledger row is written', () => {
        expect(result.rows).toHaveLength(0);
      });

      then('the refusal a human reads is pinned', () => {
        expect(asStableRefusal(result)).toMatchSnapshot();
      });
    });
  });

  given('[case7] a case id with no fulcrum on the route', () => {
    when('[t0] a human rules it', () => {
      const result = useThen('it is refused', async () => {
        const scene = await genRouteWithFulcrum({
          slug: 'fulcrum-verdict-typo',
          owed: 'human',
          verdict: 'null',
        });
        const error = await getError(
          setFulcrumVerdict(
            { route: scene.route, case: 'F45', ruled: 'upheld' },
            { isTTY: true },
          ),
        );
        return { error, route: scene.route };
      });

      then('the refusal names the case and where it looked', () => {
        expect(result.error.message).toContain('no fulcrum found for case F45');
      });

      then('the refusal a human reads is pinned', () => {
        expect(asStableRefusal(result)).toMatchSnapshot();
      });
    });
  });

  given('[case8] a design-call fulcrum that owes none', () => {
    when('[t0] a human tries to rule it', () => {
      const result = useThen('it is refused', async () => {
        const scene = await genRouteWithFulcrum({
          slug: 'fulcrum-verdict-none',
          owed: 'none',
          verdict: 'null',
        });
        const error = await getError(
          setFulcrumVerdict(
            { route: scene.route, case: 'F44', ruled: 'upheld' },
            { isTTY: true },
          ),
        );
        return { error, route: scene.route };
      });

      then('the refusal names that it holds no dispute to rule', () => {
        expect(result.error.message).toContain(
          'holds no dispute a human can rule',
        );
      });

      then('the refusal a human reads is pinned', () => {
        expect(asStableRefusal(result)).toMatchSnapshot();
      });
    });
  });

  given('[case5] a verdict the human changed, then a hand flipped back', () => {
    when('[t0] the dispute state is read', () => {
      const result = useThen('it reads the state', async () => {
        const scene = await genRouteWithFulcrum({
          slug: 'fulcrum-verdict-flipped',
          owed: 'human',
          verdict: 'null',
        });
        await setFulcrumVerdict(
          { route: scene.route, case: 'F44', ruled: 'upheld' },
          { isTTY: true },
        );
        await setFulcrumVerdict(
          { route: scene.route, case: 'F44', ruled: 'conceded' },
          { isTTY: true },
        );
        const content = await fs.readFile(scene.file, 'utf8');
        await fs.writeFile(
          scene.file,
          content.replace('ruled: conceded', 'ruled: upheld'),
        );
        const rows = await getAllFulcrumVerdictRows({ route: scene.route });
        const state = await getOneRouteFulcrumDisputeState({
          route: scene.route,
        });
        return { rows, state };
      });

      then('the ledger holds both verdicts, in order', () => {
        expect(result.rows.map((row) => row.ruled)).toEqual([
          'upheld',
          'conceded',
        ]);
      });

      then(
        'the superseded row does not prove the flip; it reads as forged',
        () => {
          expect(result.state.forged.map((e) => e.frontmatter.case)).toEqual([
            'F44',
          ]);
          expect(result.state.owedHuman).toHaveLength(1);
          expect(result.state.ruled).toHaveLength(0);
        },
      );
    });
  });

  given('[case6] a ledger row written twice', () => {
    when('[t0] the same verdict row is set again', () => {
      const result = useThen('it is found, not appended', async () => {
        const route = genTempDir({ slug: 'fulcrum-verdict-row-twice' });
        const row: FulcrumVerdictRow = {
          case: 'F44',
          ruled: 'upheld',
          on: '2026-11-17',
          seen: 'hash-read',
        };
        const first = await setFulcrumVerdictRow({ route, row });
        const second = await setFulcrumVerdictRow({ route, row });
        const rows = await getAllFulcrumVerdictRows({ route });
        return { first, second, rows };
      });

      then('the first appends and the second finds it', () => {
        expect(result.first.outcome).toEqual('appended');
        expect(result.second.outcome).toEqual('found');
        expect(result.rows).toHaveLength(1);
      });
    });
  });
});
