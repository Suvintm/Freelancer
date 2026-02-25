import React from "react";

/**
 * ReelSkeleton — Full-screen animated placeholder shown while the first
 * batch of reels is loading. Mimics the exact layout of ReelCard.
 */
const ReelSkeleton = () => {
    return (
        <div className="w-full h-screen bg-zinc-900 relative overflow-hidden flex-shrink-0 snap-start">

            {/* shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]" />

            {/* Top gradient */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/30 to-transparent" />

            {/* Bottom content area */}
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/70 to-transparent" />

            {/* Bottom-left: author + title + description */}
            <div className="absolute bottom-20 left-5 right-24 space-y-3">
                {/* Author row */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-700 animate-pulse" />
                    <div className="w-28 h-4 rounded-full bg-zinc-700 animate-pulse" />
                    <div className="w-12 h-4 rounded bg-zinc-700 animate-pulse" />
                </div>
                {/* Title */}
                <div className="w-48 h-4 rounded-full bg-zinc-700 animate-pulse" />
                {/* Description */}
                <div className="w-40 h-3 rounded-full bg-zinc-700 animate-pulse" />
                <div className="w-32 h-3 rounded-full bg-zinc-700/60 animate-pulse" />
            </div>

            {/* Right action bar */}
            <div className="absolute right-4 bottom-44 flex flex-col items-center gap-5">
                {/* Profile pic */}
                <div className="w-12 h-12 rounded-full bg-zinc-700 animate-pulse" />
                {/* Like */}
                <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-full bg-zinc-700 animate-pulse" />
                    <div className="w-6 h-3 rounded bg-zinc-700 animate-pulse" />
                </div>
                {/* Comment */}
                <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-full bg-zinc-700 animate-pulse" />
                    <div className="w-6 h-3 rounded bg-zinc-700 animate-pulse" />
                </div>
                {/* View */}
                <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-full bg-zinc-700 animate-pulse" />
                    <div className="w-6 h-3 rounded bg-zinc-700 animate-pulse" />
                </div>
                {/* Share */}
                <div className="w-12 h-12 rounded-full bg-zinc-700 animate-pulse" />
            </div>

            {/* Progress bar at bottom */}
            <div className="absolute bottom-8 left-5 right-5 h-1 bg-zinc-700 rounded-full animate-pulse" />
        </div>
    );
};

export default ReelSkeleton;
