/**
 * Toast notification utilities
 *
 * Centralized toast notification helpers with consistent styling
 */

import toast from 'react-hot-toast';

/**
 * Show success toast
 */
export function showSuccess(message: string) {
  return toast.success(message, {
    duration: 3000,
  });
}

/**
 * Show error toast with optional retry action
 */
export function showError(message: string, options?: {
  retry?: () => void;
  duration?: number;
}) {
  const toastId = toast.error(message, {
    duration: options?.duration || 5000,
  });

  if (options?.retry) {
    setTimeout(() => {
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Would you like to try again?
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  options.retry!();
                }}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Retry
              </button>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        ),
        { duration: 10000 }
      );
    }, options.duration || 5000);
  }

  return toastId;
}

/**
 * Show info toast
 */
export function showInfo(message: string) {
  return toast(message, {
    icon: 'ℹ️',
    duration: 4000,
  });
}

/**
 * Show loading toast
 */
export function showLoading(message: string) {
  return toast.loading(message);
}

/**
 * Show promise toast (automatically handles loading, success, error)
 */
export function showPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  }
) {
  return toast.promise(promise, messages);
}

/**
 * Dismiss a toast by ID
 */
export function dismissToast(toastId: string) {
  toast.dismiss(toastId);
}

/**
 * Dismiss all toasts
 */
export function dismissAllToasts() {
  toast.dismiss();
}
