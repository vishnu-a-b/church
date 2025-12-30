'use client';

import Select, { StylesConfig } from 'react-select';

export interface SelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
}

const customStyles: StylesConfig<SelectOption, false> = {
  control: (provided, state) => ({
    ...provided,
    minHeight: '42px',
    borderColor: state.isFocused ? '#10b981' : '#d1d5db',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none',
    '&:hover': {
      borderColor: '#10b981',
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? '#10b981'
      : state.isFocused
      ? '#d1fae5'
      : 'white',
    color: state.isSelected ? 'white' : '#1f2937',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: '#059669',
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#9ca3af',
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#1f2937',
  }),
};

export default function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  required = false,
  disabled = false,
  className = '',
  error,
}: SearchableSelectProps) {
  const selectedOption = options.find((opt) => opt.value === value) || null;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <Select<SelectOption>
        value={selectedOption}
        onChange={(option) => onChange(option?.value || '')}
        options={options}
        placeholder={placeholder}
        isDisabled={disabled}
        isClearable={!required}
        isSearchable
        styles={customStyles}
        className="react-select-container"
        classNamePrefix="react-select"
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

// Also export as named export for convenience
export { SearchableSelect };
