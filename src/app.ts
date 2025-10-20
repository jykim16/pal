import { Command } from 'commander';
import type { LocalContext } from './context.js';
import { addChatCommand } from './commands/chat/chatCommand.js';
import { addExecCommand } from './commands/exec/execCommand.js';
import { addListCommand } from './commands/list/listCommand.js';

function increaseVerbosity(dummyValue: string, previous: number) {
  return previous + 1;
}

export function createPal(context: LocalContext) {
  const pal = new Command()
    .name('pal')
    .description('Your agentic terminal friend')
    .version('0.0.0')
    .option('-v, --verbose', 'verbosity that can be increased', increaseVerbosity, 0)
  addChatCommand(pal, context)
  addExecCommand(pal, context)
  addListCommand(pal, context)
  return pal;
}