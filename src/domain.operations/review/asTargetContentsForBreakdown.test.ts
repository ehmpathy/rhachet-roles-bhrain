import { given, then, when } from 'test-fns';

import { asTargetContentsForBreakdown } from '@src/domain.operations/review/asTargetContentsForBreakdown';
import { getOneTargetRenderPlan } from '@src/domain.operations/review/getOneTargetRenderPlan';

const BODY = 'F'.repeat(400);
const DIFF = 'D'.repeat(60);

describe('asTargetContentsForBreakdown', () => {
  given(
    '[case1] 🔴 a PULL-focus run, where the prompt carries no payload',
    () => {
      // .why = a fold that ignores `focus` reports every target's full body
      //        for content the renderer never sends under pull focus
      const folded = asTargetContentsForBreakdown({
        focus: 'pull',
        targets: [
          {
            path: 'edited.ts',
            content: BODY,
            diff: DIFF,
            changeKind: 'edited',
          },
          {
            path: 'new.ts',
            content: BODY,
            diff: `+${BODY}`,
            changeKind: 'new',
          },
        ],
      });

      when('[t0] the fold is read', () => {
        then(
          '🔴 every target folds to zero bytes — a path list sends none',
          () => {
            expect(folded.map((one) => one.content)).toEqual(['', '']);
          },
        );

        then('every path survives — the paths ARE what pull sends', () => {
          expect(folded.map((one) => one.path)).toEqual([
            'edited.ts',
            'new.ts',
          ]);
        });
      });
    },
  );

  given(
    '[case2] a PUSH-focus run, where the prompt carries the payload',
    () => {
      const folded = asTargetContentsForBreakdown({
        focus: 'push',
        targets: [
          {
            path: 'edited.ts',
            content: BODY,
            diff: DIFF,
            changeKind: 'edited',
          },
          {
            path: 'new.ts',
            content: BODY,
            diff: `+${BODY}`,
            changeKind: 'new',
          },
          {
            path: 'gone.ts',
            content: null,
            diff: `-${BODY}`,
            changeKind: 'deleted',
          },
        ],
      });

      when('[t0] the fold is read', () => {
        then('an edited target carries its body AND its delta', () => {
          expect(folded[0]!.content).toEqual(`${BODY}\n${DIFF}`);
        });

        then('🔴 a new target carries its body exactly once', () => {
          // its diff IS its body with a `+` per line, so to fold both would
          // double-count roughly the whole file
          expect(folded[1]!.content).toEqual(BODY);
        });

        then(
          'a deleted target folds to zero — it renders as a void tag',
          () => {
            expect(folded[2]!.content).toEqual('');
          },
        );

        then('🔴 no target ever folds the literal "null"', () => {
          expect(folded.some((one) => one.content.includes('null'))).toEqual(
            false,
          );
        });
      });
    },
  );

  given('[case3] the render plan the fold reads', () => {
    when('[t0] pull focus is asked', () => {
      then('🔴 neither half rides — the brain opens the files itself', () => {
        expect(
          getOneTargetRenderPlan({
            target: { content: BODY, diff: DIFF, changeKind: 'edited' },
            focus: 'pull',
          }),
        ).toEqual({ sendsFile: false, sendsDiff: false });
      });
    });

    when('[t1] push focus is asked', () => {
      then('an edited target sends both halves', () => {
        expect(
          getOneTargetRenderPlan({
            target: { content: BODY, diff: DIFF, changeKind: 'edited' },
            focus: 'push',
          }),
        ).toEqual({ sendsFile: true, sendsDiff: true });
      });

      then(
        '🔴 a new target sends its diff — an addition — and NOT a file',
        () => {
          expect(
            getOneTargetRenderPlan({
              target: { content: BODY, diff: `+${BODY}`, changeKind: 'new' },
              focus: 'push',
            }),
          ).toEqual({ sendsFile: false, sendsDiff: true });
        },
      );

      then('a deleted target sends its diff — a void tag — and no file', () => {
        expect(
          getOneTargetRenderPlan({
            target: { content: null, diff: `-${BODY}`, changeKind: 'deleted' },
            focus: 'push',
          }),
        ).toEqual({ sendsFile: false, sendsDiff: true });
      });
    });
  });
});
