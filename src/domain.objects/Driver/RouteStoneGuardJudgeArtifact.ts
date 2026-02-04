import { DomainEntity, type RefByUnique } from 'domain-objects';

import type { RouteStone } from './RouteStone';

/**
 * .what = represents the output of a judge run
 * .why = tracks judge decisions for stone passage
 */
export interface RouteStoneGuardJudgeArtifact {
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
   * judge index (j1, j2, etc)
   */
  index: number;

  /**
   * path to judge file under .route/
   */
  path: string;

  /**
   * whether the judge passed
   */
  passed: boolean;

  /**
   * reason for pass/fail (null if no reason provided)
   */
  reason: string | null;
}

export class RouteStoneGuardJudgeArtifact
  extends DomainEntity<RouteStoneGuardJudgeArtifact>
  implements RouteStoneGuardJudgeArtifact
{
  public static primary = ['path'] as const;
  public static unique = ['stone', 'hash', 'index'] as const;
}
