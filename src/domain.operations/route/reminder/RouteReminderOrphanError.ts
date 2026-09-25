import { UnexpectedCodePathError } from 'helpful-errors';

/**
 * .what = the RouteReminder ORPHAN fault — a daemon was spawned but could NOT be reaped, so a live
 *         detached process is loose: it nudges forever, unaddressable by get/del.
 * .why = this is the ONE reminder fault the auto-wire (stepRouteDrive) must NOT swallow — a loose
 *        process cannot self-correct, so the drive must fail loud and a human must act. it is a
 *        DEDICATED type so the fault-guard discriminates it by its OWN identity, NOT by the base
 *        UnexpectedCodePathError. that distinction is load-critical: a MALFORMED pid handle
 *        (readRouteReminderRawPid) and a TORN passage line (getAllPassageReportsRaw) ALSO throw
 *        UnexpectedCodePathError, but those leave NO process loose — they must be surfaced loud yet
 *        let the drive proceed, never brick route.drive on every boot/stop. a guard keyed on this
 *        subtype (not the base) isolates the reminder's one un-proceedable fault from its benign
 *        ones (rule.forbid.behavior-hazards — the reminder's failure stays scoped to the reminder).
 *
 * .note = it extends UnexpectedCodePathError, so any generic `instanceof UnexpectedCodePathError`
 *         checks elsewhere still treat it as an unexpected code path; only the auto-wire's guard
 *         narrows to this subtype to decide propagate-vs-proceed.
 */
export class RouteReminderOrphanError extends UnexpectedCodePathError {}
