import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "react-toastify";
import { FaFilter, FaBolt, FaTimes } from "react-icons/fa";
import { HiMagnifyingGlass, HiChevronLeft, HiXMark } from "react-icons/hi2";
import { useAppContext } from "../context/AppContext";
import NearbyMapView from "../components/NearbyMapView";
import NearbyEditorList from "../components/NearbyEditorList";
import MobileDiscoverySheet from "../components/MobileDiscoverySheet";
import useRefreshManager from "../hooks/useRefreshManager.js";
import usePullToRefresh from "../hooks/usePullToRefresh.jsx";

const LocalEditorsNetworkPage = () => {
  const { user } = useAppContext();
  const navigate = useNavigate();
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const [editors, setEditors] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedEditorId, setSelectedEditorId] = useState(null);
  const [searchRadius, setSearchRadius] = useState(5);
  const [isMatching, setIsMatching] = useState(false);
  const [matchResult, setMatchResult] = useState(null); // 'found' | 'notFound' | null
  const [hasSearched, setHasSearched] = useState(false);

  // ── DATA FETCHING ──────────────────────────────────────────────────
  const { data: nearbyData, isLoading: nearbyLoading, isFetching: nearbyFetching } = useQuery({
    queryKey: ['location', 'nearby', { 
      lat: userLocation?.lat, 
      lng: userLocation?.lng, 
      radius: searchRadius 
    }],
    queryFn: async () => {
      const { data } = await axios.get(
        `${backendURL}/api/location/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${searchRadius}`,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      return data.editors || [];
    },
    enabled: !!userLocation && !!user?.token && hasSearched,
    staleTime: 5 * 60 * 1000, // 5 mins
  });

  // Keep state in sync
  useEffect(() => {
    if (nearbyData) {
      setEditors(nearbyData);
    }
  }, [nearbyData]);

  // Combined loading state for UI
  const isLoading = nearbyLoading || (nearbyFetching && editors.length === 0);

  // Initial user location capture
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast.error("Please enable location to see editors near you.");
          // Fallback to Bangalore
          const fallback = { lat: 12.9716, lng: 77.5946 };
          setUserLocation(fallback);
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const handleEditorSelect = (editor) => {
    setSelectedEditorId(editor._id);
  };



  const handleAutoMatch = async () => {
    if (editors.length === 0) {
      toast.info("Discovering editors first...");
      return;
    }
    
    setIsMatching(true);
    setHasSearched(true); // Tag that initial search has happened
    setMatchResult(null);
    
    // 1. Processing Phase
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Identification Phase
    const bestMatch = editors.reduce((prev, current) => 
      (prev.relevanceScore > current.relevanceScore) ? prev : current
    );

    if (bestMatch) {
      setMatchResult('found');
      handleEditorSelect(bestMatch);
      // Wait to show result msg
      await new Promise(resolve => setTimeout(resolve, 1500));
    } else {
      setMatchResult('notFound');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    setIsMatching(false);
    setMatchResult(null);
  };
  
  const handleResetSearch = () => {
    setHasSearched(false);
    setEditors([]);
    setSearchRadius(5);
    setSelectedEditorId(null);
  };

  const handleStartDiscovery = () => {
    setHasSearched(true);
    if (userLocation) {
      // The original code had fetchNearbyEditors, but it's not defined.
      // Assuming it should trigger a refetch of the useQuery.
      // The useQuery is already enabled by hasSearched, so setting hasSearched(true)
      // should be enough to trigger it if userLocation is available.
      // If a manual trigger is needed, it would be queryClient.invalidateQueries.
      // For now, rely on the `enabled` property of useQuery.
    }
  };

  const scrollContainerRef = useRef(null);
  const { triggerRefresh } = useRefreshManager();

  // Pull-to-Refresh Integration
  const { handleTouchStart, handleTouchEnd, PullIndicator } = usePullToRefresh(
    () => triggerRefresh(true, [['location', 'nearby']]), 
    scrollContainerRef
  );

  return (
    <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-[#f8f9fa]">
      {/* AI Processing Overlay */}
      <AnimatePresence>
        {isMatching && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[5000] bg-black/95 backdrop-blur-xl flex items-center justify-center pointer-events-auto"
          >
            <div className="flex flex-col items-center gap-8 max-w-xs text-center">
              <div className="relative">
                {/* Immersive Pulsing Core */}
                <motion.div 
                   animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0, 0.2] }}
                   transition={{ duration: 2, repeat: Infinity }}
                   className="absolute inset-0 bg-white rounded-full blur-3xl"
                />
                
                <div className="relative w-28 h-28 rounded-full border border-white/10 flex items-center justify-center">
                   {!matchResult ? (
                     <>
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 border-t-2 border-white rounded-full"
                        />
                        <FaBolt className="text-4xl text-white animate-pulse" />
                     </>
                   ) : matchResult === 'found' ? (
                     <motion.div 
                       initial={{ scale: 0, rotate: -45 }}
                       animate={{ scale: 1, rotate: 0 }}
                       className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white text-3xl shadow-[0_0_50px_rgba(16,185,129,0.5)]"
                     >
                        <FaBolt />
                     </motion.div>
                   ) : (
                     <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-red-500 text-5xl"
                     >
                        !
                     </motion.div>
                   )}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {!matchResult ? (
                  <motion.div 
                    key="processing"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-2"
                  >
                    <h2 className="text-2xl font-black text-white italic tracking-tighter">
                      AI<span className="text-emerald-500 not-italic">Scouting</span>
                    </h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.4em] animate-pulse">
                      Analyzing local talent...
                    </p>
                  </motion.div>
                ) : matchResult === 'found' ? (
                  <motion.div 
                    key="found"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-1"
                  >
                    <h2 className="text-3xl font-black text-white leading-none">Best Match</h2>
                    <p className="text-emerald-500 font-black text-lg">IDENTIFIED</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-4">
                      Panning to profile
                    </p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="none"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-1"
                  >
                    <h2 className="text-2xl font-black text-white">No Match</h2>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em]">In current area</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar List (450px width on Desktop) */}
      <div className="hidden md:block w-[450px] h-full flex-shrink-0 z-10 shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
        <NearbyEditorList 
          editors={editors} 
          isLoading={isLoading} 
          selectedEditorId={selectedEditorId}
          onEditorSelect={handleEditorSelect}
        />
      </div>

      {/* Map View (Remaining width) */}
      <div className="flex-1 h-full relative">
        <NearbyMapView 
          editors={editors} 
          userLocation={userLocation} 
          selectedEditorId={selectedEditorId}
          onEditorSelect={handleEditorSelect}
          onAutoMatch={handleAutoMatch}
          searchRadius={searchRadius}
          onRadiusChange={setSearchRadius}
          hasSearched={hasSearched}
          onStartDiscovery={handleStartDiscovery}
        />

        {/* Premium Header Overlay (Uber/Google Maps Style) */}
        <div className="absolute top-0 left-0 right-0 z-[2000] pointer-events-none">
           {/* Dynamic Black Gradient Overlay */}
           <div className="absolute inset-0 h-40 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none" />
           
           <div className="relative p-6 max-w-xl mx-auto md:ml-0 flex flex-col gap-4">
              {/* Navigation & Branding Row */}
              <div className="flex items-center gap-4">
                 <motion.button 
                   onClick={() => navigate(user?.role === 'client' ? '/client-home' : '/editor-home')}
                   whileHover={{ scale: 1.1, backgroundColor: "#fff" }}
                   whileTap={{ scale: 0.9 }}
                   className="pointer-events-auto h-10 w-10 rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl group"
                 >
                   <HiChevronLeft className="text-gray-900 text-xl group-hover:-translate-x-0.5 transition-transform" />
                 </motion.button>

                 <div className="flex flex-col">
                    <h1 className="text-3xl font-black text-white italic tracking-tighter leading-none">
                       Find<span className="text-emerald-500 not-italic">Editor</span>
                    </h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-1 ml-1">
                       {hasSearched ? `${editors.length} Professionals Near You` : "Discovery Mode"}
                    </p>
                 </div>

                 {hasSearched && (
                   <motion.button
                     initial={{ opacity: 0, x: -10 }}
                     animate={{ opacity: 1, x: 0 }}
                     onClick={handleResetSearch}
                     className="pointer-events-auto h-8 px-3 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2 group hover:bg-red-500 transition-colors ml-auto"
                   >
                     <HiXMark className="text-white text-sm" />
                     <span className="text-[8px] font-black text-white uppercase tracking-widest">Stop Search</span>
                   </motion.button>
                 )}
              </div>

              {/* Compact Search Bar */}
              <div className="w-full max-w-[280px] pointer-events-auto bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl flex items-center px-4 py-2.5 gap-3">
                 <HiMagnifyingGlass className="text-gray-400 text-lg" />
                 <input 
                   type="text" 
                   placeholder="Search nearby..." 
                   className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-gray-800 placeholder:text-gray-400"
                 />
              </div>

              {/* Conditional Radius Slider (Floating below search) */}
              <AnimatePresence>
                {hasSearched && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-full max-w-[220px] pointer-events-auto bg-white/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Radius</p>
                      <p className="text-[10px] font-black text-emerald-600">{searchRadius}km</p>
                    </div>
                    <input 
                      type="range"
                      min="1"
                      max="400"
                      step="1"
                      value={searchRadius}
                      onChange={(e) => setSearchRadius(Number(e.target.value))}
                      className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet (Phase D) */}
      <MobileDiscoverySheet 
        editors={editors} 
        isLoading={(isLoading || isMatching) && hasSearched} 
        onEditorSelect={handleEditorSelect} 
        onAutoMatch={handleAutoMatch}
        hasSearched={hasSearched}
        onStartDiscovery={handleStartDiscovery}
      />
    </div>
  );
};

export default LocalEditorsNetworkPage;
