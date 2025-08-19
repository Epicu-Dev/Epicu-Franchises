"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

export interface ToastNotificationProps {
  id: string;
  message: string;
  type: "error" | "success" | "info" | "warning";
  duration?: number;
  onClose: (id: string) => void;
}

export default function ToastNotification({
  id,
  message,
  type,
  duration = 5000,
  onClose,
}: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animation d'entrée
    const enterTimer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Auto-hide timer
    const hideTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(hideTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
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
        return "bg-red-50 border-red-200 text-red-800 shadow-red-100";
      case "success":
        return "bg-green-50 border-green-200 text-green-800 shadow-green-100";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800 shadow-blue-100";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800 shadow-yellow-100";
      default:
        return "bg-red-50 border-red-200 text-red-800 shadow-red-100";
    }
  };

  const getProgressBarColor = () => {
    switch (type) {
      case "error":
        return "bg-red-500";
      case "success":
        return "bg-green-500";
      case "info":
        return "bg-blue-500";
      case "warning":
        return "bg-yellow-500";
      default:
        return "bg-red-500";
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300 ease-out ${
        isVisible && !isExiting
          ? "translate-x-0 opacity-100 scale-100"
          : "translate-x-full opacity-0 scale-95"
      }`}
    >
      <div className={`rounded-lg border shadow-lg ${getStyles()}`}>
        {/* Progress bar */}
        <div className="h-1 w-full bg-gray-200 rounded-t-lg overflow-hidden">
          <div
            className={`h-full transition-all duration-${duration} ease-linear ${getProgressBarColor()}`}
            style={{ width: isExiting ? "0%" : "100%" }}
          />
        </div>

        {/* Toast content */}
        <div className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-5">
                {message}
              </p>
            </div>
            <div className="flex-shrink-0 ml-auto">
              <button
                onClick={handleClose}
                className={`inline-flex rounded-md p-1.5 transition-colors duration-200 hover:bg-gray-100 ${
                  type === "error"
                    ? "text-red-400 hover:text-red-600"
                    : type === "success"
                    ? "text-red-400 hover:text-red-600"
                    : type === "info"
                    ? "text-blue-400 hover:text-blue-600"
                    : "text-yellow-400 hover:text-yellow-600"
                }`}
                aria-label="Fermer la notification"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
