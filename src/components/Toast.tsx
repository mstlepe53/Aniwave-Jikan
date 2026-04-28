/**
 * Toast Component
 *
 * Always mounted — opacity and position are driven directly by the `show` prop
 * so the browser always has a live element to transition between states.
 * No RAF tricks, no intermediate useState, no mount/unmount timing issues.
 */
import { Check } from 'lucide-react';

interface ToastProps {
  message: string;
  show: boolean;
}

export default function Toast({ message, show }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-[9999] pointer-events-none"
      style={{ transform: 'translateX(-50%)' }}
    >
      <div
        className="flex items-center gap-2.5 px-4 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold rounded-xl shadow-2xl whitespace-nowrap transition-all duration-300 ease-out"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? 'translateY(0px)' : 'translateY(12px)',
        }}
      >
        <span className="flex items-center justify-center w-5 h-5 bg-green-500 rounded-full shrink-0">
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </span>
        {message}
      </div>
    </div>
  );
}
