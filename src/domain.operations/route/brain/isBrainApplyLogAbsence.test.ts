import { given, then, when } from 'test-fns';

import { isBrainApplyLogAbsence } from './isBrainApplyLogAbsence';

/**
 * .what = pins the ALLOWLIST boundary itself — which codes are a benign absence, and which
 *         are a machine fault that must travel
 *
 * 🔴 .why it exists = the integration clamps drive ONE code per side (`ENOTDIR` absorbed,
 *    `EISDIR` travels), because those are the two a hermetic temp dir can raise. the codes
 *    the reviewer named by name — `ENOSPC`, `EMFILE`, `EIO` — need a full disk, an exhausted
 *    descriptor table, and a device that refuses, and none is reachable without a host
 *    dependency a peer rule forbids outright (`rule.forbid.bare-host-deps`)
 *
 *    ⇒ so the boundary is pinned at the PREDICATE, where every code is reachable for free,
 *      and the integration clamps prove the WIRE. neither alone covers the class
 *
 * .teeth measured 2026-09-18 = add `'ENOSPC'` to `CODES_ABSENCE` → `[case2]` red. drop
 *   `'EBADF'` from it → `[case1]` red (and `delBrainApplyLogHandoff`'s idempotency with it)
 */
describe('isBrainApplyLogAbsence', () => {
  given('[case1] an ABSENCE-shaped code', () => {
    // .why each = a path with no home, a path occupied by a file, a checkout that is not
    //      ours to write, a read-only filesystem, and a descriptor already spent
    const codes = ['ENOENT', 'ENOTDIR', 'EACCES', 'EPERM', 'EROFS', 'EBADF'];

    when('[t0] the predicate reads it', () => {
      then('every one is absorbed', () => {
        const verdicts = codes.map((code) =>
          isBrainApplyLogAbsence(Object.assign(new Error(code), { code })),
        );
        expect(verdicts).toEqual(codes.map(() => true));
      });
    });
  });

  given('[case2] a FOREIGN code — a fault of the machine', () => {
    // 🔴 .why each = the three the reviewer named as operator-actionable, plus the one the
    //    integration clamp drives. a diagnostic log exists to surface exactly these, so to
    //    absorb one would restore the failhide under a longer name
    const codes = ['ENOSPC', 'EMFILE', 'ENFILE', 'EIO', 'EISDIR'];

    when('[t0] the predicate reads it', () => {
      then('every one travels', () => {
        const verdicts = codes.map((code) =>
          isBrainApplyLogAbsence(Object.assign(new Error(code), { code })),
        );
        expect(verdicts).toEqual(codes.map(() => false));
      });
    });
  });

  given('[case3] a thrown value that carries no code at all', () => {
    when('[t0] the predicate reads it', () => {
      then(
        'it travels — an unrecognized shape is never a benign absence',
        () => {
          // .why = the default must be TRAVEL rather than absorb. a predicate that answered
          //        true for what it could not classify would absorb every future fault shape
          expect(isBrainApplyLogAbsence(new Error('no code'))).toEqual(false);
          expect(isBrainApplyLogAbsence('a string')).toEqual(false);
          expect(isBrainApplyLogAbsence(null)).toEqual(false);
          expect(isBrainApplyLogAbsence(undefined)).toEqual(false);
        },
      );
    });
  });
});
