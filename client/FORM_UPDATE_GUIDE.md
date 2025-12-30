# Form Update Guide: Toast Notifications & Auto-Clear

This guide shows how to update all forms to use toast notifications instead of alerts and automatically clear forms after successful operations.

## ✅ Already Updated
- ✅ **Units Page** - Complete example implementation

## 📋 Pages to Update
- Members
- Houses
- Bavanakutayimas
- Transactions
- Users
- Campaigns
- Activities

---

## Step-by-Step Update Instructions

### 1. Update Imports

**Keep roleApi but add toast service:**
```typescript
import { createRoleApi } from '@/lib/roleApi';
import { toastService } from '@/lib/toastService';
```

**Note:** We keep using `createRoleApi` because it handles role-specific token storage that the app uses.

---

### 2. Define Initial Form State

**Before:**
```typescript
export default function MyPage() {
  const [formData, setFormData] = useState({
    field1: '',
    field2: '',
  });
```

**After:**
```typescript
// Define outside component for reusability
const initialFormState = {
  field1: '',
  field2: '',
};

export default function MyPage() {
  const [formData, setFormData] = useState(initialFormState);
```

---

### 3. Keep API Instance

**Keep this:**
```typescript
const api = createRoleApi('church_admin'); // Keep for role-specific auth
```

---

### 4. Add Toast Error Handling to fetchData

**Before:**
```typescript
const fetchData = async () => {
  const response = await api.get('/endpoint');
  setData(response.data?.data || []);
};
```

**After:**
```typescript
const fetchData = async () => {
  try {
    const response = await api.get('/endpoint');
    setData(response.data?.data || []);
  } catch (error) {
    console.error('Error fetching data:', error);
    toastService.error('Failed to load data');
  }
};
```

---

### 5. Update handleSubmit with Toast Notifications

**Before:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    if (editingItem) {
      await api.put(`/endpoint/${editingItem._id}`, formData);
    } else {
      await api.post('/endpoint', formData);
    }
    setShowModal(false);
    setEditingItem(null);
    resetForm();
    fetchData();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Operation failed'); // ❌ REMOVE ALERT
  }
};
```

**After:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const toastId = toastService.info(editingItem ? 'Updating...' : 'Creating...');

  try {
    if (editingItem) {
      await api.put(`/endpoint/${editingItem._id}`, formData);
      toastService.modify(toastId, 'Updated successfully!', { type: 'success' });
    } else {
      await api.post('/endpoint', formData);
      toastService.modify(toastId, 'Created successfully!', { type: 'success' });
    }

    setShowModal(false);
    setEditingItem(null);
    resetForm();
    fetchData();
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Operation failed';
    toastService.modify(toastId, errorMsg, { type: 'error' });
  }
};
```

---

### 6. Update handleDelete with Toast Notifications

**Before:**
```typescript
const handleDelete = async (id: string) => {
  if (!confirm('Are you sure?')) return; // ❌ REMOVE CONFIRM
  try {
    await api.delete(`/endpoint/${id}`);
    fetchData();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Delete failed'); // ❌ REMOVE ALERT
  }
};
```

**After:**
```typescript
const handleDeleteItem = async (id: string) => {
  if (!confirm('Are you sure you want to delete this item?')) return;

  const toastId = toastService.info('Deleting...');

  try {
    await api.delete(`/endpoint/${id}`);
    toastService.modify(toastId, 'Deleted successfully!', { type: 'success' });
    fetchData();
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || 'Delete failed';
    toastService.modify(toastId, errorMsg, { type: 'error' });
  }
};
```

**Also update the button onClick:**
```typescript
// Before
<button onClick={() => handleDelete(item._id)}>Delete</button>

// After
<button onClick={() => handleDeleteItem(item._id)}>Delete</button>
```

---

### 7. Update resetForm Function

**Before:**
```typescript
const resetForm = () => {
  setFormData({ field1: '', field2: '' });
};
```

**After:**
```typescript
const resetForm = () => {
  setFormData(initialFormState);
};
```

---

## Complete Example Comparison

### BEFORE (❌ Old Way)
```typescript
'use client';
import { useState } from 'react';
import { createRoleApi } from '@/lib/roleApi';

export default function MembersPage() {
  const api = createRoleApi('church_admin');
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/members', formData);
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      alert('Operation failed'); // ❌
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return; // ❌
    try {
      await api.delete(`/members/${id}`);
      fetchData();
    } catch (error) {
      alert('Delete failed'); // ❌
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '' }); // Not using initial state
  };
}
```

### AFTER (✅ New Way)
```typescript
'use client';
import { useState } from 'react';
import { memberService } from '@/lib/apiServices';
import { handleSave, handleDelete, closeModalAndReset } from '@/lib/formHelpers';

const initialFormState = { name: '', email: '' };

export default function MembersPage() {
  const [formData, setFormData] = useState(initialFormState);
  const [editingMember, setEditingMember] = useState(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await handleSave(
      () => editingMember
        ? memberService.update(editingMember._id, formData)
        : memberService.create(formData),
      {
        isEditing: !!editingMember,
        entityName: 'Member',
        onSuccess: () => {
          closeModalAndReset(setShowModal, resetForm, setEditingMember);
          fetchData();
        },
        resetForm,
      }
    );
  };

  const handleDeleteMember = async (id: string) => {
    await handleDelete(
      () => memberService.delete(id),
      {
        entityName: 'Member',
        onSuccess: fetchData,
      }
    );
  };

  const resetForm = () => {
    setFormData(initialFormState);
  };
}
```

---

## Service Mapping

Use these services based on your page:

| Page | Service Import |
|------|---------------|
| Units | `unitService` |
| Bavanakutayimas | `bavanakutayimaService` |
| Houses | `houseService` |
| Members | `memberService` |
| Users | `userService` |
| Transactions | `transactionService` |
| Campaigns | `campaignService` |
| Activities | `spiritualActivityService` |
| Churches | `churchService` |

---

## Benefits

✅ **Toast Notifications** - Better UX than alerts
✅ **Auto-clear Forms** - Forms reset after success
✅ **Consistent Error Handling** - Same pattern everywhere
✅ **Loading States** - Visual feedback during operations
✅ **Less Code** - Reusable utilities
✅ **Type Safety** - Full TypeScript support

---

## Testing Checklist

After updating a page, test:

- [ ] Create new item - shows success toast & clears form
- [ ] Edit item - shows update toast & clears form
- [ ] Delete item - shows confirmation & success toast
- [ ] Error handling - shows error toast
- [ ] Form validation - shows warning toast
- [ ] Modal closes after success
- [ ] Data refreshes after operations

---

## Need Help?

See the **Units page** (`client/app/church-admin/dashboard/units/page.tsx`) for a complete working example!
