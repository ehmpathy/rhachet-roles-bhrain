import type { AttributionGrade } from '@src/domain.objects/Reviewer/AttributionGrade';
import {
  ORDER_OF_SECTIONS,
  type PromptSectionChars,
  SECTIONS_NIL,
} from '@src/domain.objects/Reviewer/PromptSectionChars';
import { getOneAttributionGradeOfMarkup } from '@src/domain.operations/review/getOneAttributionGradeOfMarkup';
import {
  MARKER_OF_OUTPUT_FORMAT,
  MARKER_OF_RULES,
} from '@src/domain.operations/review/getOneHeadMarkerOffsets';

/**
 * .what = the census rows a delimited block feeds — every row but the head and residual
 * .why = `instructions` and `outputFormat` are cut from the head by its markers, and
 *        `scaffold` is what lies between the blocks; none of the three has a block
 */
type DelimitedSection = Exclude<
  keyof PromptSectionChars,
  'scaffold' | 'instructions' | 'outputFormat'
>;

/**
 * .what = the tag of the delimited block each row is read from
 * .why = a Record over the rows, never a hand-written list of lookups — a
 *        list compiles while it silently drops a row a later build adds; the
 *        Record goes red until that row names its tag
 *        (rule.require.distinguish-every-review-input)
 *
 * .note = `<target>` is deliberately absent — it wraps the diff and file
 *         blocks, so counting it would double chars those two already hold.
 */
const TAG_OF_SECTION: Record<DelimitedSection, string> = {
  rules: 'rules',
  refs: 'refs',
  conversation: 'conversation',
  'targetDiffs.additions': 'target.diff',
  'targetDiffs.deletions': 'target.diff',
  'targetDiffs.mutations': 'target.diff',
  targetFiles: 'target.file',
  // .note = a new entry here also needs a verdict in `IS_TARGET_SECTION` below,
  //         which is a `Record` over this map's keys for exactly that reason
};

/**
 * .what = each distinct tag the scan hunts, once — three rows share `target.diff`
 * .why = a scan per ROW would open the same `<target.diff>` three times; the row a
 *        block feeds is decided after the match, from its `kind` attribute
 *        (`asSectionOfBlock`)
 */
const TAGS_OF_SCAN = [...new Set(Object.values(TAG_OF_SECTION))];

/**
 * .what = the tags a known compiler leaves BETWEEN the delimited blocks — the
 *         `<target>` wrapper, plus any block tag the scan skipped as unclosed
 * .why = `scaffold` is the residual, so a block under a tag no row names would sum
 *        into it in silence. every tag a gap holds must be one of these; any other
 *        tag is an input with no row, and the grade says so whatever its mass
 *        (rule.require.distinguish-every-review-input)
 */
const TAGS_OF_GAP_MARKUP: ReadonlySet<string> = new Set([
  'target',
  ...TAGS_OF_SCAN,
]);

/**
 * .what = the tag names in one inter-block gap that no known compiler emits
 * .why = names the unknown-tag hunt, so the scan loop reads as a call rather than a
 *        regex pipeline to decode (rule.require.named-transformers)
 */
const getAllUnknownTagsOfGap = (input: { gap: string }): string[] =>
  [...input.gap.matchAll(/<\/?([a-z][\w.-]*)(?:\s[^>]*)?\/?>/gi)]
    .map((match) => match[1]!)
    .filter((tag) => !TAGS_OF_GAP_MARKUP.has(tag));

/**
 * .what = the census row one matched block feeds
 * .why = the three `targetDiffs.*` rows share one tag and part on `kind`. a diff
 *        tagged `kind="+"` is a net-new file's whole body; `kind="-"` is a void
 *        marker; `kind="~"` (or no kind) is an edited file's hunks.
 *
 * .note = an archived prompt rendered before the `kind` glyphs carries the prior
 *         word form, `change="added"` / `change="deleted"` on the same tag. both are
 *         read, so a census over old runs parts their diffs as they were SENT.
 *
 * .note = an archived prompt rendered BEFORE additions moved into the diff group
 *         carries `<target.file change="new">` and `<target.file change="deleted" />`.
 *         those stay `targetFiles` — as they were SENT — and the row says so
 *         by its count, never by a re-attribution this reader cannot verify.
 */
const asSectionOfBlock = (input: {
  tag: string;
  opener: string;
}): DelimitedSection => {
  const into = (Object.keys(TAG_OF_SECTION) as DelimitedSection[]).find(
    (one) => TAG_OF_SECTION[one] === input.tag,
  ); // a literal Record with no dynamic writes; `Object.keys` cannot narrow it (rule.forbid.as-cast's documented exception)
  if (into !== undefined && input.tag !== 'target.diff') return into;
  if (/\s(?:kind="\+"|change="added")/.test(input.opener))
    return 'targetDiffs.additions';
  if (/\s(?:kind="-"|change="deleted")/.test(input.opener))
    return 'targetDiffs.deletions';
  return 'targetDiffs.mutations';
};

/**
 * .what = which delimited blocks carry a TARGET, and so contribute to the locus
 * .why = the locus attributes mass to a PLACE, and only a target block has one. a
 *        `<rules>` or `<conversation>` block is real prompt mass with no path to
 *        prune it by, so it must not reach a directory rollup — folded in, it would
 *        land under whatever path the walk last saw and overstate that directory.
 *
 *        a `Record` over the delimited rows rather than a two-name check, so a new
 *        delimited section goes red here until it states whether it is a target
 *        (rule.require.distinguish-every-review-input).
 *
 * .note = `targetDiffs` is TRUE here and FALSE in `IS_TARGET_COUNT_INPUT`, and the
 *         two are both right: that map counts targets, where a diff beside its file
 *         would count one target twice. this map sums CHARS, and a diff's chars are
 *         real mass that the same path brought in — so they belong to its row.
 */
const IS_TARGET_SECTION: Record<DelimitedSection, boolean> = {
  rules: false,
  refs: false,
  conversation: false,
  'targetDiffs.additions': true,
  'targetDiffs.deletions': true,
  'targetDiffs.mutations': true,
  targetFiles: true,
};

/**
 * .what = which delimited blocks mark one TARGET apiece, for the target count
 * .why = a target now arrives as exactly one of: a file body (edited), an addition, or
 *        a deletion. a mutation rides beside its edited file's body, so to count it
 *        too would count one target twice — the same reason `IS_TARGET_COUNT_INPUT`
 *        holds `targetDiffs.mutations` false
 */
const IS_TARGET_COUNT_SECTION: Record<DelimitedSection, boolean> = {
  rules: false,
  refs: false,
  conversation: false,
  targetFiles: true,
  'targetDiffs.additions': true,
  'targetDiffs.deletions': true,
  'targetDiffs.mutations': false,
};

/**
 * .what = whether a census row is read from a delimited block
 * .why = narrows the rank's row list to the rows `TAG_OF_SECTION` keys, with no cast
 */
const isDelimitedSection = (
  section: keyof PromptSectionChars,
): section is DelimitedSection =>
  section !== 'scaffold' &&
  section !== 'instructions' &&
  section !== 'outputFormat';

/**
 * .what = the delimited rows, in print order
 * .why = walked off the rank, so a new row reaches the scan and the sum below by the
 *        same Record that names it, never by a second list
 */
const DELIMITED_SECTIONS = ORDER_OF_SECTIONS.filter(isDelimitedSection);
/**
 * .what = finds the index of the close tag that ends a block, or -1
 * .why = a target body can hold the close tag's literal text — this repo's
 *        own `asTargetSection.ts` does — so the first plain match would
 *        truncate the real body early. every real close sits on its own
 *        line, so a close with a newline on each side is preferred.
 *
 * .note = the plain first match is the fallback, for a prompt rendered
 *         inline (older artifacts and compact fixtures carry no newline
 *         around a close).
 */
const getOneCloseOfBlock = (input: {
  prompt: string;
  close: string;
  from: number;
}): number => {
  const lineClose = new RegExp(
    `\\n${input.close.replace(/\./g, '\\.')}(?=\\n|$)`,
    'g',
  );
  // deliberate mutation of a RegExp built the line above, per call, so no cursor
  // carries across calls (rule.require.immutable-vars' scoped-zone clause). a
  // hoisted `g` regex would keep its `lastIndex` between calls and skip closes
  lineClose.lastIndex = Math.max(input.from - 1, 0);
  const anchored = lineClose.exec(input.prompt);
  if (anchored) return anchored.index + 1;
  return input.prompt.indexOf(input.close, input.from);
};

/**
 * .what = finds the earliest block that opens at or after a cursor, of any kind
 * .why = the scan must take blocks in the order they appear, never one kind to
 *        exhaustion — else a later kind could open INSIDE a span already counted
 *
 * .note = the candidates are tried earliest first, and the first whole block
 *         wins. an unclosed opener is skipped for the next candidate, so a
 *         truncated block never swallows the blocks behind it. a close is hunted
 *         only for the candidate tried, never for every tag that opened.
 */
const getOneNextBlock = (input: {
  prompt: string;
  from: number;
  /**
   * the next opener of each tag, as found by an earlier call of this walk
   *
   * .why = without it, every block re-hunts every tag from the cursor. a tag that
   *        opens once (`<rules>`, `<refs>`, `<conversation>`) is then searched to the
   *        END of a megabyte prompt once per later block, which makes the parse
   *        O(blocks × prompt) — measured as most of a grove meter's wall time.
   *
   * .note = a remembered opener at or after the cursor is still the leftmost one:
   *         the hunt that found it started at an earlier cursor and matched no
   *         opener in between. a remembered `null` stays `null` for the same reason.
   *         so the memo changes how often the prompt is scanned, never what is found
   */
  openers: Map<string, OpenerOfTag | null>;
}): {
  // narrowed to the DELIMITED rows the scan actually walks, so the locus Record
  // lookup below needs no cast — `scaffold` is a residual and never a block
  into: DelimitedSection;
  at: number;
  body: number;
  end: number;
  /** the block's `path="…"` attribute, where its tag carries one */
  path: string | null;
} | null => {
  // each tag's next opener at or after the cursor, earliest first
  const candidates = TAGS_OF_SCAN.map((tag) =>
    getOneNextOpenerOfTag({ ...input, tag }),
  )
    .filter((found): found is OpenerOfTag => found !== null)
    .sort((a, b) => a.at - b.at);

  // the earliest opener whose block is whole wins; an unclosed one is skipped
  for (const found of candidates) {
    const into = asSectionOfBlock({ tag: found.tag, opener: found.text });

    // a void tag (`<target.file … change="deleted" />`) is a whole block
    // with no body — read as an opener it would hunt forward for a later
    // target's close and absorb every block in between
    if (found.text.endsWith('/>'))
      return {
        into,
        at: found.at,
        body: 0,
        end: found.at + found.text.length,
        path: asPathOfTag({ tag: found.text }),
      };

    const close = `</${found.tag}>`;
    const bodyFrom = found.at + found.text.length;
    const bodyUntil = getOneCloseOfBlock({
      prompt: input.prompt,
      close,
      from: bodyFrom,
    });
    // an unclosed block is a truncated prompt. skip it rather than run to the
    // end of the file and count a body that was never there
    if (bodyUntil === -1) continue;

    return {
      into,
      at: found.at,
      body: bodyUntil - bodyFrom,
      end: bodyUntil + close.length,
      path: asPathOfTag({ tag: found.text }),
    };
  }

  return null;
};

/**
 * .what = one opener tag as found in the prompt — its tag name, offset, and text
 * .why = the unit the walk remembers per tag, so a later block reuses the hunt
 */
type OpenerOfTag = { tag: string; at: number; text: string };

/**
 * .what = the next opener of one tag at or after the cursor, from the walk's memo
 *         where it still holds, else from a fresh hunt that refills the memo
 * .why = see `openers` on `getOneNextBlock` — the memo is what keeps the walk linear
 *
 * .note = deliberate mutation of the walk's own memo, owned by one call of
 *         `asPromptSectionChars` and never observed outside it
 *         (rule.require.immutable-vars' scoped-zone clause)
 */
const getOneNextOpenerOfTag = (input: {
  prompt: string;
  from: number;
  tag: string;
  openers: Map<string, OpenerOfTag | null>;
}): OpenerOfTag | null => {
  // a remembered answer still holds where it lies at or after the cursor
  const known = input.openers.get(input.tag);
  if (known === null) return null;
  if (known !== undefined && known.at >= input.from) return known;

  // otherwise hunt from the cursor, and remember what was found
  const opener = new RegExp(
    `<${input.tag.replace(/\./g, '\\.')}(?:\\s[^>]*)?>`,
    'g',
  );
  opener.lastIndex = input.from;
  const match = opener.exec(input.prompt);
  const found = match
    ? { tag: input.tag, at: match.index, text: match[0] }
    : null;
  input.openers.set(input.tag, found);
  return found;
};

/**
 * .what = the `path="…"` attribute of an opener tag, or null where it carries none
 * .why = the census answers "which INPUT bought this prompt" and cannot answer
 *        "which PLACE it came from" — `targetFiles is 87.6% of 1.0M chars` names a
 *        kind, never an address, so it cannot part mass a lane needs from mass a
 *        glob swept in. the path is what makes the mass prunable
 *        (rule.require.report-both-cost-levers-with-trend-and-locus).
 *
 * .note = read off the OPENER alone, never the whole block — and the reason is
 *         NARROWER than it first looks, which is worth stating because the wide
 *         version is wrong. a target body routinely holds the literal text
 *         `path="…"` (this repo's own source does), and the tempting claim is that a
 *         whole-block scan would read that quoted text as the block's own path. it
 *         would not: this regex is not `g`, so `exec` takes the FIRST match, and an
 *         opener always precedes its own body.
 *
 * 🔴      the real difference shows on a block whose opener carries NO path. there a
 *         whole-block scan reaches past the opener into the body and attributes that
 *         block's mass to a path the body merely QUOTED — inventing a directory that
 *         contributed no chars at all. this reader is archaeological: it parses
 *         artifacts the current renderer did not write, so a path-less opener is a
 *         shape it must survive rather than one it may assume away. `[case12]` clamps
 *         exactly that, and its first draft was green under BOTH implementations — a
 *         clamp with no teeth (rule.require.clamp-edge-cases).
 *
 * .note = `[^"]*` rather than a greedy class, so a tag with attributes AFTER the
 *         path (`<target.file path="a.ts" change="deleted" />`) stops at the first
 *         quote that closes the value rather than swallow the rest of the tag.
 */
const asPathOfTag = (input: { tag: string }): string | null => {
  const match = /\spath="([^"]*)"/.exec(input.tag);
  return match ? match[1]! : null;
};

/**
 * .what = the offset the block scan starts at — the rubric header, where the head carries one
 * .why = the head's instructions name the blocks by their literal tags (the rule never
 *        to flag the `<rules>` section, the diff howto's `<target.diff path="…">`). a
 *        scan from offset 0 opens a block at that prose, hunts forward to the REAL
 *        close, and folds the whole static head into one row — the absorption
 *        `rule.require.distinguish-every-review-input` forbids, with every figure still
 *        summed. no real block opens ahead of the rubric header, so the scan starts there
 *
 * .note = the same two markers the attribution grade cuts at (`getOneHeadMarkerOffsets`),
 *         sought in the same order: the rubric header that follows the output contract,
 *         never a quote of `## rules` earlier in the instructions
 *
 * .note = 0 where either marker is absent — an older layout this reader must survive.
 *         it scans as it always did there, and the attribution grade declines to vouch
 */
const getOneOffsetOfFirstBlockScan = (input: { prompt: string }): number => {
  const atOutputFormat = input.prompt.indexOf(MARKER_OF_OUTPUT_FORMAT);
  if (atOutputFormat < 0) return 0;
  const atRules = input.prompt.indexOf(MARKER_OF_RULES, atOutputFormat);
  return atRules < 0 ? 0 : atRules;
};

/**
 * .what = the two named head rows, cut at the head's markers, or null where it has none
 * .why = `instructions` and `outputFormat` are NAMED inputs. they carry markers in the
 *        head — the same unconditional literals the compiled lane cuts at
 *        (`getOneHeadMarkerOffsets`) — so each gets a row of its own, and the residual
 *        holds only genuine markup (rule.require.distinguish-every-review-input).
 *
 * .note = sought only within the head (ahead of the first delimited block), never the
 *         whole prompt — a target body routinely quotes `## rules`, and this repo's
 *         own source quotes both markers.
 *
 * .note = `null` where either marker is absent or inverted, rather than a throw. the
 *         compiled lane throws there because its head is the CURRENT compiler's; this
 *         reader parses artifacts an older compiler wrote, so an unknown head is a
 *         shape to survive. the caller then leaves both rows at 0, so those chars stay
 *         in `scaffold` as they did before the rows existed.
 */
const getOneHeadRows = (input: {
  prompt: string;
  headUntil: number;
}): { instructions: number; outputFormat: number } | null => {
  const head = input.prompt.slice(0, input.headUntil);
  const atOutputFormat = head.indexOf(MARKER_OF_OUTPUT_FORMAT);
  if (atOutputFormat < 0) return null;
  const atRules = head.indexOf(MARKER_OF_RULES, atOutputFormat);
  if (atRules < 0) return null;
  return {
    instructions: atOutputFormat,
    outputFormat: atRules - atOutputFormat,
  };
};

/**
 * .what = the attribution grade of the re-parse residual
 * .why = three answers, each with its own reason, named in one place so the reader's
 *        return reads as a call rather than a nested conditional:
 *        - null where the head carried no markers — the residual still holds the
 *          whole preamble, so the reader declines to vouch
 *        - `unattributed` where a gap held a tag no row names — an unmapped block,
 *          caught by name rather than by mass, so a small one cannot slip under the
 *          mass floor (rule.require.distinguish-every-review-input)
 *        - otherwise, the compiled lane's markup law
 */
const asAttributionOfResidual = (input: {
  headRows: { instructions: number; outputFormat: number } | null;
  tagsUnknown: string[];
  scaffold: number;
  promptChars: number;
}): AttributionGrade | null => {
  if (input.headRows === null) return null;
  if (input.tagsUnknown.length > 0) return 'unattributed';
  return getOneAttributionGradeOfMarkup({
    markupChars: input.scaffold,
    promptChars: input.promptChars,
  });
};

/**
 * .what = reads a rendered review prompt and attributes its chars by input
 * .why = the only instrument that can attribute a prompt's chars by input
 *        for runs already on disk. the forward instrument
 *        (`getOnePromptComposition`) measures from the source arrays and is
 *        strictly better, but only from the round it ships in onward.
 *
 * .note = a single forward cursor, never a scan per tag — a review target
 *         routinely contains the literal markers (`compileReviewPrompt.ts`
 *         holds `<target.file path="…">` in its own source), so a per-tag
 *         scan would open a block inside a span it already counted.
 *         measured: that read put delimited bodies at 2.9x the prompt corpus
 *         and shares past 100%. one cursor makes spans disjoint by
 *         construction, and a nested pseudo-tag absorbs into its outer body.
 *
 * .note = this reads the rendered artifact, so a marker that moves silently
 *         changes what it reports — an absent `<rules>` or `<target>`
 *         marker, or a negative residual, answers absent rather than a
 *         bogus row. a prompt this cannot parse is unread, never one that
 *         carried no rubric.
 */
export const asPromptSectionChars = (input: {
  prompt: string;
}): {
  sections: PromptSectionChars;
  targets: number;
  /**
   * whether the residual is small enough to vouch for, by the compiled lane's law
   *
   * .note = `null` where the head carries no markers to cut — an older layout this
   *         reader cannot part instructions from markup in, so it declines to vouch
   *         rather than grade a residual that still holds the whole preamble
   */
  attribution: AttributionGrade | null;
  /**
   * one entry per target path, with the chars it contributed
   *
   * .note = EMPTY rather than absent where no block carried a path — a `pull`-focus
   *         prompt sends a path list and no payload, so it has targets and no
   *         per-target mass to attribute. the renderer must say which of the two it
   *         met rather than report `0 directories` for both
   *         (hazard.a-status-read-cannot-report-absence).
   */
  locus: { path: string; chars: number }[];
} | null => {
  // every review prompt carries a rubric and a target. one that carries neither
  // is not a review prompt this reader understands. `compileReviewPrompt` renders
  // `<rules>` even for an empty rubric so this witness holds — its [case8] clamps it
  if (!input.prompt.includes('<rules>')) return null;
  if (!input.prompt.includes('<target>')) return null;

  // deliberate mutation, bounded to the scan below
  // (rule.require.immutable-vars' scoped-zone clause). the accumulators are
  // declared here, mutated only by the loop below, and read only after —
  // no caller observes an intermediate state. each escapes in its own form:
  // - `sections` escapes as a fresh spread at the return, never the accumulator
  // - `charsByPath` never escapes; only its entries do, cloned into fresh
  //   `{ path, chars }` objects of `locus`
  // - `targets` escapes by value, a number, so no reference leaks
  // - `tagsUnknown`, `cursor`, `headUntil` never escape; only values derived
  //   from them do
  // the alternative, a `reduce` over a materialized block list, costs a second
  // pass and a spread per block for an immutability no caller can tell apart.
  const sections = { ...SECTIONS_NIL };
  const charsByPath = new Map<string, number>();
  const tagsUnknown: string[] = [];
  // - `openers` never escapes; it only spares the walk a re-hunt per block
  const openers = new Map<string, OpenerOfTag | null>();
  let targets = 0;
  let cursor = getOneOffsetOfFirstBlockScan({ prompt: input.prompt });
  let headUntil: number | null = null;

  for (;;) {
    const block = getOneNextBlock({
      prompt: input.prompt,
      from: cursor,
      openers,
    });
    if (block === null) break;
    // the static head ends where the first delimited block opens
    if (headUntil === null) headUntil = block.at;
    // the gap ahead of this block is residual markup — hunt it for a tag no row names
    tagsUnknown.push(
      ...getAllUnknownTagsOfGap({ gap: input.prompt.slice(cursor, block.at) }),
    );
    sections[block.into] += block.body;
    if (IS_TARGET_COUNT_SECTION[block.into]) targets += 1;
    // the locus, folded off the SAME walk — a second scan would re-open the
    // nested-marker hazard this one cursor exists to close, and would cost a
    // second pass over a prompt that routinely runs past a megabyte
    if (block.path !== null && IS_TARGET_SECTION[block.into])
      charsByPath.set(
        block.path,
        (charsByPath.get(block.path) ?? 0) + block.body,
      );
    cursor = block.end;
  }
  // the gap behind the last block is residual markup too
  tagsUnknown.push(
    ...getAllUnknownTagsOfGap({ gap: input.prompt.slice(cursor) }),
  );
  // .note = the mutation zone ends HERE. every read below is of a settled value

  // the named rows, summed off the same list the scan walked
  const delimited = DELIMITED_SECTIONS.reduce(
    (sum, section) => sum + sections[section],
    0,
  );

  // the two named head rows, cut at the head's markers. an older layout with no
  // markers reads null here, so both rows stay 0 and their chars stay in scaffold
  const headRows = getOneHeadRows({
    prompt: input.prompt,
    headUntil: headUntil ?? 0,
  });
  const instructions = headRows?.instructions ?? 0;
  const outputFormat = headRows?.outputFormat ?? 0;

  // why a residual rather than a sum over known markup parts: this reader re-parses
  // prompts that OLDER compilers wrote, and each wrote its own headers and tags. a sum
  // over known constituents would need every past compiler's markup set, and it would
  // read an unknown tag as zero chars — a silent undercount, with no row to show it. the
  // residual keeps the rows summed to the prompt, and the attribution grade below names
  // it `unattributed` where a gap holds a tag no row names (whatever its mass) or where
  // the remainder is outsized, so an unmapped block is surfaced, never absorbed.
  // the residual is the ONE honest reader for this historical corpus; a run that carries
  // `prompt.composition` is attributed by `getOnePromptComposition` instead, which names every
  // input with no residual (the deferral is ruled at fulcrum F86)
  //
  // the spans are disjoint and lie within the prompt, so the residual cannot go
  // negative. where it does, the layout is not one this reader knows — say so
  // loudly, rather than clamp it to zero and ship a census whose rows do not sum
  // to its own total
  const scaffold =
    input.prompt.length - delimited - instructions - outputFormat;
  if (scaffold < 0) return null;

  return {
    sections: { ...sections, instructions, outputFormat, scaffold },
    targets,
    // 🔴 `scaffold` is a residual, so it sums exact whatever enters the prompt. the
    // named head blocks have rows of their own, so `scaffold` holds only markup, and
    // the grade checks that by the compiled lane's own law — an input with no row
    // shows up as excess markup rather than absorbed in silence
    // (rule.require.distinguish-every-review-input). null where the head carried no
    // markers: that residual still holds the whole preamble, so it is not vouched for.
    // a gap tag no row names grades `unattributed` outright — a small unmapped block
    // sits under the mass floor, so the share test alone would vouch for it
    attribution: asAttributionOfResidual({
      headRows,
      tagsUnknown,
      scaffold,
      promptChars: input.prompt.length,
    }),
    // one entry per target PATH, each the sum of its file body and its diff body.
    // body chars alone, so this stays commensurable with `sections` and can never
    // exceed the prompt — the tags a target carries land in `scaffold`, as they did
    // before this row existed
    locus: [...charsByPath.entries()].map(([path, chars]) => ({ path, chars })),
  };
};
