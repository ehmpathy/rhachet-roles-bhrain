import { given, then, when } from 'test-fns';

import { formatRouteDriveHeaderLines } from './formatRouteDriveHeaderLines';

describe('formatRouteDriveHeaderLines', () => {
  given('[case1] a halt with no aside', () => {
    when('[t0] the header renders', () => {
      const lines = formatRouteDriveHeaderLines({
        route: '.behavior/v2026_01_01.demo',
        stone: '1.vision',
        aside: [],
      });

      then(
        'the owl, the tree root, and the route + stone branch render in order',
        () => {
          expect(lines).toEqual([
            `🦉 where were we?`,
            '',
            `🗿 route.drive`,
            `   ├─ where do we go?`,
            `   │  ├─ route = .behavior/v2026_01_01.demo`,
            `   │  └─ stone = 1.vision`,
            `   │`,
          ]);
        },
      );

      then('the bytes a driver reads are pinned', () => {
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case2] the stone guidance, with its tea-pause aside', () => {
    when('[t0] the header renders', () => {
      const lines = formatRouteDriveHeaderLines({
        route: '.behavior/v2026_01_01.demo',
        stone: '1.vision',
        aside: [`🍵 tea first. then, choose your path.`, ''],
      });

      then('the aside sits between the owl and the tree root', () => {
        expect(lines.slice(0, 5)).toEqual([
          `🦉 where were we?`,
          '',
          `🍵 tea first. then, choose your path.`,
          '',
          `🗿 route.drive`,
        ]);
      });
    });
  });
});
