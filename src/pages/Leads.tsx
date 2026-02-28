import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import AdminLeads from "@/components/AdminLeads";
import MyLeads from "@/components/MyLeads";

const Leads = () => {
  const { isAdmin } = useAuth();

  return (
    <AppLayout
      title={isAdmin ? "Leads" : "My Leads"}
      maxWidthClass="max-w-[1600px]"
      fullHeight={true}
    >
      {isAdmin ? <AdminLeads /> : <MyLeads />}
    </AppLayout>
  );
};

export default Leads;
