import React from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '../utils/cn';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
  className
}) => {
  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] max-h-[95vh]'
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className={cn(
        "relative w-full animate-scale-in",
        sizeClasses[size]
      )}>
        <div className={cn(
          "cyber-glass rounded-2xl p-6 shadow-2xl border border-cyan-400/20",
          className
        )}>
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                {title && (
                  <h2 className="text-xl font-tech font-bold text-foreground holographic">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1 text-sm text-muted">
                    {description}
                  </p>
                )}
              </div>
              
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="ml-4 hover:bg-danger/20 hover:text-danger"
                >
                  <XMarkIcon className="h-5 w-5" />
                </Button>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className="relative">
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// Modal compound components
const ModalHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <div className={cn("mb-4 pb-4 border-b border-border", className)}>
    {children}
  </div>
);

const ModalBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <div className={cn("py-2", className)}>
    {children}
  </div>
);

const ModalFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <div className={cn("mt-6 pt-4 border-t border-border flex items-center justify-end gap-3", className)}>
    {children}
  </div>
);

export { Modal, ModalHeader, ModalBody, ModalFooter };