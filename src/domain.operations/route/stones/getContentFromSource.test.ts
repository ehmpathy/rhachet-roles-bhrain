import * as path from 'path';
import { getError, given, then, when } from 'test-fns';

import { getContentFromSource } from './getContentFromSource';

const ASSETS_DIR = path.join(__dirname, '../.test/assets');
const ROUTE_SIMPLE = path.join(ASSETS_DIR, 'route.simple');

describe('getContentFromSource', () => {
  given('[case1] @stdin source with content', () => {
    when('[t0] stdin has content', () => {
      then('returns stdin content', async () => {
        const result = await getContentFromSource({
          source: '@stdin',
          stdin: 'this is the stone content',
          route: ROUTE_SIMPLE,
        });
        expect(result.content).toEqual('this is the stone content');
      });
    });

    when('[t1] stdin has multiline content', () => {
      then('returns full content', async () => {
        const content = `# research stone

## questions
- what is X?
- why does X matter?

## findings
(to be filled)`;
        const result = await getContentFromSource({
          source: '@stdin',
          stdin: content,
          route: ROUTE_SIMPLE,
        });
        expect(result.content).toEqual(content);
      });
    });
  });

  given('[case2] @stdin source without content', () => {
    when('[t0] stdin is null', () => {
      then('throws BadRequestError', async () => {
        const error = await getError(
          getContentFromSource({
            source: '@stdin',
            stdin: null,
            route: ROUTE_SIMPLE,
          }),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('no content provided via stdin');
      });
    });

    when('[t1] stdin is empty string', () => {
      then('throws BadRequestError', async () => {
        const error = await getError(
          getContentFromSource({
            source: '@stdin',
            stdin: '',
            route: ROUTE_SIMPLE,
          }),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('no content provided via stdin');
      });
    });

    when('[t2] stdin is whitespace only', () => {
      then('throws BadRequestError', async () => {
        const error = await getError(
          getContentFromSource({
            source: '@stdin',
            stdin: '   \n  ',
            route: ROUTE_SIMPLE,
          }),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('no content provided via stdin');
      });
    });
  });

  given('[case3] template() source with extant file', () => {
    when('[t0] template path uses $behavior variable', () => {
      then('expands variable and reads file', async () => {
        const result = await getContentFromSource({
          source: 'template($behavior/refs/template.research.adhoc.stone)',
          stdin: null,
          route: ROUTE_SIMPLE,
        });
        expect(result.content).toContain('research: adhoc');
        expect(result.content).toContain('investigate the topic');
      });
    });

    when('[t1] template path is absolute', () => {
      then('reads file at path', async () => {
        const templatePath = path.join(
          ROUTE_SIMPLE,
          'refs/template.research.adhoc.stone',
        );
        const result = await getContentFromSource({
          source: `template(${templatePath})`,
          stdin: null,
          route: ROUTE_SIMPLE,
        });
        expect(result.content).toContain('research: adhoc');
      });
    });
  });

  given('[case4] template() source with absent file', () => {
    when('[t0] template file does not exist', () => {
      then('throws BadRequestError', async () => {
        const error = await getError(
          getContentFromSource({
            source: 'template($behavior/refs/nonexistent.stone)',
            stdin: null,
            route: ROUTE_SIMPLE,
          }),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('template file not found');
      });
    });
  });

  given('[case5] literal source', () => {
    when('[t0] source is plain text', () => {
      then('returns text as content', async () => {
        const result = await getContentFromSource({
          source: 'research this topic thoroughly',
          stdin: null,
          route: ROUTE_SIMPLE,
        });
        expect(result.content).toEqual('research this topic thoroughly');
      });
    });

    when('[t1] source is multiline text', () => {
      then('returns full text as content', async () => {
        const literal = `# custom stone

do these things:
1. first
2. second`;
        const result = await getContentFromSource({
          source: literal,
          stdin: null,
          route: ROUTE_SIMPLE,
        });
        expect(result.content).toEqual(literal);
      });
    });

    when('[t2] source looks like template but has wrong syntax', () => {
      then('treats as literal', async () => {
        const result = await getContentFromSource({
          source: 'template foo.stone', // lacks parens
          stdin: null,
          route: ROUTE_SIMPLE,
        });
        expect(result.content).toEqual('template foo.stone');
      });
    });
  });
});
