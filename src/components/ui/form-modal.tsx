"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  showFooter?: boolean;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg", 
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export const FormModal = React.memo(({
  isOpen,
  onClose,
  title,
  description,
  children,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  isSubmitting = false,
  submitDisabled = false,
  size = "md",
  showFooter = true,
}: FormModalProps) => {
  const handleCancel = React.useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  }, [onCancel, onClose]);

  const handleSubmit = React.useCallback(() => {
    if (onSubmit && !isSubmitting && !submitDisabled) {
      onSubmit();
    }
  }, [onSubmit, isSubmitting, submitDisabled]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <DialogTitle className="text-lg font-semibold">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-sm text-muted-foreground">
                  {description}
                </DialogDescription>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {children}
        </div>

        {showFooter && (
          <DialogFooter className="flex-shrink-0">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                {cancelLabel}
              </Button>
              {onSubmit && (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || submitDisabled}
                >
                  {isSubmitting ? "Saving..." : submitLabel}
                </Button>
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
});

FormModal.displayName = "FormModal";

// Hook for managing form modal state
export function useFormModal() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const openModal = React.useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = React.useCallback(() => {
    setIsOpen(false);
    setIsSubmitting(false);
  }, []);

  const startSubmitting = React.useCallback(() => {
    setIsSubmitting(true);
  }, []);

  const stopSubmitting = React.useCallback(() => {
    setIsSubmitting(false);
  }, []);

  return {
    isOpen,
    isSubmitting,
    openModal,
    closeModal,
    startSubmitting,
    stopSubmitting,
  };
}

// Higher-order component for form validation
export function withFormValidation<T extends Record<string, any>>(
  Component: React.ComponentType<any>,
  validationSchema?: (data: T) => Record<string, string> | null
) {
  return React.memo((props: any) => {
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    const validate = React.useCallback((data: T) => {
      if (!validationSchema) return true;
      
      const validationErrors = validationSchema(data);
      if (validationErrors) {
        setErrors(validationErrors);
        return false;
      }
      
      setErrors({});
      return true;
    }, []);

    const clearErrors = React.useCallback(() => {
      setErrors({});
    }, []);

    return (
      <Component
        {...props}
        errors={errors}
        validate={validate}
        clearErrors={clearErrors}
      />
    );
  });
}