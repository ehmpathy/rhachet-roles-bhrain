import * as path from 'path';

import { DIR_OF_ROUTE_REMINDER_HANDLES } from './getRouteReminderHandlePath';
import { getRouteReminderPidPath } from './getRouteReminderPidPath';

/**
 * .what = unit cases for getRouteReminderPidPath — the per-clone handle path
 * .why = the clone token is the whole per-clone isolation guarantee: two distinct clone addresses
 *        must NEVER fold to the same pid filename, or one clone's register returns the other's
 *        daemon and a deregister kills the wrong one. these cases clamp the injective encode.
 */
describe('getRouteReminderPidPath', () => {
  const repoRoot = '/tmp/repo-x';

  test('the common readable case passes through mostly unescaped', () => {
    const p = getRouteReminderPidPath({ repoRoot, cloneAddr: '@:driver-1' });
    // a plain address stays human-readable — only the '@' and ':' sigil chars escape
    expect(path.basename(p)).toEqual(
      'daemon.of=reminder-driveon.session=~40~3adriver-1.pid',
    );
  });

  test('the handle sits in the clone home under the repo root', () => {
    const p = getRouteReminderPidPath({ repoRoot, cloneAddr: '@:driver-1' });
    expect(p).toEqual(
      path.join(
        repoRoot,
        DIR_OF_ROUTE_REMINDER_HANDLES,
        'daemon.of=reminder-driveon.session=~40~3adriver-1.pid',
      ),
    );
  });

  // the clamp that carries the guarantee: a pair a lossy fold would collide must map to DISTINCT files
  const COLLISION_PAIRS: { a: string; b: string }[] = [
    { a: '@feat/auth', b: '@feat-auth' }, // '/'→'~2f' vs literal '-'
    { a: 'a/b', b: 'a-b' }, // the minimal collision
    { a: 'role:3', b: 'role-3' }, // ':'→'~3a' vs literal '-'
    { a: 'x y', b: 'x-y' }, // ' '→'~20' vs literal '-'
  ];

  COLLISION_PAIRS.forEach(({ a, b }) => {
    test(`distinct addresses map to distinct handles: "${a}" vs "${b}"`, () => {
      const pathA = getRouteReminderPidPath({ repoRoot, cloneAddr: a });
      const pathB = getRouteReminderPidPath({ repoRoot, cloneAddr: b });
      // the whole per-clone guarantee: two different clones never share one handle
      expect(pathA).not.toEqual(pathB);
    });
  });

  test('an unsafe char is escaped to its ~XX hex byte', () => {
    // '@feat/auth' → '@'=0x40, '/'=0x2f escaped; letters/'-' pass through
    const p = getRouteReminderPidPath({ repoRoot, cloneAddr: '@feat/auth' });
    expect(path.basename(p)).toEqual(
      'daemon.of=reminder-driveon.session=~40feat~2fauth.pid',
    );
  });

  test('a literal ~ is itself escaped, so the escape stays reversible', () => {
    // '~' (0x7e) is outside the safe set → it escapes to ~7e, so it can never be confused
    // with an escape prefix (this is what keeps distinct inputs distinct)
    const p = getRouteReminderPidPath({ repoRoot, cloneAddr: 'a~b' });
    expect(path.basename(p)).toEqual(
      'daemon.of=reminder-driveon.session=a~7eb.pid',
    );
  });
});
