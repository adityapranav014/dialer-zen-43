import { cn } from "@/lib/utils";

/**
 * Professional skeleton placeholder with shimmer effect.
 * Works in both light and dark themes using CSS custom-property–based gradients.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted relative overflow-hidden isolate",
        // Shimmer overlay via pseudo-element
        "before:absolute before:inset-0 before:bg-shimmer before:animate-shimmer",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
