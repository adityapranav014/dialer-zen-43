import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragOverlay,
    closestCorners,
    useDraggable,
    useDroppable,
} from "@dnd-kit/core";
import {
    Phone,
    Clock,
    UserCheck,
    X,
    Check,
    Search,
    AlertCircle,
    TrendingUp,
    Plus,
} from "lucide-react";
import { useLeads, LeadStatus as DbLeadStatus } from "@/hooks/useLeads";
import { useTeam } from "@/hooks/useTeam";
import AddLeadModal from "./AddLeadModal";
import LeadDetailPopup from "./LeadDetailPopup";
import { AdminLeadsSkeleton } from "@/components/skeletons";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lead {
    id: string;
    name: string;
    phone: string;
    status: DbLeadStatus;
    assigned_to: string | null;
    created_at: string;
    value?: string;
    // UI computed fields
    assignedTo: string | null;
    assignedToColor: string | null;
    assignedToInitials: string | null;
}

interface BDA {
    id: string;
    name: string;
    initials: string;
    status: "active" | "idle" | "offline";
    avatarColor: string;
}

const timeAgo = (isoDate: string) => {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
};

// Avatar color palette — keyed by name stored in DB
const AVATAR_COLOR_MAP: Record<string, { bg: string; text: string }> = {
    violet:  { bg: "bg-violet-100 dark:bg-violet-900/40",  text: "text-violet-600 dark:text-violet-300" },
    blue:    { bg: "bg-blue-100 dark:bg-blue-900/40",    text: "text-blue-600 dark:text-blue-300" },
    emerald: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-600 dark:text-emerald-300" },
    orange:  { bg: "bg-orange-100 dark:bg-orange-900/40",  text: "text-orange-600 dark:text-orange-300" },
    pink:    { bg: "bg-pink-100 dark:bg-pink-900/40",    text: "text-pink-600 dark:text-pink-300" },
    cyan:    { bg: "bg-cyan-100 dark:bg-cyan-900/40",    text: "text-cyan-600 dark:text-cyan-300" },
    lime:    { bg: "bg-lime-100 dark:bg-lime-900/40",    text: "text-lime-600 dark:text-lime-300" },
    fuchsia: { bg: "bg-fuchsia-100 dark:bg-fuchsia-900/40", text: "text-fuchsia-600 dark:text-fuchsia-300" },
    red:     { bg: "bg-red-100 dark:bg-red-900/40",     text: "text-red-600 dark:text-red-300" },
    amber:   { bg: "bg-amber-100 dark:bg-amber-900/40",   text: "text-amber-600 dark:text-amber-300" },
    indigo:  { bg: "bg-indigo-100 dark:bg-indigo-900/40",  text: "text-indigo-600 dark:text-indigo-300" },
    teal:    { bg: "bg-teal-100 dark:bg-teal-900/40",    text: "text-teal-600 dark:text-teal-300" },
};
export const AVATAR_COLOR_NAMES = Object.keys(AVATAR_COLOR_MAP);

const getAvatarClasses = (colorName: string | null, fallbackId: string): string => {
    if (colorName && AVATAR_COLOR_MAP[colorName]) {
        const c = AVATAR_COLOR_MAP[colorName];
        return `${c.bg} ${c.text}`;
    }
    // Fallback: hash-based
    return getAvatarColor(fallbackId);
};

const avatarColors = [
    "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300",
    "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300",
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300",
    "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300",
    "bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-300",
    "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-300",
    "bg-lime-100 text-lime-600 dark:bg-lime-900/40 dark:text-lime-300",
    "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/40 dark:text-fuchsia-300",
];
const getAvatarColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return avatarColors[Math.abs(hash) % avatarColors.length];
};
const getInitials = (n: string) => n.split(" ").map(w => w[0]).join("").toUpperCase();

// ─── Column Config ────────────────────────────────────────────────────────────

const columns: { id: DbLeadStatus; label: string; icon: string; color: string; bg: string; headerBg: string; border: string; dot: string; dropBg: string }[] = [
    { id: "new", label: "New", icon: "🔵", color: "text-foreground", bg: "bg-muted/50 dark:bg-muted/30", headerBg: "bg-card dark:bg-card", border: "border-border/60", dot: "bg-foreground/70", dropBg: "bg-foreground/[0.02]" },
    { id: "contacted", label: "Contacted", icon: "📞", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50/40 dark:bg-blue-950/20", headerBg: "bg-white dark:bg-blue-950/60", border: "border-blue-200/40 dark:border-blue-800/50", dot: "bg-blue-500", dropBg: "bg-blue-50/30 dark:bg-blue-950/10" },
    { id: "interested", label: "Interested", icon: "🔥", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50/40 dark:bg-emerald-950/20", headerBg: "bg-white dark:bg-emerald-950/60", border: "border-emerald-200/40 dark:border-emerald-800/50", dot: "bg-emerald-500", dropBg: "bg-emerald-50/30 dark:bg-emerald-950/10" },
    { id: "closed", label: "Closed", icon: "✅", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50/40 dark:bg-purple-950/20", headerBg: "bg-white dark:bg-purple-950/60", border: "border-purple-200/40 dark:border-purple-800/50", dot: "bg-purple-500", dropBg: "bg-purple-50/30 dark:bg-purple-950/10" },
];

const statusBDACfg: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-600 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
    idle: "bg-amber-50 text-amber-600 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
    offline: "bg-muted text-foreground/40 border-border",
};

// ─── Lead Card Content (pure presentational) ─────────────────────────────────

const LeadCardContent = ({ lead, onAssign, onViewDetail, isDragOverlay = false }: { lead: Lead; onAssign?: (lead: Lead) => void; onViewDetail?: (lead: Lead) => void; isDragOverlay?: boolean }) => (
    <div className={`group/card bg-card rounded-[10px] select-none transition-all duration-200 ${
        isDragOverlay
            ? "shadow-2xl ring-2 ring-primary/20 scale-[1.02] rotate-[1deg] p-3.5"
            : "shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_3px_12px_rgba(0,0,0,0.08)] border border-border/50 hover:border-border p-3.5"
    }`}>
        <div className="flex-1 min-w-0">
            {/* Name + value */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
                <button
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); onViewDetail?.(lead); }}
                    className="text-[13px] font-semibold text-foreground truncate tracking-tight leading-snug text-left hover:text-primary transition-colors cursor-pointer"
                    title="View lead details"
                >{lead.name}</button>
                {lead.value && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md shrink-0">{lead.value}</span>}
            </div>

            {/* Phone */}
            <div className="flex items-center gap-1.5 text-[11px] text-foreground/35 font-medium">
                <Phone className="h-3 w-3" />
                <span>{lead.phone}</span>
            </div>

            {/* Assigned BDA badge */}
            {lead.assignedTo && (
                <div className="mt-2 flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/60 dark:bg-muted/40">
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[7px] font-bold shrink-0 ${lead.assignedToColor || "bg-primary text-primary-foreground"}`}>
                        {lead.assignedToInitials || lead.assignedTo.split(" ").map(n => n[0]).join("")}
                    </div>
                    <span className="text-[10px] font-medium text-foreground/50 truncate">{lead.assignedTo}</span>
                </div>
            )}

            {/* Footer: time + assign */}
            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/30">
                <span className="text-[10px] text-foreground/25 font-medium flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {timeAgo(lead.created_at)}
                </span>
                {onAssign && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onAssign(lead); }}
                        className={`flex items-center gap-1 text-[10px] font-semibold rounded-md px-2 py-1 transition-all duration-150 ${
                            lead.assignedTo
                                ? "text-foreground/30 opacity-0 group-hover/card:opacity-100 hover:!text-primary hover:!bg-primary/10"
                                : "text-primary bg-primary/[0.06] hover:bg-primary/10"
                        }`}
                    >
                        <UserCheck className="h-2.5 w-2.5" />
                        {lead.assignedTo ? "Reassign" : "Assign"}
                    </button>
                )}
            </div>
        </div>
    </div>
);

// ─── Draggable Lead Card ──────────────────────────────────────────────────────

const DraggableLead = ({ lead, onAssign, onViewDetail }: { lead: Lead; onAssign: (lead: Lead) => void; onViewDetail: (lead: Lead) => void }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            className={`cursor-grab active:cursor-grabbing touch-none outline-none rounded-[10px] transition-all duration-150 ${
                isDragging
                    ? "opacity-0 scale-[0.98] h-0 overflow-hidden p-0 m-0 border-0"
                    : "opacity-100 hover:-translate-y-0.5"
            }`}
        >
            <LeadCardContent lead={lead} onAssign={isDragging ? undefined : onAssign} onViewDetail={isDragging ? undefined : onViewDetail} />
        </div>
    );
};

// ─── Kanban Column (droppable) ────────────────────────────────────────────────

interface KanbanColumnProps {
    colId: DbLeadStatus;
    dropBg: string;
    leads: Lead[];
    onAssign: (lead: Lead) => void;
    onViewDetail: (lead: Lead) => void;
}

// ─── Column Header (rendered in sticky row) ──────────────────────────────────

const KanbanColumnHeader = ({ color, headerBg, border, dot, label, count }: {
    color: string; headerBg: string; border: string; dot: string; label: string; count: number;
}) => (
    <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg border ${headerBg} ${border} shadow-[0_1px_2px_rgba(0,0,0,0.03)]`}>
        <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center h-4 w-4">
                <span className={`absolute inset-0 rounded-full ${dot} opacity-15`} />
                <span className={`h-2 w-2 rounded-full ${dot}`} />
            </div>
            <span className={`text-sm font-semibold tracking-tight ${color}`}>{label}</span>
        </div>
        <span className={`text-xs font-bold tabular-nums min-w-[24px] text-center py-0.5 px-1.5 rounded-md bg-foreground/[0.05] ${color}`}>
            {count}
        </span>
    </div>
);

// ─── Column Cards (droppable area) ───────────────────────────────────────────

const KanbanColumn = ({ colId, dropBg, leads, onAssign, onViewDetail }: KanbanColumnProps) => {
    const { setNodeRef, isOver } = useDroppable({ id: colId });

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col rounded-xl transition-all duration-200 flex-1 ${dropBg} ${
                isOver
                    ? "ring-2 ring-primary/25 bg-primary/[0.04] shadow-lg shadow-primary/5"
                    : ""
            }`}
        >
            {/* Leads — grows naturally */}
            <div className="flex flex-col gap-2 p-1.5 flex-1">
                {leads.length === 0 && (
                    <div className={`flex flex-col items-center justify-center py-10 flex-1 min-h-[100px] text-center rounded-lg border border-dashed transition-all duration-200 ${
                        isOver
                            ? "border-primary/40 bg-primary/[0.04]"
                            : "border-foreground/[0.06]"
                    }`}>
                        <div className="text-foreground/15 mb-1">
                            <TrendingUp className="h-5 w-5 mx-auto" />
                        </div>
                        <p className="text-[11px] text-foreground/25 font-medium">{isOver ? "Drop here" : "No leads yet"}</p>
                    </div>
                )}
                {leads.map((lead) => (
                    <DraggableLead key={lead.id} lead={lead} onAssign={onAssign} onViewDetail={onViewDetail} />
                ))}
            </div>
        </div>
    );
};

// ─── BDA Assign Sheet ─────────────────────────────────────────────────────────

interface AssignSheetProps {
    lead: Lead | null;
    bdas: BDA[];
    onAssign: (leadId: string, userId: string | null) => void;
    onClose: () => void;
}

const AssignSheet = ({ lead, bdas, onAssign, onClose }: AssignSheetProps) => {
    const [search, setSearch] = useState("");
    if (!lead) return null;

    const filtered = bdas.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <>
            {lead && (
                <>
                    {/* Backdrop */}
                    <div
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity"
                    />
                    {/* Sheet */}
                    <div
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm rounded-2xl bg-card border border-border p-5 shadow-xl"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Assign Lead</p>
                                <p className="text-xs text-foreground/40 mt-0.5">{lead.name} · {lead.phone}</p>
                            </div>
                            <button onClick={onClose} className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/25 pointer-events-none" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search BDA..."
                                className="w-full h-9 pl-9 pr-3 bg-muted border border-border rounded-lg text-xs text-foreground placeholder:text-foreground/25 focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all"
                                autoFocus
                            />
                        </div>

                        {/* BDA List */}
                        <div className="space-y-1.5 max-h-64 overflow-y-auto scroll-container">
                            {filtered.map((bda) => (
                                <button
                                    key={bda.id}
                                    onClick={() => { onAssign(lead.id, bda.id); onClose(); }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left group hover:border-foreground/15 hover:bg-accent/50 ${lead.assigned_to === bda.id ? "border-foreground/20 bg-accent" : "border-foreground/[0.04] bg-card"}`}
                                >
                                    <div className={`h-8 w-8 rounded-full ${bda.avatarColor} flex items-center justify-center text-[10px] font-bold shrink-0`}>
                                        {bda.initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-foreground">{bda.name}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${statusBDACfg[bda.status]}`}>
                                            {bda.status}
                                        </span>
                                        {lead.assigned_to === bda.id && <Check className="h-3.5 w-3.5 text-foreground" />}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Unassign option */}
                        {lead.assigned_to && (
                            <button
                                onClick={() => { onAssign(lead.id, null); onClose(); }}
                                className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-xs text-foreground/40 hover:text-red-500 transition-colors border border-dashed border-border rounded-xl hover:border-red-300"
                            >
                                <AlertCircle className="h-3 w-3" />
                                Remove assignment
                            </button>
                        )}
                    </div>
                </>
            )}
        </>
    );
};

// ─── Main AdminLeads ──────────────────────────────────────────────────────────

const AdminLeads = () => {
    const { allLeads: leadsData, loading: loadingLeads, updateStatus, assignLead } = useLeads();
    const { members: teamMembers, loading: loadingUsers } = useTeam();

    const [search, setSearch] = useState("");
    const [bdaSearch, setBdaSearch] = useState("");
    const [selectedBdas, setSelectedBdas] = useState<Set<string>>(new Set());
    const [activeId, setActiveId] = useState<string | null>(null);
    const [assigningLead, setAssigningLead] = useState<Lead | null>(null);
    const [viewingLead, setViewingLead] = useState<Lead | null>(null);
    const [addLeadOpen, setAddLeadOpen] = useState(false);

    // Drag-to-scroll for Team Workload pills
    const workloadRef = useRef<HTMLDivElement>(null);
    const isDraggingScroll = useRef(false);
    const dragStartX = useRef(0);
    const scrollStartX = useRef(0);
    const hasDragged = useRef(false);
    const pointerId = useRef<number | null>(null);

    const handleWorkloadPointerDown = useCallback((e: React.PointerEvent) => {
        // Only handle primary button (left click / touch)
        if (e.button !== 0) return;
        const el = workloadRef.current;
        if (!el) return;
        isDraggingScroll.current = true;
        hasDragged.current = false;
        dragStartX.current = e.clientX;
        scrollStartX.current = el.scrollLeft;
        pointerId.current = e.pointerId;
    }, []);

    const handleWorkloadPointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDraggingScroll.current || !workloadRef.current) return;
        const dx = e.clientX - dragStartX.current;
        if (!hasDragged.current && Math.abs(dx) > 3) {
            hasDragged.current = true;
            // Start capturing only once actual drag is detected
            const el = workloadRef.current;
            if (el && pointerId.current !== null) {
                el.setPointerCapture(pointerId.current);
                el.style.cursor = "grabbing";
                el.style.userSelect = "none";
            }
        }
        if (hasDragged.current) {
            workloadRef.current.scrollLeft = scrollStartX.current - dx;
        }
    }, []);

    const handleWorkloadPointerUp = useCallback((e: React.PointerEvent) => {
        if (!isDraggingScroll.current) return;
        isDraggingScroll.current = false;
        const el = workloadRef.current;
        if (el && hasDragged.current) {
            try { el.releasePointerCapture(e.pointerId); } catch { /* already released */ }
            el.style.cursor = "grab";
            el.style.userSelect = "";
        }
        pointerId.current = null;
    }, []);

    // Mouse wheel → horizontal scroll (like VS Code tab bar)
    const handleWorkloadWheel = useCallback((e: React.WheelEvent) => {
        const el = workloadRef.current;
        if (!el) return;
        // If there's meaningful vertical delta, convert it to horizontal scroll
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            el.scrollLeft += e.deltaY;
        }
    }, []);

    // Listen for global "open-add-lead-modal" event (from QuickActions / GlobalSearch)
    useEffect(() => {
        // Check for pending action stored before navigation
        const pending = sessionStorage.getItem("dialflow_pending_action");
        if (pending === "open-add-lead-modal") {
            sessionStorage.removeItem("dialflow_pending_action");
            setAddLeadOpen(true);
        }

        const handler = () => setAddLeadOpen(true);
        window.addEventListener("open-add-lead-modal", handler);
        return () => window.removeEventListener("open-add-lead-modal", handler);
    }, []);

    // Map DB leads to component Lead interface
    const leads = useMemo(() => leadsData.map(l => {
        const member = teamMembers.find(m => m.id === l.assigned_to);
        return {
            ...l,
            assignedTo: member?.name || null,
            assignedToColor: member ? getAvatarClasses(member.avatarColor, member.id) : null,
            assignedToInitials: member ? getInitials(member.name || "U") : null,
        };
    }) as Lead[], [leadsData, teamMembers]);

    // Open detail popup when navigated from GlobalSearch
    // Handles both cross-page (sessionStorage on data load) and same-page (custom event)
    const openPendingLeadDetail = useCallback((targetId: string) => {
        if (!targetId || leads.length === 0) return;
        const found = leads.find(l => l.id === targetId);
        if (found) {
            sessionStorage.removeItem("dialflow_pending_action");
            sessionStorage.removeItem("dialflow_pending_detail_id");
            setViewingLead(found);
        }
    }, [leads]);

    // Cross-page: check sessionStorage when leads become available
    useEffect(() => {
        const pending = sessionStorage.getItem("dialflow_pending_action");
        if (pending === "open-lead-detail" && leads.length > 0) {
            const targetId = sessionStorage.getItem("dialflow_pending_detail_id");
            if (targetId) openPendingLeadDetail(targetId);
        }
    }, [leads, openPendingLeadDetail]);

    // Same-page: listen for custom event from GlobalSearch
    useEffect(() => {
        const handler = (e: Event) => {
            const { type, id } = (e as CustomEvent).detail || {};
            if (type === "leads" && id) openPendingLeadDetail(id);
        };
        window.addEventListener("dialflow-open-detail", handler);
        return () => window.removeEventListener("dialflow-open-detail", handler);
    }, [openPendingLeadDetail]);

    const bdas = useMemo(() => teamMembers.map(m => ({
        id: m.id,
        name: m.name || "Unknown",
        initials: getInitials(m.name || "U"),
        status: (m.isActive ? "active" : "offline") as "active" | "idle" | "offline",
        avatarColor: getAvatarClasses(m.avatarColor, m.id)
    })) as BDA[], [teamMembers]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleAssign = useCallback((leadId: string, userId: string | null) => {
        const lead = leads.find(l => l.id === leadId);
        const bda = bdas.find(b => b.id === userId);
        assignLead(
            { leadId, userId },
            {
                onSuccess: () => toast.success(
                    userId
                        ? `"${lead?.name || 'Lead'}" assigned to ${bda?.name || 'member'}`
                        : `"${lead?.name || 'Lead'}" unassigned`
                ),
                onError: (err: any) => toast.error(err?.message || `Failed to assign "${lead?.name || 'lead'}"`),
            },
        );
    }, [assignLead, leads, bdas]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const leadId = active.id as string;
        const targetId = over.id as string;
        const draggedLead = leads.find(l => l.id === leadId);
        if (!draggedLead) return;

        // Determine new status: dropped on a column directly?
        const targetCol = columns.find(c => c.id === targetId);
        const newStatus: DbLeadStatus | undefined = targetCol
            ? targetCol.id
            : leads.find(l => l.id === targetId)?.status;

        if (!newStatus || newStatus === draggedLead.status) return;

        const statusLabel = columns.find(c => c.id === newStatus)?.label || newStatus;

        updateStatus(
            { leadId, status: newStatus },
            {
                onSuccess: () => toast.success(`"${draggedLead.name}" moved to ${statusLabel}`),
                onError: (err: any) => toast.error(err?.message || `Failed to move "${draggedLead.name}"`),
            },
        );
    }, [leads, updateStatus]);

    const filteredLeads = useMemo(() => {
        const q = search.toLowerCase();
        return leads.filter(l => {
            const matchesSearch = !q || l.name.toLowerCase().includes(q) || l.phone.includes(search);
            const matchesBda = selectedBdas.size === 0 || (l.assigned_to && selectedBdas.has(l.assigned_to)) || (selectedBdas.has("__unassigned__") && !l.assigned_to);
            return matchesSearch && matchesBda;
        });
    }, [leads, search, selectedBdas]);

    // Stats — memoised to avoid re-computation on unrelated state changes
    const { unassigned, avgLoad } = useMemo(() => {
        let unassignedCount = 0;
        let assignedCount = 0;
        for (const l of leads) {
            if (l.assigned_to === null) unassignedCount++;
            else assignedCount++;
        }
        return {
            totalLeads: leads.length,
            unassigned: unassignedCount,
            activeBdas: bdas.length,
            avgLoad: bdas.length > 0 ? Math.round(assignedCount / bdas.length) : 0,
        };
    }, [leads, bdas]);

    // BDA workload — pre-compute lead counts in one pass then sort
    const bdaWorkload = useMemo(() => {
        const countMap = new Map<string, number>();
        for (const l of leads) {
            if (l.assigned_to) countMap.set(l.assigned_to, (countMap.get(l.assigned_to) || 0) + 1);
        }
        return bdas.map(bda => ({
            ...bda,
            leadCount: countMap.get(bda.id) || 0,
        })).sort((a, b) => a.leadCount - b.leadCount);
    }, [bdas, leads]);

    const filteredBdaWorkload = useMemo(() => {
        if (!bdaSearch.trim()) return bdaWorkload;
        const q = bdaSearch.toLowerCase();
        return bdaWorkload.filter(bda => bda.name.toLowerCase().includes(q));
    }, [bdaWorkload, bdaSearch]);

    if (loadingLeads || loadingUsers) {
        return <AdminLeadsSkeleton />;
    }

    const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col h-full min-h-0">

                <div className="shrink-0">
                    {/* ── Compact header: title + search + add ── */}
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="min-w-0">
                                <h2 className="text-lg font-semibold text-foreground tracking-tight">Lead Management</h2>
                                <p className="text-xs text-foreground/40 mt-0.5">Drag leads between stages or assign to BDAs</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                            {/* Search */}
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/25 group-focus-within:text-foreground transition-colors pointer-events-none" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search leads…"
                                    className="h-9 w-48 lg:w-56 pl-9 pr-3 bg-card border border-border rounded-lg text-xs text-foreground placeholder:text-foreground/25 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/15 transition-all"
                                />
                            </div>
                            <button
                                onClick={() => setAddLeadOpen(true)}
                                className="h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition-all shrink-0"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Add Lead</span>
                            </button>
                        </div>
                    </div>

                    {/* ── Team Workload Strip ── */}
                    <div className="mb-4 min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-foreground/30 mb-2">Team Workload · click to filter</p>
                        <div className="flex items-center gap-2.5 min-w-0">
                                {/* BDA search — fixed, does not scroll */}
                                <div className="relative shrink-0 group">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/25 group-focus-within:text-foreground transition-colors pointer-events-none" />
                                    <input
                                        value={bdaSearch}
                                        onChange={(e) => setBdaSearch(e.target.value)}
                                        placeholder="Find member…"
                                        className={`h-9 w-28 sm:w-36 pl-8 ${bdaSearch ? "pr-7" : "pr-2.5"} bg-card border border-border rounded-xl text-[11px] text-foreground placeholder:text-foreground/25 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/15 transition-all`}
                                    />
                                    {bdaSearch && (
                                        <button
                                            onClick={() => setBdaSearch("")}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-foreground/10 hover:bg-foreground/20 flex items-center justify-center transition-colors"
                                        >
                                            <X className="h-2.5 w-2.5 text-foreground/50" />
                                        </button>
                                    )}
                                </div>

                                <div className="h-6 w-px bg-border shrink-0" />

                                {/* Scrollable pills area — drag or mouse-wheel to scroll */}
                                <div
                                    ref={workloadRef}
                                    onPointerDown={handleWorkloadPointerDown}
                                    onPointerMove={handleWorkloadPointerMove}
                                    onPointerUp={handleWorkloadPointerUp}
                                    onPointerCancel={handleWorkloadPointerUp}
                                    onWheel={handleWorkloadWheel}
                                    className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar cursor-grab flex-1 min-w-0"
                                    style={{ touchAction: "pan-y" }}
                                >
                                    {/* Unassigned pill — hidden when searching BDAs */}
                                    {!bdaSearch.trim() && (
                                        <>
                                            <button
                                                onClick={() => { if (hasDragged.current) return; setSelectedBdas(prev => { const next = new Set(prev); if (next.has("__unassigned__")) next.delete("__unassigned__"); else next.add("__unassigned__"); return next; }); }}
                                                className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                                                    selectedBdas.has("__unassigned__")
                                                        ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30 ring-1 ring-amber-300"
                                                        : "border-border bg-card hover:border-foreground/15"
                                                }`}
                                            >
                                                <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                                                    <AlertCircle className="h-3 w-3 text-amber-500" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[11px] font-semibold text-foreground leading-none">{unassigned}</p>
                                                    <p className="text-[9px] text-foreground/30 font-medium leading-tight mt-0.5">Unassigned</p>
                                                </div>
                                            </button>

                                            <div className="h-6 w-px bg-border shrink-0" />
                                        </>
                                    )}

                                    {/* BDA workload pills — sorted least loaded first */}
                                    {filteredBdaWorkload.map((bda) => {
                                    const isSelected = selectedBdas.has(bda.id);
                                    const loadLevel = bda.leadCount === 0 ? "free" : bda.leadCount <= avgLoad ? "normal" : "heavy";
                                    return (
                                        <button
                                            key={bda.id}
                                            onClick={() => { if (hasDragged.current) return; setSelectedBdas(prev => { const next = new Set(prev); if (next.has(bda.id)) next.delete(bda.id); else next.add(bda.id); return next; }); }}
                                            className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                                                isSelected
                                                    ? "border-foreground/25 bg-accent ring-1 ring-foreground/10"
                                                    : "border-border bg-card hover:border-foreground/15"
                                            }`}
                                        >
                                            <div className="relative">
                                                <div className={`h-6 w-6 rounded-full ${bda.avatarColor} flex items-center justify-center text-[8px] font-bold shrink-0`}>
                                                    {bda.initials}
                                                </div>
                                                <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-card ${
                                                    bda.status === "active" ? "bg-emerald-400" : bda.status === "idle" ? "bg-amber-400" : "bg-gray-300 dark:bg-gray-600"
                                                }`} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[11px] font-semibold text-foreground leading-none">
                                                    {bda.leadCount}
                                                    <span className={`ml-1 text-[9px] font-medium ${
                                                        loadLevel === "free" ? "text-emerald-500" : loadLevel === "heavy" ? "text-amber-500" : "text-foreground/30"
                                                    }`}>
                                                        {loadLevel === "free" ? "free" : loadLevel === "heavy" ? "heavy" : ""}
                                                    </span>
                                                </p>
                                                <p className="text-[9px] text-foreground/30 font-medium leading-tight mt-0.5 max-w-[72px] truncate">{bda.name.split(" ")[0]}</p>
                                            </div>
                                        </button>
                                    );
                                })}

                                    {/* No results message */}
                                    {bdaSearch.trim() && filteredBdaWorkload.length === 0 && (
                                        <p className="shrink-0 text-[11px] text-foreground/30 italic px-2">No match</p>
                                    )}
                                </div>

                                {/* Clear filter — fixed outside scroll area */}
                                {selectedBdas.size > 0 && (
                                    <button
                                        onClick={() => setSelectedBdas(new Set())}
                                        className="shrink-0 h-8 px-3 rounded-lg border border-border bg-card text-[11px] font-medium text-foreground/50 hover:text-foreground hover:border-foreground/15 transition-all flex items-center gap-1.5"
                                    >
                                        <X className="h-3 w-3" />
                                        Clear{selectedBdas.size > 1 ? ` (${selectedBdas.size})` : ""}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                {/* ── Kanban Board — Jira-style: fixed headers + single scroll ── */}
                <div className="flex-1 min-h-0 -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-auto pb-4 scroll-container">
                    <div style={{ minWidth: `${columns.length * 280}px` }}>
                        {/* ── Sticky Column Headers — pointer-events-none so they don't block drag ── */}
                        <div className="sticky top-0 z-20 pb-3 pointer-events-none">
                            <div className="absolute inset-x-0 -top-2 bottom-0 bg-background" />
                            <div className="relative flex gap-3 w-full">
                                {columns.map((col) => {
                                    const count = filteredLeads.filter((l) => l.status === col.id).length;
                                    return (
                                        <div key={col.id} className="flex-1 min-w-[260px]">
                                            <KanbanColumnHeader
                                                color={col.color}
                                                headerBg={col.headerBg}
                                                border={col.border}
                                                dot={col.dot}
                                                label={col.label}
                                                count={count}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Card Columns ── */}
                        <div className="flex gap-3 items-stretch" style={{ minHeight: '200px' }}>
                            {columns.map((col) => {
                                const colLeads = filteredLeads.filter((l) => l.status === col.id);
                                return (
                                    <div key={col.id} className="flex-1 min-w-[260px] flex flex-col">
                                        <KanbanColumn
                                            colId={col.id}
                                            dropBg={col.dropBg}
                                            leads={colLeads}
                                            onAssign={(lead) => setAssigningLead(lead)}
                                            onViewDetail={(lead) => setViewingLead(lead)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Drag Overlay — follows cursor, fades out on drop (no revert animation) */}
                <DragOverlay
                    dropAnimation={null}
                    style={{ cursor: "grabbing", zIndex: 50 }}
                >
                    {activeLead && (
                        <div className="w-[260px] animate-in fade-in zoom-in-95 duration-150">
                            <LeadCardContent lead={activeLead} isDragOverlay />
                        </div>
                    )}
                </DragOverlay>

                {/* Assign Sheet */}
                <AssignSheet
                    lead={assigningLead}
                    bdas={bdas}
                    onAssign={handleAssign}
                    onClose={() => setAssigningLead(null)}
                />

                {/* Add Lead Modal */}
                <AddLeadModal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} />

                {/* Lead Detail Popup */}
                <LeadDetailPopup lead={viewingLead} onClose={() => setViewingLead(null)} />

            </div>
        </DndContext>
    );
};

export default AdminLeads;
