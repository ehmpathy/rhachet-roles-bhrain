import { DomainLiteral } from 'domain-objects';

/**
 * .what = a single block event in drive history
 */
export interface DriveBlockEvent {
  stone: string;
  timestamp: string;
}

/**
 * .what = tracks consecutive stop blocks for route.drive
 * .why = prevents infinite loops and provides observability
 */
export interface DriveBlocks {
  /**
   * consecutive blocks since last approval/reset
   */
  current: number;

  /**
   * history of block events
   */
  history: DriveBlockEvent[];
}

export class DriveBlocks
  extends DomainLiteral<DriveBlocks>
  implements DriveBlocks {}
