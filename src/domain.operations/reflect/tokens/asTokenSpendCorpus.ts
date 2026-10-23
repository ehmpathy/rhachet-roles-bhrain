import {
  type TokenSpendInventoryRow,
  type TokenSpendRepaidRow,
  TokenSpendReport,
  type TokenSpendSkip,
} from '@src/domain.objects/Reflector/TokenSpendReport';

import { asGroupsByKey } from './asGroupsByKey';
import { asSharePercentiles } from './asSharePercentiles';
import { asTokenPriceSum } from './asTokenPriceSum';

/**
 * .what = sums the reports of many transcripts into one corpus report
 * .why = a corpus answers "where do our sessions spend, in sum?"; each part adds across
 *        transcripts, and the files that could not be read are named, never dropped
 *
 * .note = a call ordinal names no one file in a corpus, so repaid rows carry no peak,
 *         and context per call is the median and peak across all transcripts' calls;
 *         each rebase keeps the transcript it occurred in, so its call still names a place
 */
export const asTokenSpendCorpus = (input: {
  reports: TokenSpendReport[];
  skipped: TokenSpendSkip[];
}): TokenSpendReport => {
  const { reports } = input;
  // one metered transcript keeps its own shape — repaid peaks, no spread — beside any skips
  const [reportOnly, ...reportsAfter] = reports;
  if (reportOnly && reportsAfter.length === 0)
    return input.skipped.length === 0
      ? reportOnly
      : new TokenSpendReport({ ...reportOnly, skipped: input.skipped });

  return new TokenSpendReport({
    transcripts: listOf({ reports, facet: (report) => report.transcripts }),
    skipped: input.skipped,
    notes: asNotesOfCorpus({ reports }),
    partialLinesSkipped: sumOf({
      reports,
      facet: (report) => report.partialLinesSkipped,
    }),
    calls: sumOf({ reports, facet: (report) => report.calls }),
    efficiency: {
      inputRaw: sumOf({
        reports,
        facet: (report) => report.efficiency.inputRaw,
      }),
      cacheRead: sumOf({
        reports,
        facet: (report) => report.efficiency.cacheRead,
      }),
      cacheWrite5m: sumOf({
        reports,
        facet: (report) => report.efficiency.cacheWrite5m,
      }),
      cacheWrite1h: sumOf({
        reports,
        facet: (report) => report.efficiency.cacheWrite1h,
      }),
      output: sumOf({ reports, facet: (report) => report.efficiency.output }),
      priced: asTokenPriceSum({
        parts: listOf({
          reports,
          facet: (report) => [report.efficiency.priced],
        }),
      }),
      models: asUnionOf({
        reports,
        facet: (report) => report.efficiency.models,
      }),
    },
    contextPerCall: asContextPerCallOfCorpus({ reports }),
    inventory: asInventoryOfCorpus({ reports }),
    repaid: asRepaidOfCorpus({ reports }),
    rebases: listOf({ reports, facet: (report) => report.rebases }),
    subagents: listOf({ reports, facet: (report) => report.subagents }),
    tokensPerByte: null,
  });
};

/**
 * .what = sums one numeric facet across reports
 * .why = every count in a corpus is the sum of its transcripts' counts
 */
const sumOf = (input: {
  reports: TokenSpendReport[];
  facet: (report: TokenSpendReport) => number;
}): number =>
  input.reports.reduce((sum, report) => sum + input.facet(report), 0);

/**
 * .what = one list facet across reports, concatenated in report order
 * .why = a corpus lists every transcript's entries, never only the first
 */
const listOf = <T>(input: {
  reports: TokenSpendReport[];
  facet: (report: TokenSpendReport) => T[];
}): T[] => input.reports.flatMap(input.facet);

/**
 * .what = the distinct values of one list facet across reports, in first-seen order
 * .why = a model or a note named by several transcripts reads once in the corpus
 */
const asUnionOf = (input: {
  reports: TokenSpendReport[];
  facet: (report: TokenSpendReport) => string[];
}): string[] => [...new Set(input.reports.flatMap(input.facet))];

/**
 * .what = each distinct note once, qualified by how many transcripts carry it
 * .why = a note true of one session reads false of the corpus when unqualified — e.g.
 *        "no boot.instructions block was seen" beside a corpus boot.instructions row
 */
const asNotesOfCorpus = (input: { reports: TokenSpendReport[] }): string[] =>
  asUnionOf({ reports: input.reports, facet: (report) => report.notes }).map(
    (note) => {
      const carriers = input.reports.filter((report) =>
        report.notes.includes(note),
      ).length;
      if (carriers === input.reports.length) return note;
      return `${note} (in ${carriers} of ${input.reports.length} transcripts)`;
    },
  );

/**
 * .what = the median of the transcripts' medians, and the peak of their peaks
 * .why = per-call contexts are not kept past each transcript's report
 */
const asContextPerCallOfCorpus = (input: {
  reports: TokenSpendReport[];
}): TokenSpendReport['contextPerCall'] => {
  const known = input.reports
    .map((report) => report.contextPerCall)
    .filter(
      (context): context is NonNullable<typeof context> => context !== null,
    );
  if (known.length === 0) return null;
  const medians = known.map((context) => context.median).sort((a, b) => a - b);
  return {
    median: medians[Math.floor(medians.length / 2)]!,
    peak: Math.max(...known.map((context) => context.peak)),
  };
};

/**
 * .what = the inventory rows summed per category and label across transcripts
 * .why = shares over N transcripts read off the sum of their last-call contexts; the
 *        spread says whether every session holds that share or a few hold it all
 */
const asInventoryOfCorpus = (input: {
  reports: TokenSpendReport[];
}): TokenSpendInventoryRow[] => {
  const rows = input.reports.flatMap((report) => report.inventory);
  const shareOf = asShareOfCategoryPerReport({ reports: input.reports });
  return asGroupsByKey({ items: rows, keyOf: (row) => row.category })
    .map((ofCategory) => {
      const labelEntries = ofCategory.flatMap((row) => row.labels);
      const labels = asGroupsByKey({
        items: labelEntries,
        keyOf: (entry) => entry.label,
      })
        .map((ofLabel) => ({
          label: ofLabel[0]!.label,
          tokens: ofLabel.reduce((sum, entry) => sum + entry.tokens, 0),
        }))
        .sort((a, b) => b.tokens - a.tokens);
      return {
        category: ofCategory[0]!.category,
        tokens: ofCategory.reduce((sum, row) => sum + row.tokens, 0),
        tiers: [...new Set(ofCategory.flatMap((row) => row.tiers))].sort(),
        labels,
        spread: asSharePercentiles({
          shares: shareOf({ category: ofCategory[0]!.category }),
        }),
      };
    })
    .sort((a, b) => b.tokens - a.tokens);
};

/**
 * .what = for one category, its share of each transcript's last-call context
 * .why = a transcript that never held the category holds a zero share of it, so the
 *        spread counts every session, not only those where the category appeared
 */
const asShareOfCategoryPerReport = (input: {
  reports: TokenSpendReport[];
}): ((args: { category: TokenSpendInventoryRow['category'] }) => number[]) => {
  const perReport = input.reports.map((report) => ({
    whole: report.inventory.reduce((sum, row) => sum + row.tokens, 0),
    inventory: report.inventory,
  }));
  return ({ category }) =>
    perReport.map(({ whole, inventory }) => {
      const tokens = inventory
        .filter((row) => row.category === category)
        .reduce((sum, row) => sum + row.tokens, 0);
      return whole === 0 ? 0 : tokens / whole;
    });
};

/**
 * .what = the repaid rows summed per category·label across transcripts
 * .why = a target that recurs across sessions is the one most worth a cut
 */
const asRepaidOfCorpus = (input: {
  reports: TokenSpendReport[];
}): TokenSpendRepaidRow[] => {
  const rows = input.reports.flatMap((report) => report.repaid);
  return asGroupsByKey({
    items: rows,
    keyOf: (row) => `${row.category}\u0000${row.label}`,
  }).map((ofKey) => {
    return {
      category: ofKey[0]!.category,
      label: ofKey[0]!.label,
      tokens: {
        cacheRead: ofKey.reduce((sum, row) => sum + row.tokens.cacheRead, 0),
        cacheWrite5m: ofKey.reduce(
          (sum, row) => sum + row.tokens.cacheWrite5m,
          0,
        ),
        cacheWrite1h: ofKey.reduce(
          (sum, row) => sum + row.tokens.cacheWrite1h,
          0,
        ),
        input: ofKey.reduce((sum, row) => sum + row.tokens.input, 0),
      },
      priced: asTokenPriceSum({ parts: ofKey.map((row) => row.priced) }),
      peak: null,
    };
  });
};
