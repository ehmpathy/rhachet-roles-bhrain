import { DomainLiteral } from 'domain-objects';

/**
 * .what = current state of drive stop blocker
 */
export interface DriveBlockerState {
  /**
   * consecutive blocks since last approval/reset
   */
  count: number;

  /**
   * stone that triggered the current block streak
   */
  stone: string | null;
}

export class DriveBlockerState
  extends DomainLiteral<DriveBlockerState>
  implements DriveBlockerState {}
