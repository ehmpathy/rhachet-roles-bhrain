/**
 * .what = sdk exports for route operations
 * .why = enables other role repos to compose route ops programmatically
 */

// types for context injection
export type { ContextCliEmit } from '@src/domain.objects/Driver/ContextCliEmit';
export type { GuardProgressEvent } from '@src/domain.objects/Driver/GuardProgressEvent';
export type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
export { delRouteBind } from '@src/domain.operations/route/bind/delRouteBind';
export { getRouteBind } from '@src/domain.operations/route/bind/getRouteBind';
export { getRouteBindByBranch } from '@src/domain.operations/route/bind/getRouteBindByBranch';
// bind operations
export { setRouteBind } from '@src/domain.operations/route/bind/setRouteBind';
// step operations
export { stepRouteDrive } from '@src/domain.operations/route/stepRouteDrive';
export { stepRouteStoneDel } from '@src/domain.operations/route/stepRouteStoneDel';
export { stepRouteStoneGet } from '@src/domain.operations/route/stepRouteStoneGet';
export { stepRouteStoneSet } from '@src/domain.operations/route/stepRouteStoneSet';
// stone operations
export { getAllStones } from '@src/domain.operations/route/stones/getAllStones';
export { setStoneAsApproved } from '@src/domain.operations/route/stones/setStoneAsApproved';
export { setStoneAsPassed } from '@src/domain.operations/route/stones/setStoneAsPassed';
