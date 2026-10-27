import { asTreeLeaves } from './asTreeLeaves';

describe('asTreeLeaves', () => {
  test('a bare leaf and a leaf with children → tees, elbows, and a stem beneath a peer', () => {
    expect(
      asTreeLeaves({
        leaves: [
          { line: 'roots (2)', children: ['/a', '/b'] },
          'hint: pass a path',
        ],
      }),
    ).toEqual(['├─ roots (2)', '│  ├─ /a', '│  └─ /b', '└─ hint: pass a path']);
  });

  test('the last leaf hangs its children under a blank stem', () => {
    expect(
      asTreeLeaves({ leaves: [{ line: 'fix: retry', children: ['rhx x'] }] }),
    ).toEqual(['└─ fix: retry', '   └─ rhx x']);
  });

  test('no leaves → no lines', () => {
    expect(asTreeLeaves({ leaves: [] })).toEqual([]);
  });
});
