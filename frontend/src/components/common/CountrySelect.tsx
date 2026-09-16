import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Search, X, Loader2, MapPin, Edit3, RotateCcw } from 'lucide-react';
import type { CountryData } from '../../data/countries';
import { COUNTRIES, findCountryByName, findCountryByCode, detectBrowserCountry } from '../../data/countries';

interface CountrySelectProps {
  value: string; // Country full name (e.g. 'India') or ISO code (e.g. 'IN')
  onChange: (country: CountryData) => void;
  disabled?: boolean;
  isDetecting?: boolean;
  lockable?: boolean;
  className?: string;
  variant?: 'suvix-dark' | 'suvix-light';
  placement?: 'top' | 'bottom';
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
  disabled = false,
  isDetecting = false,
  lockable = true,
  className = '',
  variant = 'suvix-dark',
  placement = 'bottom',
}) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryData>(() => {
    if (value) {
      const match = findCountryByName(value) || findCountryByCode(value);
      if (match) return match;
    }
    return detectBrowserCountry();
  });

  const [initialDetectedCountry, setInitialDetectedCountry] = useState<CountryData>(selectedCountry);
  const [isManualOverride, setIsManualOverride] = useState(false);
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
        if (match.code !== initialDetectedCountry.code) {
          setIsManualOverride(true);
        }
      }
    }
  }, [value, selectedCountry.code, initialDetectedCountry.code]);

  // Keep track of first detection
  useEffect(() => {
    if (!isDetecting && selectedCountry && !isManualOverride) {
      setInitialDetectedCountry(selectedCountry);
    }
  }, [isDetecting, selectedCountry, isManualOverride]);

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
    setIsManualOverride(c.code !== initialDetectedCountry.code);
    setIsOpen(false);
    setSearchQuery('');
    onChange(c);
  };

  const handleResetToDetected = (e: React.MouseEvent) => {
    e.stopPropagation();
    const detected = initialDetectedCountry;
    setSelectedCountry(detected);
    setIsManualOverride(false);
    setIsOpen(false);
    onChange(detected);
  };

  const isDark = variant === 'suvix-dark';

  if (isDetecting) {
    return (
      <div className={`relative w-full ${className}`}>
        <div
          className={`w-full h-8.5 sm:h-10 px-2.5 sm:px-3.5 flex items-center gap-2 rounded-xl text-[11px] sm:text-[13px] font-medium select-none ${
            isDark
              ? 'bg-zinc-100 !border-2 !border-zinc-300 text-zinc-600 animate-pulse'
              : 'bg-zinc-100 border border-zinc-200 text-zinc-600 animate-pulse'
          }`}
        >
          <Loader2 size={13} className="animate-spin text-zinc-500 shrink-0" />
          <span className="text-zinc-500 font-medium">Detecting your location...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {/* Screen Reader Live Region */}
      <div className="sr-only" aria-live="polite">
        {selectedCountry ? `Selected country is ${selectedCountry.name}` : ''}
      </div>

      <div
        className={`w-full h-8.5 sm:h-10 px-2.5 sm:px-3.5 flex items-center justify-between rounded-xl transition-all ${
          isDark
            ? 'bg-[#F8F9FA] hover:bg-zinc-100/70 border border-zinc-200/80 focus-within:border-zinc-400 focus-within:bg-white text-zinc-950 font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
            : 'bg-white border border-zinc-300 focus-within:border-zinc-950 text-zinc-900 font-medium'
        }`}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex-1 flex items-center gap-1.5 sm:gap-2 truncate text-left text-[11px] sm:text-[13px] ${
            disabled ? 'cursor-default' : 'cursor-pointer'
          }`}
        >
          <span
            className={`fi fi-${selectedCountry.code.toLowerCase()} rounded-[2px] shadow-2xs shrink-0 inline-block`}
            style={{ width: '1.25em', height: '0.9em' }}
          />
          <span className="truncate font-semibold">{selectedCountry.name}</span>
          <ChevronDown
            size={14}
            className={`text-zinc-500 transition-transform duration-200 shrink-0 ml-1 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Single-state Action Badge */}
        {lockable && (
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {!isManualOverride ? (
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-colors"
                title="Location auto-detected. Click to change."
              >
                <MapPin size={10} className="text-emerald-600 shrink-0" />
                <span>Auto-detected</span>
                <span className="text-emerald-900/50 font-normal">· Change</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetToDetected}
                className="text-[10px] font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300/80 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-colors"
                title={`Reset to detected country: ${initialDetectedCountry.name}`}
              >
                <Edit3 size={10} className="text-zinc-500 shrink-0" />
                <span>Manual</span>
                <RotateCcw size={9} className="text-zinc-500 shrink-0 ml-0.5" />
                <span className="text-zinc-900/60 font-normal">Reset</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Searchable Dropdown Modal */}
      {isOpen && (
        <div
          className={`absolute left-0 z-50 w-full bg-white rounded-2xl overflow-hidden flex flex-col max-h-64 sm:max-h-72 animate-in fade-in zoom-in-95 duration-150 ${
            placement === 'top'
              ? 'bottom-[calc(100%+6px)] shadow-[0_-10px_35px_rgba(0,0,0,0.18)]'
              : 'top-[calc(100%+6px)] shadow-2xl'
          } border border-zinc-200`}
        >
          {/* Search Box */}
          <div className="p-2.5 border-b border-zinc-200 bg-zinc-50 flex items-center gap-2">
            <Search size={14} className="text-zinc-500 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search country..."
              className="w-full bg-transparent text-xs sm:text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none font-medium"
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
                      <span
                        className={`fi fi-${c.code.toLowerCase()} rounded-[2px] shadow-2xs shrink-0 inline-block`}
                        style={{ width: '1.25em', height: '0.9em' }}
                      />
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
