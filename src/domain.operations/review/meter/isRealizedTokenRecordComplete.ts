import { getAllNamesOfUnmeasuredFields } from '@src/domain.operations/review/meter/getAllNamesOfUnmeasuredFields';

/**
 * .what = whether a realized record carries every token figure a `metered` run asserts
 * .why = the meter learns "the artifact lacks a token figure" from a name, never by
 *        a trace of four disjuncts. a type predicate, so the guard also narrows each
 *        figure to a number for the lines below it
 * .note = each figure is typed `unknown`, never `number | undefined`: the record is read
 *         off disk, so a figure may be `null` or a string, and only a finite number counts
 *         as measured (`getAllNamesOfUnmeasuredFields`)
 */
export const isRealizedTokenRecordComplete = (input: {
  tokens: {
    input: unknown;
    inputCacheCreation: unknown;
    inputCacheRead: unknown;
    output: unknown;
  };
}): input is {
  tokens: {
    input: number;
    inputCacheCreation: number;
    inputCacheRead: number;
    output: number;
  };
} => getAllNamesOfUnmeasuredFields({ fields: input.tokens }).length === 0;
