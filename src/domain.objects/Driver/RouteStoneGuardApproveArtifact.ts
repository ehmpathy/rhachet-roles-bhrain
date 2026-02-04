import { DomainEntity, type RefByUnique } from 'domain-objects';

import type { RouteStone } from './RouteStone';

/**
 * .what = represents human approval for a stone
 * .why = enables human-gated milestones
 */
export interface RouteStoneGuardApproveArtifact {
  /**
   * reference to the stone by unique key (path)
   */
  stone: RefByUnique<typeof RouteStone>;

  /**
   * path to .approved file under .route/
   */
  path: string;
}

export class RouteStoneGuardApproveArtifact
  extends DomainEntity<RouteStoneGuardApproveArtifact>
  implements RouteStoneGuardApproveArtifact
{
  public static primary = ['path'] as const;
  public static unique = ['stone'] as const;
}
