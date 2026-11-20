import { asFulcrumContentSeen } from './asFulcrumContentSeen';

// .note = js-yaml ships no types; required as the rest of src does (asReviewRubricsConfig.ts)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const yaml = require('js-yaml');

const FULCRUM_REWORKS = ['clean', 'dirty'] as const;
const FULCRUM_GROUNDS = ['wrong', 'dirty'] as const;
const FULCRUM_STATUSES = ['open', 'held', 'ruled', 'superseded'] as const;
const FULCRUM_OWEDS = ['human', 'reflect', 'none'] as const;
const FULCRUM_VERDICTS = ['upheld', 'conceded'] as const;

/**
 * .what = renders a closed set as the hint a malformed field names, e.g. `clean | dirty`
 * .why = the hint is read from the same constant the parse checks against, so the two never drift
 */
const asFulcrumEnumHint = (input: { values: readonly string[] }): string =>
  input.values.join(' | ');

/**
 * .what = the frontmatter of one fulcrum entry — the one home of a deferral's attributes
 * .why = invariant 5 (`define.invariant.review.peer.dispute.the-fulcrum-is-the-one-home`): the
 *        approval gate, the dispute path, and the onStop linter all read these fields, so they
 *        must be machine-readable, never prose
 */
export interface FulcrumFrontmatter {
  case: string;
  rework: (typeof FULCRUM_REWORKS)[number];
  ground: (typeof FULCRUM_GROUNDS)[number];
  confidence: number;
  status: (typeof FULCRUM_STATUSES)[number];
  owed: (typeof FULCRUM_OWEDS)[number];
  holds: string[];
  lean: string;
  reflect: string | null;
  verdict: FulcrumVerdict | null;
}

/**
 * .what = a human's verdict on one disputed fulcrum, as its frontmatter carries it
 * .why = the gate, the lever, and the provenance check each read these three fields
 */
export interface FulcrumVerdict {
  by: 'human';
  at: string;
  ruled: (typeof FULCRUM_VERDICTS)[number];
}

/**
 * .what = the fields every fulcrum frontmatter must carry, in the order a reader pastes them
 * .why = one list, read by the dispute-time refusal and the onStop linter alike, so the two
 *        surfaces can never teach different fixes
 */
export const FULCRUM_FRONTMATTER_FIELDS_REQUIRED = [
  'case',
  'rework',
  'ground',
  'confidence',
  'status',
  'owed',
  'holds',
  'lean',
  'verdict',
] as const;

/**
 * .what = the outcome of a frontmatter parse: valid, absent, or invalid with each defect named
 * .why = the gate, the linter, the lever, and the dispute-time check each branch on it
 */
export type FulcrumFrontmatterParse =
  | {
      kind: 'valid';
      frontmatter: FulcrumFrontmatter;
      /**
       * the hash a verdict row binds to (`asFulcrumContentSeen`); an edit after the verdict moves it
       */
      seen: string;
    }
  | { kind: 'absent' }
  | { kind: 'invalid'; absent: string[]; malformed: string[] };

const REFLECT_REF_PATTERN = /^[\w.-]+\/[\w.-]+#\d+$/;

/**
 * .what = the yaml block at the head of a fulcrum entry; group 1 is its body
 * .why = the parser and the verdict writer read the one block the same way
 */
export const FULCRUM_FRONTMATTER_BLOCK_PATTERN =
  /^---\r?\n([\s\S]*?)\r?\n---\s*(\r?\n|$)/;

/**
 * .what = parses and validates the yaml frontmatter at the head of a fulcrum entry
 * .why = a field that is absent, or holds a value outside its closed set, must be named — never
 *        defaulted. a defaulted `owed` or `verdict` would let a dispute slip past the human gate
 */
export const asFulcrumFrontmatter = (input: {
  content: string;
}): FulcrumFrontmatterParse => {
  // find the frontmatter block; a file that does not open with one has none
  const match = input.content.match(FULCRUM_FRONTMATTER_BLOCK_PATTERN);
  if (!match?.[1]) return { kind: 'absent' };

  // parse the yaml; a block that does not parse, or parses to no map, is named whole
  const raw = asYamlRecord({ block: match[1] });
  if (raw === 'unparsed')
    return {
      kind: 'invalid',
      absent: [],
      malformed: ['frontmatter (the block does not parse as yaml)'],
    };
  if (raw === 'unmapped')
    return {
      kind: 'invalid',
      absent: [],
      malformed: ['frontmatter (a map of fields)'],
    };

  // parse each field; a present field whose value sits outside its closed set is malformed
  const fields = {
    case: asTextField({ value: raw.case }),
    lean: asTextField({ value: raw.lean }),
    rework: asOneOf({ value: raw.rework, values: FULCRUM_REWORKS }),
    ground: asOneOf({ value: raw.ground, values: FULCRUM_GROUNDS }),
    confidence: asConfidence({ value: raw.confidence }),
    status: asOneOf({ value: raw.status, values: FULCRUM_STATUSES }),
    owed: asOneOf({ value: raw.owed, values: FULCRUM_OWEDS }),
    holds: Array.isArray(raw.holds) ? raw.holds.map(String) : null,
    verdict: asFulcrumVerdictField({ value: raw.verdict }),
    reflect: asReflectField({ value: raw.reflect }),
  };

  // name each required field the block lacks, and each present field that is malformed
  const absent = FULCRUM_FRONTMATTER_FIELDS_REQUIRED.filter(
    (field) => !(field in raw),
  ).map(String);
  const malformed = getAllMalformedFields({ raw, fields });
  if (
    absent.length ||
    malformed.length ||
    !fields.case ||
    !fields.lean ||
    !fields.rework ||
    !fields.ground ||
    fields.confidence === null ||
    !fields.status ||
    !fields.owed ||
    !fields.holds ||
    !fields.verdict ||
    !fields.reflect
  )
    return { kind: 'invalid', absent, malformed };

  const frontmatter: FulcrumFrontmatter = {
    case: fields.case,
    rework: fields.rework,
    ground: fields.ground,
    confidence: fields.confidence,
    status: fields.status,
    owed: fields.owed,
    holds: fields.holds,
    lean: fields.lean,
    reflect: fields.reflect.value,
    verdict: fields.verdict.value,
  };
  return {
    kind: 'valid',
    frontmatter,
    seen: asFulcrumContentSeen({
      frontmatter,
      body: input.content.slice(match[0].length),
    }),
  };
};

const UNPARSED = Symbol('unparsed');

/**
 * .what = loads a yaml block as a record of fields, or names why it could not
 * .why = only a yaml syntax fault reads as `unparsed`; any other throw is a malfunction and
 *        rises (`rule.forbid.failhide`)
 */
const asYamlRecord = (input: {
  block: string;
}): Record<string, unknown> | 'unparsed' | 'unmapped' => {
  const parsed: unknown = (() => {
    try {
      return yaml.load(input.block);
    } catch (error) {
      if (!(error instanceof yaml.YAMLException)) throw error;
      return UNPARSED;
    }
  })();
  if (parsed === UNPARSED) return 'unparsed';
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
    return 'unmapped';
  return { ...parsed };
};

/**
 * .what = narrows a value to one member of a closed set, or null
 * .why = each enum field of the frontmatter reads through one guard, so no field is cast
 */
const asOneOf = <T extends string>(input: {
  value: unknown;
  values: readonly T[];
}): T | null => input.values.find((member) => member === input.value) ?? null;

/**
 * .what = narrows a value to non-empty text, or null
 * .why = `case:` or `lean:` left blank loads as yaml null; read as text, it would print as the
 *        word `null` at the gate. a bare number (`case: 44`) is text a human typed, so it reads too
 */
const asTextField = (input: { value: unknown }): string | null => {
  if (typeof input.value === 'number') return String(input.value);
  if (typeof input.value !== 'string') return null;
  return input.value.trim().length ? input.value : null;
};

/**
 * .what = narrows a value to a confidence from 0 to 1, or null
 * .why = confidence decides who rules a dispute; a value outside 0–1 must be named, never clamped
 */
const asConfidence = (input: { value: unknown }): number | null =>
  typeof input.value === 'number' && input.value >= 0 && input.value <= 1
    ? input.value
    : null;

/**
 * .what = narrows the `verdict` field to null or a verdict shape, wrapped so null stays valid
 * .why = `verdict: null` is the open state, so a malformed verdict must read apart from it
 */
const asFulcrumVerdictField = (input: {
  value: unknown;
}): { value: FulcrumVerdict | null } | null => {
  if (input.value === null || input.value === undefined) return { value: null };
  if (typeof input.value !== 'object') return null;
  const verdict: Record<string, unknown> = { ...input.value };
  const ruled = asOneOf({ value: verdict.ruled, values: FULCRUM_VERDICTS });
  const at = asVerdictDate({ value: verdict.at });
  if (verdict.by !== 'human' || !ruled || !at) return null;
  return { value: { by: 'human', at, ruled } };
};

/**
 * .what = narrows a verdict's `at` to a `YYYY-MM-DD` string
 * .why = yaml reads a bare `2026-11-17` as a Date, a quoted one as a string; both mean one day
 */
const asVerdictDate = (input: { value: unknown }): string | null => {
  if (input.value instanceof Date) return input.value.toJSON().slice(0, 10);
  if (
    typeof input.value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(input.value)
  )
    return input.value;
  return null;
};

/**
 * .what = narrows the `reflect` field to null or an `<owner>/<repo>#<number>` ref
 * .why = a reflection is an upstream issue; a ref that names none must be refused
 */
const asReflectField = (input: {
  value: unknown;
}): { value: string | null } | null => {
  if (input.value === null || input.value === undefined || input.value === '')
    return { value: null };
  return REFLECT_REF_PATTERN.test(String(input.value))
    ? { value: String(input.value) }
    : null;
};

/**
 * .what = names each present field whose value is outside its closed set
 * .why = the dispute refusal and the linter print these names as the fix; one line per field
 */
const getAllMalformedFields = (input: {
  raw: Record<string, unknown>;
  fields: {
    case: string | null;
    lean: string | null;
    rework: string | null;
    ground: string | null;
    confidence: number | null;
    status: string | null;
    owed: string | null;
    holds: string[] | null;
    verdict: { value: FulcrumVerdict | null } | null;
    reflect: { value: string | null } | null;
  };
}): string[] => {
  const { raw, fields } = input;
  const isPresentAndMalformed = (check: {
    field: string;
    parsed: unknown;
  }): boolean => check.field in raw && check.parsed === null;
  return [
    isPresentAndMalformed({ field: 'case', parsed: fields.case })
      ? 'case (the file id, e.g. F44)'
      : null,
    isPresentAndMalformed({ field: 'lean', parsed: fields.lean })
      ? 'lean (one line of text)'
      : null,
    isPresentAndMalformed({ field: 'rework', parsed: fields.rework })
      ? `rework (${asFulcrumEnumHint({ values: FULCRUM_REWORKS })})`
      : null,
    isPresentAndMalformed({ field: 'ground', parsed: fields.ground })
      ? `ground (${asFulcrumEnumHint({ values: FULCRUM_GROUNDS })})`
      : null,
    isPresentAndMalformed({ field: 'confidence', parsed: fields.confidence })
      ? 'confidence (a number from 0 to 1)'
      : null,
    isPresentAndMalformed({ field: 'status', parsed: fields.status })
      ? `status (${asFulcrumEnumHint({ values: FULCRUM_STATUSES })})`
      : null,
    isPresentAndMalformed({ field: 'owed', parsed: fields.owed })
      ? `owed (${asFulcrumEnumHint({ values: FULCRUM_OWEDS })})`
      : null,
    isPresentAndMalformed({ field: 'holds', parsed: fields.holds })
      ? 'holds (a list)'
      : null,
    fields.verdict === null
      ? `verdict (null, or { by: human, at: <date>, ruled: ${asFulcrumEnumHint({ values: FULCRUM_VERDICTS })} })`
      : null,
    fields.reflect === null ? 'reflect (<owner>/<repo>#<number>)' : null,
    fields.owed === 'reflect' && fields.reflect && !fields.reflect.value
      ? 'reflect (required when owed: reflect)'
      : null,
  ].filter((line): line is string => line !== null);
};
