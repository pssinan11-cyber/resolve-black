/**
 * Custom hook for consistent error handling across the application
 * 
 * Usage:
 * ```tsx
 * const handleError = useErrorHandler();
 * 
 * try {
 *   await someAsyncOperation();
 * } catch (error) {
 *   handleError(error, 'Failed to perform operation');
 * }
 * ```
 */

import { toast } from 'sonner';
import { ERROR_MESSAGES } from '@/lib/constants';

export function useErrorHandler() {
  const handleError = (
    error: unknown,
    fallbackMessage: string = ERROR_MESSAGES.generic
  ): void => {
    console.error('Error caught:', error);

    // Handle different error types
    if (error instanceof Error) {
      // Network errors
      if (error.message.includes('fetch') || error.message.includes('network')) {
        toast.error(ERROR_MESSAGES.network);
        return;
      }

      // Authentication errors
      if (error.message.includes('auth') || error.message.includes('unauthorized')) {
        toast.error(ERROR_MESSAGES.authentication);
        return;
      }

      // Authorization errors
      if (error.message.includes('permission') || error.message.includes('forbidden')) {
        toast.error(ERROR_MESSAGES.authorization);
        return;
      }

      // Display the error message if available
      toast.error(error.message || fallbackMessage);
    } else if (typeof error === 'string') {
      toast.error(error);
    } else {
      toast.error(fallbackMessage);
    }
  };

  return handleError;
}

/**
 * Async error handler for use with promises
 * 
 * Usage:
 * ```tsx
 * const handleAsync = useAsyncErrorHandler();
 * 
 * await handleAsync(
 *   async () => {
 *     // async operation
 *   },
 *   'Custom error message'
 * );
 * ```
 */
export function useAsyncErrorHandler() {
  const handleError = useErrorHandler();

  const handleAsync = async <T>(
    operation: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> => {
    try {
      return await operation();
    } catch (error) {
      handleError(error, errorMessage);
      return null;
    }
  };

  return handleAsync;
}
