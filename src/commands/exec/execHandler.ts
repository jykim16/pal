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
  const {stdout, stderr} = context.process
  context.logger.info(`prompt is: ${prompt}`)
  context.logger.info(`path is: ${path}`)
  context.logger.info(`arg is: ${args}`)
  if (prompt || !path) {
    //TODO: finish from LLM: determine 'path' from 'prompt'
    stderr.write(`prompt handling not implemented yet\n`)
    return
  }
  const pathDetails = context.manifestManager.getCommandManifestEntry(path)
  if (!pathDetails) {
    stderr.write(`the command does not exist in path '${path}'\n`)
    return
  } else {
    if (!Object.keys(pathDetails.parameters).length || args) {
      stdout.write("Executing script\n")
      await executeScript(pathDetails.path, args || "", context)
      return
    }
  }
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