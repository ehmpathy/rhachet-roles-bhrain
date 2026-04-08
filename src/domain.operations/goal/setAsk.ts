import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

import { Ask } from '@src/domain.objects/Achiever/Ask';

/**
 * .what = appends an ask to asks.inventory.jsonl
 * .why = accumulates peer input with content hash for later triage
 * .note = hash is deterministic — same content yields same hash
 */
export const setAsk = async (input: {
  content: string;
  scopeDir: string;
}): Promise<{ ask: Ask }> => {
  // compute hash from content
  const hash = crypto.createHash('sha256').update(input.content).digest('hex');

  // construct Ask
  const ask = new Ask({
    hash,
    content: input.content,
    receivedAt: new Date().toISOString().split('T')[0] ?? '',
  });

  // ensure goals directory found or created
  await fs.mkdir(input.scopeDir, { recursive: true });

  // append ask as JSON line
  const inventoryPath = path.join(input.scopeDir, 'asks.inventory.jsonl');
  await fs.appendFile(inventoryPath, JSON.stringify(ask) + '\n');

  return { ask };
};
