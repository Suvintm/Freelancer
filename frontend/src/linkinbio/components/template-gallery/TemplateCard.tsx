import React from 'react';
import type { TemplateConfig } from '../../types/template.types';
import { Check, Sparkles, Phone, MessageCircle } from 'lucide-react';

interface TemplateCardProps {
  config: TemplateConfig;
  isSelected: boolean;
  onSelect: (slug: string) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  config,
  isSelected,
  onSelect,
}) => {
  return (
    <div
      onClick={() => onSelect(config.slug)}
      className={`group relative rounded-2xl border-2 p-3 flex flex-col cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'border-[#736154] bg-[#736154]/5 shadow-md shadow-[#736154]/10 ring-1 ring-[#736154]'
          : 'border-border-main/60 hover:border-[#736154]/50 bg-surface/40 hover:bg-surface'
      }`}
    >
      {/* Category Badge & Selection Indicator */}
      <div className="flex items-center justify-between mb-2 z-10">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#736154]/10 text-[#736154] border border-[#736154]/20">
          <Sparkles size={9} />
          {config.category}
        </span>

        {isSelected && (
          <span className="w-5 h-5 rounded-full bg-[#736154] text-white flex items-center justify-center shadow">
            <Check size={11} />
          </span>
        )}
      </div>

      {/* Actual Default Template Design Live Preview Shell */}
      <div className="w-full h-56 rounded-xl overflow-hidden mb-2.5 relative border border-border-main/60 bg-[#FAF7F2] shadow-inner select-none group-hover:scale-[1.01] transition-transform flex flex-col p-2.5">
        {/* Floral Watermark Graphic in Top Left Corner */}
        <div className="absolute top-0 left-0 w-24 h-24 pointer-events-none opacity-30 select-none z-0">
          <svg viewBox="0 0 200 200" fill="none" stroke="#9A8372" strokeWidth="1.5" className="w-full h-full transform -rotate-12">
            <path d="M20,100 C50,40 100,20 150,30 C120,70 100,120 120,170 C80,150 40,140 20,100 Z" />
            <path d="M40,70 C70,20 120,10 160,50 C110,80 90,130 90,180" />
            <path d="M10,130 C30,90 70,60 110,70" />
          </svg>
        </div>

        {/* 1. Header (Avatar, Title, Subtitle) */}
        <div className="flex flex-col items-center text-center relative z-10 pt-1 pb-1.5">
          <div className="w-7 h-7 rounded-full p-0.5 border border-[#C5B3A5] bg-white shadow-xs overflow-hidden mb-1">
            <img
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80"
              alt="Nuna Beauty"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <h4 className="text-[9px] font-bold text-[#1E1A17] tracking-tight leading-none">
            Nuna Beauty
          </h4>
          <p className="text-[6.5px] text-[#6B5E55] mt-0.5 leading-tight max-w-[150px] line-clamp-1">
            Welcome to our link in bio page made on Many.bio!
          </p>
        </div>

        {/* 2. For consultations Section */}
        <div className="relative z-10 mb-2">
          <p className="text-[7px] font-bold text-center text-[#1E1A17] mb-1">
            For consultations
          </p>
          <div className="flex flex-col gap-1">
            <div className="h-5 px-2 rounded-md bg-[#736154] text-white flex items-center justify-between shadow-xs">
              <Phone size={7} className="fill-current shrink-0" />
              <span className="text-[6.5px] font-semibold w-full text-center -ml-2">Call</span>
            </div>
            <div className="h-5 px-2 rounded-md bg-[#736154] text-white flex items-center justify-between shadow-xs">
              <MessageCircle size={8} className="fill-current shrink-0" />
              <span className="text-[6.5px] font-semibold w-full text-center -ml-2">Send a Whatsapp</span>
            </div>
          </div>
        </div>

        {/* 3. Book an appointment Section */}
        <div className="relative z-10 flex-1 overflow-hidden flex flex-col">
          <p className="text-[7px] font-bold text-center text-[#1E1A17] mb-1">
            Book an appointment
          </p>
          <div className="flex flex-col gap-1 overflow-hidden">
            {/* Service 1 */}
            <div className="h-6 p-1 pr-2 rounded-md bg-[#736154] text-white flex items-center gap-1.5 shadow-xs">
              <img
                src="https://images.unsplash.com/photo-1560869713-7d0a29430803?w=80&auto=format&fit=crop&q=80"
                alt="Haircuts"
                className="w-4 h-4 rounded object-cover shrink-0"
              />
              <div className="flex-1 min-w-0 leading-none">
                <p className="text-[6.5px] font-bold truncate">Women haircuts</p>
                <p className="text-[5.5px] text-white/70 truncate">contact by WhatsApp</p>
              </div>
            </div>

            {/* Service 2 */}
            <div className="h-6 p-1 pr-2 rounded-md bg-[#736154] text-white flex items-center gap-1.5 shadow-xs">
              <img
                src="https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=80&auto=format&fit=crop&q=80"
                alt="Children"
                className="w-4 h-4 rounded object-cover shrink-0"
              />
              <div className="flex-1 min-w-0 leading-none">
                <p className="text-[6.5px] font-bold truncate">Children haircuts</p>
                <p className="text-[5.5px] text-white/70 truncate">contact by WhatsApp</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Template Name & Description */}
      <div>
        <h4 className="text-xs font-bold text-text-main group-hover:text-[#736154] transition-colors">
          {config.name}
        </h4>
        <p className="text-[10px] text-text-muted mt-0.5 line-clamp-2 leading-relaxed">
          {config.description}
        </p>
      </div>
    </div>
  );
};

export default TemplateCard;
