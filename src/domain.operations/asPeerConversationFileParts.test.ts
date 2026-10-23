import { given, then, when } from 'test-fns';

import { asPeerConversationFileParts } from './asPeerConversationFileParts';
import {
  asPeerReviewOutputName,
  type PeerReviewOutputParts,
} from './asPeerReviewOutputName';

const PARTS: PeerReviewOutputParts = {
  stone: '5.1.execution.from_vision',
  iteration: '040',
  hash: 'e1e11c03db40826fc9',
  index: '030',
  slug: 'enroll-impl-arch-defects',
};

describe('asPeerConversationFileParts', () => {
  given(
    '[case1] 🔴 the ROUND TRIP — every name the guard writes reads back whole',
    () => {
      // .why = the conversation expander keys generations and lanes on these parts. a
      //        grammar rename that left this parser behind would make a lane read no
      //        prior dialogue with naught red — this clamp turns red instead
      when('[t0] the given and its report are composed, then parsed', () => {
        then('the given reads back as the given side, not a report', () => {
          expect(
            asPeerConversationFileParts({
              file: asPeerReviewOutputName({ parts: PARTS, kind: 'stdout' }),
            }),
          ).toEqual({ ...PARTS, side: 'given', report: false });
        });

        then('the report reads back as the given side, a report', () => {
          expect(
            asPeerConversationFileParts({
              file: asPeerReviewOutputName({ parts: PARTS, kind: 'report' }),
            }),
          ).toEqual({ ...PARTS, side: 'given', report: true });
        });
      });

      when('[t1] the driver taken to it is parsed', () => {
        then('it reads back as the taken side, with the same parts', () => {
          expect(
            asPeerConversationFileParts({
              file: `.reviews/peer/5.1.execution.from_vision._.review.i040.e1e11c03db40826fc9.r030._.taken.by_self.enroll-impl-arch-defects.md`,
            }),
          ).toEqual({ ...PARTS, side: 'taken', report: false });
        });
      });
    },
  );

  given('[case2] two slugs where one prefixes the other', () => {
    when('[t0] each name is parsed', () => {
      then('each reads its own whole slug, never the shorter one', () => {
        const ops = asPeerConversationFileParts({
          file: asPeerReviewOutputName({
            parts: { ...PARTS, slug: 'repo-rules-ops' },
            kind: 'report',
          }),
        });
        expect(ops?.slug).toEqual('repo-rules-ops');
      });
    });
  });

  given('[case3] a name with no iNNN.hash generation', () => {
    when('[t0] it is parsed', () => {
      then('it answers null, so the caller decides what it means', () => {
        expect(
          asPeerConversationFileParts({
            file: '1.test._.review.ix.h.r001._.taken.by_self.lane-conv.md',
          }),
        ).toEqual(null);
      });
    });
  });
});
