import { asContentByPath } from '@src/domain.operations/review/asContentByPath';
import { asConversationEntryCondensed } from '@src/domain.operations/review/asConversationEntryCondensed';
import { getAllFileContentsByGroup } from '@src/domain.operations/review/getAllFileContentsByGroup';
import { getAllTargetsExtant } from '@src/domain.operations/review/getAllTargetsExtant';
import { getOneReviewScope } from '@src/domain.operations/review/getOneReviewScope';

/**
 * .what = a review lane's scope, settled once: its files, and every body the prompt reads
 * .why = a split lane runs a prime and N partitions over one scope. each run that re-walked
 *        it would repeat the git diff, the glob walk, the join, the polluter verdict, the
 *        mtime stat, and every read — and could see a different scope than the plan was made
 *        over. one settled scope, narrowed per partition, makes every run read the same bytes
 */
export type ReviewScopeSettled = {
  /** the scope walk's own result — targets, patches, refs, conversation, and its trace */
  scope: Awaited<ReturnType<typeof getOneReviewScope>>;
  /** the rule files the lane enumerated */
  ruleFiles: string[];
  /** every body the prompt reads, read in one bounded pour */
  contents: {
    rules: { path: string; content: string }[];
    refs: { path: string; content: string }[];
    conversation: { path: string; content: string }[];
    /** the body of each extant target, keyed by path; a deleted target has none */
    targetBodiesByPath: Map<string, string>;
  };
};

/**
 * .what = walks a lane's scope and reads every body it needs, ONCE
 * .why = the scope step of a review, apart from the compile-and-ask step, so a split lane
 *        settles its scope once and hands it to each partition run
 *        (`stepReviewOfScope`), never a re-walk per run
 *
 * .note = 🔴 every read goes through ONE bounded communicator (`getAllFileContentsByGroup`),
 *         so a wide corpus over many concurrent lanes cannot flood the descriptor table. ONE
 *         call, and the arity is the guarantee: separate calls, each bounded, would stack
 *         their bounds if fanned
 * .note = 🔴 the HEAP peak is not bounded here: all four lists live together at compile, so
 *         retention sets it, and no concurrency cap moves it
 */
export const getOneReviewScopeSettled = async (
  input: Parameters<typeof getOneReviewScope>[0],
  context: { cwd: string },
): Promise<ReviewScopeSettled> => {
  // work out the scope: targets, their patches, refs, and conversation, traced to the log dir
  const scope = await getOneReviewScope(input, context);

  // a DELETED target has no body to read — the file is gone — so it is held out of
  // the read set, and re-joined later as a marker, rather than read and caught
  const targetsToRead = getAllTargetsExtant({
    targets: scope.targets.files,
    changeKindByPath: scope.fileDiffByPath,
  });

  // read every file body the prompt needs, in ONE bounded pour
  const contentsByGroup = await getAllFileContentsByGroup({
    cwd: context.cwd,
    groups: {
      rules: input.ruleFiles,
      refs: scope.refFiles,
      conversation: scope.conversationFiles,
      targets: targetsToRead,
    },
  });

  return {
    scope,
    ruleFiles: input.ruleFiles,
    contents: {
      rules: contentsByGroup.rules,
      refs: contentsByGroup.refs,
      // a prior given that held no verdict rides as one line, never as its whole stdout
      conversation: contentsByGroup.conversation.map((entry) =>
        asConversationEntryCondensed({ entry }),
      ),
      targetBodiesByPath: asContentByPath({ reads: contentsByGroup.targets }),
    },
  };
};
