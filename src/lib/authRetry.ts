export const isAuthNetworkError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  return /Failed to fetch/i.test(error.message);
};

export const withAuthNetworkRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 1,
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isAuthNetworkError(error) || attempt === maxRetries) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
    }
  }

  throw lastError;
};

export const getReadableAuthError = (error: unknown): string => {
  if (isAuthNetworkError(error)) {
    return "Unable to reach the authentication server. Please check internet/VPN/ad blocker and try again.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
};
