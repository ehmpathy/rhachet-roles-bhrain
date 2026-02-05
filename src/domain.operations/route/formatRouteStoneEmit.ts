/**
 * .what = formats route stone operation output with good vibes
 * .why = provides consistent, readable cli output for the driver role
 */

const HEADER_GET = '🦉 and then?';
const HEADER_SET = `🦉 so you're saying there's a chance?`;
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
      action: 'passed';
      passage: 'allowed' | 'blocked';
      note?: string;
      reason?: string;
    }
  | {
      operation: 'route.stone.del';
      mode: 'plan' | 'apply';
      pattern: string;
      patternRaw: string;
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
    lines.push(`🗿 ${input.operation}`);
    lines.push(`   ├─ stone = ${input.stone}`);

    if (input.action === 'approved') {
      lines.push(`   └─ approval = granted`);
    } else {
      // format passage with optional note inline
      const passageValue = input.note
        ? `${input.passage} (${input.note})`
        : input.passage;

      if (input.passage === 'blocked' && input.reason) {
        lines.push(`   ├─ passage = ${passageValue}`);
        lines.push(`   └─ reason = ${input.reason}`);
      } else {
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
  pattern: string;
  patternRaw: string;
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

  // pattern line: only show (from "...") when glob differs from raw
  const patternSuffix =
    input.pattern !== input.patternRaw ? ` (from "${input.patternRaw}")` : '';
  lines.push(`   ├─ pattern = ${input.pattern}${patternSuffix}`);

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
