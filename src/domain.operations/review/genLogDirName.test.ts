import { given, then, when } from 'test-fns';

import { asLogDirNameParts } from './__test_assets__/asLogDirNameParts';
import { asLogDirMintedAt } from './asLogDirMintedAt';
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

  given(
    '[case3] the order contract `--of run` rests its whole answer on',
    () => {
      /**
       * 🔴 .why = `getOneReviewRunMeterLatest` picks "the run that just ran" by a
       *           LEXICAL sort of these names, and takes the last. that is correct
       *           only while the iso stamp leads — a silent time assumption with a
       *           silent failure: a name that does not sort chronologically is
       *           reported as the newest run, and the command renders one plausible
       *           row with no signal at all (rule.forbid.behavior-hazards).
       *
       *           `[case2]` already pins that the stamp is sortable IN ISOLATION.
       *           this pins the property the CONSUMER actually depends on — that a
       *           lexical sort over whole names is a chronological one — so a future
       *           move of the stamp off the head goes red HERE rather than silently
       *           re-defines what "latest" means.
       *
       * .note = built from a real minted name, with only the stamp substituted. an
       *         assertion over two hand-written strings would pass even if the
       *         grammar changed shape entirely
       */
      when('[t0] two names differ only in their stamp', () => {
        const parts = asLogDirNameParts({ name: genLogDirName() });
        const asNameWithStamp = (stamp: string): string =>
          `${stamp}.pid${parts.pid}.${parts.uuid}`;

        const earlier = asNameWithStamp('2026-09-21T10-00-00-000Z');
        const later = asNameWithStamp('2026-09-21T10-00-00-001Z');

        then('🔴 a lexical sort orders them chronologically', () => {
          expect([later, earlier].sort()).toEqual([earlier, later]);
        });

        then('the later one is what a `.sort().pop()` picks as latest', () => {
          // the exact move `getOneReviewRunMeterLatest` makes, asserted against the
          // real grammar rather than trusted
          const dirs = [later, earlier].sort();
          expect(dirs[dirs.length - 1]).toEqual(later);
        });
      });

      when('[t1] the stamps cross a date boundary', () => {
        // the case a non-iso stamp (say `9/21/2026`) would get wrong, and the reason
        // the format is asserted rather than merely present: a lexical sort over a
        // human date string orders `10/01` before `9/21`
        const parts = asLogDirNameParts({ name: genLogDirName() });
        const asNameWithStamp = (stamp: string): string =>
          `${stamp}.pid${parts.pid}.${parts.uuid}`;

        const september = asNameWithStamp('2026-09-30T23-59-59-999Z');
        const october = asNameWithStamp('2026-10-01T00-00-00-000Z');

        then('the later date still sorts last', () => {
          expect([october, september].sort()).toEqual([september, october]);
        });
      });
    },
  );

  given('[case4] a name this very generator minted', () => {
    /**
     * 🔴 .why = THE anti-drift clamp for `asLogDirMintedAt`, and it has teeth only
     *           because the input comes from `genLogDirName()` rather than a hand
     *           string. an un-escape asserted against a literal stays green after
     *           the MINT changes its escape — which is the exact silent drift
     *           `SHAPE_OF_LOG_DIR_NAME` was declared beside the mint to forbid.
     *
     * ⚠️ the failure this guards is not a throw. a wrong un-escape yields an
     *    `Invalid Date`, which compares FALSE against every bound — so every
     *    reader of the stamp would misplace EVERY run in time, with no signal at all.
     */
    when('[t0] the instant it encodes is read back', () => {
      const at = new Date();
      const name = genLogDirName();

      then('🔴 it round-trips to a REAL date, never an Invalid Date', () => {
        expect(Number.isNaN(asLogDirMintedAt({ name }).getTime())).toEqual(
          false,
        );
      });

      then('and to the instant it was minted, within a second', () => {
        // the mint reads its own clock, so an exact equality would race. a second
        // is far tighter than the 15m cadence the verdict compares against
        const drift = Math.abs(
          asLogDirMintedAt({ name }).getTime() - at.getTime(),
        );
        expect(drift).toBeLessThan(1_000);
      });

      then(
        '🔴 the epoch fallback can never win a `Math.max` as "latest"',
        () => {
          // an unreadable name must sort BEFORE every real run, never after. the
          // alternative — NaN — compares false both ways and is unorderable
          const unreadable = asLogDirMintedAt({ name: 'zzz-debug' });
          expect(unreadable.getTime()).toEqual(0);
          expect(unreadable.getTime()).toBeLessThan(
            asLogDirMintedAt({ name }).getTime(),
          );
        },
      );
    });

    when('[t1] two minted names are compared', () => {
      then('the un-escape preserves the mint`s chronological order', () => {
        const parts = asLogDirNameParts({ name: genLogDirName() });
        const asNameWithStamp = (stamp: string): string =>
          `${stamp}.pid${parts.pid}.${parts.uuid}`;

        const earlier = asLogDirMintedAt({
          name: asNameWithStamp('2026-09-30T23-59-59-999Z'),
        });
        const later = asLogDirMintedAt({
          name: asNameWithStamp('2026-10-01T00-00-00-000Z'),
        });
        expect(later.getTime()).toBeGreaterThan(earlier.getTime());
      });

      then('a millisecond apart is a millisecond apart', () => {
        // the `-000Z` → `.000Z` half of the un-escape. get it wrong and every
        // stamp within one second reads as the same instant
        const parts = asLogDirNameParts({ name: genLogDirName() });
        const asNameWithStamp = (stamp: string): string =>
          `${stamp}.pid${parts.pid}.${parts.uuid}`;

        const first = asLogDirMintedAt({
          name: asNameWithStamp('2026-09-21T10-00-00-000Z'),
        });
        const second = asLogDirMintedAt({
          name: asNameWithStamp('2026-09-21T10-00-00-001Z'),
        });
        expect(second.getTime() - first.getTime()).toEqual(1);
      });
    });
  });
});
