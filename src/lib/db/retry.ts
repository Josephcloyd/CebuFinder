const TRANSIENT_DATABASE_ERRORS = [
  'connection terminated unexpectedly',
  'server has closed the connection',
  'connection reset',
  'econnreset',
  'econnrefused',
  'connection timeout',
  'connection closed',
]

function isTransientDatabaseError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  return TRANSIENT_DATABASE_ERRORS.some((candidate) => message.includes(candidate))
}

export async function withDatabaseRetry<T>(operation: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (!isTransientDatabaseError(error) || attempt === maxAttempts) throw error

      // Give node-postgres enough time to evict the broken pooled connection.
      await new Promise((resolve) => setTimeout(resolve, attempt * 150))
    }
  }

  throw lastError
}
