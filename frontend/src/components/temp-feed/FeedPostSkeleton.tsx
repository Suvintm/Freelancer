import { useTheme } from '../../hooks/useTheme';

export const FeedPostSkeleton = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`mb-6 rounded-[32px] border overflow-hidden ${
      isDarkMode ? 'bg-[#0d0d0d] border-zinc-900/60' : 'bg-white border-zinc-200 shadow-md'
    }`}>
      {/* Header Skeleton */}
      <div className="flex items-center justify-between p-4 px-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full animate-pulse ${
            isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'
          }`} />
          <div className="flex flex-col gap-2">
            <div className={`h-4 w-32 rounded animate-pulse ${
              isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'
            }`} />
            <div className={`h-3 w-20 rounded animate-pulse ${
              isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'
            }`} />
          </div>
        </div>
        <div className={`w-8 h-8 rounded-full animate-pulse ${
          isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'
        }`} />
      </div>

      {/* Main Image/Video Skeleton */}
      <div className={`w-full aspect-[4/5] lg:aspect-[4/5] animate-pulse ${
        isDarkMode ? 'bg-zinc-900/50' : 'bg-zinc-100'
      }`} />

      {/* Actions & Text Skeleton */}
      <div className="p-4 px-5 space-y-4">
        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`w-8 h-8 rounded-full animate-pulse ${
                isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'
              }`} />
            ))}
          </div>
          <div className={`w-8 h-8 rounded-full animate-pulse ${
            isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'
          }`} />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <div className={`h-4 w-1/4 rounded animate-pulse ${
            isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'
          }`} />
          <div className={`h-4 w-3/4 rounded animate-pulse ${
            isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'
          }`} />
          <div className={`h-4 w-1/2 rounded animate-pulse ${
            isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'
          }`} />
        </div>
      </div>
    </div>
  );
};
