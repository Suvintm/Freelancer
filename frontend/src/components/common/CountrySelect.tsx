import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import type { CountryData } from '../../data/countries';
import { COUNTRIES, findCountryByName, findCountryByCode, detectBrowserCountry } from '../../data/countries';

interface CountrySelectProps {
  value: string; // Country full name (e.g. 'India') or ISO code (e.g. 'IN')
  onChange: (country: CountryData) => void;
  disabled?: boolean;
  className?: string;
  variant?: 'suvix-dark' | 'suvix-light';
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
  variant = 'suvix-dark',
}) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryData>(() => {
    if (value) {
      const match = findCountryByName(value) || findCountryByCode(value);
      if (match) return match;
    }
    return detectBrowserCountry();
  });

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync external value
  useEffect(() => {
    if (value) {
      const match = findCountryByName(value) || findCountryByCode(value);
      if (match && match.code !== selectedCountry.code) {
        setSelectedCountry(match);
      }
    }
  }, [value]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRIES;
    const q = searchQuery.toLowerCase().trim();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.includes(q)
    );
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (c: CountryData) => {
    setSelectedCountry(c);
    setIsOpen(false);
    setSearchQuery('');
    onChange(c);
  };

  const isDark = variant === 'suvix-dark';

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-10 px-3.5 flex items-center justify-between rounded-xl transition-all cursor-pointer text-xs sm:text-[13px] ${
          isDark
            ? 'bg-white !border-2 !border-black text-black font-medium'
            : 'bg-white border border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 text-zinc-900 font-medium'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <span className="text-base leading-none">{selectedCountry.flag}</span>
          <span className="truncate">{selectedCountry.name}</span>
        </div>
        <ChevronDown
          size={14}
          className={`text-zinc-500 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-full bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-72 animate-in fade-in zoom-in-95 duration-150">
          {/* Search Box */}
          <div className="p-2.5 border-b border-zinc-100 bg-zinc-50/70 flex items-center gap-2">
            <Search size={14} className="text-zinc-400 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search country..."
              className="w-full bg-transparent text-xs sm:text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 hover:bg-zinc-200 rounded-full text-zinc-400 hover:text-zinc-700"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* List of Countries */}
          <div className="flex-1 overflow-y-auto py-1 custom-scrollbar">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c) => {
                const isSelected = c.code === selectedCountry.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs transition-colors hover:bg-zinc-100 cursor-pointer ${
                      isSelected ? 'bg-zinc-100 font-bold text-black' : 'text-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-base shrink-0 leading-none">{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                    </div>
                    <span className="font-mono text-[11px] text-zinc-400 shrink-0 ml-2">
                      {c.code}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-zinc-400">
                No matching country found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
