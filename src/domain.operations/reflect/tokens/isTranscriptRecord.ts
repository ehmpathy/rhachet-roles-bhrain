/**
 * .what = one parsed line of a claude transcript
 * .why = the reader treats records as loose json; each consumer narrows the fields it needs
 */
export type TranscriptRecord = Record<string, unknown>;

/**
 * .what = is this parsed json value a record (a plain object)?
 * .why = a jsonl line may hold a bare value; only an object is a transcript record
 */
export const isTranscriptRecord = (value: unknown): value is TranscriptRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
