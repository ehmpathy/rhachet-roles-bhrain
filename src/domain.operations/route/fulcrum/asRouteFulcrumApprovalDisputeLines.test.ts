import { asRouteFulcrumApprovalDisputeLines } from './asRouteFulcrumApprovalDisputeLines';
import type { RouteFulcrumDisputeState } from './asRouteFulcrumDisputeState';

const STATE_CLEAN: RouteFulcrumDisputeState = {
  owedHuman: [],
  ruled: [],
  reflected: [],
  unreadable: [],
  forged: [],
  reopened: [],
};

const REPAIR_LINE =
  '├─ first, the driver repairs each fault above; approval is refused until then';

describe('asRouteFulcrumApprovalDisputeLines', () => {
  test('a clean state renders no block and no repair step', () => {
    expect(
      asRouteFulcrumApprovalDisputeLines({
        disputes: { state: STATE_CLEAN, refusal: null },
      }),
    ).toEqual([]);
  });

  test('🔴 clamp. an unreadable entry alone owes the driver a repair before any approval', () => {
    // with no human-owed dispute, the ask alone would send the human to approve a gate that
    // refuses; the repair step names who acts first
    const lines = asRouteFulcrumApprovalDisputeLines({
      disputes: {
        state: {
          ...STATE_CLEAN,
          unreadable: [
            {
              path: '.fulcrums/inventory.of=fulcrums.case=F46-bare.md',
              slug: 'F46',
            },
          ],
        },
        refusal: null,
      },
    });
    expect(lines).toContain(REPAIR_LINE);
    expect(lines.join('\n')).toMatchSnapshot();
  });

  test('a record that cannot be read renders its refusal, then the repair step', () => {
    const lines = asRouteFulcrumApprovalDisputeLines({
      disputes: {
        state: null,
        refusal: [
          'fulcrum verdict ledger holds an unreadable row at line 1',
          '   └─ fix: restore the line from git',
        ].join('\n'),
      },
    });
    expect(lines[0]).toEqual(
      '├─ the dispute record cannot be read; approval is refused until it is repaired',
    );
    expect(lines).toContain(REPAIR_LINE);
    expect(lines.join('\n')).toMatchSnapshot();
  });
});
