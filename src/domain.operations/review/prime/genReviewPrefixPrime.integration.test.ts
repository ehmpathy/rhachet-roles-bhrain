import { genTempDir, given, then, useThen, when } from 'test-fns';

import { asReviewWatermarkKey } from '@src/domain.operations/review/watermark/asReviewWatermarkKey';
import { getOneReviewWatermarkRaw } from '@src/domain.operations/review/watermark/getOneReviewWatermarkRaw';
import { setOneReviewWatermarkRaw } from '@src/domain.operations/review/watermark/setOneReviewWatermarkRaw';

import { genReviewPrefixPrime } from './genReviewPrefixPrime';

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
        const before = Date.now();
        const lane = await runOneLane(
          { meet, name: 'c' },
          { prime: fake.prime, log },
        );
        return { lane, calls: fake.calls, waited: Date.now() - before };
      });

      then('it pours at once, with no second poke and no gather', () => {
        expect(scene.calls).toHaveLength(1);
        expect(scene.lane.outcome).toEqual('awaited');
        expect(scene.waited).toBeLessThan(OPTIONS.msOfGather);
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
        const before = Date.now();
        const lane = await runOneLane(
          { meet, name: 'b' },
          { prime: fake.prime, log },
        );
        return { first, lane, waited: Date.now() - before, calls: fake.calls };
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

          // the second lane finishes its own compile seconds later — past the first's gather
          await new Promise((done) => setTimeout(done, OPTIONS.msOfGather * 2));
          const second = await runOneLane(
            { meet, name: 'b' },
            { prime: fake.prime, log },
          );
          const first = await firstAwaited;
          const reviewOfFirst = log.find(
            (row) => row.name === 'a' && row.event === 'review',
          )!.at;
          const reviewOfSecond = log.find(
            (row) => row.name === 'b' && row.event === 'review',
          )!.at;
          return {
            first,
            second,
            calls: fake.calls,
            gap: reviewOfSecond - reviewOfFirst,
          };
        });

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
            // the first lane logs its review a few ms after its release stamp, so allow slack
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
            const before = Date.now();
            const leaderAwaited = runOneLane(
              { meet, name: 'a', msOfStop: before + 800 },
              { prime: primeWedged, log },
            );
            await new Promise((done) => setTimeout(done, 50));
            const peer = await runOneLane(
              { meet, name: 'b', msOfStop: before + 2_500 },
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
            expect(scene.waited).toBeLessThan(2_000);
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
