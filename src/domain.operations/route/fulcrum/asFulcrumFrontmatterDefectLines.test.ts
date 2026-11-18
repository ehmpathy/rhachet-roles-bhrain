import { asFulcrumFrontmatterDefectLines } from './asFulcrumFrontmatterDefectLines';

describe('asFulcrumFrontmatterDefectLines', () => {
  test('names the file, each absent and malformed field, then the block to paste', () => {
    const lines = asFulcrumFrontmatterDefectLines({
      path: '.fulcrums/inventory.of=fulcrums.case=F44-rename-table.md',
      parse: {
        kind: 'invalid',
        absent: ['owed', 'verdict'],
        malformed: ['ground (wrong | dirty)'],
      },
      dispute: null,
    });
    expect(lines.join('\n')).toContain('│  ├─ owed');
    expect(lines.join('\n')).toContain('│  └─ verdict');
    expect(lines.join('\n')).toContain('│  └─ ground (wrong | dirty)');
    expect(lines.join('\n')).toContain('case: F44');
    expect(lines.join('\n')).toMatchSnapshot();
  });

  test('an absent block names every required field as absent', () => {
    const lines = asFulcrumFrontmatterDefectLines({
      path: '.fulcrums/inventory.of=fulcrums.case=F44-rename-table.md',
      parse: { kind: 'absent' },
      dispute: null,
    });
    expect(lines.join('\n')).toContain('│  ├─ case');
    expect(lines.join('\n')).toContain('│  └─ verdict');
    expect(lines.join('\n')).not.toContain('├─ malformed');
  });

  test('🔴 clamp. with no dispute, the block teaches owed: none, so a plain best-guess fulcrum holds no gate', () => {
    // every live `owed: human` entry refuses approval; a block that taught `human` would make a
    // call nobody disputed read as a dispute the human owes
    const lines = asFulcrumFrontmatterDefectLines({
      path: '.fulcrums/inventory.of=fulcrums.case=F44-rename-table.md',
      parse: { kind: 'invalid', absent: ['owed'], malformed: [] },
      dispute: null,
    });
    expect(lines.join('\n')).toContain('owed: none');
    expect(lines.join('\n')).not.toContain('owed: human ');
  });

  test('🔴 clamp. for a dispute, the block teaches the derived owed and the disputed concern', () => {
    // the dispute path refuses `owed: none` and a `holds` that omits the concern; a block that
    // taught either would be refused by the very check that printed it
    const lines = asFulcrumFrontmatterDefectLines({
      path: '.fulcrums/inventory.of=fulcrums.case=F44-rename-table.md',
      parse: { kind: 'invalid', absent: ['owed', 'holds'], malformed: [] },
      dispute: { reviewer: 'rules', iteration: 4, about: 'blocker.2' },
    });
    expect(lines.join('\n')).toContain('owed: human ');
    // the round the driver read, never an `<iteration>` placeholder to hand-fill
    expect(lines.join('\n')).toContain('holds: [rules/i004/blocker.2]');
    expect(lines.join('\n')).not.toContain('owed: none');
    expect(lines.join('\n')).toMatchSnapshot();
  });

  test('a misnamed file is taught a case placeholder, never its own name', () => {
    const lines = asFulcrumFrontmatterDefectLines({
      path: '.fulcrums/F47.deferral.md',
      parse: {
        kind: 'invalid',
        absent: [],
        malformed: ['file name (inventory.of=fulcrums.case=<id>-<slug>.md)'],
      },
      dispute: null,
    });
    expect(lines.join('\n')).not.toContain('absent');
    expect(lines.join('\n')).not.toContain('case: F47.deferral.md');
    expect(lines.join('\n')).toContain(
      'case: <id, as the renamed file declares it, e.g. F44>',
    );
  });
});
