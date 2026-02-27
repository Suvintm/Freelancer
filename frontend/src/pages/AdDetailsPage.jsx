import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
    HiArrowLeft, 
    HiSpeakerWave, 
    HiSpeakerXMark, 
    HiPlay, 
    HiPause,
    HiOutlineLink,
    HiOutlineChatBubbleBottomCenterText,
    HiOutlineClock,
    HiOutlineTag,
    HiOutlineGlobeAlt,
    HiOutlineCamera
} from "react-icons/hi2";
import { FaInstagram, FaFacebook, FaTwitter, FaYoutube, FaExternalLinkAlt } from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import axios from "axios";

const AdDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { backendURL } = useAppContext();
    const [ad, setAd] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const videoRef = useRef(null);

    // Dummy data for initial dev if API doesn't have it
    const dummyAds = {
        "default-ad-1": {
            title: "Premiere Pro Mastery",
            description: "Master the art of storytelling with our comprehensive Adobe Premiere Pro course. From basic cutting to advanced color grading and sound design, we cover it all.",
            longDescription: "Our course is designed by industry professionals with over 10 years of experience in Hollywood and major streaming platforms. You will learn the hidden shortcuts, professional workflows, and technical nuances that separate a hobbyist from a professional editor.\n\nWhat you'll get:\n- 40+ HD Video Tutorials\n- Raw footage for practice\n- Custom LUTs and Sound Packs\n- Direct feedback on your projects\n- Certification upon completion",
            mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            mediaType: "video",
            links: {
                website: "https://suvix.in/course",
                instagram: "https://instagram.com/suvix_creative",
                twitter: "https://twitter.com/suvix"
            },
            tags: ["Education", "Editing", "VFX"],
            gallery: [
                "/hero_banner_1_1766946342128.png",
                "/gig_banner_1_1766948855701.png",
                "/hero_banner_1_1766946342128.png"
            ],
            duration: "24 Weeks",
            category: "Professional Training"
        },
        "default-ad-2": {
            title: "Suvix Creative Suite",
            description: "The all-in-one resource for creative professionals. High-quality assets, templates, and collaborative tools.",
            longDescription: "Suvix Creative Suite is the ultimate toolkit for digital creators. Whether you are a YouTuber, a Freelance Editor, or a Production Studio, our suite provides the building blocks for stunning visual content.\n\nFeatures:\n- Cloud Collaboration\n- Asset Library (4K Stocks)\n- Project Management for Editors\n- Secure Client Review System",
            mediaUrl: "/hero_banner_1_1766946342128.png",
            mediaType: "image",
            links: {
                website: "https://suvix.in",
                instagram: "https://instagram.com/suvix_creative"
            },
            tags: ["Tools", "Assets", "Productivity"],
            gallery: [
                "/gig_banner_1_1766948855701.png",
                "/hero_banner_1_1766946342128.png"
            ],
            duration: "Lifetime Access",
            category: "Software & Tools"
        }
    };

    useEffect(() => {
        const fetchAd = async () => {
            try {
                // Try fetching from the new ads API
                const res = await axios.get(`${backendURL}/api/ads/${id}`);
                if (res.data.success && res.data.ad) {
                    const apiAd = res.data.ad;
                    // Normalize to the shape AdDetailsPage expects
                    setAd({
                        title: apiAd.title,
                        description: apiAd.description || apiAd.tagline || "",
                        longDescription: apiAd.longDescription || apiAd.description || "",
                        mediaUrl: apiAd.mediaUrl,
                        mediaType: apiAd.mediaType,
                        links: {
                            website: apiAd.websiteUrl,
                            instagram: apiAd.instagramUrl,
                            facebook: apiAd.facebookUrl,
                            youtube: apiAd.youtubeUrl,
                            other: apiAd.otherUrl,
                        },
                        tags: [],
                        gallery: apiAd.galleryImages || [],
                        category: apiAd.companyName || "Advertisement",
                        badge: apiAd.badge,
                        ctaText: apiAd.ctaText,
                    });
                } else {
                    // Fallback to dummy for legacy static IDs
                    setAd(dummyAds[id] || dummyAds["default-ad-1"]);
                }
            } catch (err) {
                console.error("Failed to fetch ad:", err);
                setAd(dummyAds[id] || dummyAds["default-ad-1"]);
            } finally {
                setLoading(false);
            }
        };
        fetchAd();
        window.scrollTo(0, 0);
    }, [id, backendURL]);

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };

    if (loading) return (
        <div className="min-h-screen bg-[#050509] flex items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050509] text-white selection:bg-violet-500/30">
            {/* Header / Back */}
            <div className="fixed top-0 left-0 right-0 z-50 p-6 flex items-center justify-between">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white hover:text-black transition-all shadow-2xl"
                >
                    <HiArrowLeft className="text-xl" />
                </button>
                <div className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Sponsor Details</span>
                </div>
            </div>

            {/* Main Video Section */}
            <div className="relative w-full h-[60vh] md:h-[75vh] bg-black overflow-hidden">
                {ad.mediaType === "video" ? (
                    <div className="relative w-full h-full group">
                        <video 
                            ref={videoRef}
                            src={ad.mediaUrl}
                            autoPlay
                            onClick={togglePlay}
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            className="w-full h-full object-contain md:object-cover"
                        />
                        {/* Video Controls Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 space-y-4">
                                {/* Time Progress Bar */}
                                <div className="relative w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                                    <motion.div 
                                        className="absolute top-0 left-0 h-full bg-violet-500"
                                        style={{ width: `${(currentTime / duration) * 100}%` }}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <button onClick={togglePlay} className="text-2xl hover:scale-110 transition-transform">
                                            {isPlaying ? <HiPause /> : <HiPlay />}
                                        </button>
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => setIsMuted(!isMuted)} className="text-xl">
                                                {isMuted ? <HiSpeakerXMark /> : <HiSpeakerWave />}
                                            </button>
                                            <span className="text-xs font-mono text-zinc-400">
                                                {formatTime(currentTime)} / {formatTime(duration)}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="text-xl">
                                        <HiOutlineCamera />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <img 
                        src={ad.mediaUrl} 
                        className="w-full h-full object-cover" 
                        alt={ad.title} 
                    />
                )}
            </div>

            {/* Content Container */}
            <div className="max-w-7xl mx-auto px-6 md:px-12 -mt-10 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    
                    {/* Left Side: Info */}
                    <div className="lg:col-span-2 space-y-12 pb-20">
                        {/* Title & Tags */}
                        <div className="space-y-6">
                            <div className="flex flex-wrap gap-2">
                                {ad.tags.map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-violet-600/20 border border-violet-500/30 text-violet-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                        {tag}
                                    </span>
                                ))}
                                <span className="px-3 py-1 bg-zinc-800 text-zinc-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                    {ad.category}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
                                {ad.title}
                            </h1>
                            <p className="text-xl text-zinc-400 leading-relaxed font-medium">
                                {ad.description}
                            </p>
                        </div>

                        {/* Detailed Story */}
                        <div className="space-y-6 bg-white/[0.02] border border-white/[0.05] p-8 md:p-12 rounded-[2.5rem]">
                            <div className="flex items-center gap-3">
                                <HiOutlineChatBubbleBottomCenterText className="text-violet-500 text-2xl" />
                                <h3 className="text-xl font-bold uppercase tracking-widest text-zinc-500">The Story</h3>
                            </div>
                            <div className="text-zinc-400 leading-relaxed text-lg whitespace-pre-line">
                                {ad.longDescription}
                            </div>
                        </div>

                        {/* Image Gallery */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <HiOutlineCamera className="text-violet-500 text-2xl" />
                                <h3 className="text-xl font-bold uppercase tracking-widest text-zinc-500">Visuals</h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {ad.gallery.map((img, i) => (
                                    <div key={i} className="aspect-video rounded-3xl overflow-hidden border border-white/5 group">
                                        <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Sidebar / Links */}
                    <div className="lg:sticky lg:top-32 h-fit space-y-6 pb-20">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
                            <div className="space-y-4">
                                <h4 className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Connect</h4>
                                <div className="space-y-3">
                                    {ad.links.website && (
                                        <a href={ad.links.website} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-white/[0.05] hover:bg-white text-white hover:text-black rounded-2xl transition-all group">
                                            <div className="flex items-center gap-3">
                                                <HiOutlineGlobeAlt className="text-xl" />
                                                <span className="font-bold">Official Website</span>
                                            </div>
                                            <FaExternalLinkAlt className="text-xs opacity-40 group-hover:opacity-100" />
                                        </a>
                                    )}
                                    {ad.links.instagram && (
                                        <a href={ad.links.instagram} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-[#E1306C]/10 hover:bg-[#E1306C] text-white rounded-2xl transition-all group">
                                            <div className="flex items-center gap-3">
                                                <FaInstagram className="text-xl" />
                                                <span className="font-bold">Instagram</span>
                                            </div>
                                            <FaExternalLinkAlt className="text-xs opacity-40 group-hover:opacity-100" />
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="h-px bg-white/10" />

                            <div className="space-y-4">
                                <h4 className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Highlights</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex items-center gap-3">
                                        <HiOutlineClock className="text-violet-500" />
                                        <span className="text-sm font-medium text-zinc-300">{ad.duration}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <HiOutlineTag className="text-violet-500" />
                                        <span className="text-sm font-medium text-zinc-300">Verified Sponsor</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main CTA */}
                        <motion.button 
                            whileHover={{ scale: 1.02, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-6 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-[2rem] text-white font-black uppercase tracking-widest shadow-[0_20px_40px_rgba(124,58,237,0.3)] flex flex-col items-center justify-center gap-1 group"
                        >
                            <span className="text-lg">Promote with Suvix</span>
                            <span className="text-[10px] opacity-60 font-medium">Contact our Ad Team</span>
                        </motion.button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdDetailsPage;
