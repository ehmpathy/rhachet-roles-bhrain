/**
 * .what = the NAMES of the classes our own code throws to name a PROVIDER fault
 * .why = the poke timeout rejects as `ReviewBrainCallError` (the wedge is the
 *        provider's), and the deadline beneath it as `ReviewTimeoutError`. each is a
 *        fault BY NAME, read first — so a later edit to the defect list below can
 *        never turn a poke timeout into a rethrown defect
 */
const NAMES_OF_BRAIN_FAULT = new Set([
  'ReviewBrainCallError',
  'ReviewTimeoutError',
]);

/**
 * .what = the NAMES of the classes a DEFECT in our own code throws, never a provider
 * .why = a provider refusal and a network drop each reach the poke as an ordinary
 *        error (the sdk's `API*Error`). the
 *        engine's own classes name a bug in the poke's own code instead — a bad
 *        property read, an unbound name, a bad range — and no provider raises them
 *        through the sdk, which wraps a raw `fetch failed` into `APIConnectionError`
 *
 * .note = NAMES, never class identities. `instanceof` fails across a vm realm
 *         (a jest sandbox, a worker), so an identity check would read a same-named
 *         defect from another realm as a provider fault — or a provider fault as a
 *         non-error — and this subsystem already paid for that once
 *         (`killChildIfAlive`, `isErrorOfAbsence`). the shape is realm-free
 */
const NAMES_OF_CODE_DEFECT = new Set([
  'TypeError',
  'ReferenceError',
  'SyntaxError',
  'RangeError',
]);

/**
 * .what = true when a poke's throw is a fault the prime may record and survive
 * .why = the per-poke catch must allowlist what it absorbs (rule.forbid.failhide).
 *        a provider fault is the class the loop is built to outlive; a defect in
 *        the poke's own code is not, and must fail loud as itself rather than sit
 *        in the ledger misnamed as the provider's
 *
 * .note = the allowlist is read off the SHAPE: an object with a string `message`
 *         whose `name` is not a code-defect name. a thrown primitive carries no
 *         shape a fault row could quote, so it still rethrows
 */
export const isErrorOfPokeFault = (input: { error: unknown }): boolean => {
  // only an error-shaped throw can be a provider fault a row can name
  if (typeof input.error !== 'object' || input.error === null) return false;
  // .note = the `as` reads field NAMES off a caught value already proven an object above;
  //         every field is typed `unknown`, so the `typeof` checks below are the gate
  const shape = input.error as { name?: unknown; message?: unknown };
  if (typeof shape.message !== 'string') return false;

  // a brain-fault name is the provider's, by name — never by absence from the defect list
  if (typeof shape.name === 'string' && NAMES_OF_BRAIN_FAULT.has(shape.name))
    return true;

  // a code-defect name is a bug in our own poke, never the provider's
  return !(
    typeof shape.name === 'string' && NAMES_OF_CODE_DEFECT.has(shape.name)
  );
};
