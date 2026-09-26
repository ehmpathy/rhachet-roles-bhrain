import * as fs from 'fs/promises';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { withEnoentAsNull } from '../withEnoentAsNull';

/**
 * .what = every passage entry from passage.jsonl, in raw append (file) order
 * .why = passage.jsonl is append-only; the raw sequence of entries is the one true
 *        substrate every passage read builds on. this is the single shared parser
 *        (fs.access → fs.readFile → split → JSON.parse → PassageReport) that
 *        getLatestPassageForStone, getAllLatestPassageByStone, and getAllPassageReports
 *        all consume — so a change to the encode format, corrupt-line rules, or the parse
 *        shape lands in ONE place, not three that drift apart (rule.prefer.wet-over-dry,
 *        3+ call sites; rule.forbid.maintenance-hazards).
 *
 * .note = this returns entries VERBATIM in write order — NO dedup, NO sticky re-bucket.
 *         callers apply their own reduction: last-per-stone (raw), latest-for-one-stone
 *         (raw), or the sticky approval/overrule re-bucket (getAllPassageReports).
 */
export const getAllPassageReportsRaw = async (input: {
  route: string;
}): Promise<PassageReport[]> => {
  const passagePath = path.join(input.route, '.route', 'passage.jsonl');

  // read the log; ALLOWLIST only ENOENT (no passage.jsonl yet → no passage) and rethrow every
  // other fault. a blanket catch here would collapse a real EACCES/EPERM into "route not live",
  // and the daemon would self-exit `route-not-live` with no trace — the exact failhide the torn-line
  // failloud below guards against (rule.forbid.failhide — allowlist the expected code, rethrow rest).
  const content = await withEnoentAsNull(() =>
    fs.readFile(passagePath, 'utf-8'),
  );
  if (content === null) return []; // no file → no passage yet

  // parse every entry in raw append order (last line = most recent write). a torn line (a
  // partial/interleaved append — plausible on an append-only log the daemon reads every ~20min)
  // must fail LOUD with the torn line + a fix hint (rule.require.failloud), never a cryptic
  // bare `SyntaxError: Unexpected token`. a torn line stays fatal (crash-loud is U3-safe: the
  // daemon dies rather than misread a route's status), but now names what to fix.
  // tag each line with its PHYSICAL file line number BEFORE the blank-line filter — else a torn
  // line's reported lineNumber would be its post-filter index, off by every blank line above it, and
  // misdirect whoever repairs the file (rule.require.failloud — the fix hint must name the real line).
  return content
    .split('\n')
    .map((line, index) => ({ line, lineNumber: index + 1 }))
    .filter((entry) => entry.line.length > 0)
    .map((entry) => {
      try {
        return new PassageReport(JSON.parse(entry.line));
      } catch (error) {
        throw new UnexpectedCodePathError(
          'passage.jsonl has a torn/unparseable line — cannot read route status',
          {
            passagePath,
            lineNumber: entry.lineNumber,
            line: entry.line,
            hint: 'the append-only passage.jsonl holds one JSON object per line; a partial/torn line must be repaired or removed',
            parseError: error instanceof Error ? error.message : String(error),
          },
        );
      }
    });
};
