import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaChevronLeft, 
  FaTimes, 
  FaCloudUploadAlt, 
  FaMapMarkerAlt, 
  FaUserTag, 
  FaHashtag, 
  FaPoll, 
  FaPen,
  FaChevronRight,
  FaPlus,
  FaEye,
  FaCheckCircle
} from "react-icons/fa";
import { HiOutlinePhoto, HiOutlineVideoCamera } from "react-icons/hi2";
import { useAppContext } from "../context/AppContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const ReelUploadPage = () => {
  const { user, backendURL } = useAppContext();
  const navigate = useNavigate();
  
  // State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState([]); // Array of strings
  const [hashtagInput, setHashtagInput] = useState("");
  const [showHashtagInput, setShowHashtagInput] = useState(false);
  const [location, setLocation] = useState("");
  const [isAIContent, setIsAIContent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showTrending, setShowTrending] = useState(false);
  
  const trendingHashtags = [
    "#trending", "#viral", "#foryou", "#reelsinstagram", "#explorepage", 
    "#photography", "#nature", "#love", "#instagood", "#fashion"
  ];

  // Files
  const [editedFile, setEditedFile] = useState(null);
  const [editedPreview, setEditedPreview] = useState(null);
  const [originalFiles, setOriginalFiles] = useState([]);
  const [originalPreviews, setOriginalPreviews] = useState([]);
  
  // Carousel logic
  const [carouselIndex, setCarouselIndex] = useState(0); // 0: Edited, 1+: Originals

  const editedInputRef = useRef(null);
  const originalInputRef = useRef(null);

  const handleEditedChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditedFile(file);
      setEditedPreview({
        url: URL.createObjectURL(file),
        type: file.type.startsWith("video") ? "video" : "image"
      });
      setCarouselIndex(0);
    }
  };

  const handleOriginalsChange = (e) => {
    const files = Array.from(e.target.files);
    const newOriginals = [...originalFiles, ...files].slice(0, 2); // Max 2 originals as requested
    setOriginalFiles(newOriginals);
    
    const newPreviews = newOriginals.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video") ? "video" : "image"
    }));
    setOriginalPreviews(newPreviews);
  };

  const removeOriginal = (idx) => {
    const newFiles = [...originalFiles];
    newFiles.splice(idx, 1);
    setOriginalFiles(newFiles);
    
    const newPreviews = [...originalPreviews];
    newPreviews.splice(idx, 1);
    setOriginalPreviews(newPreviews);
    
    // Adjust carousel index if needed
    if (carouselIndex > newFiles.length) {
        setCarouselIndex(newFiles.length);
    }
  };

  const removeEditedFile = () => {
    setEditedFile(null);
    setEditedPreview(null);
    if (carouselIndex === 0 && originalFiles.length > 0) {
      setCarouselIndex(0);
    }
  };

  const addHashtag = (tag) => {
    const cleanedTag = tag.trim().startsWith("#") ? tag.trim() : `#${tag.trim()}`;
    if (cleanedTag && cleanedTag !== "#" && !hashtags.includes(cleanedTag)) {
        setHashtags([...hashtags, cleanedTag]);
        setHashtagInput("");
        setShowTrending(false);
    }
  };

  const removeHashtag = (tag) => {
    setHashtags(hashtags.filter(h => h !== tag));
  };

  const handleUpload = async () => {
    if (!editedFile) return toast.error("Please add an edited clip");
    if (!title) return toast.error("Please add a title");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("location", location);
    formData.append("isAIContent", isAIContent);
    formData.append("editedClip", editedFile);
    originalFiles.forEach(file => formData.append("originalClip", file));
    
    // Process hashtags: split by space or comma and clean
    formData.append("hashtags", JSON.stringify(hashtags));

    try {
      setLoading(true);
      setUploadProgress(0);

      const { data } = await axios.post(`${backendURL}/api/portfolio`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user?.token}`,
        },
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      toast.success("Reel uploaded successfully!");
      // Redirect to the newly created portfolio/reel
      navigate("/editor-profile", { state: { openPortfolioId: data.portfolio._id } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload reel");
      setLoading(false);
    }
  };

  const allPreviews = editedPreview ? [editedPreview, ...originalPreviews] : originalPreviews;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col max-w-md mx-auto relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sticky top-0 bg-black z-20 border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <FaChevronLeft className="text-xl" />
        </button>
        <h1 className="font-bold text-lg">New reel</h1>
        <button 
          onClick={handleUpload}
          disabled={loading}
          className="text-blue-500 font-bold text-base"
        >
          {loading ? "..." : "Share"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-2 custom-scrollbar flex flex-col">
        {/* Media Preview Carousel (Side-Peek) */}
        <div className="relative h-[40vh] w-full flex items-center overflow-hidden mb-4 py-2">
          <motion.div 
            className="flex gap-4 items-center absolute left-0"
            initial={false}
            animate={{ x: `calc(50% - 11.25vh - ${carouselIndex} * (22.5vh + 1rem))` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ 
                display: "flex", 
                width: "max-content", 
            }}
          >
            {allPreviews.map((preview, idx) => (
              <motion.div
                key={idx}
                onClick={() => setCarouselIndex(idx)}
                className="relative aspect-[9/16] h-[40vh] bg-zinc-900 rounded-2xl overflow-hidden shrink-0 transition-shadow cursor-pointer"
                animate={{ 
                  scale: idx === carouselIndex ? 1 : 0.8,
                  opacity: idx === carouselIndex ? 1 : 0.4,
                  filter: idx === carouselIndex ? "blur(0px)" : "blur(1px)"
                }}
                style={{ width: "22.5vh" }}
              >
                {preview.type === "video" ? (
                  <video 
                    src={preview.url} 
                    className="w-full h-full object-contain" 
                    autoPlay 
                    loop 
                    muted 
                  />
                ) : (
                  <img 
                    src={preview.url} 
                    className="w-full h-full object-contain" 
                    alt="" 
                  />
                )}
                
                {/* Overlay Badge */}
                <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/10 z-20">
                  {idx === 0 ? "Edited" : `Original ${idx}`}
                </div>

                {/* Remove Button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (idx === 0) {
                      removeEditedFile();
                    } else {
                      removeOriginal(idx - 1);
                    }
                  }}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 z-30 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FaTimes className="text-[10px] text-white" />
                </button>
              </motion.div>
            ))}
            
            {/* Empty placeholder to encourage adding more */}
            {allPreviews.length < 3 && (
                <div 
                   onClick={() => originalInputRef.current.click()}
                   className="relative aspect-[9/16] h-[40vh] bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-2xl shrink-0 flex flex-col items-center justify-center gap-2 text-zinc-700 opacity-40 scale-80"
                   style={{ width: "22.5vh" }}
                >
                   <FaPlus />
                   <span className="text-[10px] font-bold">Add more</span>
                </div>
            )}
          </motion.div>

          {/* Centering Indicator Removed */}

          {/* Navigation Buttons Overlay */}
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-20 pointer-events-none">
             <button 
                onClick={(e) => { e.stopPropagation(); setCarouselIndex(prev => Math.max(0, prev - 1)); }}
                disabled={carouselIndex === 0}
                className="w-8 h-8 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-full border border-white/20 pointer-events-auto disabled:opacity-30 active:scale-90 transition-all"
             >
                <FaChevronLeft className="text-xs" />
             </button>
             <button 
                onClick={(e) => { e.stopPropagation(); setCarouselIndex(prev => Math.min(allPreviews.length - 1, prev + 1)); }}
                disabled={carouselIndex === allPreviews.length - 1}
                className="w-8 h-8 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-full border border-white/20 pointer-events-auto disabled:opacity-30 active:scale-90 transition-all"
             >
                <FaChevronRight className="text-xs" />
             </button>
          </div>
        </div>

        {/* Media Selectors */}
        <div className="flex flex-col gap-3 mb-6">
            <div className="flex gap-2">
                <button 
                    onClick={() => editedInputRef.current.click()}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-xl border transition-all ${editedFile ? "border-white bg-white text-black" : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"}`}
                >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${editedFile ? "bg-black/10" : "bg-zinc-800"}`}>
                        <FaCheckCircle className={`text-[10px] ${editedFile ? "opacity-100" : "opacity-30"}`} />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest">Edited Reel</span>
                    <input ref={editedInputRef} type="file" hidden onChange={handleEditedChange} accept="video/*,image/*" />
                </button>

                <button 
                    onClick={() => originalInputRef.current.click()}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-xl border transition-all ${originalFiles.length > 0 ? "border-white bg-white text-black" : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"}`}
                >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${originalFiles.length > 0 ? "bg-black/10" : "bg-zinc-800"}`}>
                        <FaPlus className="text-[10px]" />
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-[8px] font-black uppercase tracking-widest">Originals</span>
                        <span className="text-[7px] font-bold opacity-50">(Opt)</span>
                    </div>
                    <input ref={originalInputRef} type="file" multiple hidden onChange={handleOriginalsChange} accept="video/*,image/*" />
                </button>
            </div>
            
            <p className="text-[8px] text-zinc-600 text-center px-6 leading-tight opacity-80">
                Why it matters? Adding original clips builds trust and showcases your authentic process to clients.
            </p>
        </div>

        {/* Inputs Section */}
        <div className="space-y-6">
          <div className="flex gap-3">
             <div className="w-9 h-9 rounded-full bg-zinc-800 flex-shrink-0 overflow-hidden border border-white/10">
                {user?.profilePicture ? (
                    <img src={user.profilePicture} className="w-full h-full object-cover" alt="" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-zinc-500">
                        {user?.name?.[0]}
                    </div>
                )}
             </div>
             <div className="flex-1 flex flex-col gap-1">
                <input 
                    type="text"
                    placeholder="Title your work..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-[14px] font-bold placeholder:text-zinc-600 p-0"
                />
                <div className="relative">
                    <textarea 
                        placeholder="Write a caption..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                        rows={2}
                        className="bg-transparent border-none focus:ring-0 text-xs w-full p-0 resize-none placeholder:text-zinc-600 leading-snug"
                    />
                    <div className="flex justify-end pr-1 mt-1">
                        <span className={`text-[9px] font-medium ${description.length >= 500 ? "text-red-500" : "text-zinc-600"}`}>
                            {description.length}/500
                        </span>
                    </div>
                </div>
             </div>
          </div>

          {/* Hashtag Management */}
          <div className="space-y-3">
            <div className="flex gap-2 items-center">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <FaHashtag className="text-zinc-500 text-xs flex-shrink-0" />
                    <input 
                        type="text"
                        placeholder="Add hashtag..."
                        value={hashtagInput}
                        onChange={(e) => setHashtagInput(e.target.value)}
                        onFocus={() => setShowTrending(true)}
                        onKeyDown={(e) => e.key === "Enter" && addHashtag(hashtagInput)}
                        className="bg-transparent border-none focus:ring-0 text-xs p-0 w-full placeholder:text-zinc-700"
                    />
                    {hashtagInput && (
                        <button 
                            onClick={() => addHashtag(hashtagInput)}
                            className="text-[10px] font-black uppercase text-blue-500 px-2"
                        >
                            Add
                        </button>
                    )}
                </div>
                {!hashtagInput && (
                    <div className="flex gap-2">
                        <button className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400">
                            <FaPoll className="text-xs" />
                        </button>
                        <button className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400">
                            <FaPen className="text-xs" />
                        </button>
                    </div>
                )}
            </div>

            {/* Added Hashtags List */}
            {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {hashtags.map((tag, i) => (
                        <span 
                            key={i} 
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-white text-black text-[10px] font-bold rounded-full transition-all active:scale-95"
                        >
                            {tag}
                            <button onClick={() => removeHashtag(tag)} className="opacity-60 hover:opacity-100">
                                <FaTimes className="text-[8px]" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Trending Suggestions */}
            {showTrending && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col gap-2"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-500">Trending Now</span>
                        <button onClick={() => setShowTrending(false)} className="text-zinc-600">
                            <FaTimes className="text-[8px]" />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {trendingHashtags.map((tag, i) => (
                            <button 
                                key={i}
                                onClick={() => addHashtag(tag)}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${hashtags.includes(tag) ? "bg-white border-white text-black" : "bg-black/20 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"}`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
          </div>

          {/* Action Rows */}
          <div className="divide-y divide-zinc-900 border-y border-zinc-900">
             <button className="w-full flex items-center justify-between py-2.5 group">
                <div className="flex items-center gap-2">
                    <FaUserTag className="text-sm text-zinc-500" />
                    <span className="text-[12px] font-medium text-zinc-300">Tag people</span>
                </div>
                <FaChevronRight className="text-zinc-700 text-[10px]" />
             </button>

             <button className="w-full flex items-center justify-between py-2.5 group">
                <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-sm text-zinc-500" />
                    <span className="text-[12px] font-medium text-zinc-300">Add location</span>
                </div>
                <FaChevronRight className="text-zinc-700 text-[10px]" />
             </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/50">
             <div className="flex flex-col">
                <span className="text-[11px] font-bold">AI label</span>
                <span className="text-[9px] text-zinc-600">Label content made with AI.</span>
             </div>
             <button 
                onClick={() => setIsAIContent(!isAIContent)}
                className={`w-10 h-5 rounded-full relative transition-colors ${isAIContent ? "bg-blue-600" : "bg-zinc-800"}`}
             >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isAIContent ? "right-0.5" : "left-0.5"}`} />
             </button>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 bg-black border-t border-white/5 sticky bottom-0 z-20 flex gap-3">
         <button 
            onClick={() => navigate(-1)}
            className="flex-1 py-4 rounded-xl bg-zinc-900 text-sm font-bold transition-transform active:scale-95"
         >
            Save draft
         </button>
         <button 
            onClick={handleUpload}
            disabled={loading}
            className="flex-1 py-4 rounded-xl bg-blue-600 text-sm font-bold transition-transform active:scale-95 disabled:opacity-50"
         >
            {loading ? `Uploading ${uploadProgress}%` : "Share"}
         </button>
      </div>

      {/* Upload Progress Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="relative w-32 h-32 mb-8">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle 
                        className="text-zinc-800 stroke-current" 
                        strokeWidth="4" 
                        cx="50" cy="50" r="45" 
                        fill="transparent"
                    />
                    <motion.circle 
                        className="text-blue-500 stroke-current" 
                        strokeWidth="4" 
                        strokeLinecap="round"
                        cx="50" cy="50" r="45" 
                        fill="transparent"
                        strokeDasharray="282.7"
                        animate={{ strokeDashoffset: 282.7 - (282.7 * uploadProgress) / 100 }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black">{uploadProgress}%</span>
                </div>
            </div>
            <h2 className="text-xl font-bold mb-2">Sharing your reel...</h2>
            <p className="text-zinc-500 text-sm">Hang tight, we're making you famous!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReelUploadPage;
