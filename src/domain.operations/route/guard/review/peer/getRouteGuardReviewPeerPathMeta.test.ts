import { given, then, when } from 'test-fns';

import { getRouteGuardReviewPeerPathMeta } from './getRouteGuardReviewPeerPathMeta';

describe('getRouteGuardReviewPeerPathMeta', () => {
  given('[case1] a given path with a simple slug', () => {
    const pathGiven =
      '.reviews/peer/1.vision._.review.i001.abc123.r001._.given.by_peer.arch.md';

    when('[t0] the meta is parsed', () => {
      then('extracts slug and iteration', () => {
        const meta = getRouteGuardReviewPeerPathMeta({ path: pathGiven });
        expect(meta).toEqual({ slug: 'arch', iteration: 1 });
      });
    });
  });

  given('[case5] a zero-padded iteration segment', () => {
    when('[t0] the meta is parsed', () => {
      then('reads the iteration as a NUMBER, not a padded string', () => {
        // the latest-given-per-slug pick compares iterations as ordinals. a string
        // compare would be correct only while the pad width holds, and the pad is a
        // format detail — parse it once, here, so no caller can get it wrong
        const meta = getRouteGuardReviewPeerPathMeta({
          path: '.reviews/peer/1.vision._.review.i017.abc123.r001._.given.by_peer.arch.md',
        });
        expect(meta.iteration).toEqual(17);
      });
    });

    when(
      '[t1] two iterations either side of a pad boundary are compared',
      () => {
        then(
          'the numeric order is correct where a string order would not be',
          () => {
            const i009 = getRouteGuardReviewPeerPathMeta({
              path: '.reviews/peer/1.vision._.review.i009.abc123.r001._.given.by_peer.arch.md',
            });
            const i010 = getRouteGuardReviewPeerPathMeta({
              path: '.reviews/peer/1.vision._.review.i010.def456.r001._.given.by_peer.arch.md',
            });
            expect(i010.iteration).toBeGreaterThan(i009.iteration);
          },
        );
      },
    );
  });

  given('[case2] a taken path with a multi-part slug', () => {
    const pathTaken =
      '.reviews/peer/3.exec._.review.i002.def456.r003._.taken.by_self.enroll-blueprint-arch-defects.md';

    when('[t0] the meta is parsed', () => {
      then('extracts the full slug verbatim', () => {
        const meta = getRouteGuardReviewPeerPathMeta({ path: pathTaken });
        expect(meta.slug).toEqual('enroll-blueprint-arch-defects');
      });
    });
  });

  given('[case3] a sanitized slug that itself contains dots', () => {
    const pathGiven =
      '.reviews/peer/1.vision._.review.i001.abc123.r001._.given.by_peer..test-mock-review.sh.md';

    when('[t0] the meta is parsed', () => {
      then('greedily captures the slug up to the .md suffix', () => {
        const meta = getRouteGuardReviewPeerPathMeta({ path: pathGiven });
        expect(meta.slug).toEqual('.test-mock-review.sh');
      });
    });
  });

  given('[case7] the hash segment — REQUIRED to parse, never RETURNED', () => {
    // the two halves of the pair each refuse a `hash` field, and each carries a note
    // that the absence is the guard. this parser is one hop upstream of both, so a
    // `hash` on its return re-offers the exact key those notes exist to withhold
    // (r11 blocker.2, i004).
    //
    // 🔴 the two assertions below are a PAIR, and neither alone is the clamp:
    //    [t0] alone would stay green if the segment were dropped from the regex too,
    //    which would silently LOOSEN the grammar — a filename with no hash would parse.
    //    [t1] alone would stay green if the field were merely renamed.
    const pathGiven =
      '.reviews/peer/1.vision._.review.i001.abc123.r001._.given.by_peer.architect.md';

    when('[t0] the meta is parsed from a well-formed path', () => {
      then(
        'no hash is handed out — the return is {slug, iteration} only',
        () => {
          const meta = getRouteGuardReviewPeerPathMeta({ path: pathGiven });
          expect(meta).toEqual({ slug: 'architect', iteration: 1 });
        },
      );
    });

    when('[t1] the hash segment is ABSENT from the filename', () => {
      then('it still throws — the grammar check kept its teeth', () => {
        // `.i001.r001.` — the stamp with its hash segment removed. the regex must
        // still refuse this, or the drop of the field loosened what it validates
        expect(() =>
          getRouteGuardReviewPeerPathMeta({
            path: '.reviews/peer/1.vision._.review.i001.r001._.given.by_peer.architect.md',
          }),
        ).toThrow('could not parse a peer-review filename');
      });
    });
  });

  given('[case4] a malformed path with no given/taken infix', () => {
    when('[t0] the meta is parsed', () => {
      then('throws — not a valid peer-review filename', () => {
        expect(() =>
          getRouteGuardReviewPeerPathMeta({
            path: '.reviews/peer/1.vision._.report.md',
          }),
        ).toThrow('could not parse a peer-review filename');
      });
    });
  });

  given('[case6] a bad stamp the ENUMERATOR GLOB admits', () => {
    // the glob is `…_.review.i*.*.r*.…` and `*` matches any run of non-`/` chars,
    // dots included — so a stamp with a non-digit iteration passes the glob and
    // reaches this parser. under P2 the gate reads every historical file, so this
    // one throw halts the entrance gate, the exit gate, and the stophook alike.
    // 🔴 it is reachable by a HUMAN TYPO: the driver hand-writes .taken filenames
    const pathTyped =
      '.reviews/peer/1.vision._.review.iOLD.abc123.r001._.taken.by_self.arch.md';

    when('[t0] the meta is parsed', () => {
      then('throws rather than a silent misread of the stamp', () => {
        expect(() =>
          getRouteGuardReviewPeerPathMeta({ path: pathTyped }),
        ).toThrow('could not parse a peer-review filename');
      });

      then('the error NAMES THE FIX, not just the symptom', () => {
        // a bare "could not parse" strands the driver: the halt it would have read
        // is the very artifact that cannot render (rule.require.errors-name-the-fix)
        const error = (() => {
          try {
            getRouteGuardReviewPeerPathMeta({ path: pathTyped });
            return null;
          } catch (caught) {
            return caught as Error;
          }
        })();

        expect(error).not.toBeNull();
        expect(error!.message).toContain(pathTyped); // which file
        expect(error!.message).toContain('_.given.by_peer.$slug.md'); // the grammar
        expect(error!.message).toContain('articulate into'); // the concrete move
      });
    });
  });
});
