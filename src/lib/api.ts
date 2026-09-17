import { appConfig } from './config';

export type BackendHealth = {
  status: 'checking' | 'reachable' | 'unreachable';
  detail: string;
  checkedAt: Date | null;
};

export async function checkBackendHealth(signal?: AbortSignal): Promise<BackendHealth> {
  try {
    const response = await fetch(`${appConfig.apiBaseUrl}/health/live`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });

    if (!response.ok) {
      return {
        status: 'unreachable',
        detail: `Backend returned HTTP ${response.status}`,
        checkedAt: new Date(),
      };
    }

    return {
      status: 'reachable',
      detail: 'Backend liveness endpoint responded successfully',
      checkedAt: new Date(),
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }

    return {
      status: 'unreachable',
      detail: error instanceof Error ? error.message : 'Backend request failed',
      checkedAt: new Date(),
    };
  }
}
