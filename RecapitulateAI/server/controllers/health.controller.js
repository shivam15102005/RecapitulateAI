import { getProviderPlan } from '../services/ai/providerRegistry.js';
import { isFaultSimulationEnabled } from '../config/env.js';

export function getHealth(_request, response) {
  response.json({
    status: 'ok',
    service: 'recapitulate-ai-api',
    configuredProviders: getProviderPlan().map((provider) => provider.name),
    faultSimulatorEnabled: isFaultSimulationEnabled(),
  });
}
