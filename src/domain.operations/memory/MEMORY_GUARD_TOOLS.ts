/**
 * .what = the tools the memory guard grades, by how each names what it writes
 *   - file = a tool whose `file_path` is the write target
 *   - shell = a tool whose `command` is a shell string to grade
 * .why = the hook's tool filter and the verdict read one list, so a tool the hook
 *        fires for is a tool the verdict grades, and none falls between them
 */
export const MEMORY_GUARD_TOOLS = {
  file: ['Write', 'Edit'],
  shell: ['Bash'],
} as const;
