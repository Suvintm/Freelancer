import { motion } from "framer-motion";

const Loader = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="relative w-16 h-16">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-0 w-1.5 h-4 bg-white rounded-full origin-bottom"
            style={{
              translateX: "-50%",
              rotate: `${i * 30}deg`,
              transformOrigin: "center 32px", // 32px is half of the container's height (16 * 4 / 2)
            }}
            animate={{ opacity: [0.1, 1, 0.1] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.066, // 0.8 / 12
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-white/50 text-sm font-medium tracking-widest uppercase"
      >
        Loading...
      </motion.p>
    </div>
  );
};

export default Loader;
