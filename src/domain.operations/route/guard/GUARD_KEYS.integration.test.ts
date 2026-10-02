import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, when } from 'test-fns';

import {
  KEY_ALIASED,
  KEYS_BRAIN_SUB,
  KEYS_HEADER,
  KEYS_INLINE,
  KEYS_KNOWN,
  PATTERN_INLINE,
} from './GUARD_KEYS';
import { getGuardParseWarnings } from './getGuardParseWarnings';
import { parseStoneGuard } from './parseStoneGuard';

/**
 * .what = enforces that every key in `KEYS_KNOWN` is CARRIED by the parser
 * .why = `GUARD_KEYS` centralizes the key set that the parser, the near-miss detector,
 *        and the advisory reporter must all agree on. `PATTERN_INLINE` is derived, so an
 *        inline key cannot drift — but the four header branches in `parseStoneGuard` are
 *        hand-written literals (`trimmed === 'artifacts:'` × 4), so a key added to
 *        `KEYS_HEADER` with no parser branch would be silently parsed-and-dropped. this
 *        test is the enforcement the `GUARD_KEYS` note names: it walks `KEYS_KNOWN` and
 *        fails on a key the parser does not carry.
 */
describe('GUARD_KEYS parser-carry invariant', () => {
  given('every header key in KEYS_HEADER', () => {
    // a header key carries its value on the lines BENEATH it, as `- ` list items.
    // if the parser has no branch for a header key, the list items are dropped and the
    // field stays empty — so a populated field proves the parser carries the key.
    const headerFieldByKey: Record<
      (typeof KEYS_HEADER)[number],
      (guard: Awaited<ReturnType<typeof parseStoneGuard>>) => unknown[]
    > = {
      artifacts: (guard) => guard.artifacts,
      reviews: (guard) => guard.reviews.peer ?? [],
      judges: (guard) => guard.judges,
      protect: (guard) => guard.protect,
    };

    KEYS_HEADER.forEach((key) => {
      when(`the guard declares \`${key}:\` with one item`, () => {
        then('the parser carries the key — the item lands', async () => {
          const content =
            key === 'reviews'
              ? ['reviews:', '  peer:', '    - some-review-command', ''].join(
                  '\n',
                )
              : [`${key}:`, '  - some-value', ''].join('\n');
          const guard = await parseStoneGuard({
            content,
            path: '/tmp/some.guard',
          });
          expect(headerFieldByKey[key](guard).length).toBeGreaterThan(0);
        });
      });
    });
  });

  given('every inline key in KEYS_INLINE', () => {
    // 🔴 .why a PER-KEY field map where the set holds ONE key = a walk that hard-coded
    //    `guard.brain?.choice` would be correct by coincidence rather than by
    //    construction. the moment a second inline key is declared, the same check would
    //    assert the BRAIN field for that key's line — so an absent parser arm would fail
    //    here on an UNRELATED field, which names the wrong defect, and an arm that wrote
    //    the value into `.brain` would PASS, which names none at all.
    //    ⇒ the map is the enforcement `GUARD_KEYS`'s own header claims: a key declared
    //      there with no arm in the parser fails here on its OWN field
    const inlineFieldByKey: Record<
      (typeof KEYS_INLINE)[number],
      (guard: Awaited<ReturnType<typeof parseStoneGuard>>) => unknown
    > = {
      brain: (guard) => guard.brain?.choice,
    };

    KEYS_INLINE.forEach((key) => {
      when(`the guard declares \`${key}: value\` inline`, () => {
        then('the parser carries the key — the value lands', async () => {
          const guard = await parseStoneGuard({
            content: [`${key}: some-value`, ''].join('\n'),
            path: '/tmp/some.guard',
          });
          expect(inlineFieldByKey[key](guard)).toEqual('some-value');
        });

        // 🔴 the misroute clamp — a value must land in its OWN field and no other
        // .why = a parser arm that wrote every inline key into `.brain` would satisfy the
        //        carry check above for `brain` and silently corrupt an unrelated field for
        //        every other key. the carry check proves a value LANDED; this proves it
        //        landed NOWHERE ELSE, which is the half a single-key walk cannot state
        then('it carries the key into no OTHER inline field', async () => {
          const guard = await parseStoneGuard({
            content: [`${key}: some-value`, ''].join('\n'),
            path: '/tmp/some.guard',
          });
          KEYS_INLINE.filter((other) => other !== key).forEach((other) =>
            expect(inlineFieldByKey[other](guard)).toBeUndefined(),
          );
        });
      });
    });
  });

  given('every brain sub-key in KEYS_BRAIN_SUB', () => {
    // 🔴 .why a SECOND walk, one scope down = `KEYS_BRAIN_SUB` is a declared key set with
    //    its own reader (`asBrainSubKey`) and its own parser arm, so it carries the exact
    //    drift the top-level walk above exists to catch — a key declared in the set with
    //    no arm in `finalizeBrain`'s accumulator is parsed and dropped, in silence.
    //    the top-level walk cannot reach it: an indented line is `null` to
    //    `asDeclaredGuardKey` by construction
    const brainFieldBySubKey: Record<
      (typeof KEYS_BRAIN_SUB)[number],
      (guard: Awaited<ReturnType<typeof parseStoneGuard>>) => unknown
    > = {
      choice: (guard) => guard.brain?.choice,
      effort: (guard) => guard.brain?.effort,
    };

    KEYS_BRAIN_SUB.forEach((subKey) => {
      when(`the guard explodes \`brain:\` with a \`${subKey}:\``, () => {
        then('the parser carries the sub-key — the value lands', async () => {
          const guard = await parseStoneGuard({
            content: ['brain:', `  ${subKey}: some-value`, ''].join('\n'),
            path: '/tmp/some.guard',
          });
          expect(brainFieldBySubKey[subKey](guard)).toEqual('some-value');
        });

        // 🔴 the misroute clamp, at the nested scope. an arm that wrote every sub-key into
        //    `choice` would satisfy the carry check for `choice` and corrupt `effort` —
        //    and the corruption is WORSE here than one scope up, because both fields feed
        //    one dispatch: a misrouted effort would send `/model medium`
        then('it carries the sub-key into no OTHER brain field', async () => {
          const guard = await parseStoneGuard({
            content: ['brain:', `  ${subKey}: some-value`, ''].join('\n'),
            path: '/tmp/some.guard',
          });
          KEYS_BRAIN_SUB.filter((other) => other !== subKey).forEach((other) =>
            expect(brainFieldBySubKey[other](guard)).toEqual(null),
          );
        });
      });
    });
  });

  given('every known key, declared in a guard', () => {
    KEYS_KNOWN.forEach((key) => {
      when(`the guard declares \`${key}\``, () => {
        then(
          'the parser does NOT report it as a dropped/near-miss key',
          async () => {
            const content =
              key === 'reviews'
                ? ['reviews:', '  peer:', '    - some-review-command', ''].join(
                    '\n',
                  )
                : (KEYS_INLINE as readonly string[]).includes(key)
                  ? [`${key}: some-value`, ''].join('\n')
                  : [`${key}:`, '  - some-value', ''].join('\n');
            // write the content to a per-run isolated temp file getGuardParseWarnings
            // can read. genTempDir yields a unique dir per run, so parallel jest workers
            // never write-and-read the same path (no torn read, no stale-file pass).
            const dir = genTempDir({ slug: `guard-keys-${key}` });
            const guardPath = path.join(dir, `${key}.guard`);
            await fs.writeFile(guardPath, content);
            const warnings = await getGuardParseWarnings({ path: guardPath });
            expect(warnings.find((w) => w.key === key)).toBeUndefined();
          },
        );
      });
    });
  });

  given('the derived inline-key pattern', () => {
    // `PATTERN_INLINE` is the parser's branch condition, built from `KEYS_INLINE` plus
    // the alias. the parser once carried `/^(brain|model)\s*:/i` as its own literal, so
    // this file owned the set the DETECTOR read and not the set the PARSER fired on.
    // these cases pin the derivation: a key added to `KEYS_INLINE` joins the alternation
    // here with no second edit, and the two folds below are each a shipped defect class.
    when('matched against each declared key', () => {
      then('it matches every inline key on its own line', () => {
        for (const key of KEYS_INLINE)
          expect(PATTERN_INLINE.test(`${key}: some-value`)).toBe(true);
      });

      then('it matches the alias, so the parser drops it deliberately', () => {
        // a `model:` that matched NO branch would fall to the generic path and be
        // dropped by accident — identical on the page, and carrying no warn (case=4)
        expect(PATTERN_INLINE.test(`${KEY_ALIASED.alias}: some-value`)).toBe(
          true,
        );
      });

      then('it matches no header key, whose value sits BENEATH it', () => {
        for (const key of KEYS_HEADER)
          expect(PATTERN_INLINE.test(`${key}:`)).toBe(false);
      });

      then('it admits space before the colon', () => {
        expect(PATTERN_INLINE.test('brain : some-value')).toBe(true);
      });

      then('it folds case', () => {
        expect(PATTERN_INLINE.test('Brain: some-value')).toBe(true);
      });

      then('it does not match a key that merely PREFIXES an inline key', () => {
        expect(PATTERN_INLINE.test('brainstorm: some-value')).toBe(false);
      });
    });
  });
});
