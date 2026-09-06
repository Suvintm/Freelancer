import React from 'react';
import { Building2, Check } from 'lucide-react';

interface InvoicePreviewProps {
  showGstInput: boolean;
  setShowGstInput: (show: boolean | ((prev: boolean) => boolean)) => void;
  gstinNumber: string;
  setGstinNumber: (v: string) => void;
  companyName: string;
  setCompanyName: (v: string) => void;
  subtotal?: number;
  cgst?: number;
  sgst?: number;
  totalPayable?: number;
  isDarkMode?: boolean;
}

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  showGstInput,
  setShowGstInput,
  gstinNumber,
  setGstinNumber,
  companyName,
  setCompanyName,
  subtotal: _subtotal,
  cgst: _cgst,
  sgst: _sgst,
  totalPayable: _totalPayable,
  isDarkMode = false,
}) => {
  const isGstinValid = gstinNumber.length === 15 && GSTIN_REGEX.test(gstinNumber);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setShowGstInput((prev) => !prev)}
        className={`text-[11px] hover:underline flex items-center gap-1.5 font-medium cursor-pointer transition-colors ${
          isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900'
        }`}
      >
        <Building2 className="w-3.5 h-3.5 opacity-70" />
        <span>{showGstInput ? 'Hide Business Invoice Details' : '+ Add GSTIN for Business Tax Invoice'}</span>
      </button>

      {showGstInput && (
        <div
          className="p-3 rounded-xl border border-zinc-800 bg-black space-y-2 animate-fadeIn"
        >
          <div className="flex items-center justify-between text-[10.5px]">
            <span className="font-semibold text-zinc-300">
              B2B Tax Invoice (Input Tax Credit)
            </span>
            <span className="font-mono text-[10px] text-zinc-500">
              SAC 998439
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] block mb-1 font-medium text-zinc-400">
                GSTIN Number (15 Digits)
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={15}
                  placeholder="29AAAAA0000A1Z5"
                  value={gstinNumber}
                  onChange={(e) => setGstinNumber(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ''))}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider outline-none border transition-all bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-600"
                />
                {isGstinValid && (
                  <Check className="w-3.5 h-3.5 text-emerald-500 absolute right-2.5 top-1/2 -translate-y-1/2" />
                )}
              </div>
            </div>

            <div>
              <label className="text-[10px] block mb-1 font-medium text-zinc-400">
                Company Legal Name
              </label>
              <input
                type="text"
                placeholder="Acme Studio Pvt Ltd"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs outline-none border transition-all bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-600"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
