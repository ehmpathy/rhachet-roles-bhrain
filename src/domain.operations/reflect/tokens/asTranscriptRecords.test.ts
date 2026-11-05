import { UnexpectedCodePathError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { asTranscriptRecords } from './asTranscriptRecords';

describe('asTranscriptRecords', () => {
  given('well-formed jsonl', () => {
    when('each line is an object', () => {
      then('each line becomes a record', () => {
        const { records, partialLinesSkipped } = asTranscriptRecords({
          text: '{"type":"user"}\n{"type":"assistant"}\n',
          path: 'demo.jsonl',
        });
        expect(records).toHaveLength(2);
        expect(partialLinesSkipped).toEqual(0);
      });
    });
  });

  given('a live transcript with a torn final line', () => {
    when('the last line is half-written', () => {
      then('it is skipped and counted, never a fault', () => {
        const { records, partialLinesSkipped } = asTranscriptRecords({
          text: '{"type":"user"}\n{"type":"assis',
          path: 'demo.jsonl',
        });
        expect(records).toHaveLength(1);
        expect(partialLinesSkipped).toEqual(1);
      });
    });
  });

  given('a torn line before the end', () => {
    when('the file is read', () => {
      then(
        'it fails loud with the line, the line count, and the bad line head',
        async () => {
          const error = await getError(async () =>
            asTranscriptRecords({
              text: '{"type":"user"}\n{"type":"ass\n{"type":"assistant"}\n',
              path: 'demo.jsonl',
            }),
          );
          expect(error).toBeInstanceOf(UnexpectedCodePathError);
          expect(error.message).toContain('malformed transcript line');
          expect(error.message).toContain('"line": "2 of 3"');
          expect(error.message).toContain('"head": "{\\"type\\":\\"ass"');
          expect(error.message).toContain('re-copy the file from its source');
        },
      );
    });
  });
});
