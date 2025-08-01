import { ManifestManager, type Command } from "../../data/manifest";
import { MockLLMService } from "../../data/llm";
import { UserInteraction } from "../../data/interaction";
import { spawn } from "node:child_process";
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
    const relevantScripts = await context.manifestManager.findRelevantScripts(prompt);
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
    context.manifestManager.executeCommand(execCommand, context)
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
    const scriptContent = await context.llmService.generateScript(prompt);
    // Generate script name from prompt
    const scriptName = context.manifestManager.generateScriptName(prompt);
    // Save to temporary directory
    const scriptPath = await context.manifestManager.saveScript(scriptName, scriptContent, context);
    // Generate description
    const description = await context.llmService.generateDescription(scriptName, scriptContent);
    // Show the generated script
    context.process.stdout.write(`\nGenerated script:\nName: ${scriptName}\nDescription: ${description}\nPath: ${scriptPath}\n\nScript content:\n${scriptContent}\n`);
    // Ask for confirmation to execute
    const confirmed = await context.userInteraction.confirm(
      `Would you like to execute this generated script?`
    );
    if (confirmed) {
      context.process.stdout.write(`Executing script: ${scriptName}\n`);
      await executeScript(scriptPath, context);
      // Ask if user wants to save the script
    } else {
      context.process.stdout.write("Execution cancelled.\n");
    }
  } catch (error) {
    context.process.stderr.write(`Error generating script: ${error}\n`);
  }
}

async function executeScript(scriptPath: string, context: LocalContext): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("bash", [scriptPath], {
      stdio: "inherit",
      cwd: context.process.cwd(),
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });
    child.on("error", (error) => {
      reject(error);
    });
  });
}

