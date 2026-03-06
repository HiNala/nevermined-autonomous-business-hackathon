"use client";

import { motion } from "framer-motion";

type IconType = "success" | "download" | "toggle";

interface AnimatedStateIconProps {
  type: IconType;
  size?: number;
  color?: string;
}

export function AnimatedStateIcon({
  type,
  size = 24,
  color = "var(--green-500)",
}: AnimatedStateIconProps) {
  const variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 0.6, ease: [0.42, 0, 0.58, 1] as const },
    },
  };

  if (type === "success") {
    return (
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        initial="hidden"
        animate="visible"
      >
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="2"
          variants={variants}
        />
        <motion.path
          d="M8 12l3 3 5-6"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={variants}
        />
      </motion.svg>
    );
  }

  if (type === "download") {
    return (
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        initial="hidden"
        animate="visible"
      >
        <motion.path
          d="M12 4v12m0 0l-4-4m4 4l4-4"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={variants}
        />
        <motion.path
          d="M4 18h16"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          variants={variants}
        />
      </motion.svg>
    );
  }

  // Toggle icon
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      initial="hidden"
      animate="visible"
    >
      <motion.rect
        x="2"
        y="7"
        width="20"
        height="10"
        rx="5"
        stroke={color}
        strokeWidth="2"
        variants={variants}
      />
      <motion.circle
        cx="16"
        cy="12"
        r="3"
        fill={color}
        variants={{
          hidden: { scale: 0 },
          visible: { scale: 1, transition: { delay: 0.3, duration: 0.3 } },
        }}
      />
    </motion.svg>
  );
}
