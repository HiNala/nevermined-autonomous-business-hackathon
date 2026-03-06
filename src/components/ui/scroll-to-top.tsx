"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 flex size-10 items-center justify-center rounded-full shadow-lg transition-colors duration-150"
          style={{
            background: "var(--accent-400)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
          aria-label="Scroll to top"
        >
          <ArrowUp size={16} strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
