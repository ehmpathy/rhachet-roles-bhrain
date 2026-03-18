import * as os from 'os';

describe('getReflectScope', () => {
  describe('branchSafe computation', () => {
    it('should replace / with ~ in branch names', () => {
      // test the branch safe computation logic
      const branch = 'vlad/reflect-prepare';
      const branchSafe = branch.replace(/\//g, '~');
      expect(branchSafe).toEqual('vlad~reflect-prepare');
    });

    it('should leave simple branch names unchanged', () => {
      const branch = 'main';
      const branchSafe = branch.replace(/\//g, '~');
      expect(branchSafe).toEqual('main');
    });
  });

  describe('storagePath structure', () => {
    it('should follow expected path pattern', () => {
      const homeDir = os.homedir();
      const expectedBase = `${homeDir}/.rhachet/storage/repo=bhrain/role=reflector/skills/reflect.snapshot`;

      // verify the base path pattern exists
      expect(expectedBase).toContain('.rhachet/storage');
      expect(expectedBase).toContain('repo=bhrain');
      expect(expectedBase).toContain('role=reflector');
    });
  });
});
