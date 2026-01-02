/**
 * Common component prop types
 * Shared interfaces for UI components across the application
 */

import type { ReactNode } from "react";
import type { BaseComponentProps, ActionComponentProps, DataComponentProps, ValidationResult } from "./common";

// ============================================================================
// Base UI Component Props
// ============================================================================

/**
 * Standard button component props
 */
export interface ButtonProps extends ActionComponentProps {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  children: ReactNode;
  type?: "button" | "submit" | "reset";
}

/**
 * Input field component props
 */
export interface InputProps extends BaseComponentProps {
  type?: "text" | "email" | "password" | "number" | "search";
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
}

/**
 * Textarea component props
 */
export interface TextareaProps extends Omit<InputProps, "type"> {
  rows?: number;
  minRows?: number;
  maxRows?: number;
  resize?: "none" | "vertical" | "horizontal" | "both";
}

/**
 * Select dropdown component props
 */
export interface SelectProps<T = string> extends BaseComponentProps {
  value: T | null;
  onChange: (value: T | null) => void;
  options: { value: T; label: string; disabled?: boolean }[];
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  multiple?: boolean;
}

// ============================================================================
// Modal and Dialog Props
// ============================================================================

/**
 * Modal component props
 */
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  preventClose?: boolean; // Prevents closing on backdrop click or ESC
  showCloseButton?: boolean;
  footer?: ReactNode;
}

/**
 * Alert dialog props for confirmations
 */
export interface AlertDialogProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  isLoading?: boolean;
}

/**
 * Tooltip component props
 */
export interface TooltipProps extends BaseComponentProps {
  content: ReactNode;
  children: ReactNode;
  placement?: "top" | "bottom" | "left" | "right";
  trigger?: "hover" | "click" | "focus";
  delay?: number;
}

// ============================================================================
// Table Component Props
// ============================================================================

/**
 * Table column definition
 */
export interface TableColumn<T = unknown> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string | number;
  minWidth?: string | number;
  align?: "left" | "center" | "right";
  render?: (value: unknown, item: T, index: number) => ReactNode;
  className?: string;
}

/**
 * Table component props
 */
export interface TableProps<T = unknown> extends DataComponentProps<T[]> {
  columns: TableColumn<T>[];
  keyField: keyof T;
  sortable?: boolean;
  selectable?: boolean;
  selectedIds?: (string | number)[];
  onSelectionChange?: (ids: (string | number)[]) => void;
  onRowClick?: (item: T, index: number) => void;
  onSort?: (key: string, direction: "asc" | "desc") => void;
  currentSort?: { key: string; direction: "asc" | "desc" };
  striped?: boolean;
  hoverable?: boolean;
}

// ============================================================================
// Form Component Props
// ============================================================================

/**
 * Form field wrapper props
 */
export interface FormFieldProps extends BaseComponentProps {
  label?: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  children: ReactNode;
  htmlFor?: string;
}

/**
 * Form component props
 */
export interface FormProps extends BaseComponentProps {
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  children: ReactNode;
  validation?: ValidationResult;
  loading?: boolean;
  resetOnSubmit?: boolean;
}

// ============================================================================
// Loading and State Component Props
// ============================================================================

/**
 * Loading spinner props
 */
export interface SpinnerProps extends BaseComponentProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "white";
  text?: string;
}

/**
 * Skeleton loader props
 */
export interface SkeletonProps extends BaseComponentProps {
  width?: string | number;
  height?: string | number;
  count?: number;
  circle?: boolean;
  animation?: "pulse" | "wave" | "none";
}

/**
 * Error boundary props
 */
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: unknown) => void;
}

/**
 * Empty state props
 */
export interface EmptyStateProps extends BaseComponentProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    text: string;
    onClick: () => void;
  };
  secondaryAction?: {
    text: string;
    onClick: () => void;
  };
}

// ============================================================================
// Navigation Component Props
// ============================================================================

/**
 * Pagination props
 */
export interface PaginationProps extends BaseComponentProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisiblePages?: number;
}

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}

/**
 * Breadcrumbs props
 */
export interface BreadcrumbsProps extends BaseComponentProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  maxItems?: number;
}

// ============================================================================
// Feedback Component Props
// ============================================================================

/**
 * Toast notification props
 */
export interface ToastProps extends BaseComponentProps {
  title: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning" | "info";
  duration?: number;
  action?: {
    text: string;
    onClick: () => void;
  };
  onClose?: () => void;
}

/**
 * Badge component props
 */
export interface BadgeProps extends BaseComponentProps {
  variant?: "default" | "success" | "error" | "warning" | "info" | "outline";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

/**
 * Card component props
 */
export interface CardProps extends BaseComponentProps {
  title?: string;
  description?: string;
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  variant?: "default" | "outlined" | "elevated";
  clickable?: boolean;
  onClick?: () => void;
}

// ============================================================================
// Layout Component Props
// ============================================================================

/**
 * Container props
 */
export interface ContainerProps extends BaseComponentProps {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: boolean;
  center?: boolean;
}

/**
 * Grid system props
 */
export interface GridProps extends BaseComponentProps {
  children: ReactNode;
  columns?: number | { sm?: number; md?: number; lg?: number; xl?: number };
  gap?: number | string;
  rows?: number;
}

/**
 * Flex container props
 */
export interface FlexProps extends BaseComponentProps {
  children: ReactNode;
  direction?: "row" | "column" | "row-reverse" | "column-reverse";
  justify?: "start" | "end" | "center" | "between" | "around" | "evenly";
  align?: "start" | "end" | "center" | "baseline" | "stretch";
  wrap?: boolean;
  gap?: number | string;
}
