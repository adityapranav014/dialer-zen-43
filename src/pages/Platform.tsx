/**
 * Platform / Super Admin Dashboard
 *
 * Shows all companies, platform-level stats, and allows
 * the super admin to switch into any company context.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Users,
  PhoneCall,
  TrendingUp,
  Search,
  ArrowRight,
  Plus,
  Shield,
  ToggleLeft,
  ToggleRight,
  Loader2,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Settings2,
} from "lucide-react";
import StatusConfigModal from "@/components/StatusConfigModal";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { db } from "@/integrations/turso/db";
import { tenants as tenants_table, app_users, leads as leads_table, call_logs, tenant_memberships } from "@/integrations/turso/schema";
import { eq, count } from "drizzle-orm";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const Platform = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, signOut, switchTenant, tenants, loadingTenants, isSuperAdmin, displayName } = useAuth();
  const { theme, setTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: "", slug: "", plan: "free" });
  const [creating, setCreating] = useState(false);
  const [configTenant, setConfigTenant] = useState<{ id: string; name: string } | null>(null);

  // Redirect non-super-admins
  if (!isSuperAdmin) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  // Platform stats
  const { data: platformStats } = useQuery({
    queryKey: ["platform", "stats"],
    queryFn: async () => {
      const [
        [{ value: tenantCount }],
        [{ value: userCount }],
        [{ value: leadCount }],
        [{ value: callCount }],
      ] = await Promise.all([
        db.select({ value: count() }).from(tenants_table),
        db.select({ value: count() }).from(app_users),
        db.select({ value: count() }).from(leads_table),
        db.select({ value: count() }).from(call_logs),
      ]);
      return {
        companies: tenantCount,
        users: userCount,
        leads: leadCount,
        calls: callCount,
      };
    },
  });

  // Per-tenant stats
  const { data: tenantStats = {} } = useQuery({
    queryKey: ["platform", "tenant-stats"],
    queryFn: async () => {
      const [memberships, leadsRows, callsRows] = await Promise.all([
        db.select({ tenant_id: tenant_memberships.tenant_id }).from(tenant_memberships),
        db.select({ tenant_id: leads_table.tenant_id }).from(leads_table),
        db.select({ tenant_id: call_logs.tenant_id }).from(call_logs),
      ]);

      const stats: Record<string, { members: number; leads: number; calls: number }> = {};
      for (const m of memberships) {
        if (!stats[m.tenant_id]) stats[m.tenant_id] = { members: 0, leads: 0, calls: 0 };
        stats[m.tenant_id].members++;
      }
      for (const l of leadsRows) {
        if (!stats[l.tenant_id]) stats[l.tenant_id] = { members: 0, leads: 0, calls: 0 };
        stats[l.tenant_id].leads++;
      }
      for (const c of callsRows) {
        if (!stats[c.tenant_id]) stats[c.tenant_id] = { members: 0, leads: 0, calls: 0 };
        stats[c.tenant_id].calls++;
      }
      return stats;
    },
  });

  const handleSwitchToCompany = async (tenantId: string) => {
    try {
      await switchTenant(tenantId);
      navigate("/dashboard");
      toast.success("Switched company context");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCreateCompany = async () => {
    if (!newCompany.name.trim() || !newCompany.slug.trim()) {
      toast.error("Company name and URL are required");
      return;
    }
    setCreating(true);
    try {
      await db.insert(tenants_table).values({
        name: newCompany.name.trim(),
        slug: newCompany.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, ""),
        plan: newCompany.plan,
      });
      toast.success("Company created!");
      setShowNewCompany(false);
      setNewCompany({ name: "", slug: "", plan: "free" });
      queryClient.invalidateQueries({ queryKey: ["platform"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to create company");
    } finally {
      setCreating(false);
    }
  };

  const toggleTenantActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await db.update(tenants_table).set({ is_active: !isActive }).where(eq(tenants_table.id, id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform"] });
      toast.success("Company status updated");
    },
  });

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const themeOptions = [
    { id: "light" as const, label: "Light", icon: Sun },
    { id: "dark" as const, label: "Dark", icon: Moon },
    { id: "system" as const, label: "System", icon: Monitor },
  ];

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b border-border bg-card"
        style={{
          boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground">DialFlow Platform</h1>
              <p className="text-[10px] text-foreground/40">Super Admin Console</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme switcher */}
            <div className="hidden sm:flex items-center gap-1 p-1 bg-accent/60 rounded-xl surface-inset">
              {themeOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                    theme === opt.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground/40 hover:text-foreground"
                  }`}
                >
                  <opt.icon className="h-3 w-3" />
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-foreground">{displayName}</p>
                <p className="text-[10px] text-foreground/40">Super Admin</p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="h-8 w-8 flex items-center justify-center rounded-xl text-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Platform Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Companies", value: platformStats?.companies ?? 0, icon: Building2, color: "text-blue-500" },
            { label: "Total Users", value: platformStats?.users ?? 0, icon: Users, color: "text-green-500" },
            { label: "Total Leads", value: platformStats?.leads ?? 0, icon: TrendingUp, color: "text-purple-500" },
            { label: "Total Calls", value: platformStats?.calls ?? 0, icon: PhoneCall, color: "text-orange-500" },
          ].map((stat) => (
            <div key={stat.label} className="surface-float p-4 flex items-center gap-3">
              <div className={`h-11 w-11 rounded-2xl bg-accent flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-[11px] text-foreground/40 font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Company List Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-bold text-foreground">Companies</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search companies..."
                className="h-10 pl-9 pr-4 w-56 bg-muted/60 border border-border rounded-xl text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              onClick={() => setShowNewCompany(true)}
              className="h-10 px-4 bg-primary text-primary-foreground text-sm font-bold rounded-xl flex items-center gap-1.5 transition-colors btn-depth"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Company</span>
            </button>
          </div>
        </div>

        {/* New Company Form */}
        {showNewCompany && (
          <div className="surface-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Create New Company</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={newCompany.name}
                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                placeholder="Company Name"
                className="h-10 px-3 bg-muted/60 border border-border rounded-xl text-sm"
              />
              <input
                type="text"
                value={newCompany.slug}
                onChange={(e) =>
                  setNewCompany({
                    ...newCompany,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  })
                }
                placeholder="company-url"
                className="h-10 px-3 bg-muted/60 border border-border rounded-xl text-sm"
              />
              <select
                value={newCompany.plan}
                onChange={(e) => setNewCompany({ ...newCompany, plan: e.target.value })}
                className="h-10 px-3 bg-muted/60 border border-border rounded-xl text-sm"
              >
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowNewCompany(false)}
                className="h-9 px-4 text-sm font-medium text-foreground/60 hover:text-foreground rounded-xl hover:bg-accent transition-colors duration-200">Cancel
              </button>
              <button
                onClick={handleCreateCompany}
                disabled={creating}
                className="h-9 px-4 bg-primary text-primary-foreground text-sm font-bold rounded-xl disabled:opacity-50 flex items-center gap-1.5 btn-depth"
              >
                {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create
              </button>
            </div>
          </div>
        )}

        {/* Company Cards */}
        {loadingTenants ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredTenants.map((tenant) => {
              const ts = tenantStats[tenant.id];
              return (
                <div
                  key={tenant.id}
                  className="surface-card p-4 sm:p-5 flex items-center justify-between gap-4 group hover:border-primary/20 transition-colors hover-lift"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-11 w-11 rounded-xl bg-accent flex items-center justify-center shrink-0"><Building2 className="h-5 w-5 text-foreground/40" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground truncate">
                          {tenant.name}
                        </p>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg ${
                            tenant.is_active
                              ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                          }`}
                        >
                          {tenant.is_active ? "Active" : "Inactive"}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg bg-accent text-foreground/60 uppercase">
                          {tenant.plan}
                        </span>
                      </div>
                      <p className="text-[11px] text-foreground/40 mt-0.5 font-mono">
                        {tenant.slug}.dialflow.app
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-5 text-center">
                      <div>
                        <p className="text-sm font-bold text-foreground">{ts?.members ?? 0}</p>
                        <p className="text-[10px] text-foreground/30">Users</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{ts?.leads ?? 0}</p>
                        <p className="text-[10px] text-foreground/30">Leads</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{ts?.calls ?? 0}</p>
                        <p className="text-[10px] text-foreground/30">Calls</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setConfigTenant({ id: tenant.id, name: tenant.name })}
                        className="h-8 w-8 flex items-center justify-center rounded-xl text-foreground/30 hover:text-foreground hover:bg-accent transition-colors"
                        title="Configure statuses"
                      >
                        <Settings2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleTenantActive.mutate({ id: tenant.id, isActive: tenant.is_active })}
                        className="h-8 w-8 flex items-center justify-center rounded-xl text-foreground/30 hover:text-foreground hover:bg-accent transition-colors"
                        title={tenant.is_active ? "Deactivate" : "Activate"}
                      >
                        {tenant.is_active ? (
                          <ToggleRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleSwitchToCompany(tenant.id)}
                        className="h-8 px-3 bg-primary/10 text-primary text-xs font-bold rounded-xl flex items-center gap-1 hover:bg-primary/20 transition-colors"
                      >
                        Enter
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredTenants.length === 0 && !loadingTenants && (
              <div className="text-center py-12 text-foreground/30 text-sm">
                {search ? "No companies match your search" : "No companies yet"}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Status config modal */}
      {configTenant && (
        <StatusConfigModal
          tenantId={configTenant.id}
          tenantName={configTenant.name}
          onClose={() => setConfigTenant(null)}
        />
      )}
    </div>
  );
};

export default Platform;
