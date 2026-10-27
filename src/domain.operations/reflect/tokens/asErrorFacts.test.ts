import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';

import { asErrorFacts } from './asErrorFacts';

describe('asErrorFacts', () => {
  test('a constraint with metadata → the bare message and each fact apart', () => {
    const facts = asErrorFacts({
      error: new BadRequestError('transcript not found', {
        uuid: '4444',
        roots: ['/a/projects', '/b/projects'],
        hint: 'pass the path',
      }),
    });
    expect(facts.message).toEqual('transcript not found');
    expect(facts.facts).toEqual({
      uuid: '4444',
      roots: ['/a/projects', '/b/projects'],
      hint: 'pass the path',
    });
  });

  test('a malfunction with no metadata → the bare message and null facts', () => {
    const facts = asErrorFacts({
      error: new UnexpectedCodePathError('no transcript could be read'),
    });
    expect(facts.message).toEqual('no transcript could be read');
    expect(facts.facts).toBeNull();
  });

  test.each([
    ['a json array', '[1, 2]'],
    ['text that is not json', 'see the logs'],
  ])('a full message whose tail is %s → the message alone, never a crash', (_, tail) => {
    // the full message is overwritten so its tail is a shape helpful-errors never
    // writes; the core message still comes from the redacted clone
    const error = Object.assign(new BadRequestError('transcript not found'), {
      message: `transcript not found\n\n${tail}`,
    });
    const facts = asErrorFacts({ error });
    expect(facts.message).toEqual('transcript not found');
    expect(facts.facts).toBeNull();
  });

  test('a full message that no longer holds the core one → the full message, null facts', () => {
    // a serializer drift: the full message is reworded, so no offset of the core exists in it
    const error = Object.assign(
      new BadRequestError('transcript not found', { uuid: '4444' }),
      { message: 'reworded entirely {"uuid":"4444"}' },
    );
    const facts = asErrorFacts({ error });
    expect(facts.message).toEqual('reworded entirely {"uuid":"4444"}');
    expect(facts.facts).toBeNull();
  });
});
