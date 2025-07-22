import { ManifestManager } from "../../data/manifest";
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
      await handleExistingScript(relevantScripts[0], context);
    } else {
      await handleNewScript(prompt, context);
    }
  } catch (error) {
    context.process.stderr.write(`Error in prompt mode: ${error}\n`);
  }
}

async function handleExistingScript(
  script: any,
  context: LocalContext
): Promise<void> {
  const execCommand = `pal exec ${script.name}`;
  const message = `Found a relevant script: "${script.name}"
Description: ${script.description}
\nWould you like to execute: ${execCommand}`;
  const confirmed = await context.userInteraction.confirm(message);
  if (confirmed) {
    context.process.stdout.write(`Executing: ${execCommand}\n`);
    // In a real implementation, this would call the exec command
    // TODO: implement pal exec and then run command here
    context.process.stdout.write(`[MOCK] Would execute: ${execCommand}\n`);
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
    const scriptName = generateScriptName(prompt);
    // Save to temporary directory
    const scriptPath = await context.manifestManager.saveTemporaryScript(scriptName, scriptContent);
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
      const saveConfirmed = await context.userInteraction.confirm(
        `Would you like to save this script permanently?`
      );
      if (saveConfirmed) {
        await saveScript(scriptName, description, context);
      }
    } else {
      context.process.stdout.write("Execution cancelled.\n");
    }
  } catch (error) {
    context.process.stderr.write(`Error generating script: ${error}\n`);
  }
}

async function executeScript(scriptPath: string, context: LocalContext): Promise<void> {
  // TODO: implement pal exec --tmp and then run command here
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

async function saveScript(
  scriptName: string,
  description: string,
  context: LocalContext
): Promise<void> {
  try {
    await context.manifestManager.addCommand({
      name: scriptName,
      description,
      tags: [],
    });
    context.process.stdout.write(`Script "${scriptName}" saved successfully!\n`);
  } catch (error) {
    context.process.stderr.write(`Error saving script: ${error}\n`);
  }
}

function generateScriptName(prompt: string): string {
  const words = prompt.toLowerCase().split(/\s+/);
  const filteredWords = words.filter(word => word.length > 0);
  if (filteredWords.length === 0) return "defaultScript";
  const firstWord = filteredWords[0];
  const remainingWords = filteredWords.slice(1).map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  );
  return firstWord + remainingWords.join("");
}
