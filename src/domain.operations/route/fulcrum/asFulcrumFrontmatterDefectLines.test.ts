import { asFulcrumFrontmatterDefectLines } from './asFulcrumFrontmatterDefectLines';

describe('asFulcrumFrontmatterDefectLines', () => {
  test('names the file, each absent and malformed field, then the block to paste', () => {
    const lines = asFulcrumFrontmatterDefectLines({
      path: '.fulcrums/inventory.of=fulcrums.case=F44-rename-table.md',
      slug: 'F44',
      absent: ['owed', 'verdict'],
      malformed: ['ground (wrong | dirty)'],
    });
    expect(lines.join('\n')).toContain('│  ├─ owed');
    expect(lines.join('\n')).toContain('│  └─ verdict');
    expect(lines.join('\n')).toContain('│  └─ ground (wrong | dirty)');
    expect(lines.join('\n')).toContain('case: F44');
    expect(lines.join('\n')).toMatchSnapshot();
  });

  test('a file with only malformed fields lists no absent section', () => {
    const lines = asFulcrumFrontmatterDefectLines({
      path: '.fulcrums/x.md',
      slug: 'x.md',
      absent: [],
      malformed: ['file name (inventory.of=fulcrums.case=<id>-<slug>.md)'],
    });
    expect(lines.join('\n')).not.toContain('absent');
  });
});
