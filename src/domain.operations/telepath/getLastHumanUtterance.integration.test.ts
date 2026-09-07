import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getLastHumanUtterance } from './getLastHumanUtterance';

/**
 * .what = write a jsonl transcript into a temp dir and hand back its path
 * .why = the operation reads the filesystem, so a real file is the only honest subject
 *        (rule.forbid.integration.mocks). hermetic — a temp dir, never the repo tree
 */
const genTranscript = async (input: {
  slug: string;
  entries: Record<string, unknown>[];
}): Promise<string> => {
  const dir = await fs.mkdtemp(
    path.join(os.tmpdir(), `telepath-${input.slug}-`),
  );
  const file = path.join(dir, 'transcript.jsonl');
  await fs.writeFile(
    file,
    input.entries.map((e) => JSON.stringify(e)).join('\n'),
    'utf-8',
  );
  return file;
};

const humanTurn = (at: string, text: string) => ({
  type: 'user',
  timestamp: at,
  message: { content: text },
});

const SPOKE_AT = '2026-09-06T20:00:00.000Z';

describe('getLastHumanUtterance', () => {
  given(
    '[case1] a transcript whose newest entries are the assistant at work',
    () => {
      const file = useBeforeAll(async () => ({
        path: await genTranscript({
          slug: 'plain',
          entries: [
            humanTurn(SPOKE_AT, 'do the work'),
            { type: 'assistant', timestamp: '2026-09-06T20:00:05.000Z' },
            {
              type: 'user',
              timestamp: '2026-09-06T20:00:09.000Z',
              message: { content: [{ type: 'tool_result', content: 'ok' }] },
            },
            { type: 'assistant', timestamp: '2026-09-06T20:00:11.000Z' },
          ],
        }),
      }));

      when('[t0] the last human utterance is read', () => {
        then(
          'it skips the tool_result and returns the human turn',
          async () => {
            const spokeAt = await getLastHumanUtterance({
              transcriptPath: file.path,
            });
            expect(spokeAt?.toJSON()).toEqual(SPOKE_AT);
          },
        );
      });
    },
  );

  given(
    '[case2] a stop hook replayed its OWN output as a meta user turn',
    () => {
      // 🟡 this is the case that carries the weight, and every stophook in the tree emits
      // one. without the isMeta exclusion the nudge marks the reader warm every time it
      // fires, then never fires again — a self-silenced loop that looks exactly like a
      // throttle that works, which is the defect rule.forbid.failhide names
      const file = useBeforeAll(async () => ({
        path: await genTranscript({
          slug: 'meta',
          entries: [
            humanTurn(SPOKE_AT, 'do the work'),
            {
              type: 'user',
              isMeta: true,
              timestamp: '2026-09-06T20:30:00.000Z',
              message: { content: 'Stop hook feedback:\n🦉 before you rest…' },
            },
          ],
        }),
      }));

      when('[t0] the last human utterance is read', () => {
        then("the hook's own replay does NOT count as a human", async () => {
          const spokeAt = await getLastHumanUtterance({
            transcriptPath: file.path,
          });
          expect(spokeAt?.toJSON()).toEqual(SPOKE_AT);
        });
      });
    },
  );

  given(
    '[case3] a compaction summary and a subagent turn sit at the tail',
    () => {
      const file = useBeforeAll(async () => ({
        path: await genTranscript({
          slug: 'synthetic',
          entries: [
            humanTurn(SPOKE_AT, 'do the work'),
            {
              type: 'user',
              isCompactSummary: true,
              timestamp: '2026-09-06T20:10:00.000Z',
              message: { content: 'This session continues from a prior one…' },
            },
            {
              type: 'user',
              isSidechain: true,
              timestamp: '2026-09-06T20:20:00.000Z',
              message: { content: 'go explore the codebase' },
            },
          ],
        }),
      }));

      when('[t0] the last human utterance is read', () => {
        then('neither the summary nor the subagent counts', async () => {
          const spokeAt = await getLastHumanUtterance({
            transcriptPath: file.path,
          });
          expect(spokeAt?.toJSON()).toEqual(SPOKE_AT);
        });
      });
    },
  );

  given(
    '[case4] the human QUEUED a message that has not been delivered',
    () => {
      // a queued message is the strongest evidence of a present reader there is — they
      // are at the keyboard right now, and the turn has not ended to deliver it
      const file = useBeforeAll(async () => ({
        path: await genTranscript({
          slug: 'queued',
          entries: [
            humanTurn(SPOKE_AT, 'do the work'),
            {
              type: 'queue-operation',
              operation: 'enqueue',
              timestamp: '2026-09-06T20:40:00.000Z',
              content: 'and also do the other work',
            },
            {
              type: 'queue-operation',
              operation: 'popAll',
              timestamp: '2026-09-06T20:41:00.000Z',
              content: 'and also do the other work',
            },
            {
              type: 'queue-operation',
              operation: 'remove',
              timestamp: '2026-09-06T20:42:00.000Z',
            },
          ],
        }),
      }));

      when('[t0] the last human utterance is read', () => {
        then('the enqueue counts; the harness records do not', async () => {
          const spokeAt = await getLastHumanUtterance({
            transcriptPath: file.path,
          });
          expect(spokeAt?.toJSON()).toEqual('2026-09-06T20:40:00.000Z');
        });
      });
    },
  );

  given('[case5] the transcript tail holds a half-written line', () => {
    const file = useBeforeAll(async () => {
      const good = await genTranscript({
        slug: 'torn',
        entries: [humanTurn(SPOKE_AT, 'do the work')],
      });
      await fs.appendFile(good, '\n{"type":"user","timest', 'utf-8');
      return { path: good };
    });

    when('[t0] the last human utterance is read', () => {
      then('the torn line is skipped, never fatal', async () => {
        const spokeAt = await getLastHumanUtterance({
          transcriptPath: file.path,
        });
        expect(spokeAt?.toJSON()).toEqual(SPOKE_AT);
      });
    });
  });

  given('[case6] no human has ever spoken in the transcript', () => {
    const file = useBeforeAll(async () => ({
      path: await genTranscript({
        slug: 'silent',
        entries: [{ type: 'assistant', timestamp: SPOKE_AT }],
      }),
    }));

    when('[t0] the last human utterance is read', () => {
      then(
        'null — which reads as COLD downstream, so the nudge fires',
        async () => {
          expect(
            await getLastHumanUtterance({ transcriptPath: file.path }),
          ).toEqual(null);
        },
      );
    });
  });

  given('[case7] the transcript path does not exist', () => {
    when('[t0] the last human utterance is read', () => {
      then(
        'null, never a throw — an absent transcript is a normal state',
        async () => {
          const spokeAt = await getLastHumanUtterance({
            transcriptPath: path.join(os.tmpdir(), 'telepath-absent.jsonl'),
          });
          expect(spokeAt).toEqual(null);
        },
      );
    });
  });
});
