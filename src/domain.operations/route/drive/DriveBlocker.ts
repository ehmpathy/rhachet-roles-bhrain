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

  /**
   * timestamp of first block in current streak
   */
  since: string | null;
}

export class DriveBlockerState
  extends DomainLiteral<DriveBlockerState>
  implements DriveBlockerState {}

/**
 * .what = a single block event for history log
 */
export interface DriveBlockerEvent {
  stone: string;
  timestamp: string;
  count: number;
}

export class DriveBlockerEvent
  extends DomainLiteral<DriveBlockerEvent>
  implements DriveBlockerEvent {}
