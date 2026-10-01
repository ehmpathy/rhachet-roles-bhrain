import * as path from 'path';

import { asGuardValueRepair } from './asGuardValueRepair';
import type { GuardParseWarning } from './GuardParseWarning';

/**
 * .what = one leaf of an advisory; `paste` hangs a copy-paste line beneath it
 */
interface AdvisoryLeaf {
  says: string;
  paste?: string;
}

/**
 * .what = renders dropped-key advisories as ONE `🗿 guard` tree, one branch per advisory
 * .why = the producer yields structured flags and this owns the prose, so the copy sits in one
 *        place and tests assert on state (`rule.require.single-source-of-truth-for-render`)
 *
 * 🔴 .note = a TREE, never flat `at:` / `fix:` / `note:` prose under a header (`S13`). each
 *           fact is a leaf, and each line a driver would paste hangs beneath the leaf that
 *           names it
 * .note = the return is prepended to the drive's own `{ emit: { stdout } }`, never written to
 *         process stderr — a consumer that suppresses stderr on exit 0 would lose the case=4
 *         fail-safe
 * .note = '' for an empty list, never a root with no branches: the common case adds no line
 * .note = the guard is named by BASENAME — provenance beside a warn a reader acts on in place
 * .note = the final blank line shuts the tree, so the drive's `🦉 where were we?` does not read
 *         as part of it. it belongs here, not at each concatenation, so no caller can forget it
 */
export const formatGuardParseWarnings = (input: {
  warnings: GuardParseWarning[];
}): string => {
  if (input.warnings.length === 0) return '';

  // one branch per advisory, a spacer between siblings, the elbow on the last
  const branches = input.warnings.flatMap((warn, index) => {
    const isLast = index === input.warnings.length - 1;
    const advisory = renderOne({ warn });
    return [...asBranch({ ...advisory, isLast }), ...(isLast ? [] : ['   │'])];
  });
  return `${['🗿 guard', ...branches].join('\n')}\n\n`;
};

/**
 * .what = one advisory as tree lines — its head, then each leaf, then each paste beneath
 */
const asBranch = (input: {
  head: string;
  leaves: AdvisoryLeaf[];
  isLast: boolean;
}): string[] => {
  const indent = input.isLast ? '      ' : '   │  ';
  return [
    `   ${input.isLast ? '└─' : '├─'} ${input.head}`,
    ...input.leaves.flatMap((leaf, index) => {
      const isLeafLast = index === input.leaves.length - 1;
      return [
        `${indent}${isLeafLast ? '└─' : '├─'} ${leaf.says}`,
        ...(leaf.paste
          ? [`${indent}${isLeafLast ? '   ' : '│  '}└─ ${leaf.paste}`]
          : []),
      ];
    }),
  ];
};

/**
 * .what = one brain value, real enough to paste, shown where a driver has none to copy
 * .why = one const so the fallback arms cannot drift
 *
 * .note = sampled from this repo's own `5.1.execution.from_vision.guard`, whose l3 lanes pass
 *         it to `rhx enroll --model` — known to parse, never an invention
 */
const EXAMPLE_BRAIN = 'claude-sonnet-5[1m]';

/**
 * .what = the admitted punctuation, as a driver reads it
 * .why = the `key-unreadable` arm names the set twice; one const so the copies cannot drift
 *
 * .note = PROSE; `isGuardValueLiteral`'s `LITERAL_VALUE` regex is the contract, and a widen must
 *         touch both. `isGuardValueLiteral.test.ts [case1]` proves coverage of real values, not
 *         lockstep — this note is the reminder
 */
const LITERAL_SET_HUMAN = '. _ / : # [ ] -';

/**
 * .what = one refused character, rendered so a reader can SEE it
 * .why = a space, tab, or zero-width mark renders blank inside backticks, so whitespace and
 *        invisible characters are named by codepoint
 */
const asCharShown = (char: string): string =>
  /^[\x20-\x7e]$/.test(char) && char !== ' '
    ? `\`${char}\``
    : `U+${char.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}${char === ' ' ? ' (a space)' : ''}`;

/**
 * .what = the lines one advisory renders to
 * .why = each kind names a DIFFERENT fix
 *
 * .note = ONLY the near-miss arm closes with "safe to ignore". that hedge rests on the open key
 *         set (F4): the parser cannot claim an unknown key is wrong. the other arms name keys
 *         this build OWNS, where the hedge would be false — an ignored `brain:` applies no brain
 */
const renderOne = (input: {
  warn: GuardParseWarning;
}): { head: string; leaves: AdvisoryLeaf[] } => {
  const { warn } = input;
  const at = { says: `at: ${path.basename(warn.guard)}:${warn.line}` };

  // a KNOWN key with no value — name the fix outright
  // .note = the fix prints a CONCRETE value (`EXAMPLE_BRAIN`), never a `<slot>`: a slot names a
  //         vocabulary, not a fix (`rule.require.errors-name-the-fix`)
  // .note = the `note:` leaf states what a paste does — `EXAMPLE_BRAIN` is a live `/model`
  //         argument, so a driver who blanked the key to inherit would dispatch a switch they
  //         never chose
  if (warn.type === 'key-empty')
    return {
      head: `\`${warn.key}:\` is declared with NO value, so it was IGNORED`,
      leaves: [
        at,
        {
          says: `fix: give it the argument your brain-cli's \`/model\` takes`,
          paste: `${warn.key}: ${EXAMPLE_BRAIN}`,
        },
        {
          says: `note: that value is an EXAMPLE — pasted as-is, the next entry to this stone dispatches \`/model ${EXAMPLE_BRAIN}\``,
        },
        {
          says: `or: remove the \`${warn.key}:\` line, and inherit the brain deliberately`,
        },
      ],
    };

  // a KNOWN key whose value is not a literal — SHOW the value
  // .why = an unclosed quote is invisible at a glance (`brain: 'opus` reads as `brain: opus`);
  //        the fenced echo makes it legible
  // .note = the fix is DERIVED from the refused value via `asGuardValueRepair`, never canned:
  //         a canned example would discard the model the driver chose. `EXAMPLE_BRAIN` is the
  //         fallback only for a value with naught left to keep
  if (warn.type === 'key-unreadable') {
    const repair = asGuardValueRepair({ value: warn.value });
    const fixes: AdvisoryLeaf[] = repair.spaced
      ? // a space means two arguments where `/model` takes one; a strip would join them
        // into a slug the driver never wrote, so offer the first token instead
        [
          {
            says: `fix: \`/model\` takes ONE argument, so pick the one you meant`,
            paste: `${warn.key}: ${warn.value.trim().split(/\s+/)[0]}`,
          },
        ]
      : repair.repaired
        ? [
            {
              says: `fix: your value, with the refused character removed`,
              paste: `${warn.key}: ${repair.repaired}`,
            },
            {
              says: `note: check that is the slug you meant before you paste it`,
            },
          ]
        : [
            {
              says: `fix: a plain literal — no part of your value survives the set`,
              paste: `${warn.key}: ${EXAMPLE_BRAIN}`,
            },
          ];
    return {
      head: `\`${warn.key}:\` has a value i cannot read as a literal, so it was IGNORED`,
      leaves: [
        at,
        { says: `read: \`${warn.value}\`` },
        {
          says: `refused: ${repair.refused.map(asCharShown).join(' ')} — the set is letters, digits, and \`${LITERAL_SET_HUMAN}\``,
        },
        ...fixes,
        {
          says: `why: an unclosed quote, a substitution, or a space lands here — NO switch was dispatched, so the stone kept its inherited brain`,
        },
      ],
    };
  }

  // a KNOWN alias — "i recognize it", and the rename is required
  // .why = an alias is a courtesy warn, never a carry (F2/F4), so a `model:` left in place
  //        applies no brain
  if (warn.type === 'key-alias')
    return {
      head: `\`${warn.key}:\` reads as an alias of \`${warn.canonical}:\`, but its value was IGNORED`,
      leaves: [
        at,
        {
          says: `fix: rename it to \`${warn.canonical}:\` for the switch to take effect`,
          paste: `${warn.canonical}: ${warn.value || EXAMPLE_BRAIN}`,
        },
        {
          says: `note: \`${warn.key}:\` is recognized, but ONLY \`${warn.canonical}:\` is applied — its value did not take`,
        },
      ],
    };

  return {
    head: `\`${warn.key}:\` is not a key i know, and it was IGNORED`,
    leaves: [
      at,
      { says: `did you mean: \`${warn.nearest}:\`?` },
      {
        says: `fix: rename \`${warn.key}:\` to \`${warn.nearest}:\` if that was the intent`,
      },
      {
        says: `or: if \`${warn.key}:\` is deliberate, this warn is safe to ignore`,
      },
    ],
  };
};
