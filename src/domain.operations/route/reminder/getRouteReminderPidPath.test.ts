import * as path from 'path';

import { getRouteReminderPidPath } from './getRouteReminderPidPath';

/**
 * .what = unit cases for getRouteReminderPidPath — the per-session handle path
 * .why = the session token is the whole per-session isolation guarantee (vision Q10): two
 *        distinct clone addresses must NEVER fold to the same pid filename, or one session's
 *        register returns the other's daemon and a deregister kills the wrong one. these cases
 *        clamp the injective encode — the lossy `replace(/[^safe]+/g,'-')` this replaced folded
 *        `@feat/auth` and `@feat-auth` to the SAME token; this proves distinct in, distinct out.
 */
describe('getRouteReminderPidPath', () => {
  const route = '/tmp/route-x';

  test('the common readable case passes through mostly unescaped', () => {
    const p = getRouteReminderPidPath({ route, cloneAddr: '@:driver-1' });
    // a plain address stays human-readable — only the '@' and ':' sigil chars escape
    expect(path.basename(p)).toEqual(
      'daemon.of=reminder-driveon.session=~40~3adriver-1.pid',
    );
  });

  test('the handle sits in the route .route/ dir', () => {
    const p = getRouteReminderPidPath({ route, cloneAddr: '@:driver-1' });
    expect(p).toEqual(
      path.join(
        route,
        '.route',
        'daemon.of=reminder-driveon.session=~40~3adriver-1.pid',
      ),
    );
  });

  // the clamp that carries the guarantee: a pair the OLD lossy fold collided must now map to
  // DISTINCT files
  const COLLISION_PAIRS: { a: string; b: string }[] = [
    { a: '@feat/auth', b: '@feat-auth' }, // '/'→'~2f' vs literal '-'
    { a: 'a/b', b: 'a-b' }, // the minimal collision the reviewer cited
    { a: 'role:3', b: 'role-3' }, // ':'→'~3a' vs literal '-'
    { a: 'x y', b: 'x-y' }, // ' '→'~20' vs literal '-'
  ];

  COLLISION_PAIRS.forEach(({ a, b }) => {
    test(`distinct addresses map to distinct handles: "${a}" vs "${b}"`, () => {
      const pathA = getRouteReminderPidPath({ route, cloneAddr: a });
      const pathB = getRouteReminderPidPath({ route, cloneAddr: b });
      // the whole per-session guarantee: two different sessions never share one handle
      expect(pathA).not.toEqual(pathB);
    });
  });

  test('an unsafe char is escaped to its ~XX hex byte', () => {
    // '@feat/auth' → '@'=0x40, '/'=0x2f escaped; letters/'-' pass through
    const p = getRouteReminderPidPath({ route, cloneAddr: '@feat/auth' });
    expect(path.basename(p)).toEqual(
      'daemon.of=reminder-driveon.session=~40feat~2fauth.pid',
    );
  });

  test('a literal ~ is itself escaped, so the escape stays reversible', () => {
    // '~' (0x7e) is outside the safe set → it escapes to ~7e, so it can never be confused
    // with an escape prefix (this is what keeps distinct inputs distinct)
    const p = getRouteReminderPidPath({ route, cloneAddr: 'a~b' });
    expect(path.basename(p)).toEqual(
      'daemon.of=reminder-driveon.session=a~7eb.pid',
    );
  });
});
