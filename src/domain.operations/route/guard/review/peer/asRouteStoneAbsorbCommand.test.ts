import { asRouteStoneAbsorbCommand } from './asRouteStoneAbsorbCommand';

describe('asRouteStoneAbsorbCommand', () => {
  test('composes the absorb command for one reviewer', () => {
    const composed = asRouteStoneAbsorbCommand({
      stone: '5.1.execution',
      that: 'architect',
    });
    expect(composed.head).toEqual('rhx route.stone.set --stone 5.1.execution');
    expect(composed.flags).toEqual('--as absorbed --that architect');
    expect(composed.command).toEqual(
      'rhx route.stone.set --stone 5.1.execution --as absorbed --that architect',
    );
  });
});
