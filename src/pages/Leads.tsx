import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import AdminLeads from "@/components/AdminLeads";
import MyLeads from "@/components/MyLeads";
import { SlidersHorizontal, Users, UserCheck } from "lucide-react";

const Leads = () => {
  const { isAdmin } = useAuth();

  return (
    <AppLayout
      title={isAdmin ? "Leads" : "My Leads"}
      maxWidthClass={isAdmin ? "max-w-[1700px]" : "max-w-4xl"}
      fullHeight={true}
      headerRight={
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${isAdmin
              ? "bg-primary/10 border-primary/25 text-primary"
              : "bg-accent/10 border-accent/25 text-accent"
              }`}
          >
            {isAdmin ? (
              <>
                <Users className="h-3 w-3" />
                Admin View
              </>
            ) : (
              <>
                <UserCheck className="h-3 w-3" />
                My Pipeline
              </>
            )}
          </span>
          {isAdmin && (
            <button className="h-8 w-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      }
    >
      {isAdmin ? <AdminLeads /> : <MyLeads />}
    </AppLayout>
  );
};

export default Leads;
