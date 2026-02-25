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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  lead_assigned: { icon: UserPlus, bg: "bg-blue-50", iconColor: "text-blue-500" },
  lead_status_change: { icon: ArrowRightLeft, bg: "bg-emerald-50", iconColor: "text-emerald-500" },
  call_reminder: { icon: PhoneCall, bg: "bg-amber-50", iconColor: "text-amber-500" },
  achievement: { icon: Trophy, bg: "bg-[#f6f7ed]", iconColor: "text-[#1f1f1f]" },
  system: { icon: Monitor, bg: "bg-[#f4f4f4]", iconColor: "text-[#1f1f1f]/60" },
  team_update: { icon: Users, bg: "bg-purple-50", iconColor: "text-purple-500" },
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
          ? "hover:bg-[#f4f4f4]/60"
          : "bg-[#f6f7ed]/40 hover:bg-[#f6f7ed]/70"
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
        className={`h-8 w-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}
      >
        <Icon className={`h-3.5 w-3.5 ${config.iconColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-[13px] leading-tight ${
              notification.is_read
                ? "font-medium text-[#1f1f1f]/70"
                : "font-semibold text-[#1f1f1f]"
            }`}
          >
            {notification.title}
          </p>
          <span className="text-[10px] text-[#1f1f1f]/30 whitespace-nowrap shrink-0 mt-0.5">
            {timeAgo(notification.created_at)}
          </span>
        </div>
        <p className="text-[11px] text-[#1f1f1f]/40 mt-0.5 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>

        {/* Priority badge for high/urgent */}
        {(notification.priority === "high" || notification.priority === "urgent") &&
          !notification.is_read && (
            <span
              className={`inline-block mt-1.5 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                notification.priority === "urgent"
                  ? "bg-red-50 text-red-600"
                  : "bg-amber-50 text-amber-600"
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
            className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-white text-[#1f1f1f]/30 hover:text-[#1f1f1f] transition-colors"
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
          className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-white text-[#1f1f1f]/30 hover:text-red-500 transition-colors"
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
      <PopoverTrigger asChild>
        <button className="relative h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[#f4f4f4] text-[#1f1f1f]/50 transition-colors">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1 leading-none ring-2 ring-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[360px] sm:w-[400px] p-0 rounded-xl border border-black/[0.06] shadow-lg bg-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#1f1f1f]">Notifications</h3>
            {unreadCount > 0 && (
              <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-[#1f1f1f] text-[10px] font-bold text-white px-1.5">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-[11px] font-medium text-[#1f1f1f]/40 hover:text-[#1f1f1f] transition-colors"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>

        <Separator className="bg-black/[0.06]" />

        {/* Notification list */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="h-10 w-10 rounded-full bg-[#f4f4f4] flex items-center justify-center mb-3">
              <Bell className="h-4 w-4 text-[#1f1f1f]/25" />
            </div>
            <p className="text-sm font-medium text-[#1f1f1f]/40">No notifications</p>
            <p className="text-[11px] text-[#1f1f1f]/25 mt-0.5">You're all caught up!</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="divide-y divide-black/[0.04]">
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
          </ScrollArea>
        )}

      </PopoverContent>
    </Popover>
  );
};

export default NotificationPanel;
