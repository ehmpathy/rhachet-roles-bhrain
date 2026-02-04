import { DomainLiteral, type RefByUnique } from 'domain-objects';

import type { RouteStone } from './RouteStone';

/**
 * .what = represents the drive artifacts for a stone
 * .why = tracks what has been produced along the drive
 */
export interface RouteStoneDriveArtifacts {
  /**
   * reference to the stone by unique key (path)
   */
  stone: RefByUnique<typeof RouteStone>;

  /**
   * produced .md files (route artifacts)
   */
  outputs: string[];

  /**
   * .passed marker under .route/ (drive artifact)
   *
   * null if stone has not been passed yet
   */
  passage: string | null;
}

export class RouteStoneDriveArtifacts
  extends DomainLiteral<RouteStoneDriveArtifacts>
  implements RouteStoneDriveArtifacts {}
