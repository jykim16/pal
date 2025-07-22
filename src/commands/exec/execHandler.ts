import { spawn } from "node:child_process";
import type { LocalContext } from "../../context";

interface ExecOptions {
  prompt: string;
  path?: string;
  args?: string;
  context: LocalContext;
}

export default async function execHandler(options: ExecOptions): Promise<void> {
  let { prompt, path, args, context } = options;
  const {stdout} = context.process
  if (prompt) {
    if (!path) {
      path = await findScript(prompt)
      // find script based on prompt
    }
    if (!args) {
      args = await setArgs(path, prompt)
      //  set args based on prompt
    }
  }
  executeScript(path||"", args||"", context)
}

async function findScript(prompt: string):Promise<string> {
  console.log("TODO find script")
  return ""
}

async function setArgs(scriptPath: string, prompt: string) {
  console.log("TODO set args")
  return ""
}

async function executeScript(scriptPath: string, args: string, context: LocalContext): Promise<void> {
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