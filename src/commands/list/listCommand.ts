import type { Command } from "commander";
import listHandler from "./listHandler";
import type { LocalContext } from "../../context";

export function addListCommand(pal: Command, context: LocalContext): Command {
  pal.command('list')
    .description("List all saved scripts with descriptions")
    .action(async () => {
      await listHandler({ context });
    });
  return pal;
}
