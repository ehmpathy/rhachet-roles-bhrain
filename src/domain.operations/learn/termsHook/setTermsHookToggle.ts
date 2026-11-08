import { ConstraintError } from 'helpful-errors';

import { asSettingsWithoutTermsHook } from './asSettingsWithoutTermsHook';
import { asSettingsWithTermsHook } from './asSettingsWithTermsHook';
import { asTermsHookAuthors } from './asTermsHookAuthors';
import { asTermsHookNoopOutcome } from './asTermsHookNoopOutcome';
import { getOneTermsHookSettings } from './getOneTermsHookSettings';
import { getOneTermsHookState } from './getOneTermsHookState';
import {
  getOneTermsHookTarget,
  type TermsHookTarget,
} from './getOneTermsHookTarget';
import { setTermsHookSettings } from './setTermsHookSettings';
import { withTermsHookSettingsHold } from './withTermsHookSettingsHold';

/**
 * .what = what one enable or disable did
 * .why = the cli names the outcome, the file, and any foreign authors it removed
 */
export type TermsHookToggleOutcome =
  | 'added'
  | 'updated'
  | 'removed'
  | 'already-enabled'
  | 'already-disabled';

/**
 * .what = turn the term hook on or off in this repo's claude settings
 * .why = the one write path for both verbs: read, decide, and write inside rhachet's hold on
 *        the file, so a concurrent `rhx init` or a second toggle never interleaves
 *
 * .note = idempotent: `enable` on a current entry and `disable` on no entry write naught,
 *         and an absent target is never created by `disable`
 * .note = the target is picked to choose the key, then picked again under the hold. a layout
 *         that flipped between the two (a concurrent `rhx init` that split it) is refused, so
 *         the write never lands on a path rhachet no longer reads
 * .note = a no-op is settled by a lock-free look first, so it never waits behind a live
 *         rhachet write and never makes the lock dir in a repo that never asked. rhachet
 *         writes by atomic swap, so the look reads a whole file, as `get` does
 */
export const setTermsHookToggle = async (input: {
  repoRoot: string;
  mode: 'enable' | 'disable';
}): Promise<{
  outcome: TermsHookToggleOutcome;
  target: TermsHookTarget;
  authorsRemoved: string[];
}> => {
  const targetToLock = getOneTermsHookTarget({ repoRoot: input.repoRoot });

  // settle a no-op with no hold
  const noopSeen = asTermsHookNoopOutcome({
    mode: input.mode,
    status: getOneTermsHookState({
      settings: await getOneTermsHookSettings(targetToLock),
    }).status,
  });
  if (noopSeen)
    return { outcome: noopSeen, target: targetToLock, authorsRemoved: [] };

  return withTermsHookSettingsHold({
    repoRoot: input.repoRoot,
    path: targetToLock.path,
    pathShown: targetToLock.pathShown,
    logic: async () => {
      // confirm the held key still names the target
      const target = getOneTermsHookTarget({ repoRoot: input.repoRoot });
      if (target.path !== targetToLock.path)
        throw new ConstraintError(
          'the settings file moved to a new path while learn.terms.hook waited, so it changed no file',
          {
            settings: target.pathShown,
            hint: 'rerun the command; it will write the new path',
          },
        );

      // read the state under the hold
      const settings = await getOneTermsHookSettings(target);
      const state = getOneTermsHookState({ settings });
      const authorsFound = asTermsHookAuthors({ hooks: state.found });

      // a no-op decided under the hold writes naught
      const noop = asTermsHookNoopOutcome({
        mode: input.mode,
        status: state.status,
      });
      if (noop) return { outcome: noop, target, authorsRemoved: [] };

      // enable: converge to the one declared entry; any copy it replaced is named
      if (input.mode === 'enable') {
        await setTermsHookSettings({
          path: target.path,
          settings: asSettingsWithTermsHook({ settings }),
        });
        return {
          outcome: state.status === 'off' ? 'added' : 'updated',
          target,
          authorsRemoved: authorsFound,
        };
      }

      // disable: remove every entry that runs the term hook
      await setTermsHookSettings({
        path: target.path,
        settings: asSettingsWithoutTermsHook({ settings }),
      });
      return { outcome: 'removed', target, authorsRemoved: authorsFound };
    },
  });
};
