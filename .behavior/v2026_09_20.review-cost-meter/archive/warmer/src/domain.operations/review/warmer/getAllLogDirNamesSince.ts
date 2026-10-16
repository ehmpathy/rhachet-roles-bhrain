import { asLogDirMintedAt } from '../asLogDirMintedAt';
import { isLogDirName } from '../isLogDirName';

/**
 * .what = the run dir names, among a log root's entries, minted after an instant
 * .why = the bound that keeps a warmer's wake cheap — only runs newer than its
 *        last touch are read, so the scan stays at a handful however long the
 *        history grows
 *
 * .note = the compare is on parsed dates, never on the name's bytes — the
 *         `isLogDirName` gate is what makes the parse safe, so the two filters
 *         are a pair rather than two independent checks. a lexical compare
 *         would also read chronologically today, since the name leads with a
 *         fixed-width escaped iso stamp; it is not used, because that holds
 *         only while the width is fixed — a fact about the format no type
 *         states
 */
export const getAllLogDirNamesSince = (input: {
  names: string[];
  since: Date;
}): string[] =>
  input.names
    .filter((name) => isLogDirName({ name }))
    .filter((name) => asLogDirMintedAt({ name }) > input.since);
