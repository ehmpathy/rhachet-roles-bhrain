import { MalfunctionError } from 'helpful-errors';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { asReviewWatermarkKey } from '@src/domain.operations/review/watermark/asReviewWatermarkKey';
import { getOneReviewWatermarkRaw } from '@src/domain.operations/review/watermark/getOneReviewWatermarkRaw';
import { setOneReviewWatermarkRaw } from '@src/domain.operations/review/watermark/setOneReviewWatermarkRaw';

import { genReviewPrefixPrime } from './genReviewPrefixPrime';
import { getOnePrimeWatermark } from './meet/getOnePrimeWatermark';

/**
 * .what = short windows, so a meet settles in milliseconds under test
 */
const OPTIONS = {
  msOfGather: 300,
  msOfAwait: 5_000,
  msOfPoll: 10,
  msOfReach: 400,
};

/**
 * .what = the head key every lane of one test shares
 */
const KEY_OF_HEAD = 'head-under-test';

/**
 * .what = a fresh cwd for one meet, so no test reads another's watermark
 */
const genOneMeet = (input: { slug: string }) => ({
  cwd: genTempDir({ slug: input.slug }),
  key: KEY_OF_HEAD,
});

/**
 * .what = one lane of a pour: it meets its peers, then "reviews" — records when it began
 * .why = the review itself is the brain call the meet guards; here the record of its
 *        start is all that is needed to prove the prime came first and the lanes poured
 */
const runOneLane = async (
  input: {
    meet: { cwd: string; key: string };
    name: string;
    /** the instant the lane's deadline stops the meet; a minute out where the case does not say */
    msOfStop?: number;
  },
  context: {
    prime: () => Promise<unknown>;
    log: { name: string; event: string; at: number }[];
  },
) => {
  const { outcome } = await genReviewPrefixPrime(
    {
      ...input.meet,
      deadline: { msOfStop: input.msOfStop ?? Date.now() + 60_000 },
    },
    { prime: context.prime, ...OPTIONS },
  );
  context.log.push({ name: input.name, event: 'review', at: Date.now() });
  return { name: input.name, outcome };
};

/**
 * .what = a poke stand-in that takes a moment and records when it settled
 */
const genPrimeFake = (input: {
  log: { name: string; event: string; at: number }[];
  fault: Error | null;
}) => {
  const calls: number[] = [];
  const prime = async () => {
    calls.push(Date.now());
    await new Promise((done) => setTimeout(done, 200));
    input.log.push({ name: 'prime', event: 'settled', at: Date.now() });
    if (input.fault) throw input.fault;
  };
  return { prime, calls };
};

describe('genReviewPrefixPrime', () => {
  given('[case1] two lanes that share one head pour at once', () => {
    when('[t0] both lanes meet', () => {
      const scene = useThen('both lanes run', async () => {
        const meet = genOneMeet({ slug: 'prime-two-lanes' });
        const log: { name: string; event: string; at: number }[] = [];
        const fake = genPrimeFake({ log, fault: null });
        const lanes = await Promise.all([
          runOneLane({ meet, name: 'a' }, { prime: fake.prime, log }),
          runOneLane({ meet, name: 'b' }, { prime: fake.prime, log }),
        ]);
        return { lanes, log, calls: fake.calls };
      });

      then('exactly one prime is sent', () => {
        expect(scene.calls).toHaveLength(1);
      });

      then('one lane primed and the other awaited it', () => {
        expect(scene.lanes.map((lane) => lane.outcome).sort()).toEqual([
          'awaited',
          'primed',
        ]);
      });

      then('the prime settles before either review begins', () => {
        const primeAt = scene.log.find((row) => row.name === 'prime')!.at;
        const reviewAts = scene.log
          .filter((row) => row.event === 'review')
          .map((row) => row.at);
        expect(reviewAts).toHaveLength(2);
        reviewAts.forEach((at) => expect(at).toBeGreaterThanOrEqual(primeAt));
      });

      then('the reviews pour together, never one after the other', () => {
        const reviewAts = scene.log
          .filter((row) => row.event === 'review')
          .map((row) => row.at);
        // the gap is the poll interval, far below the 200ms a review-like wait would add
        expect(Math.abs(reviewAts[0]! - reviewAts[1]!)).toBeLessThan(150);
      });
    });
  });

  given('[case2] two lanes share a head and the prime faults', () => {
    when('[t0] both lanes meet', () => {
      const scene = useThen('both lanes still run', async () => {
        const meet = genOneMeet({ slug: 'prime-fault' });
        const log: { name: string; event: string; at: number }[] = [];
        const fake = genPrimeFake({
          log,
          fault: new Error('openrouter 503: provider unavailable'),
        });
        const stderr: string[] = [];
        const errorOriginal = console.error;
        console.error = (line: string) => stderr.push(line);
        try {
          const lanes = await Promise.all([
            runOneLane({ meet, name: 'a' }, { prime: fake.prime, log }),
            runOneLane({ meet, name: 'b' }, { prime: fake.prime, log }),
          ]);
          return { lanes, log, calls: fake.calls, stderr };
        } finally {
          console.error = errorOriginal;
        }
      });

      then('exactly one prime was attempted', () => {
        expect(scene.calls).toHaveLength(1);
      });

      then('both lanes still review', () => {
        expect(
          scene.log.filter((row) => row.event === 'review').map((r) => r.name),
        ).toHaveLength(2);
        // the peer reads a COLD release: the poke faulted, so no cache stands behind it
        expect(scene.lanes.map((lane) => lane.outcome).sort()).toEqual([
          'cold',
          'faulted',
        ]);
      });

      then('the fault is named on stderr', () => {
        expect(scene.stderr.join('\n')).toContain(
          'the prime of the shared prefix failed',
        );
      });

      then('the stderr render matches the snapshot', () => {
        expect(scene.stderr.join('\n')).toContain(
          '💥 MalfunctionError: the prime of the shared prefix failed (openrouter 503: provider unavailable); its peer lanes pour cold',
        );
        expect(scene.stderr.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case3] one lane alone, with no peer to share its head', () => {
    when('[t0] the lane meets naught', () => {
      const scene = useThen('it runs', async () => {
        const meet = genOneMeet({ slug: 'prime-solo' });
        const log: { name: string; event: string; at: number }[] = [];
        const fake = genPrimeFake({ log, fault: null });
        const lane = await runOneLane(
          { meet, name: 'a' },
          { prime: fake.prime, log },
        );
        return { lane, calls: fake.calls };
      });

      then('no poke is sent — a prime with no reader is waste', () => {
        expect(scene.calls).toHaveLength(0);
        expect(scene.lane.outcome).toEqual('solo');
      });
    });
  });

  given('[case4] a lane arrives after a recent claim was primed', () => {
    when('[t0] the late lane meets', () => {
      const scene = useThen('it runs', async () => {
        const meet = genOneMeet({ slug: 'prime-late' });
        const log: { name: string; event: string; at: number }[] = [];
        const fake = genPrimeFake({ log, fault: null });
        await Promise.all([
          runOneLane({ meet, name: 'a' }, { prime: fake.prime, log }),
          runOneLane({ meet, name: 'b' }, { prime: fake.prime, log }),
        ]);
        // .why = "no gather" is read off the watermark, never the wall clock. a gather writes
        //        a fresh claim under the late lane's own nonce; a warm read writes naught. a
        //        wall-clock bound flakes whenever a loaded host slows the hold itself
        const watermarkKey = {
          cwd: meet.cwd,
          key: asReviewWatermarkKey({ kind: 'prime', of: [meet.key] }),
        };
        const watermarkBefore = await getOnePrimeWatermark({
          meet: watermarkKey,
        });
        const lane = await runOneLane(
          { meet, name: 'c' },
          { prime: fake.prime, log },
        );
        const watermarkAfter = await getOnePrimeWatermark({
          meet: watermarkKey,
        });
        return { lane, calls: fake.calls, watermarkBefore, watermarkAfter };
      });

      then('it pours at once, with no second poke and no gather', () => {
        expect(scene.calls).toHaveLength(1);
        expect(scene.lane.outcome).toEqual('awaited');

        // the release it found was warm, so its part is `warm` — it pours at once
        expect(scene.watermarkBefore?.warm).toEqual(true);

        // no claim was taken: the watermark the late lane found is the one it left
        expect(scene.watermarkAfter).toEqual(scene.watermarkBefore);
      });
    });
  });

  given('[case8] a lane arrives after a solo lane released its claim', () => {
    when('[t0] the late lane meets', () => {
      const scene = useThen('it runs', async () => {
        const meet = genOneMeet({ slug: 'prime-after-solo' });
        const log: { name: string; event: string; at: number }[] = [];
        const fake = genPrimeFake({ log, fault: null });
        const first = await runOneLane(
          { meet, name: 'a' },
          { prime: fake.prime, log },
        );
        const lane = await runOneLane(
          { meet, name: 'b' },
          { prime: fake.prime, log },
        );

        // .why = the reach counts from the solo lane's release stamp. a clock read taken after
        //        the first lane returns trails that stamp by however long the event loop lags,
        //        so it would understate the wait under load
        const watermark = await getOnePrimeWatermark({
          meet: {
            cwd: meet.cwd,
            key: asReviewWatermarkKey({ kind: 'prime', of: [meet.key] }),
          },
        });
        const reviewOfLate = log.find(
          (row) => row.name === 'b' && row.event === 'review',
        )!.at;
        return {
          first,
          lane,
          waited: reviewOfLate - watermark!.primedAt!,
          calls: fake.calls,
        };
      });

      then('the first lane went solo', () => {
        expect(scene.first.outcome).toEqual('solo');
      });

      then('the late lane trails the solo review, never a second solo', () => {
        // the solo lane's own review departs at its release and carries the head; the late
        // lane lets it reach the provider, then pours warm
        expect(scene.lane.outcome).toEqual('awaited');
        expect(scene.calls).toHaveLength(0);
      });

      then('the late lane waits out the reach, never pours at once', () => {
        // a release this fresh means the solo review has not landed yet
        expect(scene.waited).toBeGreaterThanOrEqual(OPTIONS.msOfReach - 50);
      });
    });
  });

  given(
    '[case11] a second lane arrives past the gather of a first lane that went solo',
    () => {
      when('[t0] the second lane meets, after the first released', () => {
        const scene = useThen('both lanes run', async () => {
          const meet = genOneMeet({ slug: 'prime-past-gather' });
          const log: { name: string; event: string; at: number }[] = [];
          const fake = genPrimeFake({ log, fault: null });

          // the first lane gathers alone, releases, and its own review departs
          const firstAwaited = runOneLane(
            { meet, name: 'a' },
            { prime: fake.prime, log },
          );

          // the second lane finishes its own compile later — past the first's gather
          // .why = await the first lane's release itself, never a fixed delay. a loaded host
          //        can hold the first lane's claim back past any delay, which lands the second
          //        lane inside the gather, so the first primes rather than goes solo
          const watermarkKey = {
            cwd: meet.cwd,
            key: asReviewWatermarkKey({ kind: 'prime', of: [meet.key] }),
          };
          // .note = the release stamp is captured HERE, the instant the first lane's review
          //         departs. a solo close releases once, in its gather hold; the read after both
          //         lanes return must find this same stamp, or a second release moved the anchor
          //         a late lane may already have read
          const msOfGiveUp = Date.now() + 10_000;
          const releaseOfFirst = await (async () => {
            while (Date.now() <= msOfGiveUp) {
              const found = await getOnePrimeWatermark({ meet: watermarkKey });
              if (found?.primedAt) return found.primedAt;
              await new Promise((done) => setTimeout(done, OPTIONS.msOfPoll));
            }
            throw new MalfunctionError('the first lane never released', {
              waited: '10s',
              meet: watermarkKey,
            });
          })();
          const second = await runOneLane(
            { meet, name: 'b' },
            { prime: fake.prime, log },
          );
          const first = await firstAwaited;
          const releaseAfterBoth = await getOnePrimeWatermark({
            meet: watermarkKey,
          });
          const reviewOfSecond = log.find(
            (row) => row.name === 'b' && row.event === 'review',
          )!.at;
          return {
            first,
            second,
            calls: fake.calls,
            releaseOfFirst,
            releaseAfterBoth,
            gap: reviewOfSecond - releaseOfFirst,
          };
        });

        then(
          '🔴 the solo lane releases once — its stamp never moves after a late lane can read it',
          () => {
            expect(scene.releaseAfterBoth?.primedAt).toEqual(
              scene.releaseOfFirst,
            );
          },
        );

        then('the first lane went solo', () => {
          expect(scene.first.outcome).toEqual('solo');
        });

        then(
          'the second lane reads the head as warm — the first review carried it',
          () => {
            expect(scene.second.outcome).toEqual('awaited');
          },
        );

        then('no poke is sent', () => {
          expect(scene.calls).toHaveLength(0);
        });

        then(
          'the second review departs no sooner than the reach after the first',
          () => {
            // measured from the solo release, the instant the first review departs; the slack
            // covers the clock read between the stamp and the second lane's read of it
            expect(scene.gap).toBeGreaterThanOrEqual(OPTIONS.msOfReach - 50);
          },
        );
      });
    },
  );

  given(
    '[case12] a lane meets a cold release whose holder sent no review of its own',
    () => {
      when('[t0] the lane meets it', () => {
        const scene = useThen('it runs', async () => {
          const meet = genOneMeet({ slug: 'prime-release-unsent' });
          const watermark = {
            cwd: meet.cwd,
            key: asReviewWatermarkKey({ kind: 'prime', of: [meet.key] }),
          };
          const past = Date.now() - 1_000;
          await setOneReviewWatermarkRaw({
            ...watermark,
            raw: JSON.stringify({
              claimedBy: 'pid1.defect',
              claimedAt: past,
              primedBy: 'pid1.defect',
              primedAt: past,
              warm: false,
              sent: false,
              peers: [],
            }),
          });
          const log: { name: string; event: string; at: number }[] = [];
          const fake = genPrimeFake({ log, fault: null });
          const lane = await runOneLane(
            { meet, name: 'a' },
            { prime: fake.prime, log },
          );
          return { lane };
        });

        then('the lane takes the head afresh — no request carried it', () => {
          expect(scene.lane.outcome).toEqual('solo');
        });
      });
    },
  );

  given('[case5] the last release is stale', () => {
    when('[t0] a lane meets it', () => {
      const scene = useThen('it runs', async () => {
        const meet = genOneMeet({ slug: 'prime-stale' });
        const watermark = {
          cwd: meet.cwd,
          key: asReviewWatermarkKey({ kind: 'prime', of: [meet.key] }),
        };
        const past = Date.now() - 10 * 60_000;
        await setOneReviewWatermarkRaw({
          ...watermark,
          raw: JSON.stringify({
            claimedBy: 'pid1.old',
            claimedAt: past,
            primedBy: 'pid1.old',
            primedAt: past,
            peers: [],
          }),
        });
        const log: { name: string; event: string; at: number }[] = [];
        const fake = genPrimeFake({ log, fault: null });
        const lane = await runOneLane(
          { meet, name: 'a' },
          { prime: fake.prime, log },
        );
        const after = JSON.parse(
          (await getOneReviewWatermarkRaw(watermark)) ?? 'null',
        ) as { claimedBy: string };
        return { lane, claim: after.claimedBy };
      });

      then('the lane takes the claim afresh', () => {
        expect(scene.lane.outcome).toEqual('solo');
        expect(scene.claim).not.toEqual('pid1.old');
      });
    });
  });

  given('[case9] the meet watermark on disk is torn past valid json', () => {
    when('[t0] a lane meets it', () => {
      const scene = useThen('the lane still runs', async () => {
        const meet = genOneMeet({ slug: 'prime-torn' });
        const watermark = {
          cwd: meet.cwd,
          key: asReviewWatermarkKey({ kind: 'prime', of: [meet.key] }),
        };
        await setOneReviewWatermarkRaw({
          ...watermark,
          raw: '{"claimedBy":"pid1.torn","claimedAt":',
        });
        const log: { name: string; event: string; at: number }[] = [];
        const fake = genPrimeFake({ log, fault: null });
        const stderr: string[] = [];
        const errorOriginal = console.error;
        console.error = (line: string) => stderr.push(line);
        try {
          const lane = await runOneLane(
            { meet, name: 'a' },
            { prime: fake.prime, log },
          );
          return { lane, log, stderr, key: watermark.key, cwd: meet.cwd };
        } finally {
          console.error = errorOriginal;
        }
      });

      then('the lane pours cold rather than fail its review', () => {
        expect(scene.lane.outcome).toEqual('faulted');
        expect(scene.log.filter((row) => row.event === 'review')).toHaveLength(
          1,
        );
      });

      then('the fault names the watermark key on stderr', () => {
        const said = scene.stderr.join('\n');
        expect(said).toContain('the prime watermark could not be read');
        expect(said).toContain('the watermark is not valid json');
        expect(said).toContain(scene.key);
      });

      then('the stderr render matches the snapshot', () => {
        // the temp cwd differs per run, so it is masked before the snapshot pins the rest
        expect(
          scene.stderr.join('\n').split(scene.cwd).join('<cwd>'),
        ).toContain(
          'delete it and the next round rewrites it); this lane pours cold',
        );
        expect(
          scene.stderr.join('\n').split(scene.cwd).join('<cwd>'),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case10] the meet watermark is torn while the leader gathers', () => {
    when('[t0] the leader reads it after its gather', () => {
      const scene = useThen('the lane still runs', async () => {
        const meet = genOneMeet({ slug: 'prime-torn-mid-gather' });
        const watermark = {
          cwd: meet.cwd,
          key: asReviewWatermarkKey({ kind: 'prime', of: [meet.key] }),
        };
        const log: { name: string; event: string; at: number }[] = [];
        const fake = genPrimeFake({ log, fault: null });
        const stderr: string[] = [];
        const errorOriginal = console.error;
        console.error = (line: string) => stderr.push(line);
        try {
          // the lane takes the claim, then the store tears inside its gather window
          const laneAwaited = runOneLane(
            { meet, name: 'a' },
            { prime: fake.prime, log },
          );
          await new Promise((done) => setTimeout(done, OPTIONS.msOfGather / 3));
          await setOneReviewWatermarkRaw({
            ...watermark,
            raw: '{"claimedBy":"pid1.torn","claimedAt":',
          });
          const lane = await laneAwaited;
          return { lane, log, stderr, calls: fake.calls };
        } finally {
          console.error = errorOriginal;
        }
      });

      then('the lane pours cold rather than fail its review', () => {
        expect(scene.lane.outcome).toEqual('faulted');
        expect(scene.log.filter((row) => row.event === 'review')).toHaveLength(
          1,
        );
      });

      then('no poke is sent against a store it could not read', () => {
        expect(scene.calls).toHaveLength(0);
      });

      then('the store fault is named on stderr', () => {
        expect(scene.stderr.join('\n')).toContain(
          'the prime watermark could not be read',
        );
      });
    });
  });

  given('[case6] the prime throws a defect in our own code', () => {
    when('[t0] two lanes meet', () => {
      const scene = useThen('the primer rejects', async () => {
        const meet = genOneMeet({ slug: 'prime-defect' });
        const log: { name: string; event: string; at: number }[] = [];
        const fake = genPrimeFake({
          log,
          fault: new TypeError('cannot read properties of null'),
        });
        const settled = await Promise.allSettled([
          runOneLane({ meet, name: 'a' }, { prime: fake.prime, log }),
          runOneLane({ meet, name: 'b' }, { prime: fake.prime, log }),
        ]);
        return { settled };
      });

      then('the defect fails loud, and the peer is still released', () => {
        const statuses = scene.settled.map((one) => one.status).sort();
        expect(statuses).toEqual(['fulfilled', 'rejected']);
      });
    });
  });

  given('[case7] five lanes that share one head arrive at once', () => {
    when('[t0] all five meet', () => {
      const scene = useThen('all five run', async () => {
        const meet = genOneMeet({ slug: 'prime-five-lanes' });
        const log: { name: string; event: string; at: number }[] = [];
        const fake = genPrimeFake({ log, fault: null });
        const lanes = await Promise.all(
          ['a', 'b', 'c', 'd', 'e'].map((name) =>
            runOneLane({ meet, name }, { prime: fake.prime, log }),
          ),
        );
        return { lanes, calls: fake.calls };
      });

      then('exactly one prime is sent across all five', () => {
        expect(scene.calls).toHaveLength(1);
      });

      then('one lane primed and four awaited it', () => {
        const outcomes = scene.lanes.map((lane) => lane.outcome);
        expect(outcomes.filter((one) => one === 'primed')).toHaveLength(1);
        expect(outcomes.filter((one) => one === 'awaited')).toHaveLength(4);
      });
    });
  });

  given(
    '[case13] a peer waits on a claim its holder never releases, with its deadline near',
    () => {
      when('[t0] the lane meets the wedged claim', () => {
        const scene = useThen('it runs', async () => {
          const meet = genOneMeet({ slug: 'prime-deadline-peer' });
          const watermark = {
            cwd: meet.cwd,
            key: asReviewWatermarkKey({ kind: 'prime', of: [meet.key] }),
          };
          await setOneReviewWatermarkRaw({
            ...watermark,
            raw: JSON.stringify({
              claimedBy: 'pid1.wedged',
              claimedAt: Date.now(),
              primedBy: null,
              primedAt: null,
              warm: false,
              sent: false,
              peers: [],
            }),
          });
          const log: { name: string; event: string; at: number }[] = [];
          const fake = genPrimeFake({ log, fault: null });
          const stderr: string[] = [];
          const errorOriginal = console.error;
          console.error = (line: string) => stderr.push(line);
          try {
            const before = Date.now();
            const lane = await runOneLane(
              { meet, name: 'a', msOfStop: before + 400 },
              { prime: fake.prime, log },
            );
            return { lane, waited: Date.now() - before, stderr };
          } finally {
            console.error = errorOriginal;
          }
        });

        then('the lane gives up the wait and pours cold', () => {
          expect(scene.lane.outcome).toEqual('timeout');
        });

        then(
          '🔴 the wait stops at the deadline, far inside the await bound',
          () => {
            expect(scene.waited).toBeLessThan(OPTIONS.msOfAwait / 4);
          },
        );

        then(
          'the give-up is named on stderr, with the wait it was given',
          () => {
            expect(scene.stderr.join('\n')).toContain(
              'the prime of the shared head was not released within',
            );
          },
        );

        then('the stderr render matches the snapshot', () => {
          // the wait is derived from a deadline read off the wall, so its ms is masked
          expect(
            scene.stderr.join('\n').replace(/\d+ms\b/g, '<N>ms'),
          ).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case14] a leader whose poke never settles, with the lanes deadline near',
    () => {
      when('[t0] two lanes meet', () => {
        const scene = useThen('both lanes run', async () => {
          const meet = genOneMeet({ slug: 'prime-deadline-leader' });
          const log: { name: string; event: string; at: number }[] = [];
          const calls: number[] = [];
          const primeWedged = () => {
            calls.push(Date.now());
            return new Promise<never>(() => {});
          };
          const stderr: string[] = [];
          const errorOriginal = console.error;
          console.error = (line: string) => stderr.push(line);
          try {
            // lane a arrives first, so it leads; lane b's own deadline sits past a's, so the
            // case reads a's release rather than b's own give-up
            // .note = a's deadline leaves ~1.2s past the 300ms gather, so the watermark holds
            //         of a loaded box cannot spend it before the poke is sent (seen at 800ms:
            //         the leader lapsed in its gather and never poked)
            const before = Date.now();
            const leaderAwaited = runOneLane(
              { meet, name: 'a', msOfStop: before + 1_500 },
              { prime: primeWedged, log },
            );
            await new Promise((done) => setTimeout(done, 50));
            const peer = await runOneLane(
              { meet, name: 'b', msOfStop: before + 4_500 },
              { prime: primeWedged, log },
            );
            const leader = await leaderAwaited;
            return {
              lanes: [leader, peer],
              calls,
              waited: Date.now() - before,
              stderr,
            };
          } finally {
            console.error = errorOriginal;
          }
        });

        then('one poke was sent', () => {
          expect(scene.calls).toHaveLength(1);
        });

        then(
          'the leader stops to wait on its poke, and its peer reads the release cold',
          () => {
            expect(scene.lanes).toEqual([
              { name: 'a', outcome: 'faulted' },
              { name: 'b', outcome: 'cold' },
            ]);
          },
        );

        then(
          '🔴 both lanes pour once the leader deadline passes, never a hang',
          () => {
            // past a's deadline (1.5s), well short of b's own (4.5s)
            expect(scene.waited).toBeLessThan(3_000);
          },
        );

        then('the wedged poke is named on stderr', () => {
          expect(scene.stderr.join('\n')).toContain(
            "this lane's deadline left the meet",
          );
        });

        then('the stderr render matches the snapshot', () => {
          // the wait is derived from a deadline read off the wall, so its ms is masked
          expect(
            scene.stderr.join('\n').replace(/\d+ms\b/g, '<N>ms'),
          ).toMatchSnapshot();
        });
      });
    },
  );

  given('[case15] a lane whose deadline left the meet no time at all', () => {
    when('[t0] the lane meets', () => {
      const scene = useThen('it runs', async () => {
        const meet = genOneMeet({ slug: 'prime-deadline-lapsed' });
        const watermark = {
          cwd: meet.cwd,
          key: asReviewWatermarkKey({ kind: 'prime', of: [meet.key] }),
        };
        const log: { name: string; event: string; at: number }[] = [];
        const fake = genPrimeFake({ log, fault: null });
        const before = Date.now();
        const lane = await runOneLane(
          { meet, name: 'a', msOfStop: before - 1 },
          { prime: fake.prime, log },
        );
        return {
          lane,
          waited: Date.now() - before,
          calls: fake.calls,
          raw: await getOneReviewWatermarkRaw(watermark),
        };
      });

      then('it pours at once, with no gather', () => {
        expect(scene.lane.outcome).toEqual('lapsed');
        expect(scene.waited).toBeLessThan(OPTIONS.msOfGather);
      });

      then('it takes no claim a peer would wait on, and sends no poke', () => {
        expect(scene.raw).toEqual(null);
        expect(scene.calls).toHaveLength(0);
      });
    });
  });
});
