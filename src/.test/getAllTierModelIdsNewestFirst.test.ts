import { given, then, when } from 'test-fns';

import { getAllTierModelIdsNewestFirst } from './getAllTierModelIdsNewestFirst';

const LINE = /^deepseek\/deepseek-v\d+(?:\.\d+)*-flash(?:-\d{4})?$/;

describe('getAllTierModelIdsNewestFirst', () => {
  given('[case1] a catalog with several models on the line', () => {
    const catalog = [
      { id: 'deepseek/deepseek-v4-flash', created: 100, expiration_date: null },
      { id: 'deepseek/deepseek-v4.1-flash-1017', created: 300, expiration_date: null },
      { id: 'deepseek/deepseek-v4.1-flash', created: 200, expiration_date: null },
      { id: 'deepseek/deepseek-v4.1-pro', created: 400, expiration_date: null },
      { id: 'acme/other-flash', created: 500, expiration_date: null },
    ];

    when('[t0] the ids are listed', () => {
      then('only the line is kept, newest first', () => {
        expect(
          getAllTierModelIdsNewestFirst({ catalog, line: LINE }),
        ).toEqual([
          'deepseek/deepseek-v4.1-flash-1017',
          'deepseek/deepseek-v4.1-flash',
          'deepseek/deepseek-v4-flash',
        ]);
      });
    });
  });

  given('[case2] a model on the line is dated for withdrawal', () => {
    const catalog = [
      {
        id: 'deepseek/deepseek-v5-flash',
        created: 900,
        expiration_date: '2026-12-01',
      },
      { id: 'deepseek/deepseek-v4-flash', created: 100, expiration_date: null },
    ];

    when('[t0] the ids are listed', () => {
      then('the withdrawn model is left out', () => {
        expect(
          getAllTierModelIdsNewestFirst({ catalog, line: LINE }),
        ).toEqual(['deepseek/deepseek-v4-flash']);
      });
    });
  });

  given('[case3] a catalog with no model on the line', () => {
    when('[t0] the ids are listed', () => {
      then('the list is empty', () => {
        expect(
          getAllTierModelIdsNewestFirst({
            catalog: [
              { id: 'acme/other', created: 1, expiration_date: null },
            ],
            line: LINE,
          }),
        ).toEqual([]);
      });
    });
  });
});
