import { given, then, when } from 'test-fns';

import { asMarkdownTableRows } from './asMarkdownTableRows';

const MARKDOWN = [
  '# plot',
  '',
  '| note |',
  '|---|',
  '| a table with no course column |',
  '',
  '| K | Course | Builds On |',
  '|---|---|---|',
  '| 1 | idempotency | — |',
  '| 2 | retries |',
].join('\n');

describe('asMarkdownTableRows', () => {
  given('[case1] a text with two tables', () => {
    when('[t0] rows are read by column', () => {
      const rows = asMarkdownTableRows({
        markdown: MARKDOWN,
        columns: ['course', 'builds on'],
      });

      then('it reads the first table that holds every column', () => {
        expect(rows).toHaveLength(2);
      });

      then('it keys each row by its lowercased header', () => {
        expect(rows![0]).toEqual({
          k: '1',
          course: 'idempotency',
          'builds on': '—',
        });
      });

      then('a short row reads its absent cells as empty', () => {
        expect(rows![1]!['builds on']).toEqual('');
      });
    });

    when('[t1] a column no table holds is asked for', () => {
      then('it reads null', () => {
        expect(
          asMarkdownTableRows({ markdown: MARKDOWN, columns: ['verdict'] }),
        ).toBeNull();
      });
    });
  });
});
