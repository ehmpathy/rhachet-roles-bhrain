import { given, then, when } from 'test-fns';

import { genReviewByStdout } from './genReviewByStdout';
import type { ReviewByResult, ReviewRubricResult } from './ReviewByResult';

const OWL_VIBE = { mascot: '🦉', artifact: '🔍' };

const asResult = (input: {
  slug: string;
  blockers: number;
  nitpicks: number;
  outcome: ReviewRubricResult['verdict']['outcome'];
  reason?: string;
}): ReviewRubricResult => ({
  slug: input.slug,
  verdict: {
    blockers: input.blockers,
    nitpicks: input.nitpicks,
    outcome: input.outcome,
    tallier: 'deterministic',
    ...(input.reason ? { reason: input.reason } : {}),
  },
  outputPath: `.reviews/${input.slug}.md`,
  durationMs: null,
  stdout: '',
});

describe('genReviewByStdout', () => {
  given('[case1] all rubrics pass', () => {
    const result: ReviewByResult = {
      role: 'mechanic',
      for: null,
      vibe: OWL_VIBE,
      results: [
        asResult({
          slug: 'mech-failhides',
          blockers: 0,
          nitpicks: 0,
          outcome: 'passed',
        }),
        asResult({
          slug: 'mech-decode-friction',
          blockers: 0,
          nitpicks: 0,
          outcome: 'passed',
        }),
      ],
      blockersTotal: 0,
      nitpicksTotal: 0,
    };

    when('[t0] rendered', () => {
      then('it shows the all-clear owl header + no summary', () => {
        const out = genReviewByStdout({ result });
        expect(out).toContain('🦉 not even a vole');
        expect(out).not.toContain('summary');
      });

      then('it matches snapshot', () => {
        expect(genReviewByStdout({ result })).toMatchSnapshot();
      });
    });
  });

  given('[case2] mixed blockers + nitpicks', () => {
    const result: ReviewByResult = {
      role: 'mechanic',
      for: null,
      vibe: OWL_VIBE,
      results: [
        asResult({
          slug: 'mech-failhides',
          blockers: 2,
          nitpicks: 0,
          outcome: 'rejected',
        }),
        asResult({
          slug: 'mech-decode-friction',
          blockers: 1,
          nitpicks: 3,
          outcome: 'rejected',
        }),
      ],
      blockersTotal: 3,
      nitpicksTotal: 3,
    };

    when('[t0] rendered', () => {
      then('it shows the blocker-tier owl header', () => {
        expect(genReviewByStdout({ result })).toContain('🦉 needs your talons');
      });

      then('it carries a parseable summary', () => {
        const out = genReviewByStdout({ result });
        expect(out).toMatch(/3\s+blockers/);
        expect(out).toMatch(/3\s+nitpicks/);
      });

      then('it matches snapshot', () => {
        expect(genReviewByStdout({ result })).toMatchSnapshot();
      });
    });
  });

  given('[case3] single --for rubric passes', () => {
    const result: ReviewByResult = {
      role: 'mechanic',
      for: 'mech-failhides',
      vibe: OWL_VIBE,
      results: [
        asResult({
          slug: 'mech-failhides',
          blockers: 0,
          nitpicks: 0,
          outcome: 'passed',
        }),
      ],
      blockersTotal: 0,
      nitpicksTotal: 0,
    };

    when('[t0] rendered', () => {
      then('it echoes --for in the command line', () => {
        expect(genReviewByStdout({ result })).toContain(
          '🔍 review.by --role mechanic --for mech-failhides',
        );
      });

      then('it matches snapshot', () => {
        expect(genReviewByStdout({ result })).toMatchSnapshot();
      });
    });
  });

  given('[case4] single --for rubric with findings (guard shape)', () => {
    const result: ReviewByResult = {
      role: 'mechanic',
      for: 'mech-failhides',
      vibe: OWL_VIBE,
      results: [
        asResult({
          slug: 'mech-failhides',
          blockers: 2,
          nitpicks: 1,
          outcome: 'rejected',
        }),
      ],
      blockersTotal: 2,
      nitpicksTotal: 1,
    };

    when('[t0] rendered', () => {
      then('even one rubric emits a parseable summary', () => {
        const out = genReviewByStdout({ result });
        expect(out).toContain('summary');
        expect(out).toMatch(/2\s+blockers/);
        expect(out).toMatch(/1\s+nitpick/);
      });

      then('it matches snapshot', () => {
        expect(genReviewByStdout({ result })).toMatchSnapshot();
      });
    });
  });

  given('[case5] nitpicks only, no blockers', () => {
    const result: ReviewByResult = {
      role: 'mechanic',
      for: null,
      vibe: OWL_VIBE,
      results: [
        asResult({
          slug: 'mech-nits',
          blockers: 0,
          nitpicks: 4,
          outcome: 'passed',
        }),
      ],
      blockersTotal: 0,
      nitpicksTotal: 4,
    };

    when('[t0] rendered', () => {
      then('the rubric row shows only the nitpick count', () => {
        const out = genReviewByStdout({ result });
        expect(out).toMatch(/4\s+nitpicks/);
      });

      then('the header uses the nitpicks-only owl tier', () => {
        // nitpicks but no blockers → the soft-note tier, distinct from the blocker tier
        expect(genReviewByStdout({ result })).toContain('🦉 just a few hoots');
      });

      then('the summary shows 0 blockers', () => {
        expect(genReviewByStdout({ result })).toMatch(/0\s+blockers/);
      });

      then('it matches snapshot', () => {
        expect(genReviewByStdout({ result })).toMatchSnapshot();
      });
    });
  });

  given('[case6] a vibe override', () => {
    const result: ReviewByResult = {
      role: 'mechanic',
      for: null,
      vibe: { mascot: '🐢', artifact: '🐚' },
      results: [
        asResult({ slug: 'only', blockers: 0, nitpicks: 0, outcome: 'passed' }),
      ],
      blockersTotal: 0,
      nitpicksTotal: 0,
    };

    when('[t0] rendered', () => {
      then('it uses the turtle mascot + shell artifact', () => {
        const out = genReviewByStdout({ result });
        expect(out).toContain('🐢 not even a vole');
        expect(out).toContain('🐚 review.by --role mechanic');
      });

      then('it matches snapshot', () => {
        expect(genReviewByStdout({ result })).toMatchSnapshot();
      });
    });
  });

  given('[case7] a malfunctioned rubric', () => {
    const result: ReviewByResult = {
      role: 'mechanic',
      for: null,
      vibe: OWL_VIBE,
      results: [
        asResult({
          slug: 'mech-ok',
          blockers: 0,
          nitpicks: 0,
          outcome: 'passed',
        }),
        asResult({
          slug: 'mech-broke',
          blockers: 0,
          nitpicks: 0,
          outcome: 'malfunctioned',
        }),
      ],
      blockersTotal: 0,
      nitpicksTotal: 0,
    };

    when('[t0] rendered', () => {
      then('the broken rubric shows a malfunction row, not a clean 0/0', () => {
        const out = genReviewByStdout({ result });
        expect(out).toContain('mech-broke ✗');
        expect(out).toContain('malfunctioned 💥');
      });

      then('it matches snapshot', () => {
        expect(genReviewByStdout({ result })).toMatchSnapshot();
      });
    });
  });

  given('[case8] a malfunctioned rubric with a captured reason', () => {
    const result: ReviewByResult = {
      role: 'mechanic',
      for: null,
      vibe: OWL_VIBE,
      results: [
        asResult({
          slug: 'mech-broke',
          blockers: 0,
          nitpicks: 0,
          outcome: 'malfunctioned',
          reason: 'review exited 0 with no verdict',
        }),
      ],
      blockersTotal: 0,
      nitpicksTotal: 0,
    };

    when('[t0] rendered', () => {
      then('the malfunction row carries its reason as a child', () => {
        const out = genReviewByStdout({ result });
        expect(out).toContain('malfunctioned 💥');
        expect(out).toContain('review exited 0 with no verdict');
      });

      then('the summary shows uncolored zero counts', () => {
        const out = genReviewByStdout({ result });
        // a malfunction-only run: zeros must NOT carry a severity emoji
        expect(out).toContain('0 blockers');
        expect(out).not.toMatch(/0 blockers 🔴/);
        expect(out).not.toMatch(/0 nitpicks 🟠/);
      });

      then('it matches snapshot', () => {
        expect(genReviewByStdout({ result })).toMatchSnapshot();
      });
    });
  });
});
