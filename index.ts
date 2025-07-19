#! /usr/bin/env bun

import { createPal } from "./src/app"
import { createLocalContext } from "./src/context"

let context = createLocalContext(3)
try {
  const cli = createPal(context)
  await cli.parseAsync(process.argv)
} catch (error) {
 context.logger.error(error)
} finally {
  context.close()
}