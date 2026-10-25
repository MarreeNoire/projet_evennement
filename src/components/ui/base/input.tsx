"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./input.module.css";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      description,
      error,
      iconLeft,
      iconRight,
      fullWidth = false,
      className,
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const descId = description && !error ? `${inputId}-desc` : undefined;

    return (
      <div className={cn(styles.wrapper, fullWidth && styles.fullWidth, className)}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {required && <span className={styles.required} aria-hidden="true">*</span>}
          </label>
        )}
        <div className={cn(styles.inputWrapper, error && styles.hasError)}>
          {iconLeft && <span className={styles.iconLeft} aria-hidden="true">{iconLeft}</span>}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={errorId || descId}
            className={cn(styles.input, disabled && styles.disabled)}
            {...props}
          />
          {iconRight && <span className={styles.iconRight} aria-hidden="true">{iconRight}</span>}
        </div>
        {error && (
          <p id={errorId} className={styles.error} role="alert">
            {error}
          </p>
        )}
        {description && !error && (
          <p id={descId} className={styles.description}>
            {description}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface TextareaProps extends Omit<InputHTMLAttributes<HTMLTextAreaElement>, "type"> {
  label?: string;
  description?: string;
  error?: string;
  fullWidth?: boolean;
  rows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      description,
      error,
      fullWidth = false,
      rows = 4,
      className,
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).slice(2, 9)}`;
    const errorId = error ? `${textareaId}-error` : undefined;
    const descId = description && !error ? `${textareaId}-desc` : undefined;

    return (
      <div className={cn(styles.wrapper, fullWidth && styles.fullWidth, className)}>
        {label && (
          <label htmlFor={textareaId} className={styles.label}>
            {label}
            {required && <span className={styles.required} aria-hidden="true">*</span>}
          </label>
        )}
        <div className={cn(styles.textareaWrapper, error && styles.hasError)}>
          <textarea
            ref={ref}
            id={textareaId}
            disabled={disabled}
            required={required}
            rows={rows}
            aria-invalid={!!error}
            aria-describedby={errorId || descId}
            className={cn(styles.textarea, disabled && styles.disabled)}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} className={styles.error} role="alert">
            {error}
          </p>
        )}
        {description && !error && (
          <p id={descId} className={styles.description}>
            {description}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export interface SelectProps extends Omit<InputHTMLAttributes<HTMLSelectElement>, "type"> {
  label?: string;
  description?: string;
  error?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      description,
      error,
      options,
      placeholder,
      fullWidth = false,
      className,
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).slice(2, 9)}`;
    const errorId = error ? `${selectId}-error` : undefined;
    const descId = description && !error ? `${selectId}-desc` : undefined;

    return (
      <div className={cn(styles.wrapper, fullWidth && styles.fullWidth, className)}>
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
            {required && <span className={styles.required} aria-hidden="true">*</span>}
          </label>
        )}
        <div className={cn(styles.selectWrapper, error && styles.hasError)}>
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={errorId || descId}
            className={cn(styles.select, disabled && styles.disabled)}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className={styles.selectIcon} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </div>
        {error && (
          <p id={errorId} className={styles.error} role="alert">
            {error}
          </p>
        )}
        {description && !error && (
          <p id={descId} className={styles.description}>
            {description}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";