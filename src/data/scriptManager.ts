import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { LocalContext } from "../context";
import { spawn } from "node:child_process";

export interface Command {
  name: string;
  path: string;
  description: string;
  parameters: Record<string, string>;
  tags?: string[];
}

export interface CommandManifest {
  commands: {[path:string]: Command};
  lastUpdated: string;
}
export class ScriptManager {
  private readonly manifestPath: string;
  private readonly commandDir: string;
  private manifest: CommandManifest;

  private constructor(commandDir: string, manifestPath: string, manifest: CommandManifest) {
    this.commandDir = commandDir;
    this.manifestPath = manifestPath;
    this.manifest = manifest;
  }

  public static async create(): Promise<ScriptManager> {
    const homeDir = os.homedir();
    const commandDir = path.join(homeDir, ".pal", "command");
    const manifestPath = path.join(commandDir, ".commandManifest.json");
    await this.ensureDirectories(commandDir);
    return new ScriptManager(commandDir, manifestPath, await this.readManifest(manifestPath));
  }

  getCommandManifestEntry(path: string): Command | undefined {
    return this.manifest.commands[path]
  }

  getAllCommands(): Command[] {
    return Object.values(this.manifest.commands);
  }

  private static async ensureDirectories(commandDir: string): Promise<void> {
    await fs.promises.mkdir(commandDir, { recursive: true });
  }

  private static async readManifest(manifestPath: string): Promise<CommandManifest> {
    try {
      const data = await fs.promises.readFile(manifestPath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      // If manifest doesn't exist, return empty manifest
      return {
        commands: {},
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  private async writeManifest(manifest: CommandManifest): Promise<void> {
    manifest.lastUpdated = new Date().toISOString();
    await fs.promises.writeFile(
      this.manifestPath,
      JSON.stringify(manifest, null, 2),
    );
  }

  async findRelevantScripts(prompt: string, llmService: any): Promise<Command[]> {
    const commands = this.getAllCommands();
    if (commands.length === 0) return [];

    const commandSummary = commands.map(cmd => 
      `Name: ${cmd.name}, Description: ${cmd.description}`
    ).join('\n');

    const analysisPrompt = `Given this user request: "${prompt}"

Available scripts:
${commandSummary}

Return a JSON array of script names that are relevant to the user's request. Only include scripts that directly match the user's intent. If no scripts are relevant, return an empty array.

Example response: ["scriptName1", "scriptName2"] or []`;

    try {
      const relevantNames = await llmService.generateStructured([
        { role: "user", content: analysisPrompt }
      ], { model: "gemini-2.0-flash" });

      return commands.filter(cmd => relevantNames.includes(cmd.name));
    } catch (error) {
      // Fallback to simple matching if LLM fails
      const promptLower = prompt.toLowerCase();
      return commands.filter(cmd => 
        cmd.name.toLowerCase().includes(promptLower) || 
        cmd.description.toLowerCase().includes(promptLower)
      );
    }
  }

  async addCommand(entry: Command): Promise<void> {
    this.manifest.commands[entry.name] = entry;
    await this.writeManifest(this.manifest);
  }

  async executeCommand(command: string, context: LocalContext): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn("bash", ['-c', command], {
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

  async saveScript(
    scriptName: string,
    description: string,
    scriptContent: string,
    context: LocalContext
  ): Promise<string> {
    try {
      await fs.promises.writeFile(path.join(this.commandDir, scriptName), scriptContent, {mode: 0o755});
      await context.scriptManager.addCommand({
        name: scriptName,
        path: scriptName,
        description,
        parameters: {},
        tags: [],
      });
      context.process.stdout.write(`Script "${scriptName}" saved successfully!\n`);
    } catch (error) {
      context.process.stderr.write(`Error saving script: ${error}\n`);
    }
    return scriptName;
  }

  generateScriptName(prompt: string): string {
    const words = prompt.toLowerCase().split(/\s+/);
    const filteredWords = words.filter(word => word.length > 0);
    if (filteredWords.length === 0) return "defaultScript";
    const firstWord = filteredWords[0];
    const remainingWords = filteredWords.slice(1).map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    );
    return "bash/" + firstWord + remainingWords.join("");
  }
}
