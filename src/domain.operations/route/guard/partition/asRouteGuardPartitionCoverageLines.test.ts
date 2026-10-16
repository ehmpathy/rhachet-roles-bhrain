import { UnexpectedCodePathError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { genStoneGuardPartitionCoverage } from './.test/genStoneGuardPartitionCoverage';
import { asRouteGuardPartitionCoverageLines } from './asRouteGuardPartitionCoverageLines';

const ROUTE = '.behavior/v2026_01_01.demo';
const STONE = '5.1.execution';

const SET_WITH_REST = [
  `review={src/review/**,${ROUTE}/**}`,
  `route={src/route/**,src/shared/**,${ROUTE}/**}`,
  `rest={src/**,${ROUTE}/**}`,
];
const TARGETS = [
  'src/review/getReview.ts',
  'src/route/getRoute.ts',
  'src/shared/types.ts',
  'src/utils/new/asWidget.ts',
  `${ROUTE}/1.vision.md`,
];

describe('asRouteGuardPartitionCoverageLines', () => {
  given(
    '[case1] a stone whose @all set holds, one partition literally named rest',
    () => {
      const coverage = genStoneGuardPartitionCoverage({
        route: ROUTE,
        scope: { kind: 'all' },
        peers: ['r1', 'r2'],
        partition: SET_WITH_REST,
        targets: TARGETS,
      });
      const text = asRouteGuardPartitionCoverageLines({
        route: ROUTE,
        stone: STONE,
        coverages: [coverage],
        full: false,
      }).join('\n');

      when('[t0] the coverage is rendered', () => {
        then('it says it is a read — naught written, no review run', () => {
          expect(text).toContain('naught written, no review run');
          expect(text).not.toContain('to write it: add --mode apply');
        });

        then('it names the stone and the count checked', () => {
          expect(text).toContain(`   ├─ stone = ${STONE}`);
          expect(text).toContain('checked against 5 files changed since main');
        });

        then('each file sits under the partition that claims it', () => {
          expect(text).toContain('review: 0 narrow targets + 2 common targets');
          // a partition named rest reads as any partition does
          expect(text).toContain('rest: 1 narrow target + 4 common targets');
          expect(text).not.toContain('listed below');
          expect(text.split('src/utils/new/asWidget.ts').length - 1).toEqual(1);
          expect(text).toContain('src/review/getReview.ts → review, rest');
          expect(text).toContain('src/route/getRoute.ts → route, rest');
        });

        then('a shared file names the slugs that carry it', () => {
          expect(text).toContain('src/shared/types.ts → route, rest');
        });

        then('🔴 no catch-all section is rendered', () => {
          expect(text).not.toContain('fell to rest');
        });

        then('the verdict holds, and reviewers are named', () => {
          expect(text).toContain('read by r1, r2');
          expect(text).toContain('verdict: holds');
        });

        then(
          'the verdict claims the route spec, since the diff holds one',
          () => {
            expect(text).toContain('common: 4 (route spec: 1)');
            expect(text).toContain('each with the route spec');
          },
        );

        then('it matches the snapshot', () => {
          expect(text).toMatchSnapshot();
        });
      });
    },
  );

  given('[case2] a stone whose override leaves a file unclaimed', () => {
    const coverage = genStoneGuardPartitionCoverage({
      route: ROUTE,
      scope: { kind: 'peer', stone: STONE, peer: 'r2' },
      peers: ['r2'],
      partition: [`review={src/review/**,${ROUTE}/**}`],
      targets: ['src/review/getReview.ts', 'src/route/getRoute.ts'],
    });
    const text = asRouteGuardPartitionCoverageLines({
      route: ROUTE,
      stone: STONE,
      coverages: [coverage],
      full: false,
    }).join('\n');

    when('[t0] the coverage is rendered', () => {
      then(
        'the unclaimed file is listed, and the verdict names the gap',
        () => {
          expect(text).toContain('unclaimed: 1');
          expect(text).toContain('src/route/getRoute.ts');
          expect(text).toContain('verdict: gap');
          expect(text).toContain(`scope r2 on ${STONE} — read by r2`);
        },
      );

      then(
        '🔴 the gap closes on the repair command the entrance gate prints',
        () => {
          // the preview hands the driver the lever the halt would, before a round is spent
          if (!coverage.gap)
            throw new UnexpectedCodePathError('fixture must leave a gap', {
              hint: 'the [case2] partition set must leave src/route/getRoute.ts unclaimed',
            });
          expect(text).toContain('└─ repair — run this before you arrive');
          for (const line of coverage.gap.command.split('\n'))
            expect(text).toContain(line);
          expect(text).toContain('├─ verdict: gap');
        },
      );

      then('it matches the snapshot', () => {
        expect(text).toMatchSnapshot();
      });
    });
  });

  given('[case3] a stone whose reviewers read no partition set', () => {
    const text = asRouteGuardPartitionCoverageLines({
      route: ROUTE,
      stone: STONE,
      coverages: [],
      full: false,
    }).join('\n');

    when('[t0] the coverage is rendered', () => {
      then('it says every lane runs whole', () => {
        expect(text).toContain('declared: none');
        expect(text).toContain('every lane runs whole');
      });

      then('it matches the snapshot', () => {
        expect(text).toMatchSnapshot();
      });
    });
  });

  given('[case4] the route @all set alone, with no stone named', () => {
    const coverage = genStoneGuardPartitionCoverage({
      route: ROUTE,
      scope: { kind: 'all' },
      peers: null,
      partition: SET_WITH_REST,
      targets: TARGETS,
    });
    const lines = asRouteGuardPartitionCoverageLines({
      route: ROUTE,
      stone: null,
      coverages: [coverage],
      full: false,
    });

    when('[t0] the coverage is rendered', () => {
      then('it names no stone and no reviewers', () => {
        expect(lines.join('\n')).not.toContain('stone =');
        expect(lines).toContain('   └─ scope @all');
      });

      then('it matches the snapshot', () => {
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case6] a held @all set whose diff holds no route spec file', () => {
    const coverage = genStoneGuardPartitionCoverage({
      route: ROUTE,
      scope: { kind: 'all' },
      peers: ['r1'],
      partition: SET_WITH_REST,
      targets: ['src/review/getReview.ts', 'src/utils/new/asWidget.ts'],
    });
    const text = asRouteGuardPartitionCoverageLines({
      route: ROUTE,
      stone: STONE,
      coverages: [coverage],
      full: false,
    }).join('\n');

    when('[t0] the coverage is rendered', () => {
      then('the verdict holds', () => {
        expect(text).toContain('route spec: 0');
        expect(text).toContain(
          '└─ verdict: holds — every changed file sits in a partition',
        );
      });

      // 🔴 a claim about an empty set reads as a check that was made
      then('🔴 the verdict makes no route spec claim', () => {
        expect(text).not.toContain('each with the route spec');
      });

      then('it matches the snapshot', () => {
        expect(text).toMatchSnapshot();
      });
    });
  });

  given('[case5] a branch with more files per list than the cap shows', () => {
    const named = Array.from(
      { length: 8 },
      (_, index) => `src/review/r${index}.ts`,
    );
    const fell = Array.from(
      { length: 7 },
      (_, index) => `src/new/n${index}.ts`,
    );
    const unclaimed = Array.from(
      { length: 23 },
      (_, index) => `lib/u${String(index).padStart(2, '0')}.ts`,
    );
    const coverage = genStoneGuardPartitionCoverage({
      route: ROUTE,
      scope: { kind: 'all' },
      peers: ['r1'],
      partition: SET_WITH_REST,
      targets: [...named, ...fell, ...unclaimed, `${ROUTE}/1.vision.md`],
    });
    const asText = (input: { full: boolean }): string =>
      asRouteGuardPartitionCoverageLines({
        route: ROUTE,
        stone: STONE,
        coverages: [coverage],
        full: input.full,
      }).join('\n');

    when('[t0] the coverage is rendered with the cap', () => {
      const text = asText({ full: false });

      then('every count and the verdict show whole', () => {
        expect(text).toContain('rest: 7 narrow targets');
        expect(text).toContain('unclaimed: 23');
        expect(text).toContain('verdict: gap');
      });

      then(
        'the common list shows its head of 5, and names the remainder',
        () => {
          expect(text).toContain('common: 9 (route spec: 1)');
          expect(text).toContain('src/review/r4.ts');
          expect(text).not.toContain('src/review/r5.ts');
          expect(text).toContain('… +3 more (--full lists every path)');
        },
      );

      then(
        'the rest narrow list shows its head of 5, and names the remainder',
        () => {
          expect(text).toContain('src/new/n4.ts');
          expect(text).not.toContain('src/new/n5.ts');
          expect(text).toContain('… +2 more (--full lists every path)');
        },
      );

      then(
        'the unclaimed list shows its head of 20, and names the remainder',
        () => {
          expect(text).toContain('lib/u19.ts');
          expect(text).not.toContain('lib/u20.ts');
          expect(text).toContain('… +3 more (--full lists every path)');
        },
      );

      then('it matches the snapshot', () => {
        expect(text).toMatchSnapshot();
      });
    });

    when('[t1] the coverage is rendered in full', () => {
      const text = asText({ full: true });

      then('every path is listed, and no remainder is named', () => {
        expect(text).toContain('src/review/r7.ts');
        expect(text).toContain('src/new/n6.ts');
        expect(text).toContain('lib/u22.ts');
        expect(text).not.toContain('more (--full');
      });
    });
  });
});
