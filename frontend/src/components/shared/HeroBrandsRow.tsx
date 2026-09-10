interface HeroBrandsRowProps {
  className?: string;
}

export function HeroBrandsRow({ className = '' }: HeroBrandsRowProps) {
  return (
    <div className={`w-full py-4 sm:py-5 border-t border-zinc-100/90 bg-white select-none ${className}`}>
      <div className="w-full max-w-[96vw] xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 lg:gap-6">
        {/* Left Label: TRUSTED BY CREATORS AND BRANDS WORLDWIDE */}
        <div className="shrink-0 text-left">
          <p className="text-[9.5px] sm:text-[10.5px] font-black text-zinc-600 uppercase tracking-[0.18em] leading-tight">
            Trusted By Creators
          </p>
          <p className="text-[9.5px] sm:text-[10.5px] font-black text-zinc-600 uppercase tracking-[0.18em] leading-tight">
            And Brands Worldwide
          </p>
        </div>

        {/* Center Brands List */}
        <div className="flex-1 flex items-center justify-center md:justify-start lg:justify-center gap-5 sm:gap-7 lg:gap-8 flex-wrap overflow-x-auto no-scrollbar py-1">
          {/* 1. Google */}
          <div className="flex items-center gap-1.5 shrink-0 opacity-85 hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="font-bold text-zinc-900 text-sm sm:text-[15px] tracking-tight">Google</span>
          </div>

          {/* 2. YouTube */}
          <div className="flex items-center gap-1.5 shrink-0 opacity-85 hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 28 20" className="w-5 h-3.5" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M27.9727 3.12324C27.6435 1.89323 26.6768 0.926623 25.4468 0.597366C23.2197 0 14.285 0 14.285 0C14.285 0 5.35042 0 3.12323 0.597366C1.89323 0.926623 0.926623 1.89323 0.597366 3.12324C0 5.35042 0 10 0 10C0 10 0 14.6496 0.597366 16.8768C0.926623 18.1068 1.89323 19.0734 3.12323 19.4026C5.35042 20 14.285 20 14.285 20C14.285 20 23.2197 20 25.4468 19.4026C26.6768 19.0734 27.6435 18.1068 27.9727 16.8768C28.5701 14.6496 28.5701 10 28.5701 10C28.5701 10 28.5677 5.35042 27.9727 3.12324Z"
                fill="#FF0000"
              />
              <path d="M11.4253 14.2854L18.8485 10.0004L11.4253 5.71533V14.2854Z" fill="white" />
            </svg>
            <span className="font-bold text-zinc-900 text-sm sm:text-[15px] tracking-tight">YouTube</span>
          </div>

          {/* 3. Meta */}
          <div className="flex items-center gap-1.5 shrink-0 opacity-85 hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12.0001 8.16782C10.6385 6.70282 9.20875 5.86243 7.50293 5.86243C4.13543 5.86243 1.5 8.7183 1.5 12.3023C1.5 15.8863 4.13543 18.7422 7.50293 18.7422C9.20875 18.7422 10.6385 17.9018 12.0001 16.4368C13.3616 17.9018 14.7914 18.7422 16.4972 18.7422C19.8647 18.7422 22.5001 15.8863 22.5001 12.3023C22.5001 8.7183 19.8647 5.86243 16.4972 5.86243C14.7914 5.86243 13.3616 6.70282 12.0001 8.16782ZM7.50293 8.36243C5.51868 8.36243 3.99998 10.0898 3.99998 12.3023C3.99998 14.5148 5.51868 16.2422 7.50293 16.2422C8.68367 16.2422 9.69747 15.4745 10.7491 13.9877C10.027 12.7533 9.47543 11.2359 8.95669 9.80872C8.52985 8.63462 8.04944 8.36243 7.50293 8.36243ZM16.4972 8.36243C15.9507 8.36243 15.4703 8.63462 15.0435 9.80872C14.5247 11.2359 13.9732 12.7533 13.2511 13.9877C14.3027 15.4745 15.3165 16.2422 16.4972 16.2422C18.4815 16.2422 20 14.5148 20 12.3023C20 10.0898 18.4815 8.36243 16.4972 8.36243Z"
                fill="url(#meta-grad-brands)"
              />
              <defs>
                <linearGradient id="meta-grad-brands" x1="1.5" y1="12.3023" x2="22.5001" y2="12.3023" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0064E0" />
                  <stop offset="0.4" stopColor="#0082FB" />
                  <stop offset="0.8" stopColor="#0064E0" />
                  <stop offset="1" stopColor="#0082FB" />
                </linearGradient>
              </defs>
            </svg>
            <span className="font-bold text-zinc-900 text-sm sm:text-[15px] tracking-tight">Meta</span>
          </div>

          {/* 4. Instagram */}
          <div className="flex items-center gap-1.5 shrink-0 opacity-85 hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="currentColor" className="text-zinc-900" strokeWidth="2" />
              <circle cx="12" cy="12" r="4.2" stroke="currentColor" className="text-zinc-900" strokeWidth="2" />
              <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" className="text-zinc-900" />
            </svg>
            <span className="font-bold text-zinc-900 text-sm sm:text-[15px] tracking-tight">Instagram</span>
          </div>

          {/* 5. TikTok */}
          <div className="flex items-center gap-1.5 shrink-0 opacity-85 hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 text-zinc-900" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.32a6.34 6.34 0 0 0-6.61 6.3 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.18 8.18 0 0 0 4.79 1.54V6.79c-.53 0-1.04-.03-1.6-.1z" />
            </svg>
            <span className="font-bold text-zinc-900 text-sm sm:text-[15px] tracking-tight">TikTok</span>
          </div>

          {/* 6. Forbes */}
          <div className="flex items-center shrink-0 opacity-85 hover:opacity-100 transition-opacity">
            <span className="font-['Instrument_Serif',Playfair_Display,Georgia,serif] font-bold text-zinc-950 text-lg sm:text-xl tracking-wide">
              Forbes
            </span>
          </div>

          {/* 7. Shopify */}
          <div className="flex items-center gap-1.5 shrink-0 opacity-85 hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M18.8 6.2c-.1-.2-.3-.3-.6-.3h-2.1c-.1-.8-.5-2.2-1.7-3.1C13.3 2 12.1 2 11.5 2c-.4 0-.7.1-.9.2-.5.4-.7 1.1-.9 2.1-.2 1.3-.1 2.5-.1 2.9H6.2c-.3 0-.6.2-.7.5L2.1 20.4c-.1.3 0 .7.3.9.2.2.4.3.7.3h17.8c.3 0 .5-.1.7-.3.2-.2.3-.6.3-.9L18.8 6.2zM12.6 3.6c.7.5 1 1.5 1.1 2.6H10.3c.1-1 .5-2 1.4-2.4.3-.1.6-.2.9-.2zm-1.8 11.3c0-.6.3-1.2.8-1.6.9-.7 2.3-.9 2.3-1.8 0-.4-.3-.6-.8-.6-.6 0-1.2.3-1.7.8l-.8-1.1c.8-.7 1.7-1.1 2.7-1.1 1.4 0 2.3.8 2.3 2.1 0 1.5-1.5 1.8-2.3 2.3-.4.3-.6.6-.6 1H10.8z"
                fill="#95BF47"
              />
            </svg>
            <span className="font-bold text-zinc-900 text-sm sm:text-[15px] tracking-tight">Shopify</span>
          </div>

          {/* 8. Notion */}
          <div className="flex items-center gap-1.5 shrink-0 opacity-85 hover:opacity-100 transition-opacity">
            <div className="w-4.5 h-4.5 bg-zinc-900 rounded-[3px] flex items-center justify-center text-white font-black text-[10px]">
              N
            </div>
            <span className="font-bold text-zinc-900 text-sm sm:text-[15px] tracking-tight">Notion</span>
          </div>

          {/* 9. Adobe */}
          <div className="flex items-center gap-1.5 shrink-0 opacity-85 hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#EB1000" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.58 2.5L22 21.5H16.88L14.28 14.88H9.72L14.58 2.5ZM9.42 2.5L2 21.5H7.12L9.72 14.88H14.28L9.42 2.5ZM12 7.78L13.9 12.88H10.1L12 7.78Z" />
            </svg>
            <span className="font-bold text-zinc-900 text-sm sm:text-[15px] tracking-tight">Adobe</span>
          </div>
        </div>

        {/* Right Section: Divider + Handwritten Cursive Doodle */}
        <div className="shrink-0 flex items-center gap-4 pl-0 md:pl-5 border-t md:border-t-0 md:border-l border-zinc-200 pt-3 md:pt-0">
          <div className="font-['Caveat',cursive] text-zinc-900 font-bold text-sm sm:text-[15px] leading-tight text-left select-none -rotate-2">
            <p>Create today.</p>
            <p>A brighter tomorrow.</p>
            {/* Hand-drawn organic underline */}
            <svg
              viewBox="0 0 110 12"
              className="w-18 sm:w-22 text-zinc-900 fill-none stroke-current stroke-[2] stroke-linecap-round mt-0.5"
            >
              <path d="M3 4 Q 55 10, 107 3" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
