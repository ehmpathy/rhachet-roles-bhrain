import { DomainEntity, type RefByUnique } from 'domain-objects';

import type { ExitCodeClass } from '@src/domain.objects/Driver/ExitCodeClass';

import type { RouteStone } from './RouteStone';

/**
 * .what = represents the output of a peer review run
 * .why = tracks peer review results for guard judgment
 */
export interface RouteStoneGuardReviewPeerArtifact {
  /**
   * reference to the stone by unique key (path)
   */
  stone: RefByUnique<typeof RouteStone>;

  /**
   * artifact content hash
   */
  hash: string;

  /**
   * attempt number (increments when hash changes)
   */
  iteration: number;

  /**
   * review index (r1, r2, etc)
   */
  index: number;

  /**
   * path to review file under .route/
   */
  path: string;

  /**
   * count of blocker issues found
   */
  blockers: number;

  /**
   * count of nitpick issues found
   */
  nitpicks: number;

  /**
   * which tallier produced the count — the contract term for the tactic that resolved it:
   * - 'deterministic' = counts read verbatim from the reviewer's own numbers (regex)
   * - 'probabilistic' = counts extracted from prose by the fallback sub-brain
   * - null = a pre-fallback record (reconstructed from an artifact written before this field),
   *   or a review with no detected verdict (a malfunction carries no tallier)
   *
   * .note = the field is named for the ROLE that produced the tally (`tallier`), the same word
   *         the tally contract (`ReviewCountsResolved`) and the render (`tallied by
   *         reviewer@$brain`) use.
   */
  tallier: 'deterministic' | 'probabilistic' | null;

  /**
   * the PINNED brain that tallied the count — read back from the persisted
   * `tallied by reviewer@<pin>` footer, so a render names the model that actually ran
   * - null = no sub-brain tallied it (deterministic), or a footer with no slug
   *
   * .note = never the versionless default. the default's `latest` moves when the pin
   *         moves, so a render of it would name a different model than the one that
   *         tallied, while the given beside it names the truth
   */
  talliedBy: string | null;

  /**
   * command exit code
   */
  exitCode: number;

  /**
   * exit code classification: passed, constraint, or malfunction
   */
  exitClass: ExitCodeClass;

  /**
   * command stdout
   */
  stdout: string;

  /**
   * command stderr
   */
  stderr: string;

  /**
   * review duration in milliseconds (parsed from stdout metrics)
   */
  durationMs: number | null;
}

export class RouteStoneGuardReviewPeerArtifact
  extends DomainEntity<RouteStoneGuardReviewPeerArtifact>
  implements RouteStoneGuardReviewPeerArtifact
{
  public static primary = ['path'] as const;
  public static unique = ['stone', 'hash', 'index'] as const;
}

/**
 * @deprecated use RouteStoneGuardReviewPeerArtifact instead
 */
export type RouteStoneGuardReviewArtifact = RouteStoneGuardReviewPeerArtifact;

/**
 * @deprecated use RouteStoneGuardReviewPeerArtifact instead
 */
export const RouteStoneGuardReviewArtifact = RouteStoneGuardReviewPeerArtifact;
