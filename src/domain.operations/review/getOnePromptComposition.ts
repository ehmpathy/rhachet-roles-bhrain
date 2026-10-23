import type {
  PromptComposition,
  PromptInputName,
  PromptInputWeight,
} from '@src/domain.objects/Reviewer/PromptComposition';
import { getOneAttributionGrade } from '@src/domain.operations/review/getOneAttributionGrade';
import { getOneHeadMarkerOffsets } from '@src/domain.operations/review/getOneHeadMarkerOffsets';
import { isTargetDiffSent } from '@src/domain.operations/review/isTargetDiffSent';
import { isTargetFileSent } from '@src/domain.operations/review/isTargetFileSent';
import { isTargetPayloadSent } from '@src/domain.operations/review/isTargetPayloadSent';

/**
 * .what = which side of the cache seam each input sits on
 * .why = declared beside the union so a new input must state its seam at the
 *        moment it is named, rather than default into the cheap half by silence
 *
 * .note = `markup` is marked cacheable because all but its last few hundred chars
 *         (the `## target` header and the `<target>` tags) sit in the static head.
 *
 * .note = `targetFiles` and `targetPaths` are a POSITION claim, never a promise
 *         that every body caches — see `IS_CACHEABLE_SECTION`, which argues it.
 *         an untouched file is byte-identical across rounds and the file group
 *         rides ahead of every diff, so the rows CAN ride the shared prefix.
 *
 * .note = exported so its peer can be bound to it. `IS_CACHEABLE_SECTION`
 *         states the same fact over the six coarse rows the re-parse lane
 *         reads; `[case1d]` asserts that every input's seam survives the
 *         fold through `SECTION_OF_INPUT`, so the two records cannot drift
 */
export const IS_CACHEABLE: Record<PromptInputName, boolean> = {
  instructions: true,
  outputFormat: true,
  rules: true,
  refs: true,
  markup: true,
  conversation: false,
  'targetDiffs.additions': true,
  'targetDiffs.deletions': true,
  'targetDiffs.mutations': false,
  targetFiles: true,
  targetPaths: true,
};

/**
 * .what = the total chars across a set of parts; an absent part counts as none
 * .why = every input row of the census is this same sum over a different source
 */
const getOneCharsSum = (input: {
  parts: Array<string | null | undefined>;
}): number =>
  input.parts.reduce<number>((sum, part) => sum + (part?.length ?? 0), 0);

/**
 * .what = the targets whose diff the renderer actually sends, of one change kind
 * .why = none in `pull` focus, and in `push` only those `isTargetDiffSent` admits —
 *        split by kind, since an addition, a deletion, and a mutation are three
 *        different levers: an addition shrinks only by an outline or a partition, a
 *        mutation's context by a smaller radius, and a deletion costs a tag
 */
const getAllTargetsWithDiffSent = <
  T extends Parameters<typeof isTargetDiffSent>[0]['target'],
>(input: {
  targets: T[];
  payloadSent: boolean;
  kind: 'new' | 'edited' | 'deleted';
}): T[] =>
  input.payloadSent
    ? input.targets.filter(
        (target) =>
          isTargetDiffSent({ target }) &&
          (target.changeKind ?? 'edited') === input.kind,
      )
    : [];

/**
 * .what = the chars a diff block carries — an addition's whole body, a mutation's hunks
 * .why = an addition renders the file itself labeled `kind="+"`, never git's
 *        `+`-on-every-line form, which re-sends the body plus a char per line and a
 *        preamble. so its chars are the body's. decided HERE apart from the renderer,
 *        so the residual can still catch the two in disagreement (`F11`)
 */
const asCharsOfDiffSent = (input: {
  target: { content: string | null; diff?: string | null };
  kind: 'new' | 'edited';
}): string | null | undefined =>
  input.kind === 'new' ? input.target.content : input.target.diff;

/**
 * .what = the targets whose file body the renderer actually sends
 * .why = none in `pull` focus, and in `push` only an EDITED file's body. a deleted
 *        file carries `content: null`; a new file's body rides the diff group as an
 *        addition, so to count it here too would count it twice.
 *        the file-axis twin of `getAllTargetsWithDiffSent`
 *
 * .note = both halves read the same shared PRIMITIVE the renderer reads —
 *         `isTargetFileSent` here, `isTargetDiffSent` in the diff twin — so the
 *         send question has one home per axis (rule.require.distinguish-every-review-input).
 *         what the census does NOT read is the composed `getOneTargetRenderPlan`:
 *         it composes the halves itself, with its own focus gate, and measures the
 *         chars on its own, so the residual still goes negative when the census
 *         counts a body the renderer never wrapped (`F11`)
 */
const getAllTargetsWithFileSent = <
  T extends Parameters<typeof isTargetFileSent>[0]['target'],
>(input: {
  targets: T[];
  payloadSent: boolean;
}): T[] =>
  input.payloadSent
    ? input.targets.filter((target) => isTargetFileSent({ target }))
    : [];

/**
 * .what = the chars of a total that no measured part accounts for
 * .why = the census residual — the decoration every block is wrapped in
 */
const getOneCharsResidual = (input: {
  total: number;
  measured: number[];
}): number => input.total - input.measured.reduce((sum, part) => sum + part, 0);

/**
 * .what = measures a compiled review prompt's char budget by input
 * .why = the study instrument. `metrics.realized.json` answers what a review
 *        cost, never what it was made of. these figures answer the second,
 *        per run, so a corpus of runs can be asked where the chars sit
 *
 * .note = measured from the source arrays, never a re-parse of the rendered
 *         prompt — a regex over the output would drift the moment a section
 *         moves, exactly the class of change this instrument exists to observe
 */
export const getOnePromptComposition = (input: {
  /**
   * required — decides whether a target payload is counted at all. a
   * default here would silently assume `push` and re-open the negative-markup
   * defect this argument closes
   */
  focus: 'pull' | 'push';
  rules: Array<{ path: string; content: string }>;
  refs: Array<{ path: string; content: string }>;
  conversation: Array<{ path: string; content: string }>;
  targets: Array<{
    path: string;
    content: string | null;
    diff?: string | null;
    changeKind?: 'new' | 'edited' | 'deleted';
  }>;
  /** targets a partition run carries as context only — rendered as a path list */
  targetsAsContext?: string[];
  promptHeadStatic: string;
  promptTailVariable: string;
}): PromptComposition => {
  const chars = input.promptHeadStatic.length + input.promptTailVariable.length;

  // in `pull` focus the renderer sends a path list and no payload, so both
  // target rows are nil — a sum over the source arrays regardless would count a
  // payload the prompt never carried, and push the residual negative.
  // .note = this gate composes the focus check with the per-axis primitives on
  //         purpose, rather than read `getOneTargetRenderPlan`. the doubled
  //         composition is a kept detector, not an unwired call site: were the
  //         census to read the renderer's own plan, a plan that wrapped a body it
  //         should not would be counted the same way it was sent, and the residual
  //         could never go negative to expose it (`F11`)
  const payloadSent = isTargetPayloadSent({ focus: input.focus });

  // only the targets whose diff the renderer actually sends, one list per change
  // kind — a sum over every `.diff` would count git's `+`-prefixed form of a new
  // file, which the prompt never carried, and `markup` would go negative
  const targetsAdded = getAllTargetsWithDiffSent({
    targets: input.targets,
    payloadSent,
    kind: 'new',
  });
  const targetsDeleted = getAllTargetsWithDiffSent({
    targets: input.targets,
    payloadSent,
    kind: 'deleted',
  });
  const targetsMutated = getAllTargetsWithDiffSent({
    targets: input.targets,
    payloadSent,
    kind: 'edited',
  });
  const targetsWithFileSent = getAllTargetsWithFileSent({
    targets: input.targets,
    payloadSent,
  });

  const rules = getOneCharsSum({
    parts: input.rules.map((rule) => rule.content),
  });
  const refs = getOneCharsSum({ parts: input.refs.map((ref) => ref.content) });
  const conversation = getOneCharsSum({
    parts: input.conversation.map((it) => it.content),
  });
  const targetDiffsAdditions = getOneCharsSum({
    parts: targetsAdded.map((target) =>
      asCharsOfDiffSent({ target, kind: 'new' }),
    ),
  });
  const targetDiffsMutations = getOneCharsSum({
    parts: targetsMutated.map((target) =>
      asCharsOfDiffSent({ target, kind: 'edited' }),
    ),
  });
  // a deletion is a void tag of a path alone — its few chars are markup, never body
  const targetDiffsDeletions = 0;
  const targetFiles = getOneCharsSum({
    parts: targetsWithFileSent.map((target) => target.content),
  });

  // the mirror of the two rows above: where `push` sends payloads, `pull`
  // sends a path list and the brain opens the files itself — those path
  // chars are real prompt mass, measured from the source paths; the `- ` and
  // newline the renderer wraps each one in stay markup
  //
  // a partition run's `## context only` block is a path list too, in either focus —
  // its paths land here so the block never falls silently into `markup`; its header
  // and the `- ` wraps stay markup, the same as the pull list's
  const targetPaths =
    (payloadSent
      ? 0
      : getOneCharsSum({ parts: input.targets.map((target) => target.path) })) +
    getOneCharsSum({ parts: input.targetsAsContext ?? [] });

  // the head census is an offset cut, so it refuses a head it cannot cut,
  // and hands back the offsets rather than merely assert them, so this
  // census cannot re-derive what it already decided (rule.forbid.failhide)
  const { atOutputFormat, atRules } = getOneHeadMarkerOffsets({
    promptHeadStatic: input.promptHeadStatic,
  });

  // the output-format block spans from its own marker to the rubric's.
  // .why = it is the one static block whose position was a defect, so its size
  //        is worth its own row rather than a lump into `instructions`
  const outputFormat = atRules - atOutputFormat;

  // all that sits ahead of the output-format block is the grove-wide preamble
  const instructions = atOutputFormat;

  // the residual — the headers, xml tags, and `---` separators the renderer
  // wraps each block in are real chars, really paid
  const markup = getOneCharsResidual({
    total: chars,
    measured: [
      instructions,
      outputFormat,
      rules,
      refs,
      conversation,
      targetDiffsAdditions,
      targetDiffsDeletions,
      targetDiffsMutations,
      targetFiles,
      targetPaths,
    ],
  });

  const asWeight = (
    name: PromptInputName,
    weight: { chars: number; count: number },
  ): PromptInputWeight => ({
    chars: weight.chars,
    count: weight.count,
    cacheable: IS_CACHEABLE[name],
  });

  const measured: Omit<PromptComposition, 'attribution'> = {
    chars,
    cacheable: {
      head: input.promptHeadStatic.length,
      tail: input.promptTailVariable.length,
    },
    inputs: {
      instructions: asWeight('instructions', {
        chars: instructions,
        count: 1,
      }),
      outputFormat: asWeight('outputFormat', {
        chars: outputFormat,
        count: 1,
      }),
      rules: asWeight('rules', { chars: rules, count: input.rules.length }),
      refs: asWeight('refs', { chars: refs, count: input.refs.length }),
      conversation: asWeight('conversation', {
        chars: conversation,
        count: input.conversation.length,
      }),
      'targetDiffs.additions': asWeight('targetDiffs.additions', {
        chars: targetDiffsAdditions,
        count: targetsAdded.length,
      }),
      'targetDiffs.deletions': asWeight('targetDiffs.deletions', {
        chars: targetDiffsDeletions,
        count: targetsDeleted.length,
      }),
      'targetDiffs.mutations': asWeight('targetDiffs.mutations', {
        chars: targetDiffsMutations,
        count: targetsMutated.length,
      }),
      targetFiles: asWeight('targetFiles', {
        chars: targetFiles,
        count: targetsWithFileSent.length,
      }),
      targetPaths: asWeight('targetPaths', {
        chars: targetPaths,
        count: payloadSent ? 0 : input.targets.length,
      }),
      markup: asWeight('markup', { chars: markup, count: 1 }),
    },
  };

  // the census states its own coverage beside its figures. the sum above
  // holds by algebra alone, so it proves the arithmetic and says naught about
  // coverage — this is what speaks to coverage, in the shipped path, not
  // only under test (rule.forbid.failhide, wish bar 2). it grades rather
  // than refuses, since the share is a heuristic over runtime data: a corpus
  // of many small files reads 70.8% markup off real tags alone, so a throw
  // here would kill the review rather than catch a defect. the one check
  // that is a code defect at every scale — a negative residual — still
  // throws, from inside this same operation
  const attribution = getOneAttributionGrade({ composition: measured });

  return { ...measured, attribution };
};
