"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./card.module.css";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined" | "interactive" | "hero";
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
  pressable?: boolean;
  selected?: boolean;
  loading?: boolean;
  asChild?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = "default",
      padding = "md",
      hoverable = false,
      pressable = false,
      selected = false,
      loading = false,
      asChild = false,
      className,
      ...props
    },
    ref
  ) => {
    const Component = asChild ? "div" : "div";

    return (
      <Component
        ref={ref}
        className={cn(
          styles.card,
          styles[variant],
          styles[`padding-${padding}`],
          hoverable && styles.hoverable,
          pressable && styles.pressable,
          selected && styles.selected,
          loading && styles.loading,
          className
        )}
        {...props}
      >
        {loading && <div className={styles.skeleton} aria-hidden="true" />}
        {children}
      </Component>
    );
  }
);

Card.displayName = "Card";

/* --- Sub-components --- */

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn(styles.header, className)} {...props}>
      {children}
    </div>
  )
);
CardHeader.displayName = "CardHeader";

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  size?: "sm" | "md" | "lg";
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, size = "md", className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(styles.title, styles[`title-${size}`], className)}
      {...props}
    >
      {children}
    </h3>
  )
);
CardTitle.displayName = "CardTitle";

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ children, className, ...props }, ref) => (
    <p ref={ref} className={cn(styles.description, className)} {...props}>
      {children}
    </p>
  )
);
CardDescription.displayName = "CardDescription";

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn(styles.content, className)} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = "CardContent";

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn(styles.footer, className)} {...props}>
      {children}
    </div>
  )
);
CardFooter.displayName = "CardFooter";

export interface CardMediaProps extends HTMLAttributes<HTMLDivElement> {
  ratio?: "square" | "4:3" | "16:9" | "3:2";
  fit?: "cover" | "contain";
}

export const CardMedia = forwardRef<HTMLDivElement, CardMediaProps>(
  ({ children, ratio = "4:3", fit = "cover", className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(styles.media, styles[`ratio-${ratio.replace(":", "-")}`], styles[`fit-${fit}`], className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardMedia.displayName = "CardMedia";

export interface CardActionProps extends HTMLAttributes<HTMLDivElement> {
  align?: "left" | "center" | "right" | "between";
}

export const CardAction = forwardRef<HTMLDivElement, CardActionProps>(
  ({ children, align = "right", className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(styles.action, styles[`align-${align}`], className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardAction.displayName = "CardAction";

export interface CardBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "success" | "warning" | "error";
  size?: "sm" | "md";
}

export const CardBadge = forwardRef<HTMLSpanElement, CardBadgeProps>(
  ({ children, variant = "default", size = "md", className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(styles.badge, styles[`badge-${variant}`], styles[`badge-${size}`], className)}
      {...props}
    >
      {children}
    </span>
  )
);
CardBadge.displayName = "CardBadge";