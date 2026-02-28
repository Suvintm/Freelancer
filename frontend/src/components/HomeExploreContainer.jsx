import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    HiLightningBolt, 
    HiSparkles,
    HiVideoCamera,
    HiUserGroup,
    HiCheckCircle
} from "react-icons/hi";
import { FaStar, FaRing, FaPlay, FaYoutube, FaMicrophone, FaMagic, FaPalette, FaFilm, FaFire, FaArrowRight } from "react-icons/fa";
import PromoBanner from "./PromoBanner";
import UnifiedBannerSlider from "./UnifiedBannerSlider";
import AdvancedSearchBar from "./AdvancedSearchBar";
import SuggestedReels from "./SuggestedReels";
import KYCPendingBanner from "./KYCPendingBanner";
import ProfileCompletionBanner from "./ProfileCompletionBanner";
import EditorsNearYouPreview from "./EditorsNearYouPreview";
import UnifiedExplorePreview from "./UnifiedExplorePreview";
import FollowSuggestions from "./FollowSuggestions";
import { useAppContext } from "../context/AppContext";

const HomeExploreContainer = ({ searchQuery, setSearchQuery, recentSearches, activeTab, setActiveTab }) => {
    const { user } = useAppContext();

    return (
        <div className="w-full max-w-7xl mx-auto space-y-1.5 md:space-y-4 pb-12">
            
            {/* Banner moved to parent level for better layout flow */}

            {/* Notifications Section - Dynamic & Floating */}
            <div className="px-4 space-y-1">
                <KYCPendingBanner />
                <ProfileCompletionBanner />
            </div>

            <div className="px-4 pb-4">
                <div className="max-w-3xl mx-auto">
                    <AdvancedSearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        onSearch={(term) => {
                          console.log("Searching for:", term);
                          // Implement actual search routing here if needed
                        }}
                        recentSearches={recentSearches}
                        placeholder="What are you looking for today?"
                        className="w-full"
                        suggestionType="editors"
                        variant="pill"
                    />
                </div>
            </div>

            {/* NEARBY EXPERTS - Redesigned & Repositioned */}
            <div className="px-4">
                <EditorsNearYouPreview />
            </div>


            {/* Discovery Section: Suggested Reels */}
            <div className="px-4">
                <SuggestedReels />
            </div>

            {/* User Discovery - Follow Suggestions */}
            <div className="px-4">
                <FollowSuggestions />
            </div>

            {/* Specialized Browse Section (Zepto Style Grid) */}
            <div className="px-4">
                <SpecialtyBrowse onSelect={(specialty) => setSearchQuery(specialty)} />
            </div>


            {/* MAIN EXPLORE PREVIEW - COMBINATION OF EDITORS & GIGS */}
            <div className="px-4 space-y-12">
                <UnifiedExplorePreview />
            </div>

            {/* Stats Strip - Very compact footer-like */}
            <div className="px-4 opacity-70">
                <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: "Active Editors", value: "1,200+", icon: HiUserGroup, color: "text-violet-400" },
                        { label: "Videos Edited", value: "45k+", icon: HiVideoCamera, color: "text-purple-400" },
                        { label: "Avg. Rating", value: "4.9/5", icon: FaStar, color: "text-amber-400" },
                        { label: "Fast Delivery", value: "24h", icon: HiLightningBolt, color: "text-emerald-400" },
                    ].map((stat, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center ${stat.color}`}>
                                <stat.icon className="text-sm" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white leading-tight">{stat.value}</div>
                                <div className="text-[8px] text-gray-500 uppercase tracking-tight font-semibold">{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


const SpecialtyBrowse = ({ onSelect }) => {
    const specialties = [
        { label: "YouTube", image: "/youtube_category_1766945669722.png", color: "from-red-500/20" },
        { label: "Wedding", image: "/wedding_category_1766945653582.png", color: "from-pink-500/20" },
        { label: "Reels", image: "/reels_category_1766945684333.png", color: "from-purple-500/20" },
        { label: "Color", image: "/color_category_1766945743508.png", color: "from-amber-500/20" },
        { label: "Podcast", image: "/podcast_category_1766945699811.png", color: "from-blue-500/20" },
        { label: "VFX", image: "/vfx_category_1766945726102.png", color: "from-cyan-500/20" },
        { label: "Cinematic", image: "/cinematic_category_1766945761051.png", color: "from-emerald-500/20" },
        { label: "Ads", image: "/ads_category_1766945776646.png", color: "from-orange-500/20" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <HiSparkles className="text-white text-base" />
                        <h2 className="text-[11px] font-black text-white tracking-[0.15em] uppercase">Browse by Specialty</h2>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-40 ml-5">
                         <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                         <span className="text-[9px] font-bold uppercase tracking-wider">Top Categories</span>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3 lg:gap-4">
                {specialties.map((item, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.04 }}
                        whileHover={{ y: -5, scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelect(item.label)}
                        className="relative aspect-square rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden cursor-pointer group shadow-lg"
                    >
                        {/* Background Layer with Category Specific Tint */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${item.color} to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
                        
                        <img 
                            src={item.image} 
                            alt={item.label} 
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125 brightness-90 group-hover:brightness-110" 
                            onLoad={e => { e.target.style.opacity = '1'; }}
                            style={{ opacity: 0, transition: 'opacity 0.6s ease' }}
                        />
                        
                        {/* Improved Glassmorphic Overlay */}
                        <div className="absolute inset-x-0 bottom-0 p-2 lg:p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                            <div className="text-center">
                                <span className="text-[8px] lg:text-[10px] font-black text-white uppercase tracking-wider group-hover:text-amber-400 transition-colors">
                                    {item.label}
                                </span>
                            </div>
                        </div>

                        {/* Interactive Border Glow */}
                        <div className="absolute inset-0 border border-white/0 group-hover:border-white/20 rounded-[1.5rem] lg:rounded-[2rem] transition-all duration-500 pointer-events-none" />
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default HomeExploreContainer;
