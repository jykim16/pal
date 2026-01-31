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
    // Use LLM to determine the best action
    const action = await determineAction(prompt, context);
    
    switch (action.type) {
      case 'execute_existing':
        const script = await context.scriptManager.getCommandManifestEntry(action.scriptName);
        if (script) {
          await handleExistingScript(script, prompt, context);
        } else {
          await handleNewScript(prompt, context);
        }
        break;
      case 'generate_new':
        await handleNewScript(prompt, context);
        break;
      case 'clarify':
        context.process.stdout.write(`${action.message}\n`);
        break;
    }
  } catch (error) {
    context.process.stderr.write(`Error in prompt mode: ${error}\n`);
  }
}

interface ActionResult {
  type: 'execute_existing' | 'generate_new' | 'clarify';
  scriptName?: string;
  message?: string;
}

async function determineAction(prompt: string, context: LocalContext): Promise<ActionResult> {
  const relevantScripts = await context.scriptManager.findRelevantScripts(prompt, context.llmService);
  
  if (relevantScripts.length === 0) {
    return { type: 'generate_new' };
  }

  const scriptSummary = relevantScripts.map(script => 
    `Name: ${script.name}, Description: ${script.description}`
  ).join('\n');

  const decisionPrompt = `User request: "${prompt}"

Available relevant scripts:
${scriptSummary}

Determine the best action. Respond with JSON in this format:
{
  "type": "execute_existing" | "generate_new" | "clarify",
  "scriptName": "script_name_if_executing",
  "message": "clarification_message_if_needed"
}

Choose "execute_existing" if there's a clear match, "generate_new" if existing scripts don't fit, or "clarify" if the request is ambiguous.`;

  try {
    return await context.llmService.generateStructured([
      { role: "user", content: decisionPrompt }
    ], { model: "gemini-2.0-flash" });
  } catch (error) {
    // Fallback: use first relevant script or generate new
    return relevantScripts.length > 0 
      ? { type: 'execute_existing', scriptName: relevantScripts[0].name }
      : { type: 'generate_new' };
  }
}

async function handleExistingScript(
  script: Command,
  prompt: string,
  context: LocalContext
): Promise<void> {
  const args = await determineScriptArguments(script, prompt, context);
  const execCommand = args 
    ? `pal exec --path ${script.name} --args "${args}"`
    : `pal exec --path ${script.name}`;
  
  const message = `Found a relevant script: "${script.name}"
Description: ${script.description}
${args ? `Arguments: ${args}` : ''}
\nWould you like to execute: ${execCommand}`;
  
  const confirmed = await context.userInteraction.confirm(message);
  if (confirmed) {
    context.process.stdout.write(`Executing: ${execCommand}\n`);
    context.scriptManager.executeCommand(execCommand, context)
  } else {
    context.process.stdout.write("Execution cancelled.\n");
  }
}

async function determineScriptArguments(
  script: Command,
  prompt: string,
  context: LocalContext
): Promise<string | null> {
  if (Object.keys(script.parameters).length === 0) {
    return null;
  }

  const parameterInfo = Object.entries(script.parameters)
    .map(([key, desc]) => `${key}: ${desc}`)
    .join('\n');

  const argPrompt = `User request: "${prompt}"
Script: ${script.name}
Description: ${script.description}

Script parameters:
${parameterInfo}

Based on the user's request, determine appropriate argument values for this script. Return only the argument string that would be passed to the script, or "null" if no arguments are needed.

Example responses: "file.txt" or "directory1 directory2" or "null"`;

  try {
    const response = await context.llmService.generate([
      { role: "user", content: argPrompt }
    ], { model: "gemini-2.0-flash" });
    
    return response.content.trim() === "null" ? null : response.content.trim();
  } catch (error) {
    return null;
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
