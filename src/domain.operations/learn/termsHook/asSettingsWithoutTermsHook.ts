import type {
  ClaudeHookBlockOfRepo,
  ClaudeSettingsOfRepo,
} from './ClaudeSettingsOfRepo';
import { isTermsHookCommand } from './isTermsHookCommand';

/**
 * .what = one block with its term hooks removed: the block whole, the block trimmed, or none
 * .why = a block that holds no term hook is carried through byte for byte, empty or not; only
 *        a block this removal empties is dropped, so it leaves no husk of its own make
 */
const asBlocksWithoutTermsHook = (input: {
  block: ClaudeHookBlockOfRepo;
}): ClaudeHookBlockOfRepo[] => {
  const hooks = input.block.hooks ?? [];
  const hooksKept = hooks.filter((hook) => !isTermsHookCommand({ hook }));
  if (hooksKept.length === hooks.length) return [input.block];
  if (hooksKept.length === 0) return [];
  return [{ ...input.block, hooks: hooksKept }];
};

/**
 * .what = a settings object with every inner hook that runs the term hook removed
 * .why = `disable` promises that no stop runs the term hook, whoever wrote the entry; and
 *        `enable` starts from this same clean slate before it adds the one declared entry
 *
 * .note = a block or an event is dropped only when this removal emptied it. every other key,
 *         block, event, and hook is carried through untouched, an empty one included
 * .note = no file reads as an empty one, as `asSettingsWithTermsHook` reads it
 */
export const asSettingsWithoutTermsHook = (input: {
  settings: ClaudeSettingsOfRepo | null;
}): ClaudeSettingsOfRepo => {
  // no file, or no hooks at all: naught to remove
  const settings = input.settings ?? {};
  if (!settings.hooks) return settings;

  // trim each block; drop an event only where the trim emptied it
  const hooks = Object.fromEntries(
    Object.entries(settings.hooks)
      .map(([event, blocks]) => ({
        event,
        blocks,
        blocksKept: blocks.flatMap((block) =>
          asBlocksWithoutTermsHook({ block }),
        ),
      }))
      .filter(
        ({ blocks, blocksKept }) =>
          blocksKept.length > 0 || blocks.length === 0,
      )
      .map(({ event, blocksKept }) => [event, blocksKept] as const),
  );
  return { ...settings, hooks };
};
