/**
 * .what = the name of the status file in a route's state dir
 * .why = one home for the name; the bash reader (`route.status.line.sh`) types it too, and
 *        its integration test reads this constant to keep the two from drift
 */
export const NAME_OF_ROUTE_STATUS_LINE_FILE = '.status.line.json';
