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
import { useAppContext } from "../context/AppContext";

const HomeExploreContainer = ({ searchQuery, setSearchQuery, recentSearches, activeTab, setActiveTab }) => {
    const { user } = useAppContext();

    return (
        <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-8 pb-12">
            
            {/* Banner moved to parent level for better layout flow */}

            {/* Notifications Section - Dynamic & Floating */}
            <div className="px-4 space-y-3">
                <KYCPendingBanner />
                <ProfileCompletionBanner />
            </div>

            <div className="px-4 pt-2">
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

            {/* Top Categories Navigation - Right after search for filtering */}
            <div className="px-4">
                <CategoryStrip onSelect={(skill) => setSearchQuery(skill)} />
            </div>

            {/* Discovery Section: Suggested Reels */}
            <div className="px-4">
                <SuggestedReels />
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

const CategoryStrip = ({ onSelect }) => {
    const categories = [
        { id: "all", label: "All", Icon: HiSparkles, color: "text-violet-400", activeColor: "from-violet-500 to-purple-500" },
        { id: "wedding", label: "Wedding", Icon: FaRing, color: "text-pink-400", activeColor: "from-pink-500 to-rose-500", hot: true },
        { id: "reels", label: "Reels", Icon: FaPlay, color: "text-purple-400", activeColor: "from-purple-500 to-fuchsia-500" },
        { id: "youtube", label: "YouTube", Icon: FaYoutube, color: "text-red-400", activeColor: "from-red-500 to-orange-500" },
        { id: "podcast", label: "Podcast", Icon: FaMicrophone, color: "text-blue-400", activeColor: "from-blue-500 to-cyan-500" },
        { id: "vfx", label: "VFX", Icon: FaMagic, color: "text-cyan-400", activeColor: "from-cyan-500 to-teal-500" },
        { id: "color", label: "Color", Icon: FaPalette, color: "text-amber-400", activeColor: "from-amber-500 to-orange-500" },
        { id: "cinematic", label: "Cinematic", Icon: FaFilm, color: "text-emerald-400", activeColor: "from-emerald-500 to-green-500" },
    ];

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {categories.map((cat) => (
                <motion.button
                    key={cat.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelect(cat.id === "all" ? "" : cat.label)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-gray-400 hover:text-white hover:border-white/20 transition-all whitespace-nowrap"
                >
                    <cat.Icon className={cat.color} />
                    {cat.label}
                    {cat.hot && (
                        <span className="flex items-center justify-center w-3 h-3 bg-orange-500 rounded-full text-[8px] text-white">
                            <FaFire />
                        </span>
                    )}
                </motion.button>
            ))}
        </div>
    );
};

const SpecialtyBrowse = ({ onSelect }) => {
    const specialties = [
        { label: "YouTube", image: "/youtube_category_1766945669722.png" },
        { label: "Wedding", image: "/wedding_category_1766945653582.png" },
        { label: "Reels", image: "/reels_category_1766945684333.png" },
        { label: "Color", image: "/color_category_1766945743508.png" },
        { label: "Podcast", image: "/podcast_category_1766945699811.png" },
        { label: "VFX", image: "/vfx_category_1766945726102.png" },
        { label: "Cinematic", image: "/cinematic_category_1766945761051.png" },
        { label: "Ads", image: "/ads_category_1766945776646.png" },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                        <HiSparkles className="text-emerald-500 text-xs" />
                    </div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Browse by Specialty</h2>
                </div>
            </div>
            
            <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3">
                {specialties.map((item, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelect(item.label)}
                        className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group"
                    >
                        <img 
                            src={item.image} 
                            alt={item.label} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                        <div className="absolute bottom-2 left-0 right-0 text-center">
                            <span className="text-[10px] font-bold text-white uppercase tracking-wide">{item.label}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default HomeExploreContainer;
