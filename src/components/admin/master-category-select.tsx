"use client";
import { MASTER_CATEGORIES, type MasterCategorySlug } from "@/lib/categories";
type MasterCategorySelectProps = {
  value: string;
  onChange: (value: MasterCategorySlug) => void;
  id?: string;
  name?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string | null;
};
export function MasterCategorySelect({
  value,
  onChange,
  id = "category",
  name = "category",
  label = "Category",
  required = true,
  disabled = false,
  className = "",
  error,
}: MasterCategorySelectProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-700">
        {label}
        {required ? (
          <span className="ml-1 text-red-600" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value as MasterCategorySlug)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
      >
        <option value="" disabled>
          Select category
        </option>
        {MASTER_CATEGORIES.map((category) => (
          <option key={category.slug} value={category.slug}>
            {category.name}
          </option>
        ))}
      </select>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
