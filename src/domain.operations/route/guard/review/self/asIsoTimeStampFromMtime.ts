import { asIsoTimeStamp, type IsoTimeStamp } from 'iso-time';

/**
 * .what = casts a filesystem mtime to an IsoTimeStamp
 * .why = `IsoTimeStamp` is `yyyy-MM-ddTHH:mm:ssZ` — second precision. an `fs.stat` mtime
 *        carries sub-second precision, which `asIsoTimeStamp` refuses outright.
 *
 * .note = the cut is to the second BELOW, never the nearest: an mtime of `…:07.900Z` is
 *         reported as `…:07Z`, so the rendered stamp is never later than the real event.
 * .note = the cut is lossless for this purpose. a freshness comparison runs on the raw
 *         mtimes at full precision; only the operand a human reads is cut.
 */
export const asIsoTimeStampFromMtime = (value: Date): IsoTimeStamp =>
  asIsoTimeStamp(new Date(Math.floor(value.getTime() / 1000) * 1000));
