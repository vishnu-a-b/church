import { toast, ToastOptions, Id, UpdateOptions } from 'react-toastify';

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'default';

interface ToastServiceOptions extends ToastOptions {
  type?: ToastType;
}

class ToastService {
  private defaultOptions: ToastOptions = {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  };

  /**
   * Add a new toast notification
   * @param message - The message to display
   * @param options - Toast configuration options
   * @returns Toast ID that can be used to modify or delete the toast
   */
  add(message: string, options?: ToastServiceOptions): Id {
    const { type = 'default', ...restOptions } = options || {};
    const toastOptions = { ...this.defaultOptions, ...restOptions };

    switch (type) {
      case 'success':
        return toast.success(message, toastOptions);
      case 'error':
        return toast.error(message, toastOptions);
      case 'info':
        return toast.info(message, toastOptions);
      case 'warning':
        return toast.warning(message, toastOptions);
      default:
        return toast(message, toastOptions);
    }
  }

  /**
   * Add a success toast
   */
  success(message: string, options?: ToastOptions): Id {
    return this.add(message, { ...options, type: 'success' });
  }

  /**
   * Add an error toast
   */
  error(message: string, options?: ToastOptions): Id {
    return this.add(message, { ...options, type: 'error' });
  }

  /**
   * Add an info toast
   */
  info(message: string, options?: ToastOptions): Id {
    return this.add(message, { ...options, type: 'info' });
  }

  /**
   * Add a warning toast
   */
  warning(message: string, options?: ToastOptions): Id {
    return this.add(message, { ...options, type: 'warning' });
  }

  /**
   * Modify an existing toast
   * @param toastId - The ID of the toast to modify
   * @param message - The new message
   * @param options - Updated toast configuration options
   */
  modify(toastId: Id, message: string, options?: ToastServiceOptions): void {
    const { type = 'default', ...restOptions } = options || {};
    const updateOptions: UpdateOptions = {
      render: message,
      type: type,
      ...restOptions,
    };

    toast.update(toastId, updateOptions);
  }

  /**
   * Delete/dismiss a toast
   * @param toastId - The ID of the toast to delete
   */
  delete(toastId: Id): void {
    toast.dismiss(toastId);
  }

  /**
   * Delete/dismiss all toasts
   */
  deleteAll(): void {
    toast.dismiss();
  }

  /**
   * Check if a toast is active
   * @param toastId - The ID of the toast to check
   */
  isActive(toastId: Id): boolean {
    return toast.isActive(toastId);
  }

  /**
   * Add a promise-based toast that shows loading, success, or error states
   * @param promise - The promise to track
   * @param messages - Messages for pending, success, and error states
   */
  promise<T>(
    promise: Promise<T>,
    messages: {
      pending: string;
      success: string;
      error: string;
    },
    options?: ToastOptions
  ): Promise<T> {
    return toast.promise(
      promise,
      messages,
      { ...this.defaultOptions, ...options }
    ) as Promise<T>;
  }
}

// Export a singleton instance
export const toastService = new ToastService();

// Export the class for testing or custom instances
export default ToastService;
