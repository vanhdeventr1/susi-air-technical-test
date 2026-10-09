export interface LoginResponse {
  access_token: string;
}

export interface PilotProfile {
  name: string;
  totalFlightHours: number;
  avatarUrl: string;
}

export function login(
  apiBase: string,
  credentials: { username: string; password: string },
): Promise<LoginResponse> {
  return $fetch<LoginResponse>(`${apiBase}/auth/login`, {
    method: 'POST',
    body: credentials,
  });
}

export function getPilotProfile(
  apiBase: string,
  token: string,
): Promise<PilotProfile> {
  return $fetch<PilotProfile>(`${apiBase}/pilot/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getApiErrorMessage(error: unknown): string {
  if (typeof error !== 'object' || error === null) {
    return 'Unable to sign in. Check your credentials and try again.';
  }

  const data = 'data' in error ? error.data : undefined;
  const message =
    typeof data === 'object' && data !== null && 'message' in data
      ? data.message
      : undefined;

  if (Array.isArray(message)) {
    return message.filter((item): item is string => typeof item === 'string').join(' ');
  }

  return typeof message === 'string'
    ? message
    : 'Unable to sign in. Check your credentials and try again.';
}