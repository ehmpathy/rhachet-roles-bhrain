import { spawnSync } from 'child_process';

/**
 * .what = ensure keyrack holds creds for this owner/env/key before brain work
 * .why = reviewers always need { owner: ehmpath, env: prep } creds. we ensure they are
 *        available upfront so we failfast at the credential step with keyrack's own
 *        message, instead of a fake malfunction deep inside brain invocation.
 *
 * .note = we first ASK keyrack whether the cred is already grantable (`keyrack get`). if
 *         it is, we stay silent and skip unlock — this is the CI path, where the keyrack
 *         firewall already supplied creds via env, so there is no local daemon to unlock.
 *         only when the cred is NOT yet available do we `keyrack unlock` — the local path,
 *         where keyrack reads the vault into its daemon on the user's behalf.
 * .note = this keeps keyrack the sole owner of the source decision. our code never reads
 *         process.env nor branches on CI — it just asks keyrack, then unlocks if needed.
 * .note = on unlock failure, forward keyrack's own stdout/stderr verbatim and propagate its
 *         exit code — keyrack owns the locked/absent/prikey vocabulary; we do not re-wrap it.
 * .note = uses ./node_modules/.bin/rhx regardless of PATH; reviewers run from gitroot
 *         (see rule.forbid.cwd-outside-gitroot).
 */
export const setKeyrackUnlocked = (input: {
  owner: string;
  env: string;
  key: string;
}): void => {
  // ask keyrack if the cred is already grantable (local daemon or firewall-supplied env)
  const probe = spawnSync(
    './node_modules/.bin/rhx',
    [
      'keyrack',
      'get',
      '--key',
      input.key,
      '--owner',
      input.owner,
      '--env',
      input.env,
    ],
    { encoding: 'utf-8' },
  );

  // already available: stay silent, no unlock needed (e.g. CI firewall env)
  if (probe.status === 0) return;

  // not yet available: unlock on the user's behalf (reads the vault into the daemon)
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
