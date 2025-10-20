import { type Command } from "../../data/scriptManager";
import type { LocalContext } from "../../context";

interface ChatOptions {
  prompt: string;
  vibe?: boolean;
  context: LocalContext;
}

export default async function chatHandler(options: ChatOptions): Promise<void> {
  const { prompt, vibe, context } = options;
  const {stdout} = context.process
  if (!prompt) {
    stdout.write("Interactive mode not yet implemented. Please provide a prompt.");
    return;
  }

  if (vibe) {
    stdout.write("Vibe mode not yet implemented.");
    return;
  }

  // Prompt mode implementation
  await handlePromptMode(prompt, context);
}

async function handlePromptMode(
  prompt: string,
  context: LocalContext
): Promise<void> {
  try {
    // Check if a relevant script exists
    const relevantScripts = await context.scriptManager.findRelevantScripts(prompt);
    if (relevantScripts.length > 0) {
      await handleExistingScript(relevantScripts[0]!, context);
    } else {
      await handleNewScript(prompt, context);
    }
  } catch (error) {
    context.process.stderr.write(`Error in prompt mode: ${error}\n`);
  }
}

async function handleExistingScript(
  script: Command,
  context: LocalContext
): Promise<void> {
  const execCommand = `pal exec --path ${script.name}`;
  const message = `Found a relevant script: "${script.name}"
Description: ${script.description}
\nWould you like to execute: ${execCommand}`;
  const confirmed = await context.userInteraction.confirm(message);
  if (confirmed) {
    context.process.stdout.write(`Executing: ${execCommand}\n`);
    context.scriptManager.executeCommand(execCommand, context)
  } else {
    context.process.stdout.write("Execution cancelled.\n");
  }
}

async function handleNewScript(
  prompt: string,
  context: LocalContext
): Promise<void> {
  context.process.stdout.write("No relevant script found. Generating a new script...\n");
  try {
    // Generate script using LLM
    const generatePrompt = `Generate a bash script that will fulfill the following request:${prompt}. Provide the script's content as plain text, with no markdown or additional information. Only provide the script's contents, without any \`\`\`bash or other formatting.`;
    const scriptContent = await context.llmService.generate([{role: "user", content: generatePrompt}], {model: "gemini-2.0-flash"});
    // Generate script name from prompt
    const scriptName = context.scriptManager.generateScriptName(prompt);
    const describeScript = `Describe this script in a few sentences: ${scriptContent.content}`;
    const scriptDescription = await context.llmService.generate([{role: "user", content: describeScript}], {model: "gemini-2.0-flash"});
    // Save to temporary directory
    const scriptPath = await context.scriptManager.saveScript(scriptName, scriptDescription.content, scriptContent.content, context);
    // Show the generated script
    context.process.stdout.write(`\nGenerated script:\nName: ${scriptName}\nDescription: ${scriptDescription.content}\nPath: ${scriptPath}\n\nScript content:\n${scriptContent.content}\n`);
    // Ask for confirmation to execute
    const confirmed = await context.userInteraction.confirm(
      `Would you like to execute this generated script?`
    );
    if (confirmed) {
      context.process.stdout.write(`Executing script: ${scriptName}\n`);
      await context.scriptManager.executeCommand("~/.pal/command/" + scriptPath, context);
      // Ask if user wants to save the script
    } else {
      context.process.stdout.write("Execution cancelled.\n");
    }
  } catch (error) {
    context.process.stderr.write(`Error generating script: ${error}\n`);
  }
}
