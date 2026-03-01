import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  Trophy,
  ArrowRightLeft,
  PhoneCall,
  Monitor,
  Users,
  Check,
  CheckCheck,
  X,
  Bell,
} from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  useNotifications,
  type Notification,
  type NotificationType,
} from "@/hooks/useNotifications";

// ─── Icon + colour map per notification type ──────────────────────────
const typeConfig: Record<
  NotificationType,
  { icon: typeof Bell; bg: string; iconColor: string }
> = {
  lead_assigned: { icon: UserPlus, bg: "bg-blue-50 dark:bg-blue-950/30", iconColor: "text-blue-500" },
  lead_status_change: { icon: ArrowRightLeft, bg: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-500" },
  call_reminder: { icon: PhoneCall, bg: "bg-amber-50 dark:bg-amber-950/30", iconColor: "text-amber-500" },
  achievement: { icon: Trophy, bg: "bg-accent", iconColor: "text-foreground" },
  system: { icon: Monitor, bg: "bg-muted", iconColor: "text-foreground/60" },
  team_update: { icon: Users, bg: "bg-purple-50 dark:bg-purple-950/30", iconColor: "text-purple-500" },
};

// ─── Time-ago helper ──────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ─── Single notification row ──────────────────────────────────────────
function NotificationRow({
  notification,
  onRead,
  onDelete,
  onNavigate,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (url: string) => void;
}) {
  const config = typeConfig[notification.type];
  const Icon = config.icon;

  return (
    <div
      className={`relative flex items-start gap-3 px-4 py-3 transition-colors group cursor-pointer ${
        notification.is_read
          ? "hover:bg-accent/60"
          : "bg-accent/40 hover:bg-accent/70"
      }`}
      onClick={() => {
        if (!notification.is_read) onRead(notification.id);
        if (notification.action_url) onNavigate(notification.action_url);
      }}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-blue-500" />
      )}

      {/* Type icon */}
      <div
        className={`h-8 w-8 rounded-xl ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}
      >
        <Icon className={`h-3.5 w-3.5 ${config.iconColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-[13px] leading-tight ${
              notification.is_read
                ? "font-medium text-foreground/70"
                : "font-semibold text-foreground"
            }`}
          >
            {notification.title}
          </p>
          <span className="text-[10px] text-foreground/30 whitespace-nowrap shrink-0 mt-0.5">
            {timeAgo(notification.created_at)}
          </span>
        </div>
        <p className="text-[11px] text-foreground/40 mt-0.5 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>

        {/* Priority badge for high/urgent */}
        {(notification.priority === "high" || notification.priority === "urgent") &&
          !notification.is_read && (
            <span
              className={`inline-block mt-1.5 text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                notification.priority === "urgent"
                  ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                  : "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
              }`}
            >
              {notification.priority}
            </span>
          )}
      </div>

      {/* Actions on hover */}
      <div className="hidden group-hover:flex items-center gap-1 shrink-0 mt-0.5">
        {!notification.is_read && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRead(notification.id);
            }}
            className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-card text-foreground/30 hover:text-foreground transition-colors"
            title="Mark as read"
          >
            <Check className="h-3 w-3" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-card text-foreground/30 hover:text-red-500 transition-colors"
          title="Dismiss"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────
const NotificationPanel = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();

  return (
    <Popover>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button className="relative h-8 w-8 rounded-xl flex items-center justify-center hover:bg-accent text-foreground/50 transition-colors duration-200">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-md bg-red-500 text-[10px] font-bold text-white px-1 leading-none ring-2 ring-card">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Notifications{unreadCount > 0 ? ` (${unreadCount} unread)` : ""}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[360px] sm:w-[400px] p-0 rounded-xl border border-border shadow-lg bg-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <span className="min-w-[20px] h-5 flex items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground px-1.5">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-[11px] font-semibold text-foreground/40 hover:text-foreground transition-colors duration-200"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>

        <Separator className="bg-border" />

        {/* Notification list */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center mb-3">
              <Bell className="h-4 w-4 text-foreground/25" />
            </div>
            <p className="text-sm font-medium text-foreground/40">No notifications</p>
            <p className="text-[11px] text-foreground/25 mt-0.5">You're all caught up!</p>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[400px] scroll-container">
            <div className="divide-y divide-foreground/[0.04]">
              {notifications.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onRead={markAsRead}
                  onDelete={deleteNotification}
                  onNavigate={(url) => navigate(url)}
                />
              ))}
            </div>
          </div>
        )}

      </PopoverContent>
    </Popover>
  );
};

export default NotificationPanel;
