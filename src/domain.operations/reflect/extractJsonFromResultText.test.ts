import { extractJsonFromResultText } from './extractJsonFromResultText';

const TEST_CASES = [
  {
    description: 'extracts JSON from markdown code block with json tag',
    given: {
      resultText: '```json\n{ "written": true }\n```',
    },
    expect: {
      output: '{ "written": true }',
    },
  },
  {
    description: 'extracts JSON from markdown code block without json tag',
    given: {
      resultText: '```\n{ "foo": "bar" }\n```',
    },
    expect: {
      output: '{ "foo": "bar" }',
    },
  },
  {
    description: 'strips inline backticks from JSON',
    given: {
      resultText: '`{ "written": true }`',
    },
    expect: {
      output: '{ "written": true }',
    },
  },
  {
    description: 'handles raw JSON without any wrapping',
    given: {
      resultText: '{ "status": "ok" }',
    },
    expect: {
      output: '{ "status": "ok" }',
    },
  },
  {
    description: 'trims whitespace around JSON',
    given: {
      resultText: '  \n{ "trimmed": true }\n  ',
    },
    expect: {
      output: '{ "trimmed": true }',
    },
  },
  {
    description: 'handles multiline JSON in code block',
    given: {
      resultText:
        '```json\n{\n  "timestamp": "2025-01-01",\n  "rules": []\n}\n```',
    },
    expect: {
      output: '{\n  "timestamp": "2025-01-01",\n  "rules": []\n}',
    },
  },
  {
    description: 'prefers code block extraction over inline backticks',
    given: {
      resultText: 'Here is the result: ```json\n{ "correct": true }\n```',
    },
    expect: {
      output: '{ "correct": true }',
    },
  },
  {
    description: 'handles code block with leading text',
    given: {
      resultText:
        'I have written the manifest:\n\n```json\n{ "done": true }\n```',
    },
    expect: {
      output: '{ "done": true }',
    },
  },
];

describe('extractJsonFromResultText', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const output = extractJsonFromResultText({
        resultText: thisCase.given.resultText,
      });
      expect(output).toEqual(thisCase.expect.output);
    }),
  );
});
