import winston, { Logger, verbose } from 'winston';
import { ScriptManager } from './data/scriptManager';
import { type LLMService, GeminiLLM } from './data/llm';
import { UserInteraction } from './data/interaction';


export interface LocalContext {
  readonly process: NodeJS.Process;
  readonly logger: Logger;
  readonly scriptManager: ScriptManager;
  readonly llmService: LLMService;
  readonly userInteraction: UserInteraction;
  close: Function;
}

function logLevel(verbosityCount: number):string {
  if (verbosityCount >= 3) {
    return "verbose"
  } else if (verbosityCount == 2) {
    return 'info'
  } else if (verbosityCount) {
    return 'warn'
  }
  return 'error'
}

export async function createLocalContext(verboseCount: number): Promise<LocalContext>{
  const logger = winston.createLogger({
    silent: !verboseCount,
    level: logLevel(verboseCount),
    format: winston.format.combine(
      winston.format.simple(),
      winston.format.colorize({ all: true }),
    ),
    transports: [new winston.transports.Console()],
  });
  const scriptManager = await ScriptManager.create();
  const llmService = new GeminiLLM();
  const userInteraction = new UserInteraction();
  let context: LocalContext = {
    process,
    logger,
    scriptManager,
    llmService,
    userInteraction,
    close: () => {
      userInteraction.close()
    }
  }
  return context
}