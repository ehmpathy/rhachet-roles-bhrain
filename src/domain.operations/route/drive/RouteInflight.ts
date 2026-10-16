import { DomainLiteral } from 'domain-objects';

/**
 * .what = the driver's watermark that repairs for one stone are in flight
 * .why = a driver who delegates a round's repairs to background work waits on it; the
 *        stop hook reads this watermark so that wait is not graded as a refusal
 *
 * .note = `since` is never written into the file: it rides the file's mtime, so the route
 *         persistence holds no time-precision field (rule.forbid.timestamps-in-route-artifacts,
 *         its `.exception`). the hook renders only a clock label
 */
export interface RouteInflight {
  /**
   * the stone whose repairs are in flight
   */
  stone: string;

  /**
   * when the driver marked the repairs in flight, as epoch milliseconds
   *
   * .note = read from and written to the file's mtime, never the json body
   */
  since: number;

  /**
   * what is in flight, in the driver's own words
   */
  what: string;
}

export class RouteInflight
  extends DomainLiteral<RouteInflight>
  implements RouteInflight {}
