import { given, then, when } from 'test-fns';

import { asLogDirNameParts } from './__test_assets__/asLogDirNameParts';
import { genLogDirName } from './genLogDirName';

describe('genLogDirName', () => {
  given('[case1] a tight loop, as a concurrent pour spawns its lanes', () => {
    /**
     * 🔴 .why = THE regression clamp, and it is the vision's `case=10` requirement
     *           expressed at the one grain where it has teeth.
     *
     *           the vision asked to *"assert the COUNT of directories, never the
     *           content of one"*, and named the acceptance grain. ⚠️ an acceptance
     *           pour cannot exercise this defect at all — the guard runs every review
     *           as its own subprocess, so each lane carries a distinct pid and the
     *           count comes out right with the uuid deleted. ⇒ that clamp would be
     *           green under the defect, which is no clamp.
     *
     * .note = a count, never a content check — exactly as asked. `new Set(...).size`
     *         is the assertion, so a collision of ANY two names goes red regardless of
     *         which two they are
     */
    when('[t0] 500 names are minted with no wait between them', () => {
      const names = Array.from({ length: 500 }, () => genLogDirName());

      then('every one is distinct — no two lanes share a directory', () => {
        expect(new Set(names).size).toEqual(500);
      });

      // 🔴 .why these two, and NOT a stamp-collision bound = they carry the same
      //    claim — *"the suffixes are what part these names, never the clock"* —
      //    with no dependence on the host's clock at all.
      //
      // ⚠️ .note = this read `expect(new Set(stamps).size).toBeLessThan(500)` until
      //    i023. that asserts 500 iso stamps COLLIDE in a tight loop, which is a
      //    property of the HOST rather than of this operation: a gc pause or a slow
      //    box could mint 500 distinct stamps and take the clamp red on a correct
      //    implementation. a flaky clamp is worse than an absent one, because the
      //    first red teaches a reader to re-run rather than to read.
      //    raised i023/r009 nitpick.2
      //
      //    ⇒ and the value it was there to add is already held DETERMINISTICALLY
      //      elsewhere: strip the uuid and `asLogDirNameParts` refuses the name
      //      outright ([case2]), so uuid removal goes red by grammar rather than by
      //      arithmetic over a clock
      const parted = names.map((name) => asLogDirNameParts({ name }));

      then('the pid parts NOT ONE of them inside a single process', () => {
        // .why = the half a reader assumes does the work, and it cannot: every one
        //        of the 500 shares this process. the pid parts the guard's LANES
        //        (each review is its own subprocess); it never parts calls within one
        expect(new Set(parted.map((part) => part.pid)).size).toEqual(1);
      });

      then('the uuid is minted PER CALL — 500 names, 500 uuids', () => {
        // 🔴 the teeth: a module-level `const uuid = getUuid()` — the shape a
        //    refactor reaches for to "avoid the repeated call" — yields 500
        //    identical uuids and takes this red at once
        expect(new Set(parted.map((part) => part.uuid)).size).toEqual(500);
      });
    });
  });

  given('[case2] the shape a driver reads out of a failure hint', () => {
    when('[t0] one name is minted', () => {
      const name = genLogDirName();

      // 🔴 .why parsed once, at the head = `asLogDirNameParts` REFUSES a name
      //    that does not match the grammar, so a grammar drift lands here as a
      //    loud throw. the positional splits it replaced returned `undefined`
      //    on a drift, and an assertion against `undefined` was the only guard
      //    that would have caught it. raised i032/r6
      const parts = asLogDirNameParts({ name });

      then('it leads with a sortable iso stamp', () => {
        expect(parts.stamp).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/,
        );
      });

      then(
        'it carries this process`s pid, which parts the guard`s lanes',
        () => {
          expect(parts.pid).toEqual(String(process.pid));
        },
      );

      then('it carries a uuid, which parts calls inside ONE process', () => {
        expect(parts.uuid).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        );
      });
    });
  });
});
