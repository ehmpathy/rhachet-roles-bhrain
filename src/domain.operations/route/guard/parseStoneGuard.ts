import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import { type IsoDuration, toMilliseconds } from 'iso-time';
import * as path from 'path';

import type {
  RouteStoneGuardReviewPeer,
  RouteStoneGuardReviewSelf,
  RouteStoneGuardReviewsStructured,
} from '@src/domain.objects/Driver/RouteStoneGuard';
import { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';

import { asGuardPositiveInt } from '../../asGuardPositiveInt';
import { asErrorCause } from './asErrorCause';
import { asErrorCauseClause } from './asErrorCauseClause';

/**
 * .what = parses a guard file into a RouteStoneGuard object
 * .why = enables guard configuration to be read and validated
 *
 * two input variants:
 * - `{ path }` — read the file at `path`, then parse (the original behavior).
 * - `{ content, path }` — parse the IN-MEMORY `content` AS IF it were the file at
 *   `path`. `path` is the source the content came from: its `dirname` is the base for
 *   `@path` say-ref expansion, and it becomes the object's `.path`. used by
 *   `route.guard.upgrade` (D6) to validate a var-replayed template BEFORE it overwrites
 *   a guard — so `path` is the TEMPLATE's own path, making `@path` refs expand against
 *   the template's dir (not the route dir).
 */
export const parseStoneGuard = async (
  input: { path: string } | { content: string; path: string },
): Promise<RouteStoneGuard> => {
  // read file content, unless content was injected directly (in-memory variant)
  const content =
    'content' in input ? input.content : await fs.readFile(input.path, 'utf-8');

  // get directory for @path references (base = the source path's dir)
  const guardDir = path.dirname(input.path);

  // parse simple yaml format
  const parsed = await parseSimpleYaml(content, guardDir);

  // enforce GLOBAL slug uniqueness across self + peer reviewers
  // .why = --that dispatches per-verb (--as promised for self, --as absorbed
  //        for peer); a slug shared by a self AND a peer reviewer makes --that
  //        ambiguous. a loud throw at parse makes the ambiguity structurally
  //        impossible rather than settled by convention (i8-B5)
  assertReviewSlugsGloballyUnique({ reviews: parsed.reviews });

  // enforce referential integrity between `group:` and `groups:`
  // .why = a bound the parser cannot attach to a level is a safety valve that
  //        FAILS OPEN — the author reads their declaration back and sees a cap,
  //        while the level pours uncapped. see the invariant below
  assertConcurrencyGroupsResolve({ reviews: parsed.reviews });

  // construct guard with defaults
  return new RouteStoneGuard({
    path: input.path,
    artifacts: parsed.artifacts ?? [],
    reviews: parsed.reviews ?? { self: [], peer: [] },
    judges: parsed.judges ?? [],
    protect: parsed.protect ?? [],
  });
};

/**
 * .what = throws if any slug is shared between a self and a peer reviewer
 * .why = --as promised (self) and --as absorbed (peer) both take --that; a
 *        slug used by both roles makes --that ambiguous, so forbid it at parse
 */
const assertReviewSlugsGloballyUnique = (input: {
  reviews: RouteStoneGuardReviewsStructured | undefined;
}): void => {
  const selfSlugs = new Set((input.reviews?.self ?? []).map((r) => r.slug));
  const collisions = (input.reviews?.peer ?? [])
    .map((r) => r.slug)
    .filter((slug) => selfSlugs.has(slug));

  if (collisions.length > 0)
    throw new BadRequestError(
      `reviewer slug used by BOTH a self and a peer reviewer: ${collisions.join(', ')}. slugs must be globally unique across self + peer.`,
    );
};

/**
 * .what = throws if a `group:` names no declared group, or a `groups:` entry has
 *         no member
 * .why = a concurrency bound is a SAFETY VALVE, and a valve that fails open is
 *        worse than no valve at all. both halves of the reference must hold:
 *
 * | the defect | what the author sees | what runs |
 * |---|---|---|
 * | `group: anthropc` (a typo) | a reviewer in a capped group | uncapped |
 * | `groups: { anthropic: … }` nobody joins | a level with a bound | uncapped |
 *
 * ⚠️ both are SILENT without this check — the guard parses clean, the level
 *    fans out, and the author's own file reads back as though it capped.
 *
 * .note = this is the third parse-time invariant. it exists because the taken
 *         declaration shape (a separate `groups:` map) CAN name a group nobody
 *         sits in — the per-reviewer alternative could not. the ergonomic win
 *         is paid for with this validation.
 */
const assertConcurrencyGroupsResolve = (input: {
  reviews: RouteStoneGuardReviewsStructured | undefined;
}): void => {
  const peers = input.reviews?.peer ?? [];
  const groups = input.reviews?.groups ?? {};

  const declared = new Set(Object.keys(groups));
  const joined = new Set(
    peers.map((peer) => peer.group).filter((name): name is string => !!name),
  );

  // a reviewer that names a group nobody declared
  //
  // 🔴 .why it names the REVIEWER and not only the group = the offender's slug
  //         is in hand at this point and was discarded, so the author was told
  //         WHAT is wrong and never WHERE. on a guard where several reviewers
  //         share one typo'd group the author had to hunt the file for each
  //         site — and the fix is per-reviewer, never per-group
  //         (`rule.require.errors-name-the-fix`). raised i032/r10
  const undeclaredPeers = peers.filter(
    (peer): peer is typeof peer & { group: string } =>
      !!peer.group && !declared.has(peer.group),
  );
  if (undeclaredPeers.length > 0)
    throw new BadRequestError(
      `reviewer names a concurrency group with no bound declared: ${undeclaredPeers.map((peer) => `${peer.slug} → ${peer.group}`).join(', ')}. declare it under reviews.groups, or remove the \`group:\` key.`,
    );

  // a group nobody joined — it governs no level, so its bound is inert
  //
  // ⚠️ .why the message names TWO causes = this branch is reached by two
  //          different author mistakes, and it cannot tell them apart: a genuine
  //          phantom (a `groups:` entry nobody joins) and a MISPLACEMENT (a
  //          `groups:` map nested under a reviewer, which the section switch
  //          matches at ANY indent and so reads at the reviews level — clamped
  //          by `[case15][t1]`).
  //
  //          an author who made the second mistake believes the bound belongs on
  //          the reviewer, so `add group: to a reviewer` points them at the
  //          OPPOSITE shape from the one they wrote and reads as a contradiction.
  //          to name both causes costs one clause and names the real one either
  //          way, per `rule.require.errors-name-the-fix`. raised i002/r9
  const unjoined = [...declared].filter((name) => !joined.has(name));
  if (unjoined.length > 0)
    throw new BadRequestError(
      `concurrency group declared with no members: ${unjoined.join(', ')}. it bounds no reviewer — join it from a reviewer with \`group: ${unjoined[0]}\`, or remove the entry. a \`groups:\` block nested UNDER a reviewer lands here too: it is read at the reviews level, so move it beside \`peer:\`.`,
    );
};

/**
 * .what = ensures all peer review slugs are unique via .N suffix for collisions
 * .why = downstream code can use slug as stable key without collision
 * .note = if slug is already unique, leaves it as-is; adds suffix only when collision detected
 */
const standardizePeerReviewSlugs = (input: {
  peers: RouteStoneGuardReviewPeer[];
}): RouteStoneGuardReviewPeer[] => {
  // count occurrences of each slug
  const slugCounts = new Map<string, number>();
  for (const peer of input.peers) {
    slugCounts.set(peer.slug, (slugCounts.get(peer.slug) ?? 0) + 1);
  }

  // track which slugs have collisions and their current index
  const slugIndices = new Map<string, number>();

  // process each peer, add suffix only for collisions
  return input.peers.map((peer) => {
    const count = slugCounts.get(peer.slug) ?? 1;

    // if unique, leave as-is
    if (count === 1) return peer;

    // collision detected: add .N suffix (1-indexed)
    const index = (slugIndices.get(peer.slug) ?? 0) + 1;
    slugIndices.set(peer.slug, index);

    return {
      ...peer,
      slug: `${peer.slug}.${index}`,
    };
  });
};

/**
 * .what = casts one legacy flat `reviews:` command string into a peer review
 * .why = the flat entries have two destinations — a fresh structured object, or
 *        a fold onto one that a `groups:` block already created. one mapper
 *        keeps both at the same defaults, so neither drifts from the other
 */
const asPeerReviewFromFlatCommand = (
  cmd: string,
  index: number,
): RouteStoneGuardReviewPeer => ({
  slug: cmd.split(/\s+/)[0] ?? `peer-${index + 1}`,
  run: cmd,
  budget: Infinity,
  level: 1,
});

/**
 * .what = parses simple yaml with list values
 * .why = handles guard file format without external yaml dependency
 */
const parseSimpleYaml = async (
  content: string,
  guardDir: string,
): Promise<{
  artifacts?: string[];
  reviews?: RouteStoneGuardReviewsStructured;
  judges?: string[];
  protect?: string[];
}> => {
  const result: {
    artifacts?: string[];
    reviews?: RouteStoneGuardReviewsStructured;
    judges?: string[];
    protect?: string[];
  } = {};

  const lines = content.split('\n');
  // .note = deliberate mutation, per `rule.require.immutable-vars`. these are the
  //         cursor of a line-by-line scanner: each holds "where in the document am
  //         i", which by nature changes as the document is walked. the scope is one
  //         function and not one of them escapes it.
  let currentKey: 'artifacts' | 'reviews' | 'judges' | 'protect' | null = null;
  let currentSubKey: 'self' | 'peer' | 'groups' | null = null;
  let currentGroupName: string | null = null;
  let structuredReviews: RouteStoneGuardReviewsStructured | null = null;
  let flatReviews: string[] | null = null;
  let currentSelfReview: Partial<RouteStoneGuardReviewSelf> | null = null;
  let currentPeerReview: Partial<RouteStoneGuardReviewPeer> | null = null;
  let inMultilineSay = false;
  let multilineSayContent: string[] = [];

  /**
   * .what = finalizes and stores the current peer review if complete
   * .why = enables structured peer reviews with slug, run, budget, level, timeout
   * .note = budget defaults to Infinity (unlimited) for backwards compat
   */
  const finalizePeerReview = () => {
    if (
      currentPeerReview?.slug &&
      currentPeerReview?.run &&
      structuredReviews
    ) {
      structuredReviews.peer = structuredReviews.peer ?? [];
      structuredReviews.peer.push({
        slug: currentPeerReview.slug,
        run: currentPeerReview.run,
        budget: currentPeerReview.budget ?? Infinity,
        level: currentPeerReview.level ?? 1,
        timeout: currentPeerReview.timeout,
        group: currentPeerReview.group,
      });
    }
    currentPeerReview = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line?.trim() ?? '';
    const indent = (line?.match(/^(\s*)/)?.[1] ?? '').length;

    // handle multiline say content
    if (inMultilineSay) {
      // check if we're still in the multiline block (indented content)
      if (indent >= 6 || trimmed === '') {
        multilineSayContent.push(line?.slice(6) ?? '');
        continue;
      } else {
        // end of multiline, save the content
        if (currentSelfReview) {
          currentSelfReview.say = multilineSayContent.join('\n').trim();
          if (
            currentSelfReview.slug &&
            currentSelfReview.say &&
            structuredReviews
          ) {
            structuredReviews.self = structuredReviews.self ?? [];
            structuredReviews.self.push(
              currentSelfReview as RouteStoneGuardReviewSelf,
            );
          }
        }
        inMultilineSay = false;
        multilineSayContent = [];
        currentSelfReview = null;
      }
    }

    // skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;

    // check for key declaration
    if (trimmed === 'artifacts:') {
      currentKey = 'artifacts';
      currentSubKey = null;
      result.artifacts = [];
      continue;
    }
    if (trimmed === 'reviews:') {
      currentKey = 'reviews';
      currentSubKey = null;
      continue;
    }
    if (trimmed === 'judges:') {
      currentKey = 'judges';
      currentSubKey = null;
      result.judges = [];
      continue;
    }
    if (trimmed === 'protect:') {
      currentKey = 'protect';
      currentSubKey = null;
      result.protect = [];
      continue;
    }

    // check for reviews sub-keys (structured format)
    if (currentKey === 'reviews') {
      if (trimmed === 'self:') {
        if (!structuredReviews) {
          structuredReviews = { self: [], peer: [] };
        }
        currentSubKey = 'self';
        continue;
      }
      if (trimmed === 'peer:') {
        if (!structuredReviews) {
          structuredReviews = { self: [], peer: [] };
        }
        // a new section ends any peer review still in progress
        finalizePeerReview();
        currentSubKey = 'peer';
        continue;
      }
      if (trimmed === 'groups:') {
        if (!structuredReviews) {
          structuredReviews = { self: [], peer: [] };
        }
        // a new section ends any peer review still in progress
        finalizePeerReview();
        structuredReviews.groups = structuredReviews.groups ?? {};
        currentSubKey = 'groups';
        currentGroupName = null;
        continue;
      }
    }

    // handle the groups map — `<name>:` then an indented `concurrency: N`
    // .why = groups is a MAP keyed by group name, where self/peer are LISTS.
    //        so it parses by its own shape rather than the `- ` list branch
    if (currentSubKey === 'groups' && structuredReviews?.groups) {
      // a group name declares itself with a bare `<name>:` and no value
      const nameMatch = trimmed.match(/^([A-Za-z0-9._-]+):$/);
      if (nameMatch?.[1]) {
        currentGroupName = nameMatch[1];
        continue;
      }

      if (trimmed.startsWith('concurrency:') && currentGroupName) {
        const raw = trimmed.slice(12).trim();

        // a bound that is not a positive integer bounds no level legibly
        //
        // .why = `concurrency: 0` halts the level forever and `concurrency: -1`
        //        carries no sense. refuse at parse rather than at 3am
        //
        // ⇒ every other refusal in this feature exists to stop a bound from
        //   binding at a value the author did not write. the raw-text rule that
        //   does it lives in `asGuardPositiveInt`, which `budget:` and `level:`
        //   now share — the argument for it is stated there, once
        const concurrency = asGuardPositiveInt({
          raw,
          key: 'concurrency',
          at: `group "${currentGroupName}"`,
        });

        // ⚠️ a SECOND bound for one group is refused even when the values MATCH
        // .why = two declarations of one fact is an ambiguity whichever way it
        //        is settled. to pick the last silently teaches an author that
        //        duplicates are fine, and the next duplicate will disagree
        if (structuredReviews.groups[currentGroupName])
          throw new BadRequestError(
            `concurrency group declared twice: "${currentGroupName}". a group carries exactly one bound — remove the duplicate, even if the values match.`,
          );

        structuredReviews.groups[currentGroupName] = { concurrency };
        continue;
      }

      // a `concurrency:` line with NO group name above it is a DANGLING bound
      // .why = same fail-open class as the reviewer-level refusal below. control
      //        arrives here only when `currentGroupName === null` (a set name
      //        would have `continue`d above), so the author wrote a bound under
      //        `groups:` with no `<name>:` to attach it to. without this arm the
      //        line drops silently — `startsWith('concurrency:')` is true but the
      //        `&& currentGroupName` guard short-circuits and no branch stores it,
      //        so the groups map stays empty and the level pours uncapped while
      //        the author's file reads back as though it declared a cap
      if (trimmed.startsWith('concurrency:'))
        throw new BadRequestError(
          `a concurrency bound under reviews.groups needs a group name above it: ${trimmed}. name the group first with \`<name>:\`, then \`concurrency: <n>\` indented beneath it.`,
        );
    }

    // check for list item
    if (trimmed.startsWith('- ') && currentKey) {
      const value = trimmed.slice(2).trim();

      // strip outer quotes (yaml string delimiters)
      const unquoted = value.replace(/^["'](.*)["']$/, '$1');

      if (currentKey === 'artifacts') {
        result.artifacts?.push(unquoted);
      } else if (currentKey === 'judges') {
        result.judges?.push(value);
      } else if (currentKey === 'protect') {
        result.protect?.push(value);
      } else if (currentKey === 'reviews') {
        if (currentSubKey === 'peer') {
          // check for start of structured peer review (- slug: ...)
          if (value.startsWith('slug:')) {
            // finalize any prior peer review in progress
            finalizePeerReview();
            currentPeerReview = {
              slug: value.slice(5).trim(),
            };
          } else if (structuredReviews) {
            // legacy string format under peer: section - convert to structured
            structuredReviews.peer = structuredReviews.peer ?? [];
            structuredReviews.peer.push({
              slug:
                value.split(/\s+/)[0] ??
                `peer-${structuredReviews.peer.length + 1}`,
              run: value,
              budget: Infinity,
              level: 1,
            });
          }
        } else if (currentSubKey === 'self') {
          // start of a new self review object (- slug: ...)
          if (value.startsWith('slug:')) {
            currentSelfReview = {
              slug: value.slice(5).trim(),
            };
          }
        } else {
          // flat reviews array (backwards compat)
          if (!flatReviews) {
            flatReviews = [];
          }
          flatReviews.push(value);
        }
      }
      continue;
    }

    // handle self review object properties
    if (currentSubKey === 'self' && currentSelfReview) {
      if (trimmed.startsWith('slug:')) {
        currentSelfReview.slug = trimmed.slice(5).trim();
      } else if (trimmed.startsWith('say:')) {
        const sayValue = trimmed.slice(4).trim();
        if (sayValue === '|') {
          // multiline say
          inMultilineSay = true;
          multilineSayContent = [];
        } else if (sayValue.startsWith('"@') || sayValue.startsWith('@')) {
          // @path reference - expand it
          const refPath = sayValue.replace(/^"?@/, '').replace(/"$/, '');
          const fullPath = path.join(guardDir, refPath);
          try {
            currentSelfReview.say = await fs.readFile(fullPath, 'utf-8');
          } catch (error) {
            // 🔴 the CAUSE rides in the message, and the original rides in
            //    `cause:`. one alone is not enough: with no cause clause an
            //    absent file, a directory, and a permissions fault all arrive
            //    as one sentence, so a driver cannot tell which fix to apply
            //    (`rule.require.errors-name-the-fix`). raised i032/r6 + r10
            // .why the path clause = the ref resolves against the GUARD's own
            //        directory, never the repo root, and a ref written from the
            //        root is the most common way to earn an ENOENT here
            throw new BadRequestError(
              `failed to expand @path reference: ${refPath} — ${asErrorCauseClause({ error })}. the ref resolves against the guard's own directory (${guardDir}), so write the path from there.`,
              { cause: asErrorCause({ error }) },
            );
          }
          if (
            currentSelfReview.slug &&
            currentSelfReview.say &&
            structuredReviews
          ) {
            structuredReviews.self = structuredReviews.self ?? [];
            structuredReviews.self.push(
              currentSelfReview as RouteStoneGuardReviewSelf,
            );
            currentSelfReview = null;
          }
        } else {
          // inline say value
          currentSelfReview.say = sayValue.replace(/^"/, '').replace(/"$/, '');
          if (
            currentSelfReview.slug &&
            currentSelfReview.say &&
            structuredReviews
          ) {
            structuredReviews.self = structuredReviews.self ?? [];
            structuredReviews.self.push(
              currentSelfReview as RouteStoneGuardReviewSelf,
            );
            currentSelfReview = null;
          }
        }
      }
    }

    // handle peer review object properties
    if (currentSubKey === 'peer' && currentPeerReview) {
      if (trimmed.startsWith('slug:')) {
        currentPeerReview.slug = trimmed.slice(5).trim();
      } else if (trimmed.startsWith('run:')) {
        currentPeerReview.run = trimmed.slice(4).trim();
      } else if (trimmed.startsWith('budget:')) {
        currentPeerReview.budget = asGuardPositiveInt({
          raw: trimmed.slice(7).trim(),
          key: 'budget',
          at: `reviewer "${currentPeerReview.slug ?? '<unnamed>'}"`,
        });
      } else if (trimmed.startsWith('level:')) {
        currentPeerReview.level = asGuardPositiveInt({
          raw: trimmed.slice(6).trim(),
          key: 'level',
          at: `reviewer "${currentPeerReview.slug ?? '<unnamed>'}"`,
        });
      } else if (trimmed.startsWith('group:')) {
        // strip quotes (yaml string delimiters)
        currentPeerReview.group = trimmed
          .slice(6)
          .trim()
          .replace(/^["'](.*)["']$/, '$1');
      } else if (trimmed.startsWith('timeout:')) {
        // strip quotes from timeout value (yaml string delimiters)
        const rawTimeout = trimmed.slice(8).trim();
        const timeout = rawTimeout.replace(
          /^["'](.*)["']$/,
          '$1',
        ) as IsoDuration;

        // validate timeout is valid IsoDuration with positive value
        try {
          const ms = toMilliseconds(timeout);
          if (ms <= 0) {
            throw new BadRequestError(`timeout must be positive: ${timeout}`);
          }
        } catch (error) {
          // the positive-value refusal above is already the clearest form of
          // itself, so it passes through untouched
          if (error instanceof BadRequestError) throw error;

          // 🔴 the parser's own fault rides in the message, and the original in
          //    `cause:`. `PT` with no unit, a bare `21m`, and a non-duration
          //    string each fail differently inside `toMilliseconds`, and with
          //    no cause clause all three arrive as one sentence — so the author
          //    is told WHAT was rejected and never WHY. raised i032/r6 + r10
          throw new BadRequestError(
            `invalid timeout format: ${timeout} — ${asErrorCauseClause({ error })}. write an iso-8601 duration, e.g. \`PT21M\` for 21 minutes or \`PT30S\` for 30 seconds.`,
            { cause: asErrorCause({ error }) },
          );
        }

        currentPeerReview.timeout = timeout;
      } else if (trimmed.startsWith('concurrency:')) {
        /**
         * .what = refuses a concurrency bound written on a REVIEWER
         * .why  = a bound describes a SET, so its home is `reviews.groups`. with
         *         no refusal here the line parses clean and caps naught — the
         *         author believes they bounded a level and did not
         *
         * .note = narrow on purpose. this rejects the ONE key that means a bound,
         *         never every unknown key — a blanket schema would reject the
         *         comments and stray lines extant guards already carry
         *
         * .note = a misplaced nested `groups:` needs no arm here. the section
         *         switch above matches `trimmed === 'groups:'` at ANY indent, so
         *         such a block is read as the reviews-level map and then refused
         *         by `assertConcurrencyGroupsResolve` — a group nobody joined.
         *         a second arm for it would be unreachable
         */
        throw new BadRequestError(
          `a concurrency bound cannot be declared on a reviewer: ${trimmed}. a bound describes a GROUP, so declare membership here with \`group: <name>\` and the bound under \`reviews.groups\`.`,
        );
      }
    }
  }

  // finalize any pending peer review
  finalizePeerReview();

  // handle any final multiline content
  if (inMultilineSay && currentSelfReview) {
    currentSelfReview.say = multilineSayContent.join('\n').trim();
    if (currentSelfReview.slug && currentSelfReview.say && structuredReviews) {
      structuredReviews.self = structuredReviews.self ?? [];
      structuredReviews.self.push(
        currentSelfReview as RouteStoneGuardReviewSelf,
      );
    }
  }

  // set reviews based on what was parsed
  // convert flat reviews (legacy string format) to structured format at parse time
  // .why = eliminates parallel code paths; single format everywhere downstream
  if (structuredReviews) {
    // fold any legacy flat entries onto the structured object
    // .why = a `groups:` block alone makes structuredReviews truthy with an
    //        empty peer list. a precedence that PICKS one source would then
    //        silently drop every flat peer reviewer of a guard mid-upgrade —
    //        the plausible shape of an extant flat guard that gains a bound
    if (flatReviews) {
      structuredReviews.peer = [
        ...(structuredReviews.peer ?? []),
        ...flatReviews.map(asPeerReviewFromFlatCommand),
      ];
    }
    result.reviews = structuredReviews;
  } else if (flatReviews) {
    // flat reviews: each string becomes a structured review with defaults
    result.reviews = {
      self: [],
      peer: flatReviews.map(asPeerReviewFromFlatCommand),
    };
  }

  // standardize peer review slugs to guarantee uniqueness
  // .why = downstream code can use slug as stable key without collision
  if (result.reviews?.peer) {
    result.reviews.peer = standardizePeerReviewSlugs({
      peers: result.reviews.peer,
    });
  }

  // 🔴 no groups-carry step is owed here, and the invariant is why
  // .why = `groups:` eagerly initializes `structuredReviews`, so a guard that
  //        declares one can only ever take the `if (structuredReviews)` branch
  //        above — which assigns that very object, `.groups` and all. the
  //        `else if (flatReviews)` branch builds a fresh object ONLY when
  //        `structuredReviews` is falsy, and a falsy one carries no groups to
  //        drop. the two cases are mutually exclusive by construction.
  // .note = a carry-step here WAS shipped, with a `.why` that described a state
  //         the parser cannot reach. raised i023/r11, i026/r001, i028/r7. the
  //         comment is kept in its place because the next author to add a
  //         fourth sub-key will ask the same question that block answered
  //         wrongly, and an invariant stated beats a branch re-derived
  return result;
};
