import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "react-toastify";
import { FaFilter } from "react-icons/fa";
import { HiMagnifyingGlass, HiChevronLeft } from "react-icons/hi2";
import { useAppContext } from "../context/AppContext";
import NearbyMapView from "../components/NearbyMapView";
import NearbyEditorList from "../components/NearbyEditorList";
import MobileDiscoverySheet from "../components/MobileDiscoverySheet";

const LocalEditorsNetworkPage = () => {
  const { user } = useAppContext();
  const navigate = useNavigate();
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const [editors, setEditors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedEditorId, setSelectedEditorId] = useState(null);
  const [searchRadius, setSearchRadius] = useState(25);
  const [isMatching, setIsMatching] = useState(false);
  const [matchResult, setMatchResult] = useState(null); // 'found' | 'notFound' | null
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!hasSearched) return; // Only fetch dynamically after initial search

    const debounceTimer = setTimeout(() => {
      if (userLocation) {
        fetchNearbyEditors(userLocation.lat, userLocation.lng, searchRadius);
      }
    }, 500); 

    return () => clearTimeout(debounceTimer);
  }, [searchRadius, userLocation, hasSearched]);

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
          // fetchNearbyEditors(loc.lat, loc.lng); // Removed automatic search
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast.error("Please enable location to see editors near you.");
          // Fallback to Bangalore
          const fallback = { lat: 12.9716, lng: 77.5946 };
          setUserLocation(fallback);
          // fetchNearbyEditors(fallback.lat, fallback.lng); // Removed automatic search
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const fetchNearbyEditors = async (lat, lng, radius = searchRadius) => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(
        `${backendURL}/api/location/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      if (data.success) {
        setEditors(data.editors);
      }
    } catch (error) {
      console.error("Failed to fetch nearby editors:", error);
      toast.error("Could not load nearby editors");
    } finally {
      setIsLoading(false);
    }
  };

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
          onStartDiscovery={handleAutoMatch}
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
                       Discovery Mode
                    </p>
                 </div>
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
      />
    </div>
  );
};

export default LocalEditorsNetworkPage;
