"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

export interface MessageAlertProps {
  message: string;
  type: "error" | "success" | "info" | "warning";
  onClose?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
  showCloseButton?: boolean;
  className?: string;
}

export default function MessageAlert({
  message,
  type,
  onClose,
  autoHide = false,
  autoHideDelay = 5000,
  showCloseButton = true,
  className = "",
}: MessageAlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide && type === "success") {
      const timer = setTimeout(() => {
        handleClose();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, type]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case "error":
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case "success":
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case "info":
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
      case "warning":
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      default:
        return "bg-red-50 border-red-200 text-red-800";
    }
  };

  const getCloseButtonStyles = () => {
    switch (type) {
      case "error":
        return "text-red-400 hover:text-red-600 hover:bg-red-100";
      case "success":
        return "text-green-400 hover:text-green-600 hover:bg-green-100";
      case "info":
        return "text-blue-400 hover:text-blue-600 hover:bg-blue-100";
      case "warning":
        return "text-yellow-400 hover:text-yellow-600 hover:bg-yellow-100";
      default:
        return "text-red-400 hover:text-red-600 hover:bg-red-100";
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`p-4 rounded-lg border transition-all duration-300 ease-in-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      } ${getStyles()} ${className}`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-5">
            {message}
          </p>
        </div>
        {showCloseButton && (
          <div className="flex-shrink-0 ml-auto">
            <button
              aria-label="Fermer le message"
              className={`inline-flex rounded-md p-1.5 transition-colors duration-200 ${getCloseButtonStyles()}`}
              onClick={handleClose}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
