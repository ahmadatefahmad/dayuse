export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message)
  }
}

// Thrown when the request never reached the server (offline, DNS, CORS...).
export class NetworkError extends Error {}

// Client-side JSON fetch that throws ApiError carrying the server's `error` message and `code`.
// A 401 means the session expired: send the user to sign in, then back to this page.
export async function apiFetch<T>(url: string, init: Omit<RequestInit, 'body'> & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init
  let res: Response
  try {
    res = await fetch(url, {
      ...rest,
      headers: json === undefined ? headers : { 'Content-Type': 'application/json', ...headers },
      body: json === undefined ? undefined : JSON.stringify(json),
    })
  } catch {
    throw new NetworkError('Can’t reach the server. Check your connection and try again.')
  }
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    const next = window.location.pathname + window.location.search
    window.location.assign(`/login?error=session_expired&next=${encodeURIComponent(next)}`)
  }
  if (!res.ok) throw new ApiError(data.error ?? `Request failed (${res.status})`, res.status, data.code)
  return data as T
}
