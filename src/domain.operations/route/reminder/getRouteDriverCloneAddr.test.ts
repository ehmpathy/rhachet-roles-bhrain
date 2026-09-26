import { given, then, when } from 'test-fns';

import { getRouteDriverCloneAddr } from './getRouteDriverCloneAddr';

/**
 * .what = unit-proves the driver clone-addr read from RHACHET_CLONE_SERIAL
 * .why = the auto-wire keys the reminder on this value; a plain session (var absent) MUST read
 *        as null so the caller skips the reminder, and a spawned clone MUST read its serial in
 *        the canonical `@:`-prefixed form — the SAME shape a `--clone-addr` flag requires, so
 *        the auto-wire and a manual invoke never disagree on what a cloneAddr looks like.
 *
 * .note = mutates + restores process.env.RHACHET_CLONE_SERIAL around each case. serial by jest
 *         default, so the save/restore of one var cannot leak across cases.
 */
describe('getRouteDriverCloneAddr', () => {
  const priorSerial = process.env.RHACHET_CLONE_SERIAL;
  afterEach(() => {
    if (priorSerial === undefined) delete process.env.RHACHET_CLONE_SERIAL;
    else process.env.RHACHET_CLONE_SERIAL = priorSerial;
  });

  given('[case1] a plain session — RHACHET_CLONE_SERIAL is absent', () => {
    when('[t0] the addr is read', () => {
      then('it reads null (not an enrolled clone)', () => {
        delete process.env.RHACHET_CLONE_SERIAL;
        expect(getRouteDriverCloneAddr()).toEqual(null);
      });
    });
  });

  given('[case2] a blank RHACHET_CLONE_SERIAL (whitespace only)', () => {
    when('[t0] the addr is read', () => {
      then('it reads null (a blank serial is no serial)', () => {
        process.env.RHACHET_CLONE_SERIAL = '   ';
        expect(getRouteDriverCloneAddr()).toEqual(null);
      });
    });
  });

  given('[case3] a spawned clone — RHACHET_CLONE_SERIAL holds a serial', () => {
    when('[t0] the addr is read', () => {
      then('it reads the serial, @:-prefixed to the canonical form', () => {
        process.env.RHACHET_CLONE_SERIAL = 'clone-abc123';
        expect(getRouteDriverCloneAddr()).toEqual({
          cloneAddr: '@:clone-abc123',
        });
      });
    });
  });
});
