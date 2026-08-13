import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import {
  Check,
  Star,
  ArrowRight,
  Info,
  Calendar,
  Download,
  GraduationCap,
  ShieldCheck,
  Camera,
  Music,
  Video,
  Play,
  Zap,
  Sparkles,
  Award,
  BookOpen,
  Film,
  Activity,
  FileText,
  ChevronLeft,
  ArrowLeft,
  Circle,
  Square,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  Target,
  Users,
  Clock,
  Send,
} from 'lucide-react';
import {
  FaYoutube,
  FaTiktok,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
} from 'react-icons/fa';
import type { RoleCategory } from '../../api/services/category.service';
import { ROLE_SHOWCASE_CONFIG, DEFAULT_ROLE_SHOWCASE } from '../../features/onboarding/data/roleCardData';
import video1V from '../../assets/cardassets/video1V.mp4';
import video2V from '../../assets/cardassets/video2V.mp4';
import video3V from '../../assets/cardassets/video3V.mp4';
import video4V from '../../assets/cardassets/video4V.mp4';
import youtubeThumb from '../../assets/categories/youtube.jpg';
import youtubeIcon from '../../assets/categories/youtubeicon.png';
import fitnessThumb from '../../assets/categories/fitness.jpg';
import editorThumb from '../../assets/categories/editor.jpg';
import singerThumb from '../../assets/categories/singer.jpg';
import dancerThumb from '../../assets/categories/dancer.jpg';
import actorThumb from '../../assets/categories/actor.jpg';
import musicianThumb from '../../assets/categories/musician.jpg';

const VERTICAL_VIDEOS = [video1V, video2V, video3V, video4V];

const YT_THUMBS = [
  { img: youtubeThumb, title: "Building the ultimate motion graphic studio setup", views: 142 },
  { img: editorThumb, title: "How to edit like a PRO in Premiere Pro 2026", views: 320 },
  { img: fitnessThumb, title: "My 5 AM Morning Routine for Productivity", views: 89 },
  { img: singerThumb, title: "Behind the scenes of my upcoming music video", views: 215 },
];

// ── YT FEED CAROUSEL FOR MULTIPLE VIDEOS ──
const YTFeedCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % YT_THUMBS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[75cqw] mt-[3cqw] flex justify-center pointer-events-none">
      <AnimatePresence>
        {YT_THUMBS.map((video, idx) => {
          const diff = (idx - currentIndex + YT_THUMBS.length) % YT_THUMBS.length;
          if (diff > 2) return null;

          const isActive = diff === 0;
          const yOffset = isActive ? 0 : diff === 1 ? 25 : 45;
          const scale = isActive ? 1 : diff === 1 ? 0.9 : 0.8;
          const opacity = isActive ? 1 : diff === 1 ? 0.8 : 0.4;
          const zIndex = 30 - diff * 10;

          return (
            <motion.div
              key={video.title}
              initial={{ opacity: 0, y: yOffset + 20, scale: 0.8 }}
              animate={{ opacity, y: yOffset, scale, zIndex }}
              exit={{ opacity: 0, y: -40, scale: 1.1, filter: "blur(4px)" }}
              transition={{ duration: 0.7, type: 'spring', bounce: 0.3 }}
              className="absolute top-0 left-0 right-0 rounded-[4cqw] overflow-hidden border border-zinc-200 shadow-[0_8px_20px_rgba(0,0,0,0.06)] bg-white"
            >
              <div className="w-full aspect-video relative bg-black">
                <img src={video.img} className="w-full h-full object-cover opacity-85" alt="YT Video" />
                
                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[10cqw] h-[10cqw] rounded-full bg-red-600/90 backdrop-blur-md flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                    <Play className="w-[4cqw] h-[4cqw] text-white fill-white ml-[0.5cqw]" />
                  </div>
                </div>

                {/* Glassmorphic Controls Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-[8cqw] bg-gradient-to-t from-black/90 to-transparent p-[2cqw] flex flex-col justify-end">
                  <div className="w-full h-[1cqw] bg-white/30 rounded-full mb-[1cqw]">
                    <div className="w-[65%] h-full bg-red-500 relative rounded-full">
                      <div className="absolute right-[-1cqw] top-1/2 -translate-y-1/2 w-[2cqw] h-[2cqw] bg-white rounded-full shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Video Meta Info & Interactions */}
              <div className="p-[3cqw] flex flex-col gap-[1.5cqw] bg-white">
                <div className="flex gap-[2.5cqw] items-start">
                  <img src={youtubeIcon} className="w-[8cqw] h-[8cqw] rounded-full border-[1.5px] border-zinc-100 shadow-sm shrink-0 object-cover" alt="Channel" />
                  <div className="flex flex-col">
                    <h4 className="text-[3.2cqw] font-bold text-zinc-900 leading-[1.2] line-clamp-2 pr-[2cqw]">{video.title}</h4>
                    <div className="flex items-center gap-[1cqw] mt-[0.5cqw] text-[2.5cqw] font-medium text-zinc-500">
                      <span className="text-zinc-800 font-semibold">SuviX Studio</span>
                      <span className="w-[0.5cqw] h-[0.5cqw] rounded-full bg-zinc-300" />
                      <span><LiveCounter initialValue={video.views} />K views</span>
                    </div>
                  </div>
                </div>
                
                {/* Social Stats Row */}
                <div className="flex items-center gap-[4cqw] pl-[10.5cqw]">
                   <div className="flex items-center gap-[1cqw] bg-zinc-50 px-[2cqw] py-[0.5cqw] rounded-full border border-zinc-100">
                     <Heart className="w-[2.5cqw] h-[2.5cqw] text-zinc-600 fill-zinc-600" />
                     <span className="text-[2.2cqw] font-bold text-zinc-700"><LiveCounter initialValue={14} />K</span>
                   </div>
                   <div className="flex items-center gap-[1cqw] bg-zinc-50 px-[2cqw] py-[0.5cqw] rounded-full border border-zinc-100">
                     <MessageCircle className="w-[2.5cqw] h-[2.5cqw] text-zinc-600 fill-zinc-600" />
                     <span className="text-[2.2cqw] font-bold text-zinc-700"><LiveCounter initialValue={850} /></span>
                   </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// ── EDITOR SHOWCASE COMPONENT (Pill Grid Layout) ──
const EditorShowcase = () => {
  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden relative z-30 pb-[10cqw]">
      {/* ── IMAGES GRID ── */}
      <div className="relative w-full h-[70cqw] overflow-hidden -mt-[6cqw]">
        {/* Top Left */}
        <motion.div 
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", damping: 15 }}
          className="absolute top-[-5cqw] left-[2cqw] w-[24cqw] h-[40cqw] rounded-full overflow-hidden shadow-sm bg-blue-50 -rotate-[15deg]"
        >
           <img src={fitnessThumb} className="w-full h-full object-cover rotate-[15deg] scale-[1.35]" alt="editor" />
        </motion.div>
        
        {/* Top Center (Highest) */}
        <motion.div 
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", damping: 15 }}
          className="absolute top-[-10cqw] left-[32cqw] w-[28cqw] h-[45cqw] rounded-full overflow-hidden shadow-sm bg-yellow-50 -rotate-[15deg]"
        >
           <img src={actorThumb} className="w-full h-full object-cover rotate-[15deg] scale-[1.35]" alt="editor" />
        </motion.div>
        
        {/* Top Right */}
        <motion.div 
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", damping: 15 }}
          className="absolute top-[-4cqw] right-[1cqw] w-[22cqw] h-[36cqw] rounded-full overflow-hidden shadow-sm bg-orange-50 -rotate-[15deg]"
        >
           <img src={dancerThumb} className="w-full h-full object-cover rotate-[15deg] scale-[1.35]" alt="editor" />
        </motion.div>
        
        {/* Bottom Left */}
        <motion.div 
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, type: "spring", damping: 15 }}
          className="absolute top-[40cqw] left-[4cqw] w-[26cqw] h-[42cqw] rounded-full overflow-hidden shadow-sm bg-pink-50 -rotate-[15deg]"
        >
           <img src={singerThumb} className="w-full h-full object-cover rotate-[15deg] scale-[1.35]" alt="editor" />
        </motion.div>
        
        {/* Bottom Center (Main Focus) */}
        <motion.div 
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring", damping: 15 }}
          className="absolute top-[38cqw] left-[35cqw] w-[30cqw] h-[48cqw] rounded-full overflow-hidden shadow-sm bg-indigo-50 z-10 -rotate-[15deg]"
        >
           <img src={editorThumb} className="w-full h-full object-cover rotate-[15deg] scale-[1.35]" alt="editor" />
        </motion.div>
        
        {/* Bottom Right */}
        <motion.div 
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, type: "spring", damping: 15 }}
          className="absolute top-[38cqw] right-[-4cqw] w-[24cqw] h-[38cqw] rounded-full overflow-hidden shadow-sm bg-rose-50 -rotate-[15deg]"
        >
           <img src={musicianThumb} className="w-full h-full object-cover rotate-[15deg] scale-[1.35]" alt="editor" />
        </motion.div>
      </div>
      
      {/* ── TEXT & BUTTON ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col items-center justify-center flex-1 px-[6cqw] mt-[3cqw] text-center"
      >
        <h2 className="text-[5.8cqw] font-black text-zinc-900 leading-[1.3] tracking-tight flex flex-col items-center">
          Find your perfect
          <span className="text-[#ef7b7a] inline-flex items-center gap-[1cqw]">
            companion
            <div className="relative flex items-center justify-center -mt-[1cqw] ml-[0.5cqw]">
              <Heart className="w-[4.5cqw] h-[4.5cqw] fill-[#ef7b7a] text-[#ef7b7a]" />
              <Heart className="absolute -top-[1cqw] -right-[2cqw] w-[2.5cqw] h-[2.5cqw] fill-[#ef7b7a] text-[#ef7b7a]" />
            </div>
          </span>
        </h2>
        <p className="text-[2.8cqw] font-semibold text-zinc-500 mt-[2.5cqw] mb-[5cqw] max-w-[85%] leading-relaxed">
          Someone that matches your mutual interests & connect easily
        </p>
        <button className="w-[65cqw] py-[3.5cqw] rounded-full bg-[#6a5ced] hover:bg-[#5b4edb] transition-all text-white font-bold text-[3.8cqw] shadow-[0_8px_20px_rgba(106,92,237,0.35)] flex items-center justify-center">
          Get Started
        </button>
      </motion.div>
    </div>
  )
}

// ── NORMAL USER SHOWCASE COMPONENT (Circles Layout) ──
const NormalUserShowcase = () => {
  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden relative z-30 pb-[10cqw]">
      {/* ── IMAGES & BUBBLES GRID ── */}
      <div className="relative w-full h-[72cqw] overflow-hidden -mt-[2cqw]">
         {/* Colorful background dots */}
         <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring" }} className="absolute top-[2cqw] left-[8cqw] w-[5cqw] h-[5cqw] bg-[#3fe64e] rounded-full" />
         <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="absolute top-[-5cqw] right-[-5cqw] w-[25cqw] h-[25cqw] bg-[#dcf12d] rounded-full" />
         <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }} className="absolute top-[35cqw] left-[-3cqw] w-[12cqw] h-[12cqw] bg-[#f08a2d] rounded-full" />
         <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring" }} className="absolute top-[25cqw] right-[10cqw] w-[4cqw] h-[4cqw] bg-[#ff5a5f] rounded-full" />
         <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }} className="absolute top-[52cqw] right-[25cqw] w-[6cqw] h-[6cqw] bg-[#4ca1ff] rounded-full" />

         {/* Images */}
         {/* Top Large Circle */}
         <motion.div 
           initial={{ scale: 0, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ delay: 0.2, type: "spring", damping: 14 }}
           className="absolute top-[6cqw] left-[10cqw] w-[45cqw] h-[45cqw] rounded-full overflow-hidden shadow-[0_15px_30px_rgba(59,130,246,0.15)] bg-pink-100 z-10"
         >
           <img src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover" alt="user with dog" />
         </motion.div>
         
         {/* Bottom Medium Circle */}
         <motion.div 
           initial={{ scale: 0, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ delay: 0.3, type: "spring", damping: 14 }}
           className="absolute top-[40cqw] left-[20cqw] w-[35cqw] h-[35cqw] rounded-full overflow-hidden shadow-[0_15px_30px_rgba(59,130,246,0.15)] bg-purple-100 z-20"
         >
           <img src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover" alt="cat" />
         </motion.div>

         {/* Middle Right Small Circle */}
         <motion.div 
           initial={{ scale: 0, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ delay: 0.4, type: "spring", damping: 14 }}
           className="absolute top-[28cqw] right-[12cqw] w-[22cqw] h-[22cqw] rounded-full overflow-hidden shadow-[0_15px_30px_rgba(59,130,246,0.15)] bg-cyan-100 z-10"
         >
           <img src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover" alt="puppy" />
         </motion.div>
      </div>

      {/* ── TEXT & BUTTON ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col items-center justify-center flex-1 px-[6cqw] text-center"
      >
        <h2 className="text-[5.5cqw] font-black text-[#1a2b4b] leading-[1.2] tracking-tight">
          Find Your Best <br /> Companion With Us
        </h2>
        <p className="text-[2.6cqw] font-medium text-zinc-500 mt-[3cqw] mb-[5cqw] max-w-[85%] leading-relaxed">
          Join & discover the best creators & brands as per your preferences in your network
        </p>
        
        {/* Pagination Dots */}
        <div className="flex gap-[1cqw] mb-[5cqw]">
           <div className="w-[4cqw] h-[1cqw] rounded-full bg-[#468df7]" />
           <div className="w-[1.2cqw] h-[1cqw] rounded-full bg-zinc-200" />
           <div className="w-[1.2cqw] h-[1cqw] rounded-full bg-zinc-200" />
        </div>

        <button className="w-[60cqw] py-[3.5cqw] rounded-[2.5cqw] bg-[#468df7] hover:bg-blue-600 transition-all text-white font-bold text-[3.8cqw] shadow-[0_8px_20px_rgba(70,141,247,0.3)]">
          Explore
        </button>
      </motion.div>
    </div>
  )
}

// ── BRAND SHOWCASE COMPONENT (Campaign Brief Layout) ──
const BrandShowcase = () => {
  return (
    <div className="w-full h-full flex flex-col bg-[#f8f9fa] overflow-hidden relative z-30 pb-[8cqw]">
      {/* ── HEADER IMAGE AREA ── */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative w-full h-[65cqw] rounded-b-[6cqw] overflow-hidden shadow-sm shrink-0"
      >
        <img src="https://images.unsplash.com/photo-1556906781-9a412961c28c?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover" alt="Campaign" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        
        {/* Floating Icons */}
        <div className="absolute top-[4cqw] left-[4cqw] w-[8cqw] h-[8cqw] rounded-full bg-white flex items-center justify-center shadow-md cursor-pointer">
           <ArrowLeft className="w-[4cqw] h-[4cqw] text-zinc-900" strokeWidth={2.5} />
        </div>
        <div className="absolute top-[4cqw] right-[4cqw] w-[8cqw] h-[8cqw] rounded-full bg-white flex items-center justify-center shadow-md cursor-pointer">
           <Heart className="w-[4cqw] h-[4cqw] text-red-500 fill-red-500" />
        </div>

        {/* Image Pagination */}
        <div className="absolute bottom-[4cqw] left-0 right-0 flex justify-center gap-[1.2cqw]">
           <div className="w-[5cqw] h-[1cqw] rounded-full bg-blue-500" />
           <div className="w-[2cqw] h-[1cqw] rounded-full bg-white/70" />
           <div className="w-[2cqw] h-[1cqw] rounded-full bg-white/70" />
           <div className="w-[2cqw] h-[1cqw] rounded-full bg-white/70" />
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-[5cqw] pt-[4cqw] pb-[20cqw]">
        {/* ── CAMPAIGN HEADER ── */}
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-between items-start"
        >
          <div>
            <h2 className="text-[5.5cqw] font-bold text-[#1a2b4b]">Urban Athletics</h2>
            <p className="text-[3cqw] font-medium text-zinc-500 mt-[0.5cqw]">2.5 km away</p>
          </div>
          <span className="text-[5cqw] font-bold text-blue-500">$5,000</span>
        </motion.div>

        {/* ── INFO GRID ── */}
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-[2.5cqw] mt-[5cqw]"
        >
           {/* Card 1 */}
           <div className="flex items-center gap-[2.5cqw] bg-white p-[2.5cqw] rounded-[3cqw] shadow-sm border border-zinc-100">
             <div className="w-[7cqw] h-[7cqw] rounded-full bg-blue-50 flex items-center justify-center shrink-0">
               <Target className="w-[3.5cqw] h-[3.5cqw] text-blue-500" />
             </div>
             <div className="flex flex-col">
               <span className="text-[2.2cqw] text-zinc-400 font-medium leading-none">Niche</span>
               <span className="text-[3cqw] text-[#1a2b4b] font-bold leading-tight mt-[0.8cqw]">Fitness</span>
             </div>
           </div>
           
           {/* Card 2 */}
           <div className="flex items-center gap-[2.5cqw] bg-white p-[2.5cqw] rounded-[3cqw] shadow-sm border border-zinc-100">
             <div className="w-[7cqw] h-[7cqw] rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
               <Users className="w-[3.5cqw] h-[3.5cqw] text-indigo-500" />
             </div>
             <div className="flex flex-col">
               <span className="text-[2.2cqw] text-zinc-400 font-medium leading-none">Min. Reach</span>
               <span className="text-[3cqw] text-[#1a2b4b] font-bold leading-tight mt-[0.8cqw]">500k+</span>
             </div>
           </div>

           {/* Card 3 */}
           <div className="flex items-center gap-[2.5cqw] bg-white p-[2.5cqw] rounded-[3cqw] shadow-sm border border-zinc-100">
             <div className="w-[7cqw] h-[7cqw] rounded-full bg-rose-50 flex items-center justify-center shrink-0">
               <Film className="w-[3.5cqw] h-[3.5cqw] text-rose-500" />
             </div>
             <div className="flex flex-col">
               <span className="text-[2.2cqw] text-zinc-400 font-medium leading-none">Format</span>
               <span className="text-[3cqw] text-[#1a2b4b] font-bold leading-tight mt-[0.8cqw]">IG Reels</span>
             </div>
           </div>

           {/* Card 4 */}
           <div className="flex items-center gap-[2.5cqw] bg-white p-[2.5cqw] rounded-[3cqw] shadow-sm border border-zinc-100">
             <div className="w-[7cqw] h-[7cqw] rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
               <Clock className="w-[3.5cqw] h-[3.5cqw] text-emerald-500" />
             </div>
             <div className="flex flex-col">
               <span className="text-[2.2cqw] text-zinc-400 font-medium leading-none">Duration</span>
               <span className="text-[3cqw] text-[#1a2b4b] font-bold leading-tight mt-[0.8cqw]">30 Days</span>
             </div>
           </div>
        </motion.div>

        {/* ── ABOUT SECTION ── */}
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-[6cqw]"
        >
          <h3 className="text-[3.5cqw] font-bold text-[#1a2b4b]">About Campaign</h3>
          <p className="text-[2.8cqw] text-zinc-500 leading-relaxed mt-[2cqw]">
            We are launching a new line of ultra-lightweight running shoes. We're looking for energetic creators to showcase our gear in action. The ideal video will be fast-paced, highly engaging, and naturally integrate the product into a daily workout routine.
          </p>
        </motion.div>
      </div>

      {/* ── FIXED BOTTOM ACTION BAR ── */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-0 left-0 right-0 px-[5cqw] pb-[4cqw] pt-[4cqw] bg-gradient-to-t from-[#f8f9fa] via-[#f8f9fa] to-transparent flex gap-[3cqw]"
      >
         <button className="w-[12cqw] h-[12cqw] rounded-[3cqw] bg-[#1a2b4b] flex items-center justify-center shrink-0 shadow-md hover:bg-zinc-800 active:scale-95 transition-all">
           <Send className="w-[5cqw] h-[5cqw] text-white -ml-[0.5cqw] mt-[0.5cqw]" />
         </button>
         <button className="flex-1 h-[12cqw] rounded-[3cqw] bg-[#427ded] hover:bg-blue-600 active:scale-95 transition-all text-white font-bold text-[3.8cqw] shadow-[0_8px_20px_rgba(66,125,237,0.3)]">
           Send Proposal
         </button>
      </motion.div>
    </div>
  )
}

// ── COUNTER COMPONENT FOR CONTINUOUSLY RISING NUMBERS ──
const LiveCounter = ({ initialValue = 1000 }: { initialValue?: number }) => {
  const [count, setCount] = useState(initialValue);

  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly increase by 1 to 15 every 600-1200ms
      setCount(prev => prev + Math.floor(Math.random() * 15) + 1);
    }, 600 + Math.random() * 600);

    return () => clearInterval(interval);
  }, []);

  let formattedCount = count.toString();
  if (count >= 1000000) {
    formattedCount = (count / 1000000).toFixed(1) + 'M';
  } else if (count >= 1000) {
    formattedCount = (count / 1000).toFixed(1) + 'K';
  }

  return <span>{formattedCount}</span>;
};

// ── REEL CAROUSEL WITH STACKED ANIMATION ──
const ReelCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % VERTICAL_VIDEOS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full aspect-[9/16] shrink-0 flex items-center justify-center">
      <AnimatePresence>
         {VERTICAL_VIDEOS.map((vid, idx) => {
           const diff = (idx - currentIndex + VERTICAL_VIDEOS.length) % VERTICAL_VIDEOS.length;
           // Only render the active and the next two to save performance
           if (diff > 2) return null;

           const isActive = diff === 0;
           // The top card is straight, second is bent right, third is bent left
           const rotation = isActive ? 0 : diff === 1 ? 6 : -4;
           const scale = isActive ? 1 : diff === 1 ? 0.9 : 0.82;
           const zIndex = 30 - diff * 10;
           const xOffset = isActive ? 0 : diff === 1 ? 12 : -12;

           return (
             <motion.div
               key={vid}
               initial={{ opacity: 0, scale: 0.8, rotate: rotation, x: xOffset }}
               animate={{ rotate: rotation, scale, zIndex, x: xOffset, opacity: 1 }}
               exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
               transition={{ duration: 0.6, type: 'spring', bounce: 0.3 }}
               className="absolute inset-0 rounded-[3cqw] overflow-hidden bg-black shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-zinc-200 origin-bottom"
             >
               <video 
                 src={vid}
                 autoPlay
                 loop 
                 muted 
                 playsInline 
                 className="absolute inset-0 w-full h-full object-cover"
               />
               <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
             </motion.div>
           );
         })}
      </AnimatePresence>
    </div>
  );
};


interface RoleDeviceCardProps {
  category: RoleCategory;
  thumbImage: string;
  videoAsset?: string;
  overlayBadge?: string | null;
  isSelected: boolean;
  index: number;
  onSelect: () => void;
  onOpenInfo: (category: RoleCategory) => void;
}

export const RoleDeviceCard = React.memo(function RoleDeviceCard({
  category,
  thumbImage,
  videoAsset,
  overlayBadge,
  isSelected,
  index,
  onSelect,
  onOpenInfo,
}: RoleDeviceCardProps) {
  const config = ROLE_SHOWCASE_CONFIG[category.slug] || DEFAULT_ROLE_SHOWCASE;

  // 3D Magnetic Mouse Tilt Physics (Disabled on mobile touch for battery/smoothness)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 260, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 260, damping: 25 });

  // Base rotation based on index to emulate phones standing randomly
  const baseRotateZ = index % 3 === 0 ? -4 : index % 3 === 1 ? 4 : 0;
  const baseRotateY = index % 3 === 0 ? 3 : index % 3 === 1 ? -3 : 0;

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7deg', '-7deg']);
  // Combine mouse rotation with base rotation
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [`${-7 + baseRotateY}deg`, `${7 + baseRotateY}deg`]);
  const rotateZ = `${baseRotateZ}deg`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const renderSocialIcon = (network: string, key: number) => {
    switch (network) {
      case 'youtube':
        return <FaYoutube key={key} size={11} className="text-red-500 hover:scale-110 transition-transform" />;
      case 'tiktok':
        return <FaTiktok key={key} size={10} className="text-zinc-800 hover:scale-110 transition-transform" />;
      case 'twitter':
        return <FaTwitter key={key} size={10} className="text-sky-500 hover:scale-110 transition-transform" />;
      case 'linkedin':
        return <FaLinkedin key={key} size={10} className="text-blue-600 hover:scale-110 transition-transform" />;
      case 'instagram':
        return <FaInstagram key={key} size={11} className="text-pink-500 hover:scale-110 transition-transform" />;
      default:
        return null;
    }
  };

  const renderOrbitalIcon = (iconType: string) => {
    switch (iconType) {
      case 'calendar':
        return <Calendar size={13} className="text-white" />;
      case 'download':
        return <Download size={13} className="text-white" />;
      case 'courses':
        return <GraduationCap size={15} className="text-white" />;
      case 'shield':
        return <ShieldCheck size={13} className="text-white" />;
      case 'camera':
        return <Camera size={13} className="text-white" />;
      case 'music':
        return <Music size={13} className="text-white" />;
      case 'video':
        return <Video size={13} className="text-white" />;
      case 'zap':
        return <Zap size={13} className="text-white" />;
      default:
        return <Sparkles size={13} className="text-white" />;
    }
  };

  const renderSecondaryIcon = (iconType: string) => {
    switch (iconType) {
      case 'calendar':
        return <Calendar size={12} className="text-blue-500" />;
      case 'book':
        return <BookOpen size={12} className="text-amber-500" />;
      case 'shield':
        return <ShieldCheck size={12} className="text-emerald-500" />;
      case 'file':
        return <FileText size={12} className="text-violet-500" />;
      case 'music':
        return <Music size={12} className="text-pink-500" />;
      case 'video':
        return <Video size={12} className="text-purple-500" />;
      case 'activity':
        return <Activity size={12} className="text-rose-500" />;
      default:
        return <Check size={12} className="text-emerald-500" />;
    }
  };

  return (
    <motion.div
      style={{
        rotateX,
        rotateY,
        rotateZ,
        transformStyle: 'preserve-3d',
        aspectRatio: '9 / 19.5',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onSelect}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative w-full max-w-[18rem] sm:max-w-[20rem] mx-auto cursor-pointer select-none group perspective-1000 transition-all duration-300 ${
        isSelected ? 'z-20' : 'z-10'
      }`}
    >
      {/* Ambient Outer Halo when Selected */}
      {isSelected && (
        <motion.div
          layoutId="role-selected-halo"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -inset-3 rounded-[2.6rem] bg-gradient-to-r from-red-500/25 via-amber-500/20 to-indigo-500/25 blur-xl -z-10"
        />
      )}

      {/* Selected Indicator Badge (Floats above phone) */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: -24, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ type: "spring", damping: 15 }}
            className="absolute left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-4 py-1.5 rounded-full flex items-center gap-2 shadow-[0_8px_20px_rgba(0,0,0,0.3)] border border-zinc-700/50 whitespace-nowrap"
          >
            <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shadow-inner">
              <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
            </div>
            <span className="text-sm font-bold tracking-wide">Selected</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 📱 SMARTPHONE / BENTO GLASS SHELL ───────────────────────────── */}
      <div
        style={{ containerType: 'inline-size' }}
        className={`relative w-full h-full rounded-[1.5rem] md:rounded-[2.3rem] overflow-hidden border-[3px] md:border-[6px] transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.08)] md:shadow-[0_16px_40px_rgba(0,0,0,0.08)] flex flex-col justify-between ${
          isSelected
            ? 'border-zinc-950 shadow-[0_12px_25px_rgba(0,0,0,0.22)] md:shadow-[0_24px_50px_rgba(0,0,0,0.22)] ring-2 md:ring-4 ring-zinc-950/15 bg-zinc-950'
            : 'border-zinc-900 bg-zinc-900 hover:border-zinc-800 hover:shadow-[0_10px_25px_rgba(0,0,0,0.12)] md:hover:shadow-[0_20px_45px_rgba(0,0,0,0.12)]'
        }`}
      >
        {/* Inner Screen Bezel */}
        <div className="absolute inset-0 border-[0.5cqw] border-black/10 rounded-[8cqw] pointer-events-none z-50" />
        
        {/* Top Camera/Speaker Island Notch */}
        <div className="absolute top-[3cqw] left-1/2 -translate-x-1/2 w-[30cqw] h-[6cqw] bg-black rounded-full z-40 flex items-center justify-between px-[2cqw] shadow-md border border-white/5">
          {/* Inner camera sensors */}
          <div className="w-[3cqw] h-[3cqw] rounded-full bg-zinc-900/80 border border-white/10 ml-[0.5cqw] shadow-inner" />
          <div className="w-[1.5cqw] h-[1.5cqw] rounded-full bg-green-500/20 mr-[1cqw] animate-pulse" />
        </div>

        {/* ── TOP HEADER SECTION: Role Name, Handle & Social Links ── */}
        <div className="pt-[10cqw] pb-[3cqw] px-[4cqw] flex flex-col items-center text-center relative z-20 bg-white rounded-t-[7cqw]">
          {/* Top Status Bar (Time, Wifi, Battery) */}
          <div className="absolute top-[2cqw] left-[5cqw] right-[5cqw] flex justify-between items-center z-50 text-[3cqw] font-bold text-zinc-800">
            <span>9:41</span>
            <div className="flex items-center gap-[1cqw] opacity-80">
              <Activity className="w-[3cqw] h-[3cqw]" />
              <div className="w-[5cqw] h-[2cqw] rounded-[0.5cqw] border border-zinc-800 relative flex items-center p-[1px]">
                 <div className="bg-zinc-800 h-full w-[80%] rounded-[0.2cqw]" />
              </div>
            </div>
          </div>

          {/* Creator / Role Identity */}
          <div className="flex items-center gap-[1.5cqw] mb-[0.5cqw] mt-[2cqw]">
            <h3 className="text-[5cqw] font-semibold text-zinc-900 tracking-tight leading-tight line-clamp-1">
              {category.name}
            </h3>
            {isSelected && (
              <span className="w-[2cqw] h-[2cqw] rounded-full bg-emerald-500 animate-pulse shrink-0" />
            )}
          </div>
        </div>

        {/* ── INTERNAL SCREEN CONTENT (Empty canvas for roles) ── */}
        <div className="relative flex-1 w-full bg-white flex flex-col overflow-hidden pb-[10cqw] -mt-[1px] pt-[1px]">
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-[4cqw] py-[4cqw]">
            {/* ── CREATOR ROLE SCREEN DESIGN ── */}
            {category.slug === 'creator' && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 0.2 }}
                className="w-full flex items-start gap-[4cqw]"
              >
                {/* Stacked Reel Component (Left Side) */}
                <div className="w-[50cqw] shrink-0 relative z-30">
                  <ReelCarousel />
                </div>

                {/* Social Actions / Stats (Right Side) */}
                <div className="flex flex-col gap-[3cqw] mt-[2cqw] flex-1 relative z-50">
                  <div className="flex items-center gap-[2cqw] group cursor-default">
                    <div className="w-[9cqw] h-[9cqw] rounded-full bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100/50 group-hover:scale-110 transition-transform">
                      <Heart className="w-[4.5cqw] h-[4.5cqw] text-rose-500 fill-rose-500" />
                    </div>
                    <span className="text-[3.5cqw] font-semibold text-zinc-700 tabular-nums tracking-tight">
                      <LiveCounter initialValue={12450} />
                    </span>
                  </div>

                  <div className="flex items-center gap-[2cqw] group cursor-default">
                    <div className="w-[9cqw] h-[9cqw] rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100/50 group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-[4.5cqw] h-[4.5cqw] text-blue-500 fill-blue-500" />
                    </div>
                    <span className="text-[3.5cqw] font-semibold text-zinc-700 tabular-nums tracking-tight">
                      <LiveCounter initialValue={856} />
                    </span>
                  </div>

                  <div className="flex items-center gap-[2cqw] group cursor-default">
                    <div className="w-[9cqw] h-[9cqw] rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100/50 group-hover:scale-110 transition-transform">
                      <Share2 className="w-[4.5cqw] h-[4.5cqw] text-indigo-500" />
                    </div>
                    <span className="text-[3.5cqw] font-semibold text-zinc-700 tabular-nums tracking-tight">
                      <LiveCounter initialValue={3200} />
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {category.slug === 'creator' && (
              <YTFeedCarousel />
            )}

            {/* ── EDITOR ROLE SCREEN DESIGN ── */}
            {category.slug.includes('editor') && (
              <EditorShowcase />
            )}

            {/* ── NORMAL USER SCREEN DESIGN ── */}
            {(category.slug.includes('user') || category.slug.includes('client')) && (
              <NormalUserShowcase />
            )}
            
            {/* ── BRAND / BUSINESS SCREEN DESIGN ── */}
            {(category.slug.includes('brand') || category.slug.includes('business')) && (
              <BrandShowcase />
            )}
            
            {/* End Role Screens */}
          </div>

          {/* ── SYSTEM NAVIGATION BAR (3 Buttons) ── */}
          <div className="absolute bottom-0 left-0 right-0 h-[10cqw] bg-white/90 backdrop-blur-sm border-t border-zinc-100 flex items-center justify-around px-[6cqw] z-50">
            <ChevronLeft className="w-[4cqw] h-[4cqw] text-zinc-900" strokeWidth={3} />
            <Circle className="w-[3.5cqw] h-[3.5cqw] text-zinc-900" strokeWidth={3} />
            <Square className="w-[3cqw] h-[3cqw] text-zinc-900" strokeWidth={3} />
          </div>
        </div>
      </div>

      {/* ── HARDWARE BUTTONS ── */}
      <div className="absolute top-12 md:top-24 -left-0.5 md:-left-1 w-0.5 md:w-1 h-5 md:h-8 bg-zinc-700 rounded-l-sm z-0" />
      <div className="absolute top-20 md:top-36 -left-0.5 md:-left-1 w-0.5 md:w-1 h-8 md:h-12 bg-zinc-700 rounded-l-sm z-0" />
      <div className="absolute top-32 md:top-52 -left-0.5 md:-left-1 w-0.5 md:w-1 h-8 md:h-12 bg-zinc-700 rounded-l-sm z-0" />
      <div className="absolute top-20 md:top-36 -right-0.5 md:-right-1 w-0.5 md:w-1 h-10 md:h-16 bg-zinc-700 rounded-r-sm z-0" />
    </motion.div>
  );
});
