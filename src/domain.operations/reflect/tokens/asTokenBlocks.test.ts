import { given, then, when } from 'test-fns';

import { asTokenBlocks, type ToolUseIndex } from './asTokenBlocks';

describe('asTokenBlocks', () => {
  given('[case1] a hook payload that holds its text twice', () => {
    // a `hook_success` record carries one payload under both `content` and `stdout`
    const payload = 'x'.repeat(400);
    const record = {
      type: 'attachment',
      attachment: {
        type: 'hook_success',
        hookEvent: 'SessionStart',
        content: payload,
        stdout: payload,
      },
    };

    when('[t0] its blocks are read', () => {
      const blocks = asTokenBlocks({
        record,
        toolUseIndex: new Map() as ToolUseIndex,
      });

      then('it is one hook.output block, labeled by its hook event', () => {
        expect(blocks.map((block) => [block.category, block.label])).toEqual([
          ['hook.output', 'SessionStart'],
        ]);
      });

      then('its bytes count the payload once, never twice', () => {
        expect(blocks[0]!.bytes).toEqual(400);
      });
    });
  });

  given('[case2] a hook payload with stdout alone', () => {
    const record = {
      type: 'attachment',
      attachment: { type: 'hook_success', stdout: 'y'.repeat(120) },
    };

    when('[t0] its blocks are read', () => {
      const blocks = asTokenBlocks({
        record,
        toolUseIndex: new Map() as ToolUseIndex,
      });

      then(
        'it falls back to stdout, and to the attachment type as its label',
        () => {
          expect(blocks.map((block) => [block.label, block.bytes])).toEqual([
            ['hook_success', 120],
          ]);
        },
      );
    });
  });
});
