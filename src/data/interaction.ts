import readline from "node:readline";

export class UserInteraction {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async confirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.rl.question(`${message} (y/n): `, (answer) => {
        const normalized = answer.toLowerCase().trim();
        resolve(normalized === "y" || normalized === "yes");
      });
    });
  }

  async prompt(message: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(message, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  close(): void {
    this.rl.close();
  }
}
