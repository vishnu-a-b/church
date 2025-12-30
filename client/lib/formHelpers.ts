import { toastService } from './toastService';

/**
 * Form Helper Utilities
 *
 * Provides consistent form handling with toast notifications
 */

// ============================================
// FORM RESET HELPERS
// ============================================

/**
 * Reset a React form state
 * @param setFormData - React state setter function
 * @param initialState - Initial form state object
 */
export function resetForm<T>(setFormData: React.Dispatch<React.SetStateAction<T>>, initialState: T) {
  setFormData(initialState);
}

/**
 * Reset a native HTML form
 * @param formRef - React ref to form element
 */
export function resetNativeForm(formRef: React.RefObject<HTMLFormElement>) {
  formRef.current?.reset();
}

// ============================================
// CRUD OPERATION HANDLERS
// ============================================

/**
 * Handle create operation with toast feedback
 */
export async function handleCreate<T>(
  apiCall: () => Promise<any>,
  options: {
    entityName: string;
    onSuccess: () => void;
    resetForm?: () => void;
  }
): Promise<boolean> {
  const toastId = toastService.info(`Creating ${options.entityName}...`);

  try {
    const response = await apiCall();

    if (response.data?.success || response.success) {
      toastService.modify(toastId, `${options.entityName} created successfully!`, {
        type: 'success'
      });

      options.onSuccess();
      options.resetForm?.();
      return true;
    } else {
      toastService.modify(toastId, response.data?.error || 'Creation failed', {
        type: 'error'
      });
      return false;
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || 'Creation failed';
    toastService.modify(toastId, errorMessage, { type: 'error' });
    return false;
  }
}

/**
 * Handle update operation with toast feedback
 */
export async function handleUpdate<T>(
  apiCall: () => Promise<any>,
  options: {
    entityName: string;
    onSuccess: () => void;
    resetForm?: () => void;
  }
): Promise<boolean> {
  const toastId = toastService.info(`Updating ${options.entityName}...`);

  try {
    const response = await apiCall();

    if (response.data?.success || response.success) {
      toastService.modify(toastId, `${options.entityName} updated successfully!`, {
        type: 'success'
      });

      options.onSuccess();
      options.resetForm?.();
      return true;
    } else {
      toastService.modify(toastId, response.data?.error || 'Update failed', {
        type: 'error'
      });
      return false;
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || 'Update failed';
    toastService.modify(toastId, errorMessage, { type: 'error' });
    return false;
  }
}

/**
 * Handle delete operation with confirmation and toast feedback
 */
export async function handleDelete(
  apiCall: () => Promise<any>,
  options: {
    entityName: string;
    confirmMessage?: string;
    onSuccess: () => void;
  }
): Promise<boolean> {
  // Show confirmation toast instead of alert
  const confirmMessage = options.confirmMessage || `Are you sure you want to delete this ${options.entityName}?`;

  // Use a custom confirmation - you might want to implement a modal here
  // For now, using browser confirm but styled as a warning toast
  const toastId = toastService.warning(confirmMessage, { autoClose: false });

  // Wait a moment for user to read
  await new Promise(resolve => setTimeout(resolve, 100));

  // Use browser confirm for now (you can replace with a custom modal later)
  const confirmed = window.confirm(confirmMessage);

  // Dismiss the warning toast
  toastService.delete(toastId);

  if (!confirmed) {
    return false;
  }

  const deleteToastId = toastService.info(`Deleting ${options.entityName}...`);

  try {
    const response = await apiCall();

    if (response.data?.success || response.success) {
      toastService.modify(deleteToastId, `${options.entityName} deleted successfully!`, {
        type: 'success'
      });

      options.onSuccess();
      return true;
    } else {
      toastService.modify(deleteToastId, response.data?.error || 'Delete failed', {
        type: 'error'
      });
      return false;
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || 'Delete failed';
    toastService.modify(deleteToastId, errorMessage, { type: 'error' });
    return false;
  }
}

/**
 * Handle save operation (create or update) with toast feedback
 */
export async function handleSave<T>(
  apiCall: () => Promise<any>,
  options: {
    isEditing: boolean;
    entityName: string;
    onSuccess: () => void;
    resetForm?: () => void;
  }
): Promise<boolean> {
  if (options.isEditing) {
    return handleUpdate(apiCall, {
      entityName: options.entityName,
      onSuccess: options.onSuccess,
      resetForm: options.resetForm,
    });
  } else {
    return handleCreate(apiCall, {
      entityName: options.entityName,
      onSuccess: options.onSuccess,
      resetForm: options.resetForm,
    });
  }
}

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Handle API errors with toast notifications
 */
export function handleApiError(error: any, defaultMessage: string = 'An error occurred') {
  const errorMessage = error.response?.data?.error || error.message || defaultMessage;
  toastService.error(errorMessage);
  console.error('API Error:', error);
}

// ============================================
// FORM VALIDATION
// ============================================

/**
 * Show validation error with toast
 */
export function showValidationError(message: string) {
  toastService.warning(message);
}

/**
 * Validate required fields
 */
export function validateRequired(fields: Record<string, any>, fieldNames: string[]): boolean {
  for (const fieldName of fieldNames) {
    if (!fields[fieldName] || fields[fieldName].toString().trim() === '') {
      showValidationError(`${fieldName} is required`);
      return false;
    }
  }
  return true;
}

// ============================================
// MODAL HELPERS
// ============================================

/**
 * Close modal and reset form
 */
export function closeModalAndReset(
  setShowModal: (show: boolean) => void,
  resetFormFn: () => void,
  setEditingItem?: (item: any) => void
) {
  setShowModal(false);
  resetFormFn();
  setEditingItem?.(null);
}
