import { ReactNode } from "react";
import { PhoneCall } from "lucide-react";
import SideNav from "@/components/SideNav";
import BottomNav from "@/components/BottomNav";

interface AppLayoutProps {
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  headerRight?: ReactNode;
  fullHeight?: boolean;
  children: ReactNode;
}

export const AppLayout = ({
  title,
  subtitle,
  maxWidthClass = "max-w-[1600px]",
  headerRight,
  fullHeight = false,
  children,
}: AppLayoutProps) => {
  return (
    <div className="md:pl-64 flex flex-col h-screen overflow-hidden scroll-smooth">
      <SideNav />

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/60 backdrop-blur-2xl shrink-0">
        <div
          className={`${maxWidthClass} mx-auto px-4 sm:px-8 md:px-10 h-14 flex items-center ${headerRight ? "justify-between" : "gap-3"
            }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-gradient-brand flex items-center justify-center glow-primary shrink-0">
              <PhoneCall className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-foreground tracking-tight">{title}</span>
          </div>
          {headerRight && (
            <div className="flex items-center gap-2.5">{headerRight}</div>
          )}
        </div>
      </header>

      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className={`flex-1 flex flex-col min-h-0 w-full ${fullHeight ? "overflow-hidden" : "overflow-y-auto custom-scrollbar scroll-smooth"}`}>
          <div className={`${maxWidthClass} mx-auto w-full px-4 sm:px-8 md:px-10 ${fullHeight ? "flex-1 flex flex-col min-h-0" : "pt-8 pb-24 md:pb-12"}`}>
            {subtitle && (
              <div className="mb-8 shrink-0">
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight mb-1">{subtitle}</h2>
              </div>
            )}
            {children}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
