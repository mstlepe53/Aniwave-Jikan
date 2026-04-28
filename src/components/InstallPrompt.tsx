import { X, Download, Share, Plus } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import Logo from './Logo';

export default function InstallPrompt() {
  const { showPrompt, isIOS, platform, install, dismiss, dismissLater } = usePWAInstall();

  if (!showPrompt) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px]"
        onClick={dismissLater}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Install ANIWAVE"
        className="fixed z-[61]
                   left-0 right-0 bottom-0 w-full max-w-md mx-auto
                   bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700
                   rounded-t-2xl shadow-2xl
                   md:left-auto md:right-6 md:bottom-6 md:w-80 md:max-w-none
                   md:rounded-2xl md:border
                   animate-slide-up
                   px-5 py-5"
      >
        <button
          onClick={dismiss}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close install prompt"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <img
            src="/apple-icon.png"
            alt="ANIWAVE"
            width={44}
            height={44}
            className="w-11 h-11 rounded-xl shrink-0"
          />
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">ANIWAVE</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Free Anime Streaming</p>
          </div>
        </div>

        {isIOS ? (
          <IOSInstructions onClose={dismiss} />
        ) : (
          <AndroidDesktopPrompt onInstall={install} onLater={dismissLater} platform={platform} />
        )}
      </div>
    </>
  );
}

function AndroidDesktopPrompt({
  onInstall,
  onLater,
  platform,
}: {
  onInstall: () => Promise<boolean>;
  onLater: () => void;
  platform: string;
}) {
  return (
    <>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-snug">
        {platform === 'desktop'
          ? 'Install ANIWAVE as a desktop app for a faster, distraction-free experience.'
          : 'Add ANIWAVE to your home screen for a faster, app-like experience.'}
      </p>
      <div className="flex gap-2">
        <button
          onClick={onInstall}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm py-2.5 px-4 rounded-xl hover:opacity-90 transition-opacity"
        >
          <Download className="w-4 h-4 shrink-0" />
          Install App
        </button>
        <button
          onClick={onLater}
          className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors font-medium"
        >
          Later
        </button>
      </div>
    </>
  );
}

function IOSInstructions({ onClose }: { onClose: () => void }) {
  return (
    <>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-snug">
        Install ANIWAVE on your iPhone for a fast, full-screen experience:
      </p>
      <ol className="space-y-2 mb-4">
        <li className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 shrink-0 text-xs font-bold text-gray-900 dark:text-white">1</span>
          Tap the <Share className="w-4 h-4 inline mx-0.5 text-blue-500" /> <strong>Share</strong> button at the bottom of Safari
        </li>
        <li className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 shrink-0 text-xs font-bold text-gray-900 dark:text-white">2</span>
          Tap <Plus className="w-4 h-4 inline mx-0.5 text-blue-500" /> <strong>Add to Home Screen</strong>
        </li>
        <li className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 shrink-0 text-xs font-bold text-gray-900 dark:text-white">3</span>
          Tap <strong>Add</strong> to confirm
        </li>
      </ol>
      <button
        onClick={onClose}
        className="w-full py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors font-medium"
      >
        Got it
      </button>
    </>
  );
}
