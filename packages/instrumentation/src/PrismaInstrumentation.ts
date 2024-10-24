import {
  InstrumentationBase,
  InstrumentationConfig,
  InstrumentationNodeModuleDefinition,
} from '@opentelemetry/instrumentation'
import { PrismaInstrumentationGlobalValue } from '@prisma/internals'

import { ActiveTracingHelper } from './ActiveTracingHelper'
import { GLOBAL_KEY, MODULE_NAME, NAME, VERSION } from './constants'
import { PrismaLayerType } from './types'

export interface PrismaInstrumentationConfig {
  middleware?: boolean
  ignoreLayersTypes?: PrismaLayerType[]
}

type Config = PrismaInstrumentationConfig & InstrumentationConfig

export class PrismaInstrumentation extends InstrumentationBase {
  constructor(config: Config = {}) {
    super(NAME, VERSION, config)
  }

  init() {
    const module = new InstrumentationNodeModuleDefinition(MODULE_NAME, [VERSION])

    return [module]
  }

  enable() {
    const config = this._config as Config

    const globalValue: PrismaInstrumentationGlobalValue = {
      helper: new ActiveTracingHelper({
        traceMiddleware: config.middleware ?? false,
        ignoreLayersTypes: config.ignoreLayersTypes ?? [],
      }),
    }

    global[GLOBAL_KEY] = globalValue
  }

  disable() {
    delete global[GLOBAL_KEY]
  }

  isEnabled() {
    return Boolean(global[GLOBAL_KEY])
  }
}
