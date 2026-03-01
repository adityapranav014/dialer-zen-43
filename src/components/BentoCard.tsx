import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

const BentoCard = ({ children, className = "" }: BentoCardProps) => {
  return (
    <div
      className={cn(
        "surface-card p-6",
        className
      )}
    >
      {children}
    </div>
  );
};

export default BentoCard;
