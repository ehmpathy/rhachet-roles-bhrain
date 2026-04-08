import { given, then, when } from 'test-fns';

import { asArtifactByPriority } from './asArtifactByPriority';

describe('asArtifactByPriority', () => {
  given('[case1] .yield.md and .v1.i1.md both present', () => {
    const artifacts = ['1.vision.yield.md', '1.vision.v1.i1.md'];

    when('[t0] priority is resolved', () => {
      then('.yield.md is preferred over .v1.i1.md', () => {
        const result = asArtifactByPriority({
          artifacts,
          stoneName: '1.vision',
        });
        expect(result).toEqual('1.vision.yield.md');
      });
    });
  });

  given('[case2] .yield.json present', () => {
    const artifacts = ['1.vision.yield.json'];

    when('[t0] priority is resolved', () => {
      then('.yield.json is recognized', () => {
        const result = asArtifactByPriority({
          artifacts,
          stoneName: '1.vision',
        });
        expect(result).toEqual('1.vision.yield.json');
      });
    });
  });

  given('[case3] .yield extensionless present', () => {
    const artifacts = ['1.vision.yield'];

    when('[t0] priority is resolved', () => {
      then('.yield extensionless is recognized', () => {
        const result = asArtifactByPriority({
          artifacts,
          stoneName: '1.vision',
        });
        expect(result).toEqual('1.vision.yield');
      });
    });
  });

  given('[case4] only .v1.i1.md present (backwards compat)', () => {
    const artifacts = ['1.vision.v1.i1.md'];

    when('[t0] priority is resolved', () => {
      then('.v1.i1.md is recognized', () => {
        const result = asArtifactByPriority({
          artifacts,
          stoneName: '1.vision',
        });
        expect(result).toEqual('1.vision.v1.i1.md');
      });
    });
  });

  given('[case5] only .i1.md present (test compat)', () => {
    const artifacts = ['1.vision.i1.md'];

    when('[t0] priority is resolved', () => {
      then('.i1.md is recognized', () => {
        const result = asArtifactByPriority({
          artifacts,
          stoneName: '1.vision',
        });
        expect(result).toEqual('1.vision.i1.md');
      });
    });
  });

  given('[case6] no matched artifacts', () => {
    const artifacts: string[] = [];

    when('[t0] priority is resolved', () => {
      then('null is returned', () => {
        const result = asArtifactByPriority({
          artifacts,
          stoneName: '1.vision',
        });
        expect(result).toBeNull();
      });
    });
  });

  given('[case7] .yield.md preferred over .yield.json', () => {
    const artifacts = ['1.vision.yield.json', '1.vision.yield.md'];

    when('[t0] priority is resolved', () => {
      then('.yield.md takes precedence', () => {
        const result = asArtifactByPriority({
          artifacts,
          stoneName: '1.vision',
        });
        expect(result).toEqual('1.vision.yield.md');
      });
    });
  });

  given('[case8] .yield.* preferred over .yield extensionless', () => {
    const artifacts = ['1.vision.yield', '1.vision.yield.json'];

    when('[t0] priority is resolved', () => {
      then('.yield.json takes precedence over .yield', () => {
        const result = asArtifactByPriority({
          artifacts,
          stoneName: '1.vision',
        });
        expect(result).toEqual('1.vision.yield.json');
      });
    });
  });

  given('[case9] fallback to any .md if no pattern matched', () => {
    const artifacts = ['1.vision.notes.md', '1.vision.other.txt'];

    when('[t0] priority is resolved', () => {
      then('first .md file is returned as fallback', () => {
        const result = asArtifactByPriority({
          artifacts,
          stoneName: '1.vision',
        });
        expect(result).toEqual('1.vision.notes.md');
      });
    });
  });
});
