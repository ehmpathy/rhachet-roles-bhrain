import { getAllBashWordsUnredirected } from './getAllBashWordsUnredirected';

/**
 * .what = the destination a cp or mv in one simple command names, quotes removed
 * .why = a cp or mv whose destination is memory writes it; any other is graded as
 *        a copy, so the guard needs the one word the copy lands at
 * .note = the word after `-t` / `--target-directory` (`cp -t DIR a b`), else the last
 *         word that is no redirect (`cp a M 2>&1` lands at M)
 */
export const getOneBashCopyDestination = (input: {
  segment: string;
}): string => {
  const words = getAllBashWordsUnredirected({
    words: input.segment.trim().split(/\s+/),
  });
  const indexTarget = words.findIndex(
    (word) => word === '-t' || word === '--target-directory',
  );
  const destination =
    (indexTarget >= 0 ? words[indexTarget + 1] : words[words.length - 1]) ?? '';
  return destination.replace(/["']/g, '');
};
