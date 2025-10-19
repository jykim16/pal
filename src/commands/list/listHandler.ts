import type { LocalContext } from "../../context";

interface ListHandlerOptions {
  context: LocalContext;
}

export default async function listHandler({ context }: ListHandlerOptions): Promise<void> {
  const commands = context.scriptManager.getAllCommands();
  
  if (commands.length === 0) {
    context.process.stdout.write("No scripts found.\n");
    return;
  }

  context.process.stdout.write(`Found ${commands.length} script(s):\n\n`);
  
  for (const command of commands) {
    context.process.stdout.write(`${command.name}\n`);
    context.process.stdout.write(`  ${command.description}\n\n`);
  }
}
