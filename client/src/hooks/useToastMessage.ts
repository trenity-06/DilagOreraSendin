import { useCallback, useState } from "react";

export interface Toast {
  id: string;
  message: string;
  isFailed: boolean;
}

export const useToastMessage = (_initialMessage?: string, _initialIsFailed?: boolean, _initialIsVisible?: boolean) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToastMessage = useCallback((message: string, isFailed: boolean = false) => {
    setToasts((prev) => {
      // Prevent duplicate messages from stacking up
      if (prev.some((t) => t.message === message)) {
        return prev;
      }
      const id = Math.random().toString(36).substring(2, 9);
      return [...prev, { id, message, isFailed }];
    });
  }, []);

  const closeToastMessage = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message: string) => {
    showToastMessage(message, false);
  }, [showToastMessage]);

  const showError = useCallback((message: string) => {
    showToastMessage(message, true);
  }, [showToastMessage]);

  return {
    toasts,
    showToastMessage,
    closeToastMessage,
    showSuccess,
    showError,
    // Compatibility with old API (will only show/hide first toast)
    isVisible: toasts.length > 0,
    message: toasts[0]?.message || "",
    isFailed: toasts[0]?.isFailed || false,
    onClose: () => toasts[0] && closeToastMessage(toasts[0].id)
  };
};
