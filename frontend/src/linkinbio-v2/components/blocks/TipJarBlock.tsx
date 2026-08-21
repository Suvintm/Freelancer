import React, { useState } from 'react';
import type { TipJarConfig } from '../../types/block.types';
import type { Theme } from '../../types/theme.types';
import { bioApiService } from '../../services/bioApiService';
import { Heart, Sparkles, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TipJarBlockProps {
  config: TipJarConfig;
  theme?: Theme;
  pageId?: string;
}

export const TipJarBlock: React.FC<TipJarBlockProps> = ({ config, theme: _theme, pageId }) => {
  const {
    title = 'Support My Work',
    description = 'If you enjoy my content, buy me a coffee! ☕',
    currency = 'INR',
    presets = [50, 100, 250, 500],
    customAmount = true,
    upiId = '',
    paymentUrl = '',
    thankYouMessage = 'Thank you so much for your generosity! ❤️',
  } = config;

  const [selectedAmount, setSelectedAmount] = useState<number>(presets[1] || 100);
  const [customValue, setCustomValue] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currencySymbol =
    currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';

  // Load Razorpay script dynamically
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleTip = async () => {
    const finalAmount = customValue ? parseFloat(customValue) : selectedAmount;
    if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) return;

    // Direct UPI link fallback if configured
    if (upiId && currency === 'INR' && !pageId) {
      const upiLink = `upi://pay?pa=${upiId}&pn=Creator&am=${finalAmount}&cu=INR&tn=Tip%20for%20Creator`;
      window.open(upiLink, '_blank');
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 4000);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create order on backend
      const targetPageId = pageId || 'main';
      const orderData = await bioApiService.createTipOrder({
        pageId: targetPageId,
        amount: finalAmount,
        currency,
      });

      // 2. Load script
      const loaded = await loadRazorpayScript();
      if (!loaded || !(window as any).Razorpay) {
        // Fallback to manual URL if Razorpay script fails
        if (paymentUrl) window.open(paymentUrl, '_blank');
        setIsSuccess(true);
        setIsLoading(false);
        return;
      }

      // 3. Open Razorpay Checkout Modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount * 100,
        currency: orderData.currency,
        name: orderData.creatorName || 'SuviX Creator',
        description: `Support Tip of ${currencySymbol}${finalAmount}`,
        image: orderData.creatorAvatar || 'https://suvix.in/assets/whitebglogo.png',
        order_id: orderData.orderId,
        handler: async (response: any) => {
          await bioApiService.verifyTip({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            pageId: targetPageId,
            amount: finalAmount,
            currency,
          });
          setIsSuccess(true);
          setTimeout(() => setIsSuccess(false), 5000);
        },
        theme: {
          color: '#4D6234',
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('[TipJarBlock] Tip payment error:', err);
      // Fallback
      if (paymentUrl) window.open(paymentUrl, '_blank');
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full my-2 p-3.5 sm:p-4 rounded-2xl bg-white text-slate-900 shadow-md border border-slate-100 dark:border-white/10 select-none overflow-hidden relative font-sans">
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
          <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
        </div>
        <div className="min-w-0 text-left">
          <h4 className="font-extrabold text-xs text-slate-900 truncate leading-tight">
            {title}
          </h4>
          {description && (
            <p className="text-[9px] text-slate-500 truncate leading-tight">
              {description}
            </p>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="py-3 px-2 text-center flex flex-col items-center justify-center bg-emerald-50 rounded-xl border border-emerald-200 mt-2"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-1">
              <Check className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-emerald-800">
              {thankYouMessage}
            </span>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2.5">
            {/* Presets Row */}
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {presets.map((amt) => {
                const isSelected = selectedAmount === amt && !customValue;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(amt);
                      setCustomValue('');
                    }}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border flex items-center justify-center gap-0.5 ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs scale-[1.02]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{currencySymbol}</span>
                    <span>{amt}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Input (Optional) */}
            {customAmount && (
              <div className="flex items-center gap-1.5 mb-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    value={customValue}
                    onChange={(e) => {
                      setCustomValue(e.target.value);
                      setSelectedAmount(0);
                    }}
                    placeholder="Custom Amount"
                    className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>
            )}

            {/* Send Tip CTA Button */}
            <button
              type="button"
              onClick={handleTip}
              disabled={isLoading}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 hover:opacity-95 disabled:opacity-75 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Opening Checkout...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Send {currencySymbol}
                    {customValue ? customValue : selectedAmount} Tip
                  </span>
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default TipJarBlock;
