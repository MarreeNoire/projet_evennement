import { forwardRef } from "react";

import { cn } from "@/lib/utils";

/* =============================================================================
   Champs de formulaire
   --------------------------------------------------------------------------
   Règles appliquées :
   * `<label>` toujours présent et associé (jamais de placeholder en guise de label) ;
   * erreur affichée en texte + `aria-invalid` + `aria-describedby` ;
   * anneau de focus visible ; taille de police 16 px sur petits écrans
     (empêche le zoom automatique sur iOS).
   ========================================================================== */

export const fieldBase = [
  "w-full rounded-md border border-border-strong bg-surface text-fg",
  "px-3 py-2.5 text-sm",
  "placeholder:text-fg-subtle",
  "transition-colors duration-150",
  "hover:border-border",
  "focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus",
  "disabled:cursor-not-allowed disabled:bg-bg-muted disabled:opacity-60",
  "aria-[invalid=true]:border-danger",
].join(" ");

/* ------------------------------- Label ------------------------------------ */

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  hint?: string;
}

export function Label({ className, children, required, hint, ...props }: LabelProps) {
  return (
    <label className={cn("flex items-baseline justify-between gap-2", className)} {...props}>
      <span className="text-sm font-medium text-fg">
        {children}
        {required ? (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
      </span>
      {hint ? <span className="text-xs text-fg-subtle">{hint}</span> : null}
    </label>
  );
}

/* -------------------------------- Champ ----------------------------------- */

export interface FieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/** Enveloppe un champ : label, description, message d'erreur. */
export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  description,
  children,
  className,
}: FieldProps) {
  const errorId = error && htmlFor ? `${htmlFor}-error` : undefined;
  const descriptionId = description && htmlFor ? `${htmlFor}-description` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} required={required} hint={hint}>
        {label}
      </Label>

      {description ? (
        <p id={descriptionId} className="text-xs text-fg-muted">
          {description}
        </p>
      ) : null}

      {children}

      {/* Message d'erreur : icône + texte, jamais la couleur seule */}
      {error ? (
        <p id={errorId} role="alert" className="flex items-center gap-1.5 text-xs text-danger">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-3.5 shrink-0"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-13a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1Zm0 9a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Construit les attributs ARIA d'aide à la saisie. */
export function fieldAriaProps(id?: string, { error, description }: { error?: string; description?: string } = {}) {
  if (!id) return {};
  const describedBy = [error ? `${id}-error` : null, description ? `${id}-description` : null]
    .filter(Boolean)
    .join(" ");

  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy || undefined,
  } as const;
}

/* ------------------------------- Input ------------------------------------ */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, type = "text", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(fieldBase, "h-11", className)}
      {...props}
    />
  );
});

/* ------------------------------ Textarea ---------------------------------- */

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(fieldBase, "resize-y leading-relaxed", className)}
      {...props}
    />
  );
});

/* ------------------------------- Select ----------------------------------- */

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(fieldBase, "h-11 cursor-pointer pr-8", className)}
      {...props}
    >
      {children}
    </select>
  );
});