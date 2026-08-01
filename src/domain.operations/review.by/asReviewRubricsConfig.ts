import { BadRequestError } from 'helpful-errors';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const yaml = require('js-yaml');

/**
 * .what = one named bundle of rules a role reviews against
 * .why = the atomic unit of review.by — a role declares several, each a focused concern.
 *        matches the shipped ehmpathy `rubrics.yml` shape.
 */
export interface ReviewRubric {
  slug: string;
  purpose?: string;
  rules: string[];
}

/**
 * .what = the mascot + artifact a role marks its review output with
 * .why = each role has its own vibe (owl 🦉, turtle 🐢). declared in rubrics.yml, defaulted here.
 */
export interface ReviewVibe {
  mascot: string;
  artifact: string;
}

/**
 * .what = a role's full review.by config, parsed from its rubrics.yml
 * .why = the shape stepReviewBy drives — the rubrics to run + the vibe to render with.
 */
export interface ReviewRubricsConfig {
  vibe: ReviewVibe;
  rubrics: ReviewRubric[];
}

/**
 * .what = the default vibe when rubrics.yml declares none
 * .why = bhrain owns review.by, so its owl is the fallback mascot.
 */
const DEFAULT_VIBE: ReviewVibe = { mascot: '🦉', artifact: '🔍' };

/**
 * .what = narrows an unknown value to a string-keyed record
 * .why = replaces an `as Record<string, unknown>` cast at each yaml-shape boundary with a real
 *        type guard, so the narrow is proven at runtime rather than asserted (rule.forbid.as-cast).
 *        arrays satisfy `typeof === 'object'` too — matched to the prior cast's behavior, where a
 *        top-level array falls through and fails later at the absent `rubrics` key.
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * .what = parses a rubrics.yml string into a validated ReviewRubricsConfig
 * .why = the pure transformer half of rubrics.yml load — getOneRoleReviewRubricsYml does the i/o,
 *        this validates the shape. fails loud on a malformed or self-contradictory config so a
 *        bad rubrics.yml is caught at parse, not mid-run. see rule.forbid.failhide.
 */
export const asReviewRubricsConfig = (input: {
  raw: string;
}): ReviewRubricsConfig => {
  // parse the yaml text; a syntax error surfaces as a malfunction, not a raw throw
  const parsed = asParsedYaml({ raw: input.raw });

  // the rubrics list must be present and non-empty — an empty review set is a config defect
  const rubrics = asRubricsList({ parsed });

  // each slug must be unique so --for resolves one rubric and stdout rows are unambiguous
  assertUniqueSlugs({ rubrics });

  // vibe is optional; fall back to the owl mascot when absent
  const vibe = asVibe({ parsed });

  return { vibe, rubrics };
};

/**
 * .what = parses the yaml text into an unknown object, or fails loud
 * .why = a malformed rubrics.yml must name itself in the error, not leak a raw yaml stack trace.
 */
const asParsedYaml = (input: { raw: string }): Record<string, unknown> => {
  try {
    const parsed = yaml.load(input.raw);
    if (!isRecord(parsed))
      throw new BadRequestError(
        'failed to parse rubrics.yml: expected a yaml object',
        { raw: input.raw },
      );
    return parsed;
  } catch (error) {
    if (error instanceof BadRequestError) throw error;
    const detail = error instanceof Error ? error.message : String(error);
    throw new BadRequestError(`failed to parse rubrics.yml: ${detail}`, {
      raw: input.raw,
    });
  }
};

/**
 * .what = extracts and shape-checks the rubrics list
 * .why = a config with no rubric has no review to run — a defect the caller must fix.
 */
const asRubricsList = (input: {
  parsed: Record<string, unknown>;
}): ReviewRubric[] => {
  const rubrics = input.parsed.rubrics;
  if (!Array.isArray(rubrics) || rubrics.length === 0)
    throw new BadRequestError('no rubrics found in rubrics.yml', {
      parsed: input.parsed,
    });
  return rubrics.map((rubric, index) => asRubric({ rubric, index }));
};

/**
 * .what = shape-checks one rubric entry
 * .why = a rubric without a slug or rules cannot run; catch it at parse.
 */
const asRubric = (input: { rubric: unknown; index: number }): ReviewRubric => {
  // a non-record entry has no slug — the same outcome the prior `?.slug` cast produced
  if (!isRecord(input.rubric))
    throw new BadRequestError(
      `rubric at index ${input.index} lacks a slug in rubrics.yml`,
      { rubric: input.rubric },
    );
  const rubric = input.rubric;
  const slug = rubric.slug;
  const rules = rubric.rules;
  if (typeof slug !== 'string' || slug === '')
    throw new BadRequestError(
      `rubric at index ${input.index} lacks a slug in rubrics.yml`,
      { rubric: input.rubric },
    );
  if (!Array.isArray(rules) || rules.length === 0)
    throw new BadRequestError(
      `rubric "${slug}" lacks a non-empty rules list in rubrics.yml`,
      { rubric: input.rubric },
    );
  return {
    slug,
    purpose: typeof rubric.purpose === 'string' ? rubric.purpose : undefined,
    rules: rules.map((rule) => String(rule)),
  };
};

/**
 * .what = asserts every rubric slug is unique
 * .why = a duplicate slug makes --for ambiguous and stdout rows collide.
 */
const assertUniqueSlugs = (input: { rubrics: ReviewRubric[] }): void => {
  const seen = new Set<string>();
  for (const rubric of input.rubrics) {
    if (seen.has(rubric.slug))
      throw new BadRequestError(`duplicate rubric slug: ${rubric.slug}`, {
        rubrics: input.rubrics,
      });
    seen.add(rubric.slug);
  }
};

/**
 * .what = extracts the vibe override, or the owl default
 * .why = vibe is optional; a partial vibe fills each absent field from the default.
 */
const asVibe = (input: { parsed: Record<string, unknown> }): ReviewVibe => {
  const vibe = input.parsed.vibe;
  if (!isRecord(vibe)) return DEFAULT_VIBE;
  return {
    mascot: typeof vibe.mascot === 'string' ? vibe.mascot : DEFAULT_VIBE.mascot,
    artifact:
      typeof vibe.artifact === 'string' ? vibe.artifact : DEFAULT_VIBE.artifact,
  };
};
