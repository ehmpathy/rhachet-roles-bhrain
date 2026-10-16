import { asRouteDisplayPath } from './asRouteDisplayPath';

/**
 * .what = the header block every `route.drive` surface opens with — the owl, the
 *         `🗿 route.drive` tree root, and its `where do we go?` route + stone branch
 * .why = seven renderers open with this block byte for byte: the stone guidance, the
 *        malfunction, blocked, exhausted, approval, budget, and mixed halts. hand-built in
 *        each, a reword of one line had seven homes and would drift
 *        (rule.forbid.duplicate-format-tree-operations). one builder, one home.
 *
 * .note = `aside` is the block that sits between the owl and the tree — the stone
 *         guidance's tea pause is the one surface that has one; every halt passes `[]`
 */
export const formatRouteDriveHeaderLines = (input: {
  route: string;
  stone: string;
  aside: string[];
}): string[] => [
  `🦉 where were we?`,
  '',
  ...input.aside,
  `🗿 route.drive`,
  `   ├─ where do we go?`,
  `   │  ├─ route = ${asRouteDisplayPath({ route: input.route })}`,
  `   │  └─ stone = ${input.stone}`,
  `   │`,
];
