
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaDatabase, FaExclamationTriangle, FaRocket } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../context/AppContext";

const CloudStorageCard = () => {
    const { user, backendURL } = useAppContext();
    const navigate = useNavigate();
    const [storageData, setStorageData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStorage = async () => {
            try {
                const token = user?.token;
                if (!token) return;
                const res = await axios.get(`${backendURL}/api/storage/status`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setStorageData(res.data?.storage || null);
            } catch (err) {
                console.error("Failed to fetch storage:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStorage();
    }, [backendURL, user?.token]);

    if (loading) return <div className="h-40 bg-white/5 rounded-3xl animate-pulse" />;
    if (!storageData) return null;

    const usedPercent = storageData.usedPercent || 0;
    const isCritical = usedPercent >= 90;

    return (
        <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative flex items-center gap-6">
                <div className="relative w-20 h-20 flex-shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle className="fill-none stroke-white/5" cx="50" cy="50" r="45" strokeWidth="10" />
                        <motion.circle 
                            initial={{ strokeDashoffset: 283 }}
                            animate={{ strokeDashoffset: 283 - (283 * usedPercent / 100) }}
                            className={`fill-none transition-all duration-1000 ${isCritical ? 'stroke-red-500' : 'stroke-purple-500'}`}
                            cx="50" cy="50" r="45" strokeWidth="10" strokeLinecap="round"
                            style={{ strokeDasharray: 283 }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-sm font-bold">{usedPercent}%</span>
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <FaDatabase className="text-purple-500 text-xs" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Cloud Storage</h3>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-medium mb-3">{storageData.usedFormatted} of {storageData.limitFormatted}</p>
                    
                    <button 
                        onClick={() => navigate("/storage-plans")}
                        className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold text-white transition-all flex items-center gap-2"
                    >
                        Upgrade <FaRocket className="text-[8px]" />
                    </button>
                </div>
            </div>

            {isCritical && (
                <div className="mt-3 flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <FaExclamationTriangle className="text-red-500 text-[10px]" />
                    <span className="text-[9px] text-red-400 font-bold">Storage critical!</span>
                </div>
            )}
        </div>
    );
};

export default CloudStorageCard;
