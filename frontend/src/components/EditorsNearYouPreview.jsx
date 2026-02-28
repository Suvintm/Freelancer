
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
    HiOutlineMapPin, 
    HiOutlineChevronRight,
    HiOutlineStar,
    HiSparkles,
    HiBolt,
    HiArrowRight,
    HiOutlineRocketLaunch
} from "react-icons/hi2";
import { FaMapMarkerAlt, FaStar } from "react-icons/fa";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import nearbyBg from "../assets/nearby.png";

const EditorsNearYouPreview = () => {
    const { user, backendURL } = useAppContext();
    const navigate = useNavigate();

    const { data: nearbyEditors = [], isLoading: loading } = useQuery({
        queryKey: ['homeData', 'nearby-editors', backendURL, user?.token],
        queryFn: async () => {
            const { data } = await axios.get(`${backendURL}/api/location/nearby`, {
                params: { lat: 12.97, lng: 77.59, radius: 50 },
                headers: { Authorization: `Bearer ${user?.token}` },
            });
            return data.editors?.slice(0, 4) || [];
        },
        staleTime: 5 * 60 * 1000, // 5 min cache
        enabled: !!user?.token,
    });

    if (loading) return (
        <div className="py-2">
            <div className="w-48 h-5 bg-white/8 rounded-lg animate-pulse mb-4" />
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {[1, 2, 3].map(i => (
                    <div key={i} className="relative flex-shrink-0 w-64 aspect-[16/10] bg-zinc-900 rounded-3xl animate-pulse overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 shimmer" />
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="relative group/container">
            {/* "NEW" Badge Floating on Top Edge */}
            <div className="absolute -top-2 left-6 z-20">
                <div className="px-3 py-1 bg-gradient-to-r from-blue-600 to-slate-900 rounded-full shadow-lg border border-white/20">
                    <span className="text-[9px] font-black text-white uppercase tracking-wider flex items-center gap-1">
                        <HiBolt className="text-[10px]" /> NEW
                    </span>
                </div>
            </div>

            {nearbyEditors.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
                    {nearbyEditors.map((editor) => (
                        <motion.div
                            key={editor._id}
                            whileHover={{ y: -6, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(`/editor/${editor._id}`)}
                            className="flex-shrink-0 w-64 md:w-72 aspect-[16/10] relative rounded-3xl overflow-hidden cursor-pointer group snap-start border border-white/5 shadow-2xl"
                        >
                        {/* Background Media with fade-in */}
                            <img 
                                src={editor.profilePicture || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2071&auto=format&fit=crop'} 
                                className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                                alt=""
                                loading="lazy"
                                onLoad={e => e.target.style.opacity = '1'}
                                style={{ opacity: 0, transition: 'opacity 0.7s ease' }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                            
                            {/* Floating Badge */}
                            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 align-start">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/80 backdrop-blur-md text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-1 w-fit">
                                    <HiBolt className="text-[10px]" /> {editor.approxLocation?.distance || 'LOCAL'}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col justify-end p-5">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-md">
                                            <FaStar className="text-amber-400 text-[8px]" />
                                            <span className="text-[9px] font-black text-white">{editor.rating?.toFixed(1) || '4.9'}</span>
                                        </div>
                                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">
                                            {editor.experience || '3+ yrs'} Exp
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-black text-white tracking-tight leading-tight group-hover:text-emerald-400 transition-colors">
                                        {editor.name}
                                    </h3>
                                    <div className="flex items-center justify-between pt-1">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                                                <HiOutlineMapPin className="text-zinc-400 text-[10px]" />
                                            </div>
                                            <span className="text-[10px] text-zinc-300 font-bold truncate max-w-[120px]">
                                                {editor.location || 'Bangalore, India'}
                                            </span>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                            <HiArrowRight className="text-white text-xs" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <motion.div 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => navigate('/editors-near-you')}
                    className="relative w-full h-28 md:h-40 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden cursor-pointer group border border-white/10 shadow-xl"
                >
                    {/* Immersive Background */}
                    <div className="absolute inset-0 bg-[#0d0d12]">
                        <img 
                            src={nearbyBg} 
                            className="w-full h-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-105"
                            alt="Map search"
                        />
                        {/* Mesh Texture Overlay */}
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
                    </div>
                    
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
                    
                    <div className="absolute inset-0 flex items-center px-4 md:px-10">
                        <div className="flex items-center gap-3 md:gap-8 w-full">
                            <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 backdrop-blur-xl">
                                <HiOutlineRocketLaunch className="text-white text-xl md:text-3xl animate-pulse" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm md:text-xl font-black text-white tracking-tight leading-tight">Find Experts Nearby</h3>
                                <p className="text-[9px] md:text-sm text-zinc-400 font-medium max-w-[140px] md:max-w-xs mt-0.5 md:mt-1 line-clamp-1 md:line-clamp-none">
                                    Collaborate with local creative talent today.
                                </p>
                            </div>

                            <div className="hidden sm:block">
                                <div className="px-5 py-2 bg-white/10 hover:bg-white text-white hover:text-black text-[10px] font-black rounded-full transition-all border border-white/20 flex items-center gap-1.5 whitespace-nowrap">
                                    OPEN MAP <HiArrowRight className="text-xs" />
                                </div>
                            </div>
                            
                            {/* Mobile Arrow */}
                            <div className="sm:hidden w-7 h-7 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                                <HiArrowRight className="text-white text-xs" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default EditorsNearYouPreview;
