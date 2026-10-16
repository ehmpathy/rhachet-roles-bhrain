import { asRouteStoneStanceCommand } from './asRouteStoneStanceCommand';

describe('asRouteStoneStanceCommand', () => {
  const TEST_CASES = [
    {
      description: 'a concede carries the required --severity',
      given: {
        stone: '5.1.execution',
        as: 'conceded' as const,
        with: 'mechanic',
        about: 'nitpick.3',
      },
      expect: {
        stance: '--as conceded --with mechanic --about nitpick.3',
        tail: '--severity better|urgent',
        command:
          'rhx route.stone.set --stone 5.1.execution --as conceded --with mechanic --about nitpick.3 --severity better|urgent',
      },
    },
    {
      description: 'a dispute carries the required --why',
      given: {
        stone: '5.1.execution',
        as: 'disputed' as const,
        with: 'mechanic',
        about: 'nitpick.3',
        why: '<fulcrum-path>',
      },
      expect: {
        stance: '--as disputed --with mechanic --about nitpick.3',
        tail: '--why <fulcrum-path>',
        command:
          'rhx route.stone.set --stone 5.1.execution --as disputed --with mechanic --about nitpick.3 --why <fulcrum-path>',
      },
    },
  ];

  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const composed = asRouteStoneStanceCommand(thisCase.given);
      expect(composed.head).toEqual(
        'rhx route.stone.set --stone 5.1.execution',
      );
      expect(composed.stance).toEqual(thisCase.expect.stance);
      expect(composed.tail).toEqual(thisCase.expect.tail);
      expect(composed.flags).toEqual(
        `${thisCase.expect.stance} ${thisCase.expect.tail}`,
      );
      expect(composed.command).toEqual(thisCase.expect.command);
    }),
  );
});
