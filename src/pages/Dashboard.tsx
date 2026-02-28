import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import AdminDashboard from "@/components/AdminDashboard";
import BdaDashboard from "@/components/BdaDashboard";

const Dashboard = () => {
  const { isAdmin } = useAuth();

  return (
    <AppLayout
      title="Dashboard"
      maxWidthClass="max-w-[1600px]"
      fullHeight
    >
      {isAdmin ? <AdminDashboard /> : <BdaDashboard />}
    </AppLayout>
  );
};

export default Dashboard;
