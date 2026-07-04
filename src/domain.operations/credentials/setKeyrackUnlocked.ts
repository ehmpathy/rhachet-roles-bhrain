import { spawnSync } from 'child_process';

/**
 * .what = ensure the keyrack daemon holds creds for this owner/env before brain work
 * .why = reviewers always need { owner: ehmpath, env: prep } creds; unlock upfront so we
 *        fail at the unlock step instead of deep inside brain invocation. re-unlock is
 *        instant and non-interactive for ehmpath, so we run it unconditionally (idempotent).
 *
 * .note = on failure, forward keyrack's own stdout/stderr verbatim and propagate its exit
 *         code — keyrack owns the locked/absent/prikey vocabulary; we do not re-wrap it.
 * .note = on success, stay silent — keyrack's output is captured, not printed.
 * .note = uses ./node_modules/.bin/rhx regardless of PATH; reviewers run from gitroot
 *         (see rule.forbid.cwd-outside-gitroot).
 * .note = we do NOT branch on process.env here — unlock is keyrack's job. locally keyrack
 *         reads the vault into its daemon; in CI the keyrack firewall feeds creds from env
 *         into the daemon. our code just asks keyrack to unlock, unconditionally.
 */
export const setKeyrackUnlocked = (input: {
  owner: string;
  env: string;
}): void => {
  // unlock the keyrack for this owner/env; capture output so success stays silent
  const result = spawnSync(
    './node_modules/.bin/rhx',
    ['keyrack', 'unlock', '--owner', input.owner, '--env', input.env],
    { encoding: 'utf-8' },
  );

  // success: creds now available to downstream brain work, no output needed
  if (result.status === 0) return;

  // failure: forward keyrack's own output verbatim and propagate its exit code
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
};
