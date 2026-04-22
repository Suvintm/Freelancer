import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { HiOutlineBriefcase } from 'react-icons/hi2';

// Import All Assets
import premiereIcon from "../assets/preimerepro.png";
import aeIcon from "../assets/adobeexpress.png";
import davinciIcon from "../assets/davinci.png";
import capcutIcon from "../assets/capcut.png";
import fcpxIcon from "../assets/FCPX.png";
import photoshopIcon from "../assets/photoshop.png";
import canvaIcon from "../assets/canvalogo.png";
import vnIcon from "../assets/Vnlogo.png";

const SOFTWARE_MAP = {
  "Premiere Pro": { icon: premiereIcon, color: "#9999FF" },
  "After Effects": { icon: aeIcon, color: "#CF96FD" },
  "DaVinci Resolve": { icon: davinciIcon, color: "#32A5D5" },
  "CapCut": { icon: capcutIcon, color: "#FFFFFF" },
  "FCPX": { icon: fcpxIcon, color: "#3B3B3B" },
  "Photoshop": { icon: photoshopIcon, color: "#31A8FF" },
  "Canva": { icon: canvaIcon, color: "#00C4CC" },
  "VN Editor": { icon: vnIcon, color: "#FFDE59" },
};

const SoftwareExpertise = ({ softwares = [], compact = false }) => {
  const { isDark } = useTheme();

  if (!softwares || softwares.length === 0) return null;

  return (
    <div className={`grid ${compact ? 'grid-cols-4 sm:grid-cols-6' : 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8'} gap-3`}>
      {softwares.map((name) => {
        const config = SOFTWARE_MAP[name];
        
        return (
          <div 
            key={name}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border ${
              isDark ? "bg-black/40 border-white/5" : "bg-zinc-50 border-zinc-200"
            } transition-all hover:scale-105`}
          >
            {config ? (
              <img 
                src={config.icon} 
                className="w-8 h-8 mb-2 object-contain" 
                alt={name}
              />
            ) : (
              <HiOutlineBriefcase className={`w-8 h-8 mb-2 ${isDark ? "text-zinc-600" : "text-zinc-400"}`} />
            )}
            <span className={`text-[8px] font-black uppercase tracking-widest text-center ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
              {name}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default SoftwareExpertise;
