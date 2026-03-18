import { computeProjectSlug } from './getTranscriptSource';

describe('getTranscriptSource', () => {
  describe('computeProjectSlug', () => {
    it('should convert path slashes to dashes', () => {
      const slug = computeProjectSlug({ cwd: '/home/user/git/repo' });
      expect(slug).toEqual('-home-user-git-repo');
    });

    it('should handle root path', () => {
      const slug = computeProjectSlug({ cwd: '/' });
      expect(slug).toEqual('-');
    });

    it('should handle nested worktree paths', () => {
      const slug = computeProjectSlug({
        cwd: '/home/vlad/git/ehmpathy/_worktrees/rhachet-roles-bhrain.vlad.reflect-prepare',
      });
      // claude code removes _, replaces . and / with -
      expect(slug).toEqual(
        '-home-vlad-git-ehmpathy--worktrees-rhachet-roles-bhrain-vlad-reflect-prepare',
      );
    });
  });
});
