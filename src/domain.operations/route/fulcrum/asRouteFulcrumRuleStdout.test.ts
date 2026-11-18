import { asRouteFulcrumRuleStdout } from './asRouteFulcrumRuleStdout';

describe('asRouteFulcrumRuleStdout', () => {
  test('a written verdict names the case, the verdict, the date, and the file', () => {
    const stdout = asRouteFulcrumRuleStdout({
      outcome: 'ruled',
      case: 'F44',
      ruled: 'upheld',
      on: '2026-11-17',
      path: '.fulcrums/inventory.of=fulcrums.case=F44-rename-table.md',
    });
    expect(stdout).toContain('so it is. the verdict is written');
    expect(stdout).toContain('├─ ruled: upheld');
    expect(stdout).toMatchSnapshot();
  });

  test('a verdict already on record says so, and writes naught new', () => {
    const stdout = asRouteFulcrumRuleStdout({
      outcome: 'unchanged',
      case: 'F44',
      ruled: 'conceded',
      on: '2026-11-16',
      path: '.fulcrums/inventory.of=fulcrums.case=F44-rename-table.md',
    });
    expect(stdout).toContain('so it was. this verdict already stands');
    expect(stdout).toMatchSnapshot();
  });

  test('🔴 an upheld and a conceded verdict never read alike: a concede names the repair owed', () => {
    const given = {
      outcome: 'ruled' as const,
      case: 'F44',
      on: '2026-11-17',
      path: '.fulcrums/inventory.of=fulcrums.case=F44-rename-table.md',
    };
    const upheld = asRouteFulcrumRuleStdout({ ...given, ruled: 'upheld' });
    const conceded = asRouteFulcrumRuleStdout({ ...given, ruled: 'conceded' });
    expect(upheld).toContain('next: the dispute stands');
    expect(conceded).toContain(
      'next: the driver repairs each held concern in the current diff, then runs rhx route.drive',
    );
    expect(conceded).toMatchSnapshot();
  });
});
