import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, getError, given, then, when } from 'test-fns';

import { assertRouteFulcrumDisputesRuled } from './assertRouteFulcrumDisputesRuled';
import { setFulcrumVerdictRow } from './setFulcrumVerdictRow';

const asFulcrumFile = (input: {
  slug: string;
  owed: 'human' | 'reflect' | 'none';
  verdict: string;
}): string =>
  [
    '---',
    `case: ${input.slug}`,
    'rework: clean',
    `ground: ${input.owed === 'reflect' ? 'wrong' : 'dirty'}`,
    `confidence: ${input.owed === 'reflect' ? '0.95' : '0.65'}`,
    'status: held',
    `owed: ${input.owed}`,
    ...(input.owed === 'reflect' ? ['reflect: ehmpathy/rhachet#1'] : []),
    'holds: [rules/i003/blocker.2]',
    'lean: keep the table as written',
    `verdict: ${input.verdict}`,
    '---',
    '',
    `# fulcrum: ${input.slug}`,
  ].join('\n');

const genRouteWithFulcrums = (input: {
  slug: string;
  files: Record<string, string>;
}): string => {
  const route = genTempDir({ slug: input.slug });
  const dir = path.join(route, '.fulcrums');
  fs.mkdirSync(dir, { recursive: true });
  Object.entries(input.files).forEach(([name, content]) =>
    fs.writeFileSync(
      path.join(dir, `inventory.of=fulcrums.case=${name}.md`),
      content,
    ),
  );
  return route;
};

/**
 * .what = masks the temp route in a refusal, so its bytes snap stable across runs
 */
const asStableRefusal = (input: { message: string; route: string }): string =>
  input.message.split(input.route).join('<route>');

describe('assertRouteFulcrumDisputesRuled', () => {
  given('[case1] a route with one human-owed dispute, unruled', () => {
    const route = genRouteWithFulcrums({
      slug: 'fulcrum-refusal-owed',
      files: {
        'F44-rename-table': asFulcrumFile({
          slug: 'F44',
          owed: 'human',
          verdict: 'null',
        }),
      },
    });
    when('[t0] a human approves', () => {
      then('the grant is refused, and names the dispute', async () => {
        const error = await getError(
          assertRouteFulcrumDisputesRuled({
            route,
            stone: '3.blueprint',
            grant: 'approved',
          }),
        );
        expect(error.message).toContain('F44');
        expect(error.message).toContain(
          'rhx route.fulcrum.rule --case F44 --as upheld|conceded',
        );
        expect(
          asStableRefusal({ message: error.message, route }),
        ).toMatchSnapshot();
      });
    });
  });

  given(
    '[case2] a route whose dispute a human ruled, with a ledger row',
    () => {
      const route = genRouteWithFulcrums({
        slug: 'fulcrum-refusal-ruled',
        files: {
          'F44-rename-table': asFulcrumFile({
            slug: 'F44',
            owed: 'human',
            verdict: '{ by: human, at: 2026-11-17, ruled: upheld }',
          }),
        },
      });
      beforeAll(async () => {
        await setFulcrumVerdictRow({
          route,
          row: { case: 'F44', ruled: 'upheld', on: '2026-11-17' },
        });
      });
      when('[t0] a human approves', () => {
        then('the grant proceeds', async () => {
          await assertRouteFulcrumDisputesRuled({
            route,
            stone: '3.blueprint',
            grant: 'approved',
          });
        });
      });
    },
  );

  given('[case3] a yaml verdict with no ledger row (a hand edit)', () => {
    const route = genRouteWithFulcrums({
      slug: 'fulcrum-refusal-forged',
      files: {
        'F44-rename-table': asFulcrumFile({
          slug: 'F44',
          owed: 'human',
          verdict: '{ by: human, at: 2026-11-17, ruled: upheld }',
        }),
      },
    });
    when('[t0] a human forces', () => {
      then('the grant is refused, and names the forged verdict', async () => {
        const error = await getError(
          assertRouteFulcrumDisputesRuled({
            route,
            stone: '3.blueprint',
            grant: 'forced',
          }),
        );
        expect(error.message).toContain('no human lever wrote');
      });
    });
  });

  given('[case4] only a reflect-owed dispute, and an unreadable entry', () => {
    const route = genRouteWithFulcrums({
      slug: 'fulcrum-refusal-unreadable',
      files: {
        'F45-sure-misread': asFulcrumFile({
          slug: 'F45',
          owed: 'reflect',
          verdict: 'null',
        }),
        'F46-no-frontmatter': '# fulcrum: no frontmatter\n',
      },
    });
    when('[t0] a human approves', () => {
      then(
        'the unreadable entry refuses the grant; the reflect is listed apart',
        async () => {
          const error = await getError(
            assertRouteFulcrumDisputesRuled({
              route,
              stone: '3.blueprint',
              grant: 'approved',
            }),
          );
          expect(error.message).toContain('unreadable, owe repair');
          expect(error.message).toContain('F46');
          expect(error.message).toContain('reflected upstream, informational');
          expect(
            asStableRefusal({ message: error.message, route }),
          ).toMatchSnapshot();
        },
      );
    });
  });

  given('[case4b] a file in .fulcrums whose name declares no case', () => {
    const route = genRouteWithFulcrums({
      slug: 'fulcrum-refusal-misnamed',
      files: {},
    });
    beforeAll(() => {
      fs.writeFileSync(
        path.join(route, '.fulcrums', 'F47.deferral.md'),
        asFulcrumFile({ slug: 'F47', owed: 'human', verdict: 'null' }),
      );
    });
    when('[t0] a human approves', () => {
      then(
        'the misnamed file refuses the grant as unreadable, never skipped',
        async () => {
          const error = await getError(
            assertRouteFulcrumDisputesRuled({
              route,
              stone: '3.blueprint',
              grant: 'approved',
            }),
          );
          expect(error.message).toContain('unreadable, owe repair');
          expect(error.message).toContain('F47.deferral.md');
        },
      );
    });
  });

  given('[case5] a route with only a reflect-owed dispute', () => {
    const route = genRouteWithFulcrums({
      slug: 'fulcrum-refusal-reflect-only',
      files: {
        'F45-sure-misread': asFulcrumFile({
          slug: 'F45',
          owed: 'reflect',
          verdict: 'null',
        }),
      },
    });
    when('[t0] a human approves', () => {
      then('the grant proceeds', async () => {
        await assertRouteFulcrumDisputesRuled({
          route,
          stone: '3.blueprint',
          grant: 'approved',
        });
      });
    });
  });

  given('[case6] a route with no fulcrums at all', () => {
    const route = genTempDir({ slug: 'fulcrum-refusal-none' });
    when('[t0] a human approves', () => {
      then('the grant proceeds', async () => {
        await assertRouteFulcrumDisputesRuled({
          route,
          stone: '3.blueprint',
          grant: 'approved',
        });
      });
    });
  });
});
