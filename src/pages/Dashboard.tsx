import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import AdminDashboard from "@/components/AdminDashboard";
import BdaDashboard from "@/components/BdaDashboard";

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const displayName = user?.user_metadata?.display_name || user?.email || "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AppLayout
      title="DialFlow"
      maxWidthClass="max-w-6xl"
      fullHeight={false}
      headerRight={
        <>
          <button className="relative h-8 w-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-destructive rounded-full" />
          </button>
          <div
            className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white bg-gradient-brand`}
          >
            {initials}
          </div>
        </>
      }
    >
      {isAdmin ? <AdminDashboard /> : <BdaDashboard />}
    </AppLayout>
  );
};

export default Dashboard;
