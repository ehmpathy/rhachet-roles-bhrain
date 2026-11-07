import { BASH_CLAUDE_PATH_PATTERN } from './BASH_CLAUDE_PATH_PATTERN';

/**
 * .what = the first `.claude/` path a bash command assigns to a var, if any
 * .why = `D=~/.claude/projects/p; echo x > $D/memory/a.md` builds a memory path the
 *        text never spells; a var set under `.claude/` may reach memory, so a `$var`
 *        target or an unknown cwd beside it blocks
 * .note = an assignment only: a `.claude/` path read as an arg (`jq . ~/.claude/x >
 *         $OUT`) arms naught, so a read beside it stays a read
 * .note = `D=~/…` lifts as one word; `D="$HOME/…"` lifts as `$HOME/…`, with the
 *         `D="` just before it, so the text before each match is read too
 */
export const getOneClaudePathAssigned = (input: {
  command: string;
}): string | null =>
  [...input.command.matchAll(BASH_CLAUDE_PATH_PATTERN)]
    .filter(
      (match) =>
        /^\w+=/.test(match[0]) ||
        /\w+=["']$/.test(
          input.command.slice(Math.max(0, match.index - 64), match.index),
        ),
    )
    .map((match) => match[0].replace(/^\w+=/, ''))[0] ?? null;
