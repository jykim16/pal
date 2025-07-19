import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface CommandManifestEntry {
  name: string;
  description: string;
  parameters?: Record<string, string>;
  tags?: string[];
}

export interface CommandManifest {
  commands: CommandManifestEntry[];
  lastUpdated: string;
}

export class ManifestManager {
  private readonly manifestPath: string;
  private readonly commandDir: string;
  private readonly tmpDir: string;

  constructor() {
    const homeDir = os.homedir();
    this.commandDir = path.join(homeDir, ".pal", "command");
    this.tmpDir = path.join(this.commandDir, "tmp");
    this.manifestPath = path.join(this.commandDir, ".commandManifest.json");
  }

  async ensureDirectories(): Promise<void> {
    await fs.promises.mkdir(this.commandDir, { recursive: true });
    await fs.promises.mkdir(this.tmpDir, { recursive: true });
  }

  async readManifest(): Promise<CommandManifest> {
    try {
      const data = await fs.promises.readFile(this.manifestPath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      // If manifest doesn't exist, return empty manifest
      return {
        commands: [],
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  async writeManifest(manifest: CommandManifest): Promise<void> {
    await this.ensureDirectories();
    manifest.lastUpdated = new Date().toISOString();
    await fs.promises.writeFile(
      this.manifestPath,
      JSON.stringify(manifest, null, 2),
    );
  }

  async findRelevantScripts(prompt: string): Promise<CommandManifestEntry[]> {
    const manifest = await this.readManifest();
    // Simple keyword matching for now - this could be enhanced with semantic search
    const relevantCommands = manifest.commands.filter((command) => {
      const searchText =
        `${command.name} ${command.description} ${command.tags?.join(" ") || ""}`.toLowerCase();
      const promptLower = prompt.toLowerCase();

      // Check if any word in the prompt appears in the command
      const promptWords = promptLower.split(/\s+/);
      return promptWords.some((word) => searchText.includes(word));
    });

    return relevantCommands;
  }

  async addCommand(entry: CommandManifestEntry): Promise<void> {
    const manifest = await this.readManifest();
    const existingIndex = manifest.commands.findIndex(
      (cmd) => cmd.name === entry.name,
    );

    if (existingIndex >= 0) {
      manifest.commands[existingIndex] = entry;
    } else {
      manifest.commands.push(entry);
    }

    await this.writeManifest(manifest);
  }

  async saveTemporaryScript(
    scriptName: string,
    content: string,
  ): Promise<string> {
    await this.ensureDirectories();
    const scriptPath = path.join(this.tmpDir, `${scriptName}.sh`);
    await fs.promises.writeFile(scriptPath, content, { mode: 0o755 });
    return scriptPath;
  }
}
