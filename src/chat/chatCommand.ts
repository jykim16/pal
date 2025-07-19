import type { Command } from "commander";
import chatHandler from "./chatHandler";
import type { LocalContext } from "../context";


export function addChatCommand(pal: Command, context: LocalContext):Command {
  pal.command('chat')
  .description("Chat with pal AI to generate and execute commands")
  .option("--vibe", "Execute the generated command immediately without confirmation")
  .argument('[prompt...]', 'Ask pal what you need')
  .action(async (prompt: string[], options: { vibe?: boolean }) => {
    await chatHandler({ prompt: prompt.join(" "), vibe: options.vibe, context});
  });
  return pal;
}