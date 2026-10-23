import { given, then, when } from 'test-fns';

import {
  asPeerReviewOutputName,
  type PeerReviewOutputParts,
} from './asPeerReviewOutputName';
import { asPeerReviewOutputParts } from './asPeerReviewOutputParts';

describe('asPeerReviewOutputName', () => {
  given('[case1] the parts a real guard hands it', () => {
    const parts: PeerReviewOutputParts = {
      stone: '5.1.execution.from_vision',
      iteration: '004',
      hash: 'db3f378d60d537b679',
      index: '007',
      slug: 'arch-hazards-behavior',
    };

    when('[t0] a report name is composed', () => {
      const name = asPeerReviewOutputName({ parts, kind: 'report' });

      then('it reads as the guard has always written it', () => {
        expect(name).toEqual(
          '5.1.execution.from_vision._.review.i004.db3f378d60d537b679.r007._.given.by_peer.arch-hazards-behavior.report.md',
        );
      });
    });

    when('[t1] a stdout name is composed', () => {
      const name = asPeerReviewOutputName({ parts, kind: 'stdout' });

      then('it parts from the report only on its tail', () => {
        expect(name).toEqual(
          '5.1.execution.from_vision._.review.i004.db3f378d60d537b679.r007._.given.by_peer.arch-hazards-behavior.md',
        );
      });
    });
  });

  given(
    '[case2] 🔴 the ROUND TRIP — the clamp that binds the two contexts',
    () => {
      /**
       * 🔴 this is the whole reason the grammar was lifted out of two files.
       *
       * the write side is `runOneStoneGuardReview`; the read side is the review
       * context's `asReviewRunIdentity`. before the lift, each held its own copy of
       * the rule, so a rename on the write side would lose attribution in every
       * by-reviewer report with naught red at compile time.
       *
       * ⇒ this case goes RED the moment the composer and the parser disagree, which
       * is the property no type could give us (both sides are strings).
       */
      const parts: PeerReviewOutputParts = {
        stone: '5.1.execution.from_vision',
        iteration: '012',
        hash: 'abc123',
        index: '003',
        slug: 'mech-failhides',
      };

      when('[t0] a composed name is parsed back', () => {
        const name = asPeerReviewOutputName({ parts, kind: 'report' });
        const back = asPeerReviewOutputParts({ name });

        then('every part survives the trip unchanged', () => {
          expect(back).toEqual(parts);
        });
      });
    },
  );

  given('[case3] a stone name that carries dots', () => {
    // the stone segment is greedy on purpose — `5.1.execution.from_vision` has
    // three dots of its own, and the `._.review.i` literal is the anchor
    const parts: PeerReviewOutputParts = {
      stone: '2.1.criteria.blackbox.from_vision',
      iteration: '001',
      hash: 'ff00',
      index: '001',
      slug: 'repo-rules',
    };

    when('[t0] the composed name is parsed back', () => {
      const back = asPeerReviewOutputParts({
        name: asPeerReviewOutputName({ parts, kind: 'report' }),
      });

      then(
        'the stone keeps every dot, and the round is not eaten by it',
        () => {
          expect(back?.stone).toEqual('2.1.criteria.blackbox.from_vision');
          expect(back?.iteration).toEqual('001');
        },
      );
    });
  });

  given('[case4] a slug that carries dots', () => {
    // a legacy lane's slug is a sanitized command, so it may hold dots of its own —
    // the parser anchors on the `.report.md` tail rather than the first dot
    const parts: PeerReviewOutputParts = {
      stone: '1.vision',
      iteration: '002',
      hash: 'beef',
      index: '004',
      slug: 'test.mock-review.sh',
    };

    when('[t0] the composed name is parsed back', () => {
      const back = asPeerReviewOutputParts({
        name: asPeerReviewOutputName({ parts, kind: 'report' }),
      });

      then('the slug keeps every dot', () => {
        expect(back?.slug).toEqual('test.mock-review.sh');
      });
    });
  });

  given('[case5] a name this grammar did not write', () => {
    when('[t0] a hand review output is parsed', () => {
      const back = asPeerReviewOutputParts({ name: 'my-review.md' });

      then('it answers null rather than a guess', () => {
        // a hand `rhx review` writes wherever it was told, so it has no guard
        // identity — an invented one would be worse than an absent one
        expect(back).toEqual(null);
      });
    });

    when('[t1] a STDOUT name is parsed', () => {
      const back = asPeerReviewOutputParts({
        name: asPeerReviewOutputName({
          parts: {
            stone: '1.vision',
            iteration: '001',
            hash: 'aa',
            index: '001',
            slug: 'repo-rules',
          },
          kind: 'stdout',
        }),
      });

      then('it answers null — only the REPORT tail is parseable', () => {
        // stated in the operation's own note: `--output` points at the report, so
        // that is the one kind the read side ever meets
        expect(back).toEqual(null);
      });
    });
  });
});
