import * as fs from 'fs/promises';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';

import { asFulcrumCaseFromFileName } from '../fulcrum/asFulcrumCaseFromFileName';
import { asFulcrumContentWithVerdict } from '../fulcrum/asFulcrumContentWithVerdict';
import { asFulcrumRaisedOnStones } from '../fulcrum/asFulcrumRaisedOnStones';
import { setFulcrumVerdictRow } from '../fulcrum/setFulcrumVerdictRow';
import { getAllPassageReportsRaw } from '../passage/getAllPassageReportsRaw';
import { asFulcrumSeenOfContent } from './asFulcrumSeenOfContent';

/**
 * .what = writes what `rhx route.fulcrum.rule` writes — a ledger row bound to the content, the
 *         live disputes, and the passage-log position, then the yaml verdict — on a fixed date
 * .why = the lever needs a human tty and stamps today's date; a spawned journey holds neither,
 *        and a snapshot must not drift by the day. this derives every bound field from the same
 *        pieces the lever reads, so the fixture cannot fall out of step with the proof it fakes
 */
export const setFulcrumVerdictAsTheLever = async (input: {
  route: string;
  fulcrum: string;
  ruled: 'upheld' | 'conceded';
  on: string;
}): Promise<void> => {
  const fulcrumPath = path.join(input.route, input.fulcrum);
  const content = await fs.readFile(fulcrumPath, 'utf-8');
  const reports = await getAllPassageReportsRaw({ route: input.route });
  const slug = asFulcrumCaseFromFileName({
    name: path.basename(input.fulcrum),
  })?.slug;
  if (!slug)
    throw new UnexpectedCodePathError('the fixture fulcrum names no case', {
      fulcrum: input.fulcrum,
    });
  await setFulcrumVerdictRow({
    route: input.route,
    row: {
      case: slug,
      ruled: input.ruled,
      on: input.on,
      seen: asFulcrumSeenOfContent({ content }),
      held: asFulcrumRaisedOnStones({ reports }).get(slug)?.disputes ?? [],
      after: reports.length,
    },
  });
  const contentNext = asFulcrumContentWithVerdict({
    content,
    ruled: input.ruled,
    on: input.on,
  });
  if (!contentNext)
    throw new UnexpectedCodePathError('the fixture fulcrum takes no verdict', {
      fulcrum: input.fulcrum,
    });
  await fs.writeFile(fulcrumPath, contentNext);
};
