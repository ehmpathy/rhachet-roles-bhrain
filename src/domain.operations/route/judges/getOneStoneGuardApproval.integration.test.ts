import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, when } from 'test-fns';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';

import { genFulcrumEntryContent } from '../__test_assets__/genFulcrumEntryContent';
import { setFulcrumVerdictAsTheLever } from '../__test_assets__/setFulcrumVerdictAsTheLever';
import { getAllRouteFulcrumRepairsOwed } from '../fulcrum/getAllRouteFulcrumRepairsOwed';
import { getOneRouteFulcrumDisputeState } from '../fulcrum/getOneRouteFulcrumDisputeState';
import { getAllPassageReportsRaw } from '../passage/getAllPassageReportsRaw';
import { setPassageReport } from '../passage/setPassageReport';
import { getOneStoneGuardApproval } from './getOneStoneGuardApproval';
import { setStoneGuardApproval } from './setStoneGuardApproval';

/**
 * .what = a stone, with an `approved?` judge on its guard where it is human-gated
 */
const genStone = (input: {
  route: string;
  name: string;
  isHumanGated: boolean;
}): RouteStone =>
  new RouteStone({
    name: input.name,
    path: path.join(input.route, `${input.name}.stone`),
    guard: new RouteStoneGuard({
      path: path.join(input.route, `${input.name}.guard`),
      artifacts: [`${input.name}*.md`],
      reviews: { self: [], peer: [] },
      judges: input.isHumanGated
        ? [
            'rhx route.stone.judge --mechanism approved? --stone $stone --route $route',
          ]
        : [],
      protect: [],
    }),
  });

const FULCRUM = '.fulcrums/inventory.of=fulcrums.case=F44-rename-table.md';

/**
 * .what = a temp route whose stone 1.vision was approved, then disputed via F44
 */
const genRouteApprovedThenDisputed = async (input: {
  slug: string;
}): Promise<string> => {
  const route = genTempDir({ slug: input.slug });
  fs.mkdirSync(path.join(route, '.fulcrums'), { recursive: true });
  fs.writeFileSync(
    path.join(route, FULCRUM),
    genFulcrumEntryContent({ case: 'F44', confidence: 0.7 }),
  );
  await setPassageReport({
    route,
    report: new PassageReport({ stone: '1.vision', status: 'approved' }),
  });
  await setPassageReport({
    route,
    report: new PassageReport({
      stone: '1.vision',
      status: 'disputed',
      reviewer: 'rules',
      about: 'blocker.2',
      given: 'r001.rules.md',
      fulcrum: FULCRUM,
      reason: 'disputed review.peer: rules blocker.2',
    }),
  });
  return route;
};

describe('getOneStoneGuardApproval', () => {
  // r011 i009 blocker.1: every "is this stone approved?" reader shares this rule
  given(
    '[case1] a human-gated stone, approved before a dispute was raised',
    () => {
      when('[t0] the approval is read while the dispute owes the human', () => {
        then(
          '🔴 no approval is in force — the stone halts at its gate',
          async () => {
            const route = await genRouteApprovedThenDisputed({
              slug: 'appr-open',
            });
            const stone = genStone({
              route,
              name: '1.vision',
              isHumanGated: true,
            });
            expect(await getOneStoneGuardApproval({ stone, route })).toBeNull();
          },
        );
      });
    },
  );

  given('[case2] an ungated stone, approved, then disputed', () => {
    when('[t0] the approval is read', () => {
      then(
        'it stays in force — a dispute never halts an ungated stone',
        async () => {
          const route = await genRouteApprovedThenDisputed({
            slug: 'appr-ungated',
          });
          const stone = genStone({
            route,
            name: '1.vision',
            isHumanGated: false,
          });
          expect(
            await getOneStoneGuardApproval({ stone, route }),
          ).not.toBeNull();
        },
      );
    });
  });

  given(
    '[case3] a human-gated stone, approved, then disputed and conceded',
    () => {
      const scene = { route: '' };
      beforeAll(async () => {
        scene.route = await genRouteApprovedThenDisputed({
          slug: 'appr-conceded',
        });
        await setFulcrumVerdictAsTheLever({
          route: scene.route,
          fulcrum: FULCRUM,
          ruled: 'conceded',
          on: '2026-11-18',
        });
      });

      when('[t0] the approval that predates the verdict is read', () => {
        then(
          '🔴 no approval is in force — the repair awaits a human approval',
          async () => {
            const stone = genStone({
              route: scene.route,
              name: '1.vision',
              isHumanGated: true,
            });
            expect(
              await getOneStoneGuardApproval({ stone, route: scene.route }),
            ).toBeNull();
          },
        );
      });

      // r011 i008 blocker.1: through the real writer, whose findsert once swallowed this row
      when('[t1] the human approves after the repair lands', () => {
        then(
          '🔴 the re-approval lands as a new row, and is in force',
          async () => {
            const stone = genStone({
              route: scene.route,
              name: '1.vision',
              isHumanGated: true,
            });
            await setStoneGuardApproval({ stone, route: scene.route });
            const reports = await getAllPassageReportsRaw({
              route: scene.route,
            });
            expect(
              reports.filter((report) => report.status === 'approved'),
            ).toHaveLength(2);
            expect(
              await getOneStoneGuardApproval({ stone, route: scene.route }),
            ).not.toBeNull();
          },
        );
      });

      when('[t2] the human approves once more, with no verdict since', () => {
        then('the approval is found, never appended twice', async () => {
          const stone = genStone({
            route: scene.route,
            name: '1.vision',
            isHumanGated: true,
          });
          await setStoneGuardApproval({ stone, route: scene.route });
          const reports = await getAllPassageReportsRaw({ route: scene.route });
          expect(
            reports.filter((report) => report.status === 'approved'),
          ).toHaveLength(2);
        });
      });
    },
  );

  // r011 i010 blocker.1: the writer once keyed its findsert on "in force", which an ungated stone
  // always is, so the re-approval that answers its repair never landed
  given(
    '[case5] an ungated stone, approved, then disputed and conceded',
    () => {
      when('[t0] the human approves again through the real writer', () => {
        then(
          '🔴 the re-approval lands as a new row, and the repair is answered',
          async () => {
            const route = await genRouteApprovedThenDisputed({
              slug: 'appr-ungated-conceded',
            });
            const stone = genStone({
              route,
              name: '1.vision',
              isHumanGated: false,
            });
            await setFulcrumVerdictAsTheLever({
              route,
              fulcrum: FULCRUM,
              ruled: 'conceded',
              on: '2026-11-18',
            });
            await setStoneGuardApproval({ stone, route });
            const reports = await getAllPassageReportsRaw({ route });
            expect(
              reports.filter((report) => report.status === 'approved'),
            ).toHaveLength(2);
            const state = await getOneRouteFulcrumDisputeState({ route });
            expect(getAllRouteFulcrumRepairsOwed({ state })).toEqual([]);
          },
        );
      });
    },
  );

  given('[case4] a human-gated stone, approved, with no dispute', () => {
    when('[t0] the approval is read', () => {
      then('it is in force', async () => {
        const route = genTempDir({ slug: 'appr-clear' });
        const stone = genStone({ route, name: '1.vision', isHumanGated: true });
        await setPassageReport({
          route,
          report: new PassageReport({ stone: '1.vision', status: 'approved' }),
        });
        expect(await getOneStoneGuardApproval({ stone, route })).not.toBeNull();
      });
    });
  });
});
