import { motion } from "framer-motion";
import { PhoneCall, User, LogOut, Shield, Bell, Moon, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const Profile = () => {
  const navigate = useNavigate();

  const menuItems = [
    { label: "Account Settings", icon: User },
    { label: "Notifications", icon: Bell },
    { label: "Security", icon: Shield },
    { label: "Appearance", icon: Moon },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <PhoneCall className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">Profile</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
            AM
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Arjun Mehta</h2>
            <p className="text-sm text-muted-foreground">Super Admin · TechCorp Inc.</p>
            <p className="text-xs text-primary mt-0.5">arjun@techcorp.io</p>
          </div>
        </motion.div>

        <div className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-8">DialFlow v1.0.0 · Multi-Tenant CRM</p>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
