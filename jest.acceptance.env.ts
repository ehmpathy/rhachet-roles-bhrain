import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import util from 'util';

import { keyrack } from 'rhachet/keyrack';

/**
 * .what = the default per-test budget for an acceptance test
 * .why = 90s was sized for a plain downstream api call. every acceptance test here is a blackbox
 *        drive of the real cli, and the review + route families spawn a REAL brain inside the timed
 *        block — often with fixture setup (a temp-dir clone plus a `rhachet roles link` per role)
 *        paid inside it too. so 90s sits UNDER the true cost of the common case, and five separate
 *        suites failed cicd on the clock in one round, each because it silently inherited this.
 *
 *        a suite that drives a brain carries no marker, so the shortfall stays invisible until a
 *        shard happens to draw the file — and it then presents as `Exceeded timeout`, which reads
 *        identically to a genuinely wedged call. one raised default removes the per-file guesswork
 *        that produced those five. a heavier suite still declares its own budget on top.
 *
 *        a budget is a CEILING, never a duration: a deterministic case that exits in 2s is untouched
 *        by this. the only cost is that a truly wedged test reports later, which this repo already
 *        accepts elsewhere (the guard-peer suite waits 420s).
 */
// eslint-disable-next-line no-undef
jest.setTimeout(240000);

// set console.log to not truncate nested objects
util.inspect.defaultOptions.depth = 5;

/**
 * .what = verify that we're running from a valid project directory; otherwise, fail fast
 * .why = prevent confusion and hard-to-debug errors from running tests in the wrong directory
 */
if (!existsSync(join(process.cwd(), 'package.json')))
  throw new Error('no package.json found in cwd. are you @gitroot?');

/**
 * .what = verify that the env has sufficient auth to run the tests if aws is used; otherwise, fail fast
 * .why =
 *   - prevent time wasted waiting on tests to fail due to lack of credentials
 *   - prevent time wasted debugging tests which are failing due to hard-to-read missed credential errors
 */
const declapractUsePath = join(process.cwd(), 'declapract.use.yml');
const requiresAwsAuth =
  existsSync(declapractUsePath) &&
  readFileSync(declapractUsePath, 'utf8').includes('awsAccountId');
if (
  requiresAwsAuth &&
  !(process.env.AWS_PROFILE || process.env.AWS_ACCESS_KEY_ID)
)
  throw new Error(
    'no aws credentials present. please authenticate with aws to run acceptance tests',
  );

/**
 * .what = source credentials from keyrack for test env
 * .why =
 *   - auto-inject keys into process.env
 *   - fail fast with helpful error if keyrack locked or keys absent
 */
const keyrackYmlPath = join(process.cwd(), '.agent/keyrack.yml');
if (existsSync(keyrackYmlPath))
  keyrack.source({ env: 'test', owner: 'ehmpath', mode: 'strict' });
