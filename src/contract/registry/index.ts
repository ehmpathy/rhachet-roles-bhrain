/**
 * .what = isolated registry export
 * .why = enables rhachet to load getRoleRegistry without heavy brain deps
 *
 * rhachet loads role registries to discover skills. if the main package
 * export eagerly imports brain infrastructure, simple skill lookups OOM.
 *
 * this subpath exports only the registry - no stepReview, no stepReflect,
 * no brain deps.
 */

export { getInvokeHooks } from '@src/domain.operations/hooks/getInvokeHooks';
export { getRoleRegistry } from '@src/domain.roles/getRoleRegistry';
