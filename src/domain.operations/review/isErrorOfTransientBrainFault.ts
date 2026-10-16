import { getAllErrorCauses } from '@src/utils/getAllErrorCauses';

/**
 * .what = true when a caught brain call fault is transient — a provider 5xx, a rate limit,
 *         or a dropped socket — and a second ask may well succeed
 * .why = a gateway 502/504 says naught about the prompt. to fail the whole lane on it costs
 *        a full re-arrive round; to ask again costs seconds
 *
 * .note = it reads `status` and `code` by shape, never by class: the fault arrives through
 *         `rhachet` and its brain package, each of which may load its own copy of the sdk
 * .note = it walks the `cause` chain. node's fetch (undici) reports a dropped socket as a bare
 *         `TypeError: terminated` whose `cause` carries the `UND_ERR_SOCKET` code, so a read of
 *         the outer error alone grades the drop as fatal and malfunctions the lane
 * .note = the walk is the shared, cycle-safe `getAllErrorCauses`, so the cause-chain grammar
 *         keeps one home and a transient code at any depth is seen
 */
export const isErrorOfTransientBrainFault = (input: {
  error: unknown;
}): boolean =>
  getAllErrorCauses({ error: input.error }).some((error) =>
    isErrorOneTransient({ error }),
  );

/**
 * .what = true when this one error, apart from its causes, names a transient fault
 */
const isErrorOneTransient = (input: { error: unknown }): boolean => {
  // only an object can carry a status or a code
  if (typeof input.error !== 'object' || input.error === null) return false;

  // read each field off the object; every field is `unknown`, so the `typeof` checks gate
  const status: unknown = Reflect.get(input.error, 'status');
  const code: unknown = Reflect.get(input.error, 'code');

  // a provider 5xx or a rate limit is transient
  if (typeof status === 'number')
    return status === 429 || (status >= 500 && status <= 599);

  // a dropped socket is transient
  return typeof code === 'string' && CODES_OF_DROPPED_SOCKET.includes(code);
};

const CODES_OF_DROPPED_SOCKET = [
  'ECONNRESET',
  'ETIMEDOUT',
  'EPIPE',
  'EAI_AGAIN',
  // node's fetch (undici) names its socket faults on its own scheme
  'UND_ERR_SOCKET',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_BODY_TIMEOUT',
];
