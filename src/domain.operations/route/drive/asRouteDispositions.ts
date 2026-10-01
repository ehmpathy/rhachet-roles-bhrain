import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import type { RouteStoneDisposition } from '@src/domain.objects/Driver/RouteStoneDisposition';

import { asRouteStoneDisposition } from './asRouteStoneDisposition';

/**
 * .what = pairs each stone's latest passage report with its derived disposition
 * .why = the onStop hard-stop gate reads these pairs twice (a `.find` for a malfunction,
 *        a `.find` for a wall), so the projection is named rather than inlined at the
 *        orchestrator grain — the gate then reads as a single named call instead of a
 *        `.map` a reader must simulate on each pass (`rule.require.named-transformers`)
 *
 * .note = the pair keeps the report beside its disposition because the gate needs BOTH:
 *         the disposition to classify (halt vs push, and why), and the report to read the
 *         stone name, status, and reason off the halt it found
 */
export const asRouteDispositions = (input: {
  reports: PassageReport[];
}): Array<{ report: PassageReport; disposition: RouteStoneDisposition }> =>
  input.reports.map((report) => ({
    report,
    disposition: asRouteStoneDisposition({
      status: report.status,
      blocker: report.blocker ?? null,
      reason: report.reason ?? null,
    }),
  }));
