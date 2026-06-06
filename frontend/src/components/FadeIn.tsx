"use client";

import { motion } from "framer-motion";
import React from "react";

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  x?: number;
  className?: string;
  whileInView?: boolean;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.3,
  y = 8,
  x = 0,
  className,
  whileInView = false,
}: FadeInProps) {
  const initial = { opacity: 0, y, x };
  const target = { opacity: 1, y: 0, x: 0 };
  const ease = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

  const animationProps: any = whileInView
    ? {
        initial,
        whileInView: target,
        viewport: { once: true, margin: "-40px" },
        transition: { duration, delay, ease },
      }
    : {
        initial,
        animate: target,
        transition: { duration, delay, ease },
      };

  return (
    <motion.div className={className} {...animationProps}>
      {children}
    </motion.div>
  );
}

// Stagger container for lists
export function StaggerContainer({
  children,
  className,
  stagger = 0.04,
  whileInView = false,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  whileInView?: boolean;
}) {
  const variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger } },
  };

  const props = whileInView
    ? {
        initial: "hidden" as const,
        whileInView: "show" as const,
        viewport: { once: true, margin: "-40px" as const },
      }
    : { initial: "hidden" as const, animate: "show" as const };

  return (
    <motion.div variants={variants} className={className} {...props}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { ease: [0.25, 0.1, 0.25, 1], duration: 0.3 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
