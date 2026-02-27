
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
    HiOutlineMapPin, 
    HiOutlineChevronRight,
    HiOutlineStar,
    HiSparkles
} from "react-icons/hi2";
import { FaMapMarkerAlt } from "react-icons/fa";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const EditorsNearYouPreview = () => {
    const { user, backendURL } = useAppContext();
    const navigate = useNavigate();
    const [nearbyEditors, setNearbyEditors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNearby = async () => {
            try {
                // Default to Bangalore if no location, or use a sample if mock
                const params = {
                    lat: 12.97,
                    lng: 77.59,
                    radius: 50
                };
                const { data } = await axios.get(`${backendURL}/api/location/nearby`, {
                    params,
                    headers: { Authorization: `Bearer ${user?.token}` },
                });
                setNearbyEditors(data.editors?.slice(0, 4) || []);
            } catch (err) {
                console.error("Failed to fetch nearby editors", err);
            } finally {
                setLoading(false);
            }
        };
        fetchNearby();
    }, [backendURL, user?.token]);

    if (loading) return (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex-shrink-0 w-48 h-24 bg-white/5 rounded-2xl animate-pulse" />
            ))}
        </div>
    );

    if (nearbyEditors.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                        <HiOutlineMapPin className="text-indigo-400 text-xs" />
                    </div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Editors Near You</h2>
                </div>
                <button 
                  onClick={() => navigate('/editors-near-you')}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 uppercase tracking-widest"
                >
                    View Map <HiOutlineChevronRight />
                </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                {nearbyEditors.map((editor) => (
                    <motion.div
                        key={editor._id}
                        whileHover={{ y: -4 }}
                        onClick={() => navigate(`/editor/${editor._id}`)}
                        className="flex-shrink-0 w-56 bg-[#0d0d12] border border-white/[0.06] rounded-2xl p-3 cursor-pointer group hover:border-indigo-500/30 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <img 
                                src={editor.profilePicture || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                                className="w-10 h-10 rounded-full object-cover border border-white/10"
                                alt=""
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">{editor.name}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <FaMapMarkerAlt className="text-[8px] text-zinc-600" />
                                    <span className="text-[9px] text-zinc-500 font-medium truncate">
                                        {editor.location || `${editor.approxLocation?.distance}km away`}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                <HiOutlineStar className="text-amber-500 text-[10px]" />
                                <span className="text-[10px] font-bold text-white">{editor.rating?.toFixed(1) || '4.9'}</span>
                            </div>
                            <span className="text-[10px] text-indigo-400 font-bold px-2 py-0.5 bg-indigo-500/10 rounded-full">
                                {editor.experience || '3+ yrs'}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default EditorsNearYouPreview;
