/**
 * SkeletonShowCard Component
 *
 * Loading skeleton placeholder for show cards.
 * Used while data is being fetched to prevent layout shift.
 */
export function SkeletonShowCard() {
  return (
    <div className="flex flex-col animate-pulse">
      <div className="aspect-[3/4] rounded-lg bg-gray-200 dark:bg-gray-800 mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded mb-1 w-3/4" />
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
    </div>
  );
}

/**
 * SkeletonEpisodeCard Component
 *
 * Loading skeleton placeholder for episode cards in watch page.
 */
export function SkeletonEpisodeCard() {
  return (
    <div className="flex gap-3 animate-pulse shrink-0 w-40 sm:w-48 md:w-56">
      <div className="aspect-video rounded-lg bg-gray-200 dark:bg-gray-800 w-full" />
    </div>
  );
}

/**
 * SkeletonSidebarCard Component
 *
 * Loading skeleton placeholder for sidebar recommendation cards.
 */
export function SkeletonSidebarCard() {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="w-16 h-20 rounded-md bg-gray-200 dark:bg-gray-800 shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
        <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
      </div>
    </div>
  );
}
