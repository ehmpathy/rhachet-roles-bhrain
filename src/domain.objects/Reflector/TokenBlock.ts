import { DomainLiteral } from 'domain-objects';

/**
 * .what = the categories a token in a transcript's context can be spent on
 * .why = the inventory reports one row per category; every token lands in exactly one
 */
export type TokenCategory =
  | 'boot.instructions'
  | 'hook.output'
  | 'system.reminder'
  | 'tool.result'
  | 'human.words'
  | 'assistant.own'
  | 'unattributed';

/**
 * .what = one model-visible piece of text that a transcript record adds to the context
 * .why = a delta between two calls is split across the blocks that arrived in it, by byte
 *        share, so each block needs its category, a label, and the size of what the model saw
 */
export interface TokenBlock {
  /**
   * the inventory category this block counts toward
   */
  category: TokenCategory;

  /**
   * the row label within the category
   *
   * e.g., `Bash · git.repo.test`, `Read`, `SessionStart`, `boot.md`
   */
  label: string;

  /**
   * the byte size of the text the model sees — never the jsonl record's size
   */
  bytes: number;
}

export class TokenBlock
  extends DomainLiteral<TokenBlock>
  implements TokenBlock {}
