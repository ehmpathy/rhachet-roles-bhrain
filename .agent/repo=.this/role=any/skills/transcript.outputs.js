/**
 * .what = print past tool outputs of a session transcript that match a pattern
 * .why = the transcript's rows are too long for a line search; a verbatim
 *        halt or refusal must be recovered whole
 */
const fs = require('fs');

// parse the flags
const args = process.argv.slice(2);
const getFlag = (name) => {
  const at = args.indexOf(name);
  return at === -1 ? null : (args[at + 1] ?? null);
};
const transcript = getFlag('--transcript');
const pattern = getFlag('--pattern');
const last = getFlag('--last');
if (!transcript || !pattern) {
  console.error('✋ ConstraintError: --transcript and --pattern are required');
  console.error('   usage: rhx transcript.outputs --transcript <path.jsonl> --pattern <regex> [--last N]');
  process.exit(2);
}
if (!fs.existsSync(transcript)) {
  console.error(`✋ ConstraintError: transcript not found: ${transcript}`);
  process.exit(2);
}
if (last !== null && !/^[1-9][0-9]*$/.test(last)) {
  console.error(`✋ ConstraintError: --last must be a positive integer, got ${last}`);
  process.exit(2);
}
const regex = new RegExp(pattern);

// cast one tool_result content into its text
const asTextOfContent = (content) => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content))
    return content.map((part) => (part && part.text) || '').join('');
  return '';
};

// collect every tool_result text that matches
const matches = fs
  .readFileSync(transcript, 'utf8')
  .split('\n')
  .filter((line) => line.trim().length > 0)
  .flatMap((line) => {
    const row = JSON.parse(line);
    const parts = row?.message?.content;
    if (!Array.isArray(parts)) return [];
    return parts
      .filter((part) => part && part.type === 'tool_result')
      .map((part) => asTextOfContent(part.content));
  })
  .filter((text) => regex.test(text));

// emit the newest N, oldest first
const kept = last === null ? matches : matches.slice(-Number(last));
if (kept.length === 0) {
  console.log(`(0 tool outputs match /${pattern}/)`);
  process.exit(0);
}
kept.forEach((text) => {
  console.log('=====');
  console.log(text);
});
