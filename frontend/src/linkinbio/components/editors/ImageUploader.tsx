import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface ImageUploaderProps {
  label: string;
  value?: string;
  description?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  value,
  description,
  onChange,
  onRemove
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In production Phase 8 this can call upload.api.ts
      // For local testing/drafts, use FileReader to generate a data URL
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onChange(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
          {label}
        </label>
        {value && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-[10px] font-bold text-rose-500 hover:text-rose-400 flex items-center gap-1"
          >
            <X size={11} />
            Remove
          </button>
        )}
      </div>

      {description && (
        <p className="text-[11px] text-text-muted leading-tight">{description}</p>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {value ? (
        <div className="relative rounded-2xl overflow-hidden border border-border-main group/img">
          <img src={value} alt="Preview" className="w-full h-32 object-cover" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-white/20 text-white text-xs font-semibold backdrop-blur-sm hover:bg-white/30"
            >
              Replace
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-24 rounded-2xl border-2 border-dashed border-border-main hover:border-indigo-500/50 bg-surface/50 hover:bg-indigo-500/5 flex flex-col items-center justify-center gap-2 transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Upload size={14} />
          </div>
          <span className="text-xs font-semibold text-text-muted group-hover:text-text-main">
            Click to upload image
          </span>
        </button>
      )}
    </div>
  );
};

export default ImageUploader;
