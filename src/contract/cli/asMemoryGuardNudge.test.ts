import { asMemoryGuardNudge } from './asMemoryGuardNudge';

const MEMORY_PATH = '/home/agent/.claude/projects/p/memory/x.md';

describe('asMemoryGuardNudge', () => {
  test('a write names the write, with no read hint', () => {
    const nudge = asMemoryGuardNudge({ path: MEMORY_PATH, act: 'write' });
    expect(nudge).toContain('✋ blocked: write to claude native memory');
    expect(nudge).toContain(MEMORY_PATH);
    expect(nudge).not.toContain('only a read?');
    expect(nudge).toMatchSnapshot();
  });

  test('a copy names the copy, and the route for a read', () => {
    const nudge = asMemoryGuardNudge({ path: MEMORY_PATH, act: 'copy' });
    expect(nudge).toContain('✋ blocked: a copy beside claude native memory');
    expect(nudge).toContain('only a read?');
    expect(nudge).toMatchSnapshot();
  });

  test('an unplaced redirect names what the guard could not place', () => {
    const nudge = asMemoryGuardNudge({ path: MEMORY_PATH, act: 'unplaced' });
    expect(nudge).toContain(
      '✋ blocked: an unplaced write beside claude native memory',
    );
    expect(nudge).toContain('$var');
    expect(nudge).toMatchSnapshot();
  });
});
