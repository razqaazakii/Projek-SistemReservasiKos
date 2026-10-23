import React from 'react';

export interface OptionType {
  label: string;
  value: string | number;
}

// Pisahkan 'type' HTML yang valid dari 'field variant' untuk render mode
type InputType = 'text' | 'email' | 'tel' | 'date' | 'number';
type FieldVariant = InputType | 'select' | 'textarea';

export interface InputFieldProps {
  id: string;
  name: string;
  label: string;
  // Gunakan FieldVariant — bukan mencampur HTML type dengan render mode
  type?: FieldVariant;
  value: string | number;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  onBlur?: (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  options?: OptionType[];
  rows?: number;
  min?: string | number;
  max?: string | number;
  className?: string;
}

export default function InputField({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  error,
  helperText,
  options = [],
  rows = 3,
  min,
  max,
  className = '',
}: InputFieldProps) {
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;
  const hasError = Boolean(error);

  // Komputasi aria-describedby sekali — tidak diulang di setiap branch render
  const ariaDescribedBy = hasError ? errorId : helperText ? helperId : undefined;

  const baseInputStyles = [
    'w-full px-3.5 py-2.5 rounded-lg border text-base transition-colors duration-150',
    'placeholder:text-slate-400 focus:outline-none focus:ring-2',
    hasError
      ? 'border-red-500 bg-red-50/50 text-slate-900 focus:border-red-600 focus:ring-red-500'
      : 'border-slate-300 bg-white text-slate-900 focus:border-blue-600 focus:ring-blue-500',
    'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
  ].join(' ');

  // Shared props untuk semua tipe field — hindari duplikasi
  const sharedProps = {
    id,
    name,
    onChange,
    onBlur,
    required,
    disabled,
    'aria-invalid': hasError ? ('true' as const) : ('false' as const),
    'aria-describedby': ariaDescribedBy,
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={id}
        className="text-sm font-semibold text-slate-900 flex items-center gap-1"
      >
        <span>{label}</span>
        {required && (
          <span className="text-red-600 font-bold" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {type === 'select' ? (
        <select
          {...sharedProps}
          // String() memastikan value aman untuk select meski bertipe number
          value={String(value)}
          className={`${baseInputStyles} cursor-pointer`}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={String(opt.value)} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          {...sharedProps}
          // String() memastikan value aman untuk textarea meski bertipe number
          value={String(value)}
          placeholder={placeholder}
          rows={rows}
          className={baseInputStyles}
        />
      ) : (
        <input
          {...sharedProps}
          // type di sini adalah InputType — nilai yang valid untuk atribut HTML
          type={type as InputType}
          value={value}
          placeholder={placeholder}
          min={min}
          max={max}
          className={baseInputStyles}
        />
      )}

      {helperText && !hasError && (
        <p id={helperId} className="text-xs text-slate-600">
          {helperText}
        </p>
      )}

      {hasError && (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-semibold text-red-600 flex items-center gap-1"
        >
          <svg
            className="w-4 h-4 shrink-0 text-red-600"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
