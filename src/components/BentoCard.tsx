import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "glass" | "elevated" | "glow";
  delay?: number;
}

const BentoCard = ({ children, className = "", variant = "default", delay = 0 }: BentoCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay }}
      className={cn(
        "bento-card",
        variant === "glass" && "glass",
        variant === "elevated" && "shadow-2xl",
        variant === "glow" && "glow-primary",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export default BentoCard;
