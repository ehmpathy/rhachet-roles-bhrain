import { given, then, when } from 'test-fns';

import { asStoneGuardPartitionGapLines } from './asStoneGuardPartitionGapLines';
import type { StoneGuardPartitionGap } from './StoneGuardPartitionGap';

const ROUTE = '.behavior/v2026_01_01.demo';
const COMMAND_ALL = [
  `rhx route.guard.partition --route ${ROUTE} --for review --peer @all`,
  `  --partition 'route=src/route/*,src/route/drive/**,${ROUTE}/**'`,
  '  --mode apply',
].join(' \\\n');
const COMMAND_PEER = [
  `rhx route.guard.partition --route ${ROUTE} --for review --peer mech-rules --stone 5.1.execution`,
  `  --partition 'solo=src/**,${ROUTE}/**'`,
  `  --partition 'docs=docs/**,${ROUTE}/**'`,
  '  --mode apply',
].join(' \\\n');

const GAP_UNCLAIMED: StoneGuardPartitionGap = {
  scope: { kind: 'all' },
  unclaimed: ['src/route/drive/getBlocker.ts'],
  routeAbsentFrom: [],
  placed: [
    {
      path: 'src/route/drive/getBlocker.ts',
      slug: 'route',
      glob: 'src/route/drive/**',
    },
  ],
  command: COMMAND_ALL,
};
const GAP_ROUTE_ABSENT: StoneGuardPartitionGap = {
  scope: { kind: 'all' },
  unclaimed: [],
  routeAbsentFrom: ['meter'],
  placed: [],
  command: COMMAND_ALL,
};
const GAP_PEER: StoneGuardPartitionGap = {
  scope: { kind: 'peer', stone: '5.1.execution', peer: 'mech-rules' },
  unclaimed: ['docs/x.md'],
  routeAbsentFrom: [],
  placed: [{ path: 'docs/x.md', slug: 'docs', glob: 'docs/**' }],
  command: COMMAND_PEER,
};

describe('asStoneGuardPartitionGapLines', () => {
  given('[case1] one @all gap with an unclaimed file', () => {
    when('[t0] the refusal is rendered', () => {
      const text = asStoneGuardPartitionGapLines({
        stone: '5.1.execution',
        gaps: [GAP_UNCLAIMED],
      }).join('\n');

      then('the headline says no lane runs until the partitions cover', () => {
        expect(text).toContain('no lane runs until they cover them');
      });

      // r014 nitpick.2, i014 — the route.drive replay prints these same lines long after the
      // entrance, so the copy must narrate no moment the reader may not be in
      then(
        'the copy is context-free — it names no entrance, no past run',
        () => {
          expect(text).not.toContain('at the entrance');
          expect(text).not.toContain('no lane was run');
          expect(text).toContain(
            '🗿 route.guard.partition, on stone 5.1.execution',
          );
        },
      );

      then(
        'it names the file and the partition the repair places it in',
        () => {
          expect(text).toContain(
            'src/route/drive/getBlocker.ts → route (+ src/route/drive/**)',
          );
        },
      );

      then('it carries the repair command, each line verbatim', () => {
        COMMAND_ALL.split('\n').forEach((line) => expect(text).toContain(line));
      });

      then('it matches the snapshot', () => {
        expect(text).toMatchSnapshot();
      });
    });
  });

  given('[case2] a gap with only a partition that lacks the route', () => {
    when('[t0] the refusal is rendered', () => {
      const text = asStoneGuardPartitionGapLines({
        stone: '5.1.execution',
        gaps: [GAP_ROUTE_ABSENT],
      }).join('\n');

      then('it names the partition that lacks the route spec', () => {
        expect(text).toContain('1 partition lacks the route spec');
        expect(text).toContain('meter (+ the route spec)');
      });

      then('it claims no unclaimed file', () => {
        expect(text).not.toContain('in no partition');
      });

      then('it matches the snapshot', () => {
        expect(text).toMatchSnapshot();
      });
    });
  });

  given('[case3] two gaps — the @all set and one override', () => {
    when('[t0] the refusal is rendered', () => {
      const text = asStoneGuardPartitionGapLines({
        stone: '5.1.execution',
        gaps: [GAP_UNCLAIMED, GAP_PEER],
      }).join('\n');

      then('each scope is named', () => {
        expect(text).toContain('scope @all');
        expect(text).toContain('scope mech-rules on 5.1.execution');
      });

      then('each scope carries its own repair command', () => {
        [...COMMAND_ALL.split('\n'), ...COMMAND_PEER.split('\n')].forEach(
          (line) => expect(text).toContain(line),
        );
      });

      then('it matches the snapshot', () => {
        expect(text).toMatchSnapshot();
      });
    });
  });
});
