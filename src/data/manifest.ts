import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface CommandManifestEntry {
  path: string;
  description: string;
  parameters: Record<string, string>;
  tags?: string[];
}

export interface CommandManifest {
  commands: {[path:string]: CommandManifestEntry};
  lastUpdated: string;
}
export class ManifestManager {
  private readonly manifestPath: string;
  private readonly commandDir: string;
  private manifest: CommandManifest;

  private constructor(commandDir: string, manifestPath: string, manifest: CommandManifest) {
    this.commandDir = commandDir;
    this.manifestPath = manifestPath;
    this.manifest = manifest;
  }

  public static async create(): Promise<ManifestManager> {
    const homeDir = os.homedir();
    const commandDir = path.join(homeDir, ".pal", "command");
    const manifestPath = path.join(commandDir, ".commandManifest.json");
    await this.ensureDirectories(commandDir);
    return new ManifestManager(commandDir, manifestPath, await this.readManifest(manifestPath));
  }
  getCommandManifestEntry(path: string): CommandManifestEntry | undefined {
    return this.manifest.commands[path]
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

  async findRelevantScripts(prompt: string): Promise<CommandManifestEntry[]> {
    // Simple keyword matching for now - this could be enhanced with semantic search
      const promptLower = prompt.toLowerCase();
      const promptWords = promptLower.split(/\s+/);
    const relevantCommands = Object.keys(this.manifest.commands).filter((path) => {
      return promptWords.some((word) => path.includes(word));
    });
    return relevantCommands.map(key => this.manifest.commands[key]!);
  }

  async addCommand(entry: CommandManifestEntry): Promise<void> {
    this.manifest.commands[entry.path] = entry;
    await this.writeManifest(this.manifest);
  }

  async saveTemporaryScript(
    scriptName: string,
    content: string,
  ): Promise<string> {
    const scriptPath = path.join(this.commandDir, `${scriptName}.sh`);
    await fs.promises.writeFile(scriptPath, content, { mode: 0o755 });
    return scriptPath;
  }
}
