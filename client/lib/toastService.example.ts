/**
 * Toast Service Usage Examples
 *
 * This file demonstrates how to use the toast service with add, modify, and delete actions.
 */

import { toastService } from './toastService';

// ============================================
// 1. ADD TOAST EXAMPLES
// ============================================

// Basic add with default type
function addBasicToast() {
  toastService.add('This is a basic notification');
}

// Add success toast
function addSuccessToast() {
  toastService.success('Operation completed successfully!');
}

// Add error toast
function addErrorToast() {
  toastService.error('An error occurred!');
}

// Add info toast
function addInfoToast() {
  toastService.info('Here is some information');
}

// Add warning toast
function addWarningToast() {
  toastService.warning('Warning: Please check this!');
}

// Add toast with custom options
function addCustomToast() {
  toastService.add('Custom toast with options', {
    type: 'success',
    autoClose: 5000,
    position: 'bottom-right',
    hideProgressBar: true,
  });
}

// Add toast and save its ID for later modification
function addToastWithId() {
  const toastId = toastService.success('Processing your request...');
  return toastId;
}

// ============================================
// 2. MODIFY TOAST EXAMPLES
// ============================================

// Modify a toast to update its message and type
function modifyToastExample() {
  // First, add a toast
  const toastId = toastService.info('Loading...');

  // After some time, modify it
  setTimeout(() => {
    toastService.modify(toastId, 'Data loaded successfully!', {
      type: 'success',
      autoClose: 3000,
    });
  }, 2000);
}

// Update toast from loading to error
function modifyToastToError() {
  const toastId = toastService.info('Processing payment...');

  setTimeout(() => {
    toastService.modify(toastId, 'Payment failed. Please try again.', {
      type: 'error',
    });
  }, 3000);
}

// ============================================
// 3. DELETE TOAST EXAMPLES
// ============================================

// Delete a specific toast
function deleteToastExample() {
  const toastId = toastService.success('This will disappear in 2 seconds');

  setTimeout(() => {
    toastService.delete(toastId);
  }, 2000);
}

// Delete all toasts
function deleteAllToastsExample() {
  // Add multiple toasts
  toastService.info('Toast 1');
  toastService.warning('Toast 2');
  toastService.success('Toast 3');

  // Delete all after 3 seconds
  setTimeout(() => {
    toastService.deleteAll();
  }, 3000);
}

// ============================================
// 4. PRACTICAL EXAMPLES
// ============================================

// Example: Form submission with toast updates
async function handleFormSubmission(formData: any) {
  const toastId = toastService.info('Submitting form...');

  try {
    // Simulate API call
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      toastService.modify(toastId, 'Form submitted successfully!', {
        type: 'success',
      });
    } else {
      toastService.modify(toastId, 'Submission failed. Please try again.', {
        type: 'error',
      });
    }
  } catch (error) {
    toastService.modify(toastId, 'Network error occurred!', {
      type: 'error',
    });
  }
}

// Example: File upload with progress
async function handleFileUpload(file: File) {
  const toastId = toastService.info('Uploading file...');

  try {
    // Simulate upload
    await uploadFile(file);

    toastService.modify(toastId, 'File uploaded successfully!', {
      type: 'success',
    });

    // Auto-delete after showing success
    setTimeout(() => {
      toastService.delete(toastId);
    }, 2000);
  } catch (error) {
    toastService.modify(toastId, 'Upload failed!', {
      type: 'error',
    });
  }
}

// Example: Using promise toast
async function handleDataFetch() {
  const fetchData = fetch('/api/data').then(res => res.json());

  toastService.promise(fetchData, {
    pending: 'Loading data...',
    success: 'Data loaded successfully!',
    error: 'Failed to load data',
  });
}

// Example: Check if toast is still active
function checkToastActive() {
  const toastId = toastService.success('Check if I am active');

  setTimeout(() => {
    if (toastService.isActive(toastId)) {
      console.log('Toast is still visible');
    } else {
      console.log('Toast has been dismissed');
    }
  }, 2000);
}

// ============================================
// 5. USAGE IN REACT COMPONENTS
// ============================================

// Example React component using toast service
/*
import { toastService } from '@/lib/toastService';

export function MyComponent() {
  const handleClick = () => {
    toastService.success('Button clicked!');
  };

  const handleSave = async () => {
    const toastId = toastService.info('Saving changes...');

    try {
      await saveData();
      toastService.modify(toastId, 'Changes saved!', { type: 'success' });
    } catch (error) {
      toastService.modify(toastId, 'Save failed!', { type: 'error' });
    }
  };

  const handleDelete = () => {
    const toastId = toastService.warning('Are you sure you want to delete?');

    // Delete the confirmation toast after user action
    setTimeout(() => {
      toastService.delete(toastId);
    }, 5000);
  };

  return (
    <div>
      <button onClick={handleClick}>Show Toast</button>
      <button onClick={handleSave}>Save</button>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
}
*/

// Dummy functions for examples
async function uploadFile(file: File): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 2000));
}

async function saveData(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 1000));
}

export {
  addBasicToast,
  addSuccessToast,
  addErrorToast,
  addInfoToast,
  addWarningToast,
  modifyToastExample,
  deleteToastExample,
  deleteAllToastsExample,
  handleFormSubmission,
  handleFileUpload,
  handleDataFetch,
};
