import { given, then, when } from 'test-fns';

import { asArtifactStreamsFromContent } from './asArtifactStreamsFromContent';
import { formatArtifactStreamBuckets } from './formatArtifactStreamBuckets';

describe('asArtifactStreamsFromContent', () => {
  given('[case1] a framed peer given, with a footer after the streams', () => {
    // written by the real formatter, so the fixture never encodes the grammar a third time
    const content = [
      ...formatArtifactStreamBuckets({
        stdout: '0 blockers\n2 nitpicks',
        stderr: 'clone enrolled',
        hasFooter: true,
      }),
      '└─ tallied',
      '   ├─ 0 blockers',
      '   └─ 2 nitpicks',
    ].join('\n');

    when('[t0] the streams are read', () => {
      const streams = asArtifactStreamsFromContent({ content });

      then('stdout is the reviewer stream, never the whole framed file', () => {
        expect(streams.stdout).toEqual('0 blockers\n2 nitpicks');
        expect(streams.stdout).not.toContain('tallied');
      });

      then('stderr is kept, never blanked', () => {
        expect(streams.stderr).toEqual('clone enrolled');
      });
    });
  });
});
