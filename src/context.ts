import winston, { Logger, verbose } from 'winston';
import { ManifestManager } from './data/manifest';
import { MockLLMService } from './data/llm';
import { UserInteraction } from './data/interaction';


export interface LocalContext {
  readonly process: NodeJS.Process;
  readonly logger: Logger;
  readonly manifestManager: ManifestManager;
  readonly llmService: MockLLMService;
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
  const manifestManager = await ManifestManager.create();
  const llmService = new MockLLMService();
  const userInteraction = new UserInteraction();
  let context: LocalContext = {
    process,
    logger,
    manifestManager,
    llmService,
    userInteraction,
    close: () => {
      userInteraction.close()
    }
  }
  return context
}