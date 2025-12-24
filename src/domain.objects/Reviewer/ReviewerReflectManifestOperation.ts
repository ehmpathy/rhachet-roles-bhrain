/**
 * .what = enum of manifest operation types for reviewer reflect blend
 * .why = defines how pure proposals map to sync directory
 */
export enum ReviewerReflectManifestOperation {
  /**
   * skip rule, not copied to sync
   * - duplicate of existing rule
   * - not relevant to target domain
   */
  OMIT = 'OMIT',

  /**
   * new rule, create in sync
   * - no existing rule matches
   * - path adapted to match target structure
   */
  SET_CREATE = 'SET_CREATE',

  /**
   * merge with existing rule
   * - existing rule covers same topic
   * - content merged, not replaced
   */
  SET_UPDATE = 'SET_UPDATE',

  /**
   * add as support document
   * - extends existing rule with example/ref/lesson
   * - suffix added: [demo], [ref], [lesson]
   */
  SET_APPEND = 'SET_APPEND',
}
