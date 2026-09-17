import { given, then, when } from 'test-fns';

import { asConcurrencyGroupLeakAdvisory } from './asConcurrencyGroupLeakAdvisory';

describe('asConcurrencyGroupLeakAdvisory', () => {
  given(
    '[case1] one level, one bounded group beside one unbounded lane',
    () => {
      const leak = {
        level: 1,
        groups: ['anthropic'],
        ungrouped: ['local-lint'],
      };

      when('[t0] the advisory is composed', () => {
        then('it names the level, both halves, and the close', () => {
          const advisory = asConcurrencyGroupLeakAdvisory(leak);
          expect(advisory).toContain('level 1');
          expect(advisory).toContain('bounded: anthropic');
          expect(advisory).toContain('unbounded: local-lint');
          expect(advisory).toContain('`group:`');
        });

        then('it advises rather than reports a defect', () => {
          // .why = seed S4 — only the guard author knows which reviewers share a
          //        ratelimit, so the mix is sometimes intended. an advisory that
          //        reads as a defect report would push an author to "fix" a
          //        correct guard
          const advisory = asConcurrencyGroupLeakAdvisory(leak);
          expect(advisory).toContain('or leave it, if the mix is intended');
          expect(advisory).not.toContain('✋');
          expect(advisory).not.toContain('🔴');
        });

        then('it opens on the caution glyph, never a halt glyph', () => {
          expect(asConcurrencyGroupLeakAdvisory(leak).startsWith('🟡')).toEqual(
            true,
          );
        });
      });
    },
  );

  given(
    '[case2] several groups and several ungrouped lanes at one level',
    () => {
      const leak = {
        level: 2,
        groups: ['anthropic', 'fireworks'],
        ungrouped: ['local-lint', 'local-types'],
      };

      when('[t0] the advisory is composed', () => {
        then('each half lists every member, ONE PER LINE', () => {
          // 🔴 .why this asserts the LINE SHAPE and not merely the names = the
          //    names were present under `join(', ')` too, so a `toContain` on
          //    each name passed under the defect. what changed at i022 is that
          //    a 12-wide level no longer renders as one ~145-char wall, and
          //    only a per-line assertion can tell the two renders apart
          const lines = asConcurrencyGroupLeakAdvisory(leak).split('\n');
          expect(lines).toContain('   ├─ bounded: anthropic');
          expect(lines).toContain('               fireworks');
          expect(lines).toContain('   ├─ unbounded: local-lint');
          expect(lines).toContain('                 local-types');
        });

        then('no line comma-joins two members', () => {
          // ⚠️ the clamp with teeth: this goes red the moment either half
          //    returns to `join(', ')`, which is the shape carried from i008
          //    to i022 and re-raised at every round in between
          const advisory = asConcurrencyGroupLeakAdvisory(leak);
          expect(advisory).not.toContain('anthropic, fireworks');
          expect(advisory).not.toContain('local-lint, local-types');
        });

        then('every member still appears exactly once', () => {
          const advisory = asConcurrencyGroupLeakAdvisory(leak);
          for (const name of [...leak.groups, ...leak.ungrouped])
            expect(advisory.split(name).length - 1).toEqual(1);
        });
      });
    },
  );

  given('[case3] the render is a pure value', () => {
    when('[t0] it is composed twice from one input', () => {
      then('both calls agree — no clock, no counter, no i/o', () => {
        // .why = the extraction exists so the prose has a cheap oracle. a render
        //        that varied between calls would have none
        const leak = { level: 3, groups: ['g'], ungrouped: ['u'] };
        expect(asConcurrencyGroupLeakAdvisory(leak)).toEqual(
          asConcurrencyGroupLeakAdvisory(leak),
        );
      });
    });
  });
});
