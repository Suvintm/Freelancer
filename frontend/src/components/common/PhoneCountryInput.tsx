import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Search, X, Loader2, Check } from 'lucide-react';
import { isValidPhoneNumber, type CountryCode, AsYouType } from 'libphonenumber-js';
import type { CountryData } from '../../data/countries';
import { COUNTRIES, findCountryByCode, findCountryByName, detectBrowserCountry } from '../../data/countries';

interface PhoneCountryInputProps {
  value: string;
  onChange: (fullValue: string, country: CountryData, nationalNumber: string, isValid?: boolean) => void;
  country?: string; // Country name (e.g. 'India') or ISO code (e.g. 'IN')
  onCountryChange?: (country: CountryData) => void;
  onValidityChange?: (isValid: boolean) => void;
  required?: boolean;
  disabled?: boolean;
  isDetecting?: boolean;
  placeholder?: string;
  className?: string;
  variant?: 'suvix-dark' | 'suvix-light';
}

export const PhoneCountryInput: React.FC<PhoneCountryInputProps> = ({
  value,
  onChange,
  country,
  onCountryChange,
  onValidityChange,
  required = false,
  disabled = false,
  isDetecting = false,
  placeholder = '98765 43210',
  className = '',
  variant = 'suvix-dark',
}) => {
  // Current selected country
  const [selectedCountry, setSelectedCountry] = useState<CountryData>(() => {
    if (country) {
      const match = findCountryByCode(country) || findCountryByName(country);
      if (match) return match;
    }
    return detectBrowserCountry();
  });

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [nationalNumber, setNationalNumber] = useState('');
  const [isValid, setIsValid] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync external country prop changes
  useEffect(() => {
    if (country) {
      const match = findCountryByCode(country) || findCountryByName(country);
      if (match && match.code !== selectedCountry.code) {
        setSelectedCountry(match);
      }
    }
  }, [country, selectedCountry.code]);

  const checkValidation = (num: string, cCode: string): boolean => {
    if (!num || num.trim().length < 4) return false;
    try {
      return isValidPhoneNumber(num, cCode as CountryCode);
    } catch {
      return false;
    }
  };

  // Parse initial or incoming value
  useEffect(() => {
    if (!value) {
      setNationalNumber('');
      setIsValid(false);
      return;
    }

    let parsedNumber = value;
    let currentCountry = selectedCountry;

    if (value.startsWith('+')) {
      const matchedDial = COUNTRIES.find((c) => value.startsWith(c.dialCode));
      if (matchedDial) {
        currentCountry = matchedDial;
        setSelectedCountry(matchedDial);
        parsedNumber = value.slice(matchedDial.dialCode.length).trim();
      }
    } else {
      parsedNumber = value.replace(/^\+?[0-9]*\s*/, '');
    }

    setNationalNumber(parsedNumber);
    const valid = checkValidation(parsedNumber, currentCountry.code);
    setIsValid(valid);
    onValidityChange?.(valid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter countries based on search
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

  // Close dropdown on outside click
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

  const handleCountrySelect = (c: CountryData) => {
    setSelectedCountry(c);
    setIsOpen(false);
    setSearchQuery('');
    if (onCountryChange) {
      onCountryChange(c);
    }
    const clean = nationalNumber.replace(/[^\d]/g, '');
    const valid = checkValidation(clean, c.code);
    setIsValid(valid);
    onValidityChange?.(valid);
    const full = clean ? `${c.dialCode} ${clean}` : '';
    onChange(full, c, clean, valid);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value.replace(/[^\d\s-]/g, '');
    const rawDigits = rawInput.replace(/[^\d]/g, '');

    // Format using AsYouType formatter for national format
    let formattedDisplay = rawInput;
    try {
      const formatter = new AsYouType(selectedCountry.code as CountryCode);
      const asYouTypeResult = formatter.input(rawDigits);
      if (asYouTypeResult) {
        formattedDisplay = asYouTypeResult;
      }
    } catch {
      formattedDisplay = rawInput;
    }

    setNationalNumber(formattedDisplay);
    const valid = checkValidation(rawDigits, selectedCountry.code);
    setIsValid(valid);
    onValidityChange?.(valid);

    const full = rawDigits ? `${selectedCountry.dialCode} ${rawDigits}` : '';
    onChange(full, selectedCountry, rawDigits, valid);
  };

  const isDark = variant === 'suvix-dark';

  return (
    <div className={`relative flex items-center w-full ${className}`} ref={dropdownRef}>
      {/* Country Flag & Dial Code Trigger */}
      <button
        type="button"
        disabled={disabled || isDetecting}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 h-10 px-2.5 shrink-0 rounded-l-xl select-none transition-all font-medium text-xs sm:text-[13px] ${
          disabled || isDetecting ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
        } ${
          isDark
            ? 'bg-zinc-100 hover:bg-zinc-200 border-2 border-r-0 border-black text-black'
            : 'bg-zinc-50 hover:bg-zinc-100 border border-r-0 border-zinc-300 text-zinc-900'
        }`}
        title={`${selectedCountry.name} (${selectedCountry.dialCode})`}
      >
        {isDetecting ? (
          <Loader2 size={13} className="animate-spin text-zinc-500" />
        ) : (
          <span
            className={`fi fi-${selectedCountry.code.toLowerCase()} rounded-[2px] shadow-2xs shrink-0 inline-block`}
            style={{ width: '1.25em', height: '0.9em' }}
          />
        )}
        <span className="font-bold text-[12px]">{selectedCountry.dialCode}</span>
        <ChevronDown
          size={13}
          className={`text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Phone Number Input */}
      <div className="relative flex-1">
        <input
          type="tel"
          value={nationalNumber}
          onChange={handleNumberChange}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="tel-national"
          className={`w-full h-10 pr-8 pl-2.5 rounded-r-xl text-xs sm:text-[13px] font-medium tracking-wide focus:outline-none transition-all placeholder:text-zinc-400 ${
            isDark
              ? 'suvix-input !h-10 !rounded-l-none bg-white !border-2 !border-black text-black'
              : 'bg-white border border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 rounded-r-xl text-zinc-900'
          }`}
        />

        {/* Real-time Validity Indicator */}
        {isValid && nationalNumber.length >= 4 && (
          <span
            className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-emerald-600 bg-emerald-50 border border-emerald-200/70 w-4.5 h-4.5 rounded-full"
            title="Valid phone format"
          >
            <Check size={11} strokeWidth={3} />
          </span>
        )}
      </div>

      {/* Searchable Country Dropdown Modal */}
      {isOpen && !isDetecting && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-72 animate-in fade-in zoom-in-95 duration-150">
          {/* Search Box */}
          <div className="p-2.5 border-b border-zinc-100 bg-zinc-50/70 flex items-center gap-2">
            <Search size={14} className="text-zinc-400 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search country or dial code..."
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
                    onClick={() => handleCountrySelect(c)}
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
                      {c.dialCode}
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
