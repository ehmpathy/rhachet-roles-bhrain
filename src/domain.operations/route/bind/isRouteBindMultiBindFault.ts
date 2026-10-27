import { BadRequestError } from 'helpful-errors';

import { MESSAGE_OF_MULTI_BIND } from './MESSAGE_OF_MULTI_BIND';

/**
 * .what = whether an error is the multi-bind fault: several routes hold one branch's bind flag
 * .why = the bind lookup and the bind write both raise it, and each caller that marks the
 *        status line pointer on it must detect it the one way
 */
export const isRouteBindMultiBindFault = (input: { error: unknown }): boolean =>
  input.error instanceof BadRequestError &&
  input.error.message.includes(MESSAGE_OF_MULTI_BIND);
