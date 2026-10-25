"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./button.module.css";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  pressable?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "left",
      fullWidth = false,
      pressable = true,
      className,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          styles.button,
          styles[variant],
          styles[size],
          fullWidth && styles.fullWidth,
          pressable && styles.pressable,
          isDisabled && styles.disabled,
          loading && styles.loading,
          className
        )}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading && (
          <span className={styles.spinner} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path
                d="M12 2a10 10 0 0 1 10 10"
                strokeLinecap="round"
                className={styles.spinnerPath}
              />
            </svg>
          </span>
        )}
        {!loading && icon && iconPosition === "left" && (
          <span className={styles.icon} aria-hidden="true">{icon}</span>
        )}
        <span className={styles.content}>{children}</span>
        {!loading && icon && iconPosition === "right" && (
          <span className={styles.icon} aria-hidden="true">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";