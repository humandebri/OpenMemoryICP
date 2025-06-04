import React, { useState } from 'react';
import { cn } from '@/utils/cn';

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

interface SelectValueProps {
  placeholder?: string;
}

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {},
});

export const Select: React.FC<SelectProps> = ({ children, value, onValueChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = React.useContext(SelectContext);

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
        <svg
          className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
          fill="none"
          strokeWidth="2"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }
);

SelectTrigger.displayName = 'SelectTrigger';

export const SelectContent: React.FC<SelectContentProps> = ({ className, children, ...props }) => {
  const { open } = React.useContext(SelectContext);

  if (!open) return null;

  return (
    <div
      className={cn(
        'absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg',
        className
      )}
      {...props}
    >
      <div className="py-1">{children}</div>
    </div>
  );
};

export const SelectItem: React.FC<SelectItemProps> = ({ value, className, children, ...props }) => {
  const { value: selectedValue, onValueChange, setOpen } = React.useContext(SelectContext);

  return (
    <div
      onClick={() => {
        onValueChange?.(value);
        setOpen(false);
      }}
      className={cn(
        'cursor-pointer px-3 py-2 text-sm hover:bg-gray-100',
        selectedValue === value && 'bg-primary-50 text-primary-700',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const { value } = React.useContext(SelectContext);
  const [label, setLabel] = useState<string>('');

  React.useEffect(() => {
    const items = document.querySelectorAll('[role="option"]');
    items.forEach((item) => {
      if (item.getAttribute('data-value') === value) {
        setLabel(item.textContent || '');
      }
    });
  }, [value]);

  return <span>{value ? label || value : placeholder}</span>;
};