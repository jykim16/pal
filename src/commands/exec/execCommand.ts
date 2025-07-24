import type { Command } from "commander";
import execHandler from "./execHandler";
import type { LocalContext } from "../../context";


export function addExecCommand(pal: Command, context: LocalContext):Command {
  pal.command('exec')
  .description("Execute saved scripts with pal")
  .option("--path <path>", "Path to runnable script")
  .option("--args <args>", "Set args for the script")
  .argument('[prompt...]', 'Let pal find the script and set the parameters for you')
  .action(async (prompt: string[], options: { path?: string, args?: string }) => {
    await execHandler({ prompt: prompt.join(" "), path: options.path, args: options.args, context});
  });
  return pal;
}