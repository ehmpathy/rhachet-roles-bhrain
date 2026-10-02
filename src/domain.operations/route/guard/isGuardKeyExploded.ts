import { asBrainSubKey } from './asBrainSubKey';

/**
 * .what = whether the bare key at `at` OPENS a populated block — at least one sub-key
 *         sits beneath it before the next top-level line
 * .why = a bare `brain:` is legal syntax in exactly one case: it explodes into
 *        `choice:` / `effort:` beneath. with no sub-key beneath it, it is an empty
 *        prescription — a stone that asked for a brain, set none, and ran on the
 *        inherited one, which is precisely the silent drop `case=4` exists to destroy
 *
 * 🔴 .note = a BLANKET exemption for explodable keys was the first shape, and it traded
 *           one false positive for a false negative. an exemption of every bare `brain:`
 *           keeps the exploded form usable AND re-opens the `key-empty` hole the advisory
 *           was built to close — so the exemption is conditioned on what FOLLOWS the key
 *           rather than on the key itself
 *
 * .note = it stops at the first line that is neither blank, a comment, nor indented.
 *         a top-level line shuts the block, exactly as `parseStoneGuard`'s
 *         `finalizeBrain` does — so this predicate and the parser read one boundary
 *
 * .note = PURE, and it takes the whole line array rather than a slice. the caller is
 *         already mid-`flatMap` over that array, so a slice per line would allocate one
 *         copy of the guard per key it inspects
 */
export const isGuardKeyExploded = (input: {
  lines: string[];
  at: number;
}): boolean => {
  for (const line of input.lines.slice(input.at + 1)) {
    const trimmed = line.trim();

    // blank rows and comments sit INSIDE a block without a close of it
    if (!trimmed || trimmed.startsWith('#')) continue;

    // an unindented row is the next top-level key — the block is shut
    if (!/^\s/.test(line)) return false;

    // an indented row that names a known sub-key is what makes the bare key legal
    if (asBrainSubKey({ line })) return true;
  }
  return false;
};
