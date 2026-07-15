import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { removeUpload } from '../../store/slices/uploadSlice';
import type { UploadJob } from '../../store/slices/uploadSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Image as ImageIcon, Youtube, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import LottieComponent from 'lottie-react';
import uploadAnimation from '../../assets/lottie/upload-animation.json';

// Handle ESM/CJS interop for lottie-react
const Lottie = (LottieComponent as unknown as { default: typeof LottieComponent })?.default || LottieComponent;

const getIconForType = (type: UploadJob['type']) => {
  switch (type) {
    case 'reel':
      return <Video className="w-5 h-5 text-indigo-500" />;
    case 'post':
      return <ImageIcon className="w-5 h-5 text-emerald-500" />;
    case 'youtube':
      return <Youtube className="w-5 h-5 text-rose-500" />;
    default:
      return <Video className="w-5 h-5 text-zinc-500" />;
  }
};

const UploadProgressBar = ({ job, isStackItem = false }: { job: UploadJob, isStackItem?: boolean }) => {
  const dispatch = useDispatch();
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (job.status === 'success' || job.status === 'failed') {
      // Async start to avoid synchronous setState cascading renders
      setTimeout(() => {
        setCountdown(5);
      }, 0);

      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev === null) return null;
          const next = prev - 1;
          if (next <= 0) {
            clearInterval(timer);
            dispatch(removeUpload({ id: job.id }));
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [job.status, dispatch, job.id]);
  const isFailed = job.status === 'failed';
  const isSuccess = job.status === 'success';

  return (
    <div className={`relative flex items-center p-3 gap-3 w-full bg-white dark:bg-black overflow-hidden ${isStackItem ? 'border-b border-black/20 dark:border-white/20 last:border-0' : 'rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-black/20 dark:border-white/20'}`}>
      
      {/* Background Progress Fill */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div 
          className={`h-full ${isFailed ? 'bg-rose-500/10' : isSuccess ? 'bg-emerald-500/10' : 'bg-black/10 dark:bg-white/10'}`}
          initial={{ width: 0 }}
          animate={{ width: `${job.progress}%` }}
          transition={{ ease: 'easeOut', duration: 0.3 }}
        />
      </div>

      {/* Lottie Animation or Status Icon */}
      <div className="z-10 shrink-0 w-10 h-10 flex items-center justify-center bg-white dark:bg-black border border-black/5 dark:border-white/10 rounded-xl">
        {isSuccess ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        ) : isFailed ? (
          <XCircle className="w-6 h-6 text-rose-500" />
        ) : (
          <div className="w-8 h-8">
            <Lottie 
              animationData={uploadAnimation} 
              loop={true} 
              style={{ width: '100%', height: '100%' }} 
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="z-10 flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1">
          {getIconForType(job.type)}
          <span className="text-xs font-semibold uppercase tracking-wider text-black dark:text-white">
            {job.type} Upload
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className={`text-sm font-medium truncate ${isFailed ? 'text-rose-600 dark:text-rose-400' : 'text-black dark:text-white'}`}>
            {job.message || 'Processing...'}
          </span>
          <div className="flex items-center gap-3 shrink-0">
            {countdown !== null ? (
              <span className="text-xs font-medium text-black/60 dark:text-white/60">Dismissing in {countdown}s</span>
            ) : (
              <span className="text-sm font-semibold text-black dark:text-white">{job.progress}%</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Progress Bar Line (bottom of the card) */}
      {!isStackItem && (
        <div className="absolute bottom-0 left-0 h-[3px] w-full bg-zinc-100 dark:bg-zinc-800">
          <motion.div 
            className={`h-full ${isFailed ? 'bg-rose-500' : isSuccess ? 'bg-emerald-500' : 'bg-black dark:bg-white'}`}
            initial={{ width: 0 }}
            animate={{ width: `${job.progress}%` }}
            transition={{ ease: 'easeOut', duration: 0.3 }}
          />
        </div>
      )}
      
      {/* If it's a stack item, put the progress bar line at the bottom too */}
      {isStackItem && (
        <div className="absolute bottom-0 left-0 h-[2px] w-full">
          <motion.div 
            className={`h-full ${isFailed ? 'bg-rose-500' : isSuccess ? 'bg-emerald-500' : 'bg-black dark:bg-white'}`}
            initial={{ width: 0 }}
            animate={{ width: `${job.progress}%` }}
            transition={{ ease: 'easeOut', duration: 0.3 }}
          />
        </div>
      )}
    </div>
  );
};

export const GlobalUploadProgress = () => {
  const jobs = useSelector((state: RootState) => state.upload.jobs);
  const [isExpanded, setIsExpanded] = useState(false);

  if (jobs.length === 0) return null;

  const topJob = jobs[0];
  const remainingCount = jobs.length - 1;

  return (
    <div className="w-full max-w-[400px] mx-auto mb-4 z-50 relative px-4 lg:px-0">
      <AnimatePresence>
        {jobs.length === 1 ? (
          <motion.div
            key="single"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full"
          >
            <UploadProgressBar job={topJob} />
          </motion.div>
        ) : (
          <motion.div
            key="stack"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)] border border-black/20 dark:border-white/20 bg-white dark:bg-black overflow-hidden flex flex-col"
          >
            <div 
              className="flex items-center justify-between px-4 py-2 bg-white dark:bg-black cursor-pointer border-b border-black/20 dark:border-white/20 select-none hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-black dark:text-white">
                  {jobs.length} Active Uploads
                </span>
                <span className="flex items-center justify-center bg-black dark:bg-white text-white dark:text-black text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                  {remainingCount}+
                </span>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-black dark:text-white" />
              ) : (
                <ChevronUp className="w-4 h-4 text-black dark:text-white" />
              )}
            </div>

            <AnimatePresence initial={false}>
              {isExpanded ? (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden flex flex-col"
                >
                  {jobs.map((job) => (
                    <UploadProgressBar key={job.id} job={job} isStackItem={true} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <UploadProgressBar job={topJob} isStackItem={true} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
