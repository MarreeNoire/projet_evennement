"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import styles from "./sheet.module.css";

export interface SheetProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  position?: "bottom" | "center" | "top";
  dismissible?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showHandle?: boolean;
  stickyHeader?: boolean;
}

export function Sheet({
  open,
  onOpenChange,
  children,
  title,
  description,
  size = "md",
  position = "bottom",
  dismissible = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showHandle = position === "bottom",
  stickyHeader = false,
  className,
  ...props
}: SheetProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const titleId = title ? `sheet-title-${Math.random().toString(36).slice(2, 9)}` : undefined;
  const descId = description ? `sheet-desc-${Math.random().toString(36).slice(2, 9)}` : undefined;

  // Focus trap
  useEffect(() => {
    if (!open) return;
    const content = contentRef.current;
    if (!content) return;

    const focusableElements = content.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    content.addEventListener("keydown", handleTab);
    firstElement?.focus();

    // Prevent body scroll
    document.body.style.overflow = "hidden";

    return () => {
      content.removeEventListener("keydown", handleTab);
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, closeOnEscape, onOpenChange]);

  if (!open) return null;

  const overlay = (
    <div
      className={cn(styles.overlay, dismissible && styles.dismissible)}
      onClick={closeOnOverlayClick ? () => onOpenChange(false) : undefined}
      aria-hidden="true"
    />
  );

  const sheetContent = (
    <div
      ref={contentRef}
      className={cn(
        styles.sheet,
        styles[position],
        styles[size],
        stickyHeader && styles.stickyHeader,
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      {...props}
    >
      {(title || description) && (
        <header className={cn(styles.header, stickyHeader && styles.headerSticky)}>
          <div className={styles.headerContent}>
            {title && (
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
            )}
            {description && (
              <p id={descId} className={styles.description}>
                {description}
              </p>
            )}
          </div>
          {dismissible && (
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => onOpenChange(false)}
              aria-label="Fermer"
            >
              <X className="size-5" />
            </button>
          )}
        </header>
      )}
      {showHandle && <div className={styles.handle} aria-hidden="true" />}
      <div className={styles.content}>{children}</div>
    </div>
  );

  return createPortal(
    <>
      {overlay}
      {sheetContent}
    </>,
    document.body
  );
}

export interface SheetTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function SheetTrigger({ children, className, ...props }: SheetTriggerProps) {
  return (
    <button
      type="button"
      className={cn("press", className)}
      {...props}
    >
      {children}
    </button>
  );
}

export interface SheetCloseProps extends HTMLAttributes<HTMLButtonElement> {}

export function SheetClose({ className, children = "Fermer", ...props }: SheetCloseProps) {
  return (
    <button
      type="button"
      className={cn("press", className)}
      {...props}
    >
      {children}
    </button>
  );
}