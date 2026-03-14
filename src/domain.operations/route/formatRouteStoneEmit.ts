import type { RouteStoneGuardReviewSelf } from '@src/domain.objects/Driver/RouteStoneGuard';

import { formatGuardTree } from './guard/formatGuardTree';
import { formatLetsReflect } from './guard/formatLetsReflect';
import { formatPatienceFriend } from './guard/formatPatienceFriend';
import { formatWhatsTheRush } from './guard/formatWhatsTheRush';

/**
 * .what = formats route stone operation output with good vibes
 * .why = provides consistent, readable cli output for the driver role
 */

const HEADER_GET = '🦉 and then?';
const HEADER_SET = `🦉 the way speaks for itself`;
const HEADER_DEL = `🦉 hoo needs 'em`;

type FormatInput =
  | {
      operation: 'route.stone.get';
      query: string;
      stones: { name: string; path: string }[];
      complete?: boolean;
    }
  | {
      operation: 'route.stone.set';
      stone: string;
      action: 'approved';
    }
  | {
      operation: 'route.stone.set';
      stone: string;
      action: 'rewound';
      cascade: Array<{
        stone: string;
        deleted: string;
        passage: string;
      }>;
    }
  | {
      operation: 'route.stone.set';
      stone: string;
      action: 'blocked';
      reason: string;
      guidance: string;
    }
  | {
      operation: 'route.stone.set';
      stone: string;
      action: 'promised';
      slug: string;
      route: string;
      progress: { index: number; total: number };
      nextReview?: {
        reviewSelf: RouteStoneGuardReviewSelf;
        index: number;
        total: number;
      };
    }
  | {
      operation: 'route.stone.set';
      stone: string;
      action: 'challenge:first' | 'challenge:rushed';
      slug: string;
      route: string;
      selfReview?: {
        reviewSelf: RouteStoneGuardReviewSelf;
        index: number;
        total: number;
      };
    }
  | {
      operation: 'route.stone.set';
      stone: string;
      action: 'passed';
      passage: 'allowed' | 'blocked' | 'malfunction';
      note?: string;
      reason?: string;
      slug?: string;
      route?: string;
      selfReview?: {
        reviewSelf: RouteStoneGuardReviewSelf;
        index: number;
        total: number;
      };
      guard?: {
        artifactFiles: string[];
        reviews: Array<{
          index: number;
          cmd: string;
          cached: boolean;
          durationSec: number | null;
          blockers: number;
          nitpicks: number;
          path: string;
        }>;
        judges: Array<{
          index: number;
          cmd: string;
          cached: boolean;
          durationSec: number | null;
          passed: boolean;
          reason: string | null;
          path: string;
        }>;
      };
    }
  | {
      operation: 'route.stone.del';
      mode: 'plan' | 'apply';
      patterns: { glob: string; raw: string }[];
      route: string;
      stones: {
        name: string;
        status: 'delete' | 'retain' | 'deleted' | 'retained';
        reason: string | null;
      }[];
      countDelete: number;
      countRetain: number;
    };

/**
 * .what = formats operation output as tree structure
 * .why = enables human-readable cli feedback
 */
export const formatRouteStoneEmit = (input: FormatInput): string => {
  if (input.operation === 'route.stone.del') return formatDel(input);

  const header =
    input.operation === 'route.stone.get' ? HEADER_GET : HEADER_SET;
  const lines: string[] = [header, ''];

  if (input.operation === 'route.stone.get') {
    lines.push(`🗿 ${input.operation}`);
    lines.push(`   ├─ query = ${input.query}`);

    if (input.complete) {
      lines.push(`   └─ status = all stones passed`);
    } else if (input.stones.length === 1) {
      const stone = input.stones[0]!;
      lines.push(`   └─ stone = ${stone.name} (${stone.path})`);
    } else {
      input.stones.forEach((stone, i) => {
        const isLast = i === input.stones.length - 1;
        lines.push(
          `   ${isLast ? '└─' : '├─'} stone = ${stone.name} (${stone.path})`,
        );
      });
    }
  }

  if (input.operation === 'route.stone.set') {
    // delegate to formatGuardTree for full guard tree output
    if (input.action === 'passed' && input.guard) {
      const tree = formatGuardTree({
        stone: input.stone,
        passage: input.passage,
        note: input.note ?? null,
        reason: input.reason ?? null,
        guard: input.guard,
      });
      return [header, '', tree].join('\n');
    }

    // handle review.self blocked case
    if (input.action === 'passed' && input.selfReview) {
      lines.push(`🗿 ${input.operation}`);
      lines.push(`   ├─ stone = ${input.stone}`);
      lines.push(
        `   └─ passage = blocked (${input.note ?? 'review.self required'})`,
      );
      lines.push('');
      lines.push(
        formatLetsReflect({
          stone: input.stone,
          slug: input.slug ?? input.selfReview.reviewSelf.slug,
          route: input.route ?? '',
          reviewSelf: input.selfReview.reviewSelf,
          index: input.selfReview.index,
          total: input.selfReview.total,
        }),
      );
      return lines.join('\n');
    }

    // handle challenge cases (time enforcement and rush detection)
    if (
      input.action === 'challenge:first' ||
      input.action === 'challenge:rushed'
    ) {
      // prepend rush confrontation if rushed
      if (input.action === 'challenge:rushed') {
        lines.push(formatWhatsTheRush());
        lines.push('');
      }

      // show patience message
      lines.push(
        formatPatienceFriend({
          stone: input.stone,
          slug: input.slug,
          route: input.route,
        }),
      );
      lines.push('');

      // then show lets reflect reminder with the guide
      if (input.selfReview) {
        lines.push(
          formatLetsReflect({
            stone: input.stone,
            slug: input.slug,
            route: input.route,
            reviewSelf: input.selfReview.reviewSelf,
            index: input.selfReview.index,
            total: input.selfReview.total,
          }),
        );
      }
      return lines.join('\n');
    }

    // handle blocked case (agent tried to approve)
    if (input.action === 'blocked') {
      lines.push(`🗿 ${input.operation}`);
      lines.push(`   ├─ stone = ${input.stone}`);
      lines.push(`   ├─ ✗ ${input.reason}`);
      lines.push(`   └─ ${input.guidance}`);
      return lines.join('\n');
    }

    lines.push(`🗿 ${input.operation}`);

    if (input.action === 'approved') {
      lines.push(`   ├─ stone = ${input.stone}`);
      lines.push(`   └─ ✓ approved`);
    } else if (input.action === 'rewound') {
      // format cascade with deletion counts
      lines.push(`   ├─ stone = ${input.stone}`);
      lines.push(`   ├─ cascade`);
      input.cascade.forEach((c, i) => {
        const isLast = i === input.cascade.length - 1;
        const connector = isLast ? '└─' : '├─';
        lines.push(`   │  ${connector} ${c.stone}`);
        lines.push(`   │  ${isLast ? ' ' : '│'}  ├─ deleted: ${c.deleted}`);
        lines.push(`   │  ${isLast ? ' ' : '│'}  └─ passage: ${c.passage}`);
      });
      lines.push(`   └─ done`);
      return lines.join('\n');
    } else if (input.action === 'promised') {
      lines.push(`   ├─ stone = ${input.stone}`);
      // show progress per vision: "passage = progressed (review.self N/M promised)"
      lines.push(
        `   └─ passage = progressed (review.self ${input.progress.index}/${input.progress.total} promised)`,
      );

      // if there's a next review, show lets reflect section
      if (input.nextReview) {
        lines.push('');
        lines.push(
          formatLetsReflect({
            stone: input.stone,
            slug: input.nextReview.reviewSelf.slug,
            route: input.route,
            reviewSelf: input.nextReview.reviewSelf,
            index: input.nextReview.index,
            total: input.nextReview.total,
          }),
        );
      }

      return lines.join('\n');
    } else if (input.action === 'passed') {
      // format passage with optional note inline (passed without guard or selfReview)
      const passageValue = input.note
        ? `${input.passage} (${input.note})`
        : input.passage;

      if (
        (input.passage === 'blocked' || input.passage === 'malfunction') &&
        input.reason
      ) {
        lines.push(`   ├─ stone = ${input.stone}`);
        lines.push(`   ├─ passage = ${passageValue}`);
        lines.push(`   └─ reason = ${input.reason}`);
      } else {
        lines.push(`   ├─ stone = ${input.stone}`);
        lines.push(`   └─ passage = ${passageValue}`);
      }
    }
  }

  return lines.join('\n');
};

/**
 * .what = formats del variant as treestruct with header
 * .why = enables scannable plan/apply output for stone deletion
 */
const formatDel = (input: {
  mode: 'plan' | 'apply';
  patterns: { glob: string; raw: string }[];
  route: string;
  stones: {
    name: string;
    status: 'delete' | 'retain' | 'deleted' | 'retained';
    reason: string | null;
  }[];
  countDelete: number;
  countRetain: number;
}): string => {
  const lines: string[] = [HEADER_DEL, ''];

  // operation line
  lines.push(`🗿 route.stone.del --mode ${input.mode}`);

  // pattern(s) section: single line for 1 pattern, branch for multiple
  if (input.patterns.length === 1) {
    const p = input.patterns[0]!;
    const patternSuffix = p.glob !== p.raw ? ` (from "${p.raw}")` : '';
    lines.push(`   ├─ pattern = ${p.glob}${patternSuffix}`);
  } else {
    lines.push(`   ├─ patterns`);
    input.patterns.forEach((p, i) => {
      const isLast = i === input.patterns.length - 1;
      const connector = isLast ? '└─' : '├─';
      const patternSuffix = p.glob !== p.raw ? ` (from "${p.raw}")` : '';
      lines.push(`   │  ${connector} ${p.glob}${patternSuffix}`);
    });
  }

  // route line
  lines.push(`   ├─ route   = ${input.route}`);

  // stones branch
  lines.push(`   ├─ stones`);
  input.stones.forEach((stone, i) => {
    const isLast = i === input.stones.length - 1;
    const icon =
      stone.status === 'delete' || stone.status === 'deleted' ? '✓' : '⊘';
    const reasonSuffix = stone.reason ? `, ${stone.reason}` : '';
    const connector = isLast ? '└─' : '├─';
    lines.push(
      `   │  ${connector} ${icon} ${stone.name} (${stone.status}${reasonSuffix})`,
    );
  });

  // summary counts
  const deleteLabel = input.mode === 'plan' ? 'delete' : 'deleted';
  const retainLabel = input.mode === 'plan' ? 'retain' : 'retained';

  if (input.countRetain > 0) {
    lines.push(`   ├─ ${deleteLabel} = ${input.countDelete}`);
    lines.push(`   └─ ${retainLabel} = ${input.countRetain} (artifact found)`);
  } else {
    lines.push(`   └─ ${deleteLabel} = ${input.countDelete}`);
  }

  // plan mode hint
  if (input.mode === 'plan') {
    lines.push('');
    lines.push('rerun with --mode apply to execute');
  }

  return lines.join('\n');
};
