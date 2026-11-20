import { UnexpectedCodePathError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { asFulcrumFrontmatter } from './asFulcrumFrontmatter';
import { asFulcrumOwed } from './asFulcrumOwed';

const VALID = [
  '---',
  'case: F44',
  'rework: clean',
  'ground: wrong',
  'confidence: 0.65',
  'status: held',
  'owed: human',
  'holds: [rules/i003/blocker.2]',
  'lean: keep the table as written',
  'verdict: null',
  '---',
  '',
  '# fulcrum: rename-table',
].join('\n');

describe('asFulcrumFrontmatter', () => {
  given('[case1] a complete frontmatter', () => {
    when('[t0] parsed', () => {
      then('it is valid, with each field read', () => {
        const parse = asFulcrumFrontmatter({ content: VALID });
        expect(parse.kind).toEqual('valid');
        if (parse.kind !== 'valid')
          throw new UnexpectedCodePathError('the parse should be valid', {
            parse,
            hint: 'the parser named a defect in a complete frontmatter',
          });
        expect(parse.frontmatter.case).toEqual('F44');
        expect(parse.frontmatter.confidence).toEqual(0.65);
        expect(parse.frontmatter.holds).toEqual(['rules/i003/blocker.2']);
        expect(parse.frontmatter.verdict).toEqual(null);
      });
    });
  });

  given('[case2] a file with no frontmatter', () => {
    when('[t0] parsed', () => {
      then('it is absent', () => {
        expect(asFulcrumFrontmatter({ content: '# fulcrum\n' }).kind).toEqual(
          'absent',
        );
      });
    });
  });

  given('[case3] a frontmatter that lacks fields and holds a bad value', () => {
    const content = VALID.replace('lean: keep the table as written\n', '')
      .replace('confidence: 0.65', 'confidence: 1.5')
      .replace('ground: wrong', 'ground: shaky');
    when('[t0] parsed', () => {
      then('it is invalid, and names each defect', () => {
        const parse = asFulcrumFrontmatter({ content });
        expect(parse.kind).toEqual('invalid');
        if (parse.kind !== 'invalid')
          throw new UnexpectedCodePathError('the parse should be invalid', {
            parse,
            hint: 'the parser accepted a defect it should name',
          });
        expect(parse.absent).toContain('lean');
        expect(parse.malformed.join(' ')).toContain('confidence');
        expect(parse.malformed.join(' ')).toContain('ground');
      });
    });
  });

  given('[case4] a reflect-owed frontmatter with no reflect url', () => {
    const content = VALID.replace('owed: human', 'owed: reflect').replace(
      'confidence: 0.65',
      'confidence: 0.95',
    );
    when('[t0] parsed', () => {
      then('it is invalid on reflect', () => {
        const parse = asFulcrumFrontmatter({ content });
        expect(parse.kind).toEqual('invalid');
        if (parse.kind !== 'invalid')
          throw new UnexpectedCodePathError('the parse should be invalid', {
            parse,
            hint: 'the parser accepted a defect it should name',
          });
        expect([...parse.absent, ...parse.malformed].join(' ')).toContain(
          'reflect',
        );
      });
    });
  });
});

describe('asFulcrumFrontmatter, the verdict and the yaml itself', () => {
  const TEST_CASES = [
    {
      description:
        'a yaml syntax fault is named as unparsed, never as absent fields',
      given: { content: '---\ncase: [F44\n---\n' },
      expect: {
        kind: 'invalid',
        defects: ['frontmatter (the block does not parse as yaml)'],
      },
    },
    {
      description: 'a verdict with a bare date reads as that day',
      given: {
        content: VALID.replace(
          'verdict: null',
          'verdict: { by: human, at: 2026-11-17, ruled: upheld }',
        ),
      },
      expect: { kind: 'valid', defects: [] },
    },
    {
      description: 'a verdict whose at is no date is malformed',
      given: {
        content: VALID.replace(
          'verdict: null',
          'verdict: { by: human, at: null, ruled: upheld }',
        ),
      },
      expect: {
        kind: 'invalid',
        defects: [
          'verdict (null, or { by: human, at: <date>, ruled: upheld | conceded })',
        ],
      },
    },
    {
      description:
        '🔴 clamp. a blank case or lean is malformed, never the word null',
      given: {
        content: VALID.replace('case: F44', 'case:').replace(
          'lean: keep the table as written',
          'lean:',
        ),
      },
      expect: {
        kind: 'invalid',
        defects: ['case (the file id, e.g. F44)', 'lean (one line of text)'],
      },
    },
  ];
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const parse = asFulcrumFrontmatter(thisCase.given);
      expect(parse.kind).toEqual(thisCase.expect.kind);
      expect(parse.kind === 'invalid' ? parse.malformed : []).toEqual(
        thisCase.expect.defects,
      );
    }),
  );
});

describe('asFulcrumOwed', () => {
  const CASES = [
    { ground: 'wrong', confidence: 0.95, owed: 'reflect' },
    { ground: 'wrong', confidence: 0.9, owed: 'reflect' },
    { ground: 'wrong', confidence: 0.89, owed: 'human' },
    { ground: 'dirty', confidence: 0.99, owed: 'human' },
    { ground: 'dirty', confidence: 0.4, owed: 'human' },
  ] as const;
  CASES.map((thisCase) =>
    test(`ground=${thisCase.ground} confidence=${thisCase.confidence} → ${thisCase.owed}`, () => {
      expect(
        asFulcrumOwed({
          ground: thisCase.ground,
          confidence: thisCase.confidence,
        }),
      ).toEqual(thisCase.owed);
    }),
  );
});
