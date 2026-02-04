/**
 * .what = formats route stone operation output with good vibes
 * .why = provides consistent, readable cli output for the driver role
 */

const HEADER_GET = '🦉 and then?';
const HEADER_SET = `🦉 so you're saying there's a chance?`;

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
      stone: string;
      deleted: boolean;
    };

/**
 * .what = formats operation output as tree structure
 * .why = enables human-readable cli feedback
 */
export const formatRouteStoneEmit = (input: FormatInput): string => {
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

  if (input.operation === 'route.stone.del') {
    lines.push(`🗿 ${input.operation}`);
    lines.push(`   ├─ stone = ${input.stone}`);
    lines.push(`   └─ deleted = ${input.deleted}`);
  }

  return lines.join('\n');
};
