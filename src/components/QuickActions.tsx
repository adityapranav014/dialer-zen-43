import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Users,
  UserCheck,
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";

// ─── Action definitions ───────────────────────────────────────────────
interface QuickAction {
  id: string;
  label: string;
  desc: string;
  icon: typeof Plus;
  iconBg: string;
  iconColor: string;
  /** Navigation path (navigates first, then fires event if needed) */
  path: string;
  /** Optional custom event to dispatch after navigation */
  event?: string;
  /** Visible to these roles only. undefined = everyone */
  roles?: ("admin" | "bda")[];
}

const allActions: QuickAction[] = [
  // ── Create ──────────────────────────────────────
  {
    id: "new-lead",
    label: "New Lead",
    desc: "Create a lead entry",
    icon: Users,
    iconBg: "bg-blue-50 dark:bg-blue-950/30",
    iconColor: "text-blue-500",
    path: "/leads",
    event: "open-add-lead-modal",
  },
  {
    id: "new-bda",
    label: "Add Team Member",
    desc: "Invite a new BDA agent",
    icon: UserCheck,
    iconBg: "bg-orange-50 dark:bg-orange-950/30",
    iconColor: "text-orange-500",
    path: "/team",
    event: "open-add-bda-modal",
    roles: ["admin"],
  },
];

// ─── Component ────────────────────────────────────────────────────────
const QuickActions = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const userRole: "admin" | "bda" = isAdmin ? "admin" : "bda";

  // Filter actions by role
  const visibleActions = allActions.filter(
    (a) => !a.roles || a.roles.includes(userRole),
  );

  const createActions = visibleActions;

  const handleAction = useCallback(
    (action: QuickAction) => {
      setOpen(false);

      if (action.event) {
        // Store intent so the target component can pick it up on mount
        sessionStorage.setItem("dialflow_pending_action", action.event);
      }

      navigate(action.path);

      if (action.event) {
        // Also fire immediately in case the component is already mounted
        setTimeout(
          () => window.dispatchEvent(new CustomEvent(action.event!)),
          100,
        );
      }
    },
    [navigate],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Desktop trigger */}
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button className="hidden sm:flex items-center justify-center h-8 w-8 rounded-lg border border-border bg-muted hover:bg-accent text-foreground/50 hover:text-foreground transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          {!open && (
            <TooltipContent side="bottom" className="text-xs">
              Quick actions
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-64 p-0 rounded-xl border border-border shadow-xl bg-card"
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-sm font-semibold text-foreground">Quick Actions</p>
          <p className="text-[11px] text-foreground/35 mt-0.5">
            {isAdmin ? "Admin shortcuts" : "Your shortcuts"}
          </p>
        </div>

        {/* Actions */}
        {createActions.length > 0 && (
          <div className="px-2 pb-2">
            {createActions.map((action) => (
              <ActionRow key={action.id} action={action} onSelect={handleAction} />
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

// ─── Action Row ───────────────────────────────────────────────────────
function ActionRow({
  action,
  onSelect,
}: {
  action: QuickAction;
  onSelect: (a: QuickAction) => void;
}) {
  const Icon = action.icon;
  return (
    <button
      onClick={() => onSelect(action)}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors group"
    >
      <div
        className={`h-7 w-7 rounded-md ${action.iconBg} flex items-center justify-center shrink-0 transition-colors`}
      >
        <Icon className={`h-3.5 w-3.5 ${action.iconColor}`} />
      </div>
      <div className="min-w-0 text-left">
        <p className="text-[13px] font-medium text-foreground">{action.label}</p>
        <p className="text-[10px] text-foreground/30 leading-tight">{action.desc}</p>
      </div>
    </button>
  );
}

export default QuickActions;
