import { useState, useCallback, useRef, useEffect, useMemo } from "react";
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
    Users,
    Phone,
    Clock,
    UserCheck,
    GripVertical,
    X,
    Check,
    Search,
    AlertCircle,
    TrendingUp,
    Plus,
    Filter,
} from "lucide-react";
import { useLeads, LeadStatus as DbLeadStatus } from "@/hooks/useLeads";
import { useTeam } from "@/hooks/useTeam";
import AddLeadModal from "./AddLeadModal";
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

const avatarColors = [
    "bg-violet-100 text-violet-600", "bg-blue-100 text-blue-600",
    "bg-emerald-100 text-emerald-600", "bg-orange-100 text-orange-600",
    "bg-pink-100 text-pink-600", "bg-cyan-100 text-cyan-600",
    "bg-lime-100 text-lime-600", "bg-fuchsia-100 text-fuchsia-600",
];
const getAvatarColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return avatarColors[Math.abs(hash) % avatarColors.length];
};
const getInitials = (n: string) => n.split(" ").map(w => w[0]).join("").toUpperCase();

// ─── Column Config ────────────────────────────────────────────────────────────

const columns: { id: DbLeadStatus; label: string; color: string; bg: string; border: string; dot: string }[] = [
    { id: "new", label: "New", color: "text-[#1f1f1f]", bg: "bg-white", border: "border-black/[0.06]", dot: "bg-[#1f1f1f]" },
    { id: "contacted", label: "Contacted", color: "text-blue-600", bg: "bg-blue-50/60", border: "border-blue-200/60", dot: "bg-blue-500" },
    { id: "interested", label: "Interested", color: "text-emerald-600", bg: "bg-emerald-50/60", border: "border-emerald-200/60", dot: "bg-emerald-500" },
    { id: "closed", label: "Closed", color: "text-purple-600", bg: "bg-purple-50/60", border: "border-purple-200/60", dot: "bg-purple-500" },
];

const statusBDACfg: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
    idle: "bg-amber-50 text-amber-600 border-amber-200/60",
    offline: "bg-gray-100 text-[#1f1f1f]/40 border-black/[0.06]",
};

// ─── Lead Card Content (pure presentational) ─────────────────────────────────

const LeadCardContent = ({ lead, onAssign, isDragOverlay = false }: { lead: Lead; onAssign?: (lead: Lead) => void; isDragOverlay?: boolean }) => (
    <div className={`surface-card p-4 select-none group hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] ${
        isDragOverlay ? "shadow-xl ring-2 ring-[#1f1f1f]/20 rotate-1 scale-105" : ""
    }`}>
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-xs font-semibold text-[#1f1f1f] truncate tracking-tight">{lead.name}</p>
                {lead.value && <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 shrink-0">{lead.value}</span>}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-[#1f1f1f]/40 font-medium">
                <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {lead.phone}
                </div>
            </div>

            {lead.assignedTo && (
                <div className="mt-3 flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#f6f7ed] border border-black/[0.04]">
                    <div className="h-5 w-5 rounded-full bg-[#1f1f1f] flex items-center justify-center text-[7px] font-bold text-white">
                        {lead.assignedTo.split(" ").map(n => n[0]).join("")}
                    </div>
                    <span className="text-[10px] font-medium text-[#1f1f1f]/70 truncate">{lead.assignedTo}</span>
                </div>
            )}

            <div className="flex items-center justify-between mt-4">
                <span className="text-[10px] text-[#1f1f1f]/25 font-medium flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {timeAgo(lead.created_at)}
                </span>
                {onAssign && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onAssign(lead); }}
                        className="flex items-center gap-1.5 text-[10px] font-semibold text-[#1f1f1f]/50 hover:text-[#1f1f1f] transition-all"
                    >
                        <UserCheck className="h-3 w-3" />
                        {lead.assignedTo ? "Reassign" : "Assign"}
                    </button>
                )}
            </div>
        </div>
    </div>
);

// ─── Draggable Lead Card ──────────────────────────────────────────────────────

const DraggableLead = ({ lead, onAssign }: { lead: Lead; onAssign: (lead: Lead) => void }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
                opacity: isDragging ? 0.3 : 1,
                transition: isDragging ? undefined : "opacity 200ms ease",
            }}
        >
            <div className="cursor-grab active:cursor-grabbing">
                <div className="flex items-start gap-3">
                    {/* Drag handle */}
                    <button
                        {...attributes}
                        {...listeners}
                        className="mt-5 text-[#1f1f1f]/15 hover:text-[#1f1f1f]/40 transition-colors cursor-grab active:cursor-grabbing touch-none shrink-0"
                    >
                        <GripVertical className="h-4 w-4" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <LeadCardContent lead={lead} onAssign={onAssign} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Kanban Column (droppable) ────────────────────────────────────────────────

interface KanbanColumnProps {
    colId: DbLeadStatus;
    label: string;
    color: string;
    bg: string;
    border: string;
    dot: string;
    leads: Lead[];
    onAssign: (lead: Lead) => void;
}

const KanbanColumn = ({ colId, label, color, bg, border, dot, leads, onAssign }: KanbanColumnProps) => {
    const { setNodeRef, isOver } = useDroppable({ id: colId });

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col rounded-xl border transition-all duration-200 min-h-0 h-full ${bg} ${border} ${isOver ? "ring-2 ring-[#1f1f1f]/20 border-[#1f1f1f]/20 shadow-md" : ""}`}
            style={{ minWidth: "240px" }}
        >
            {/* Column Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-black/[0.06] shrink-0">
                <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${dot}`} />
                    <span className={`text-xs font-semibold ${color}`}>{label}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/[0.04] ${color}`}>
                    {leads.length}
                </span>
            </div>

            {/* Leads */}
            <div className="flex flex-col gap-2 p-2 flex-1 overflow-y-auto overflow-x-hidden min-h-0 scroll-container">
                {leads.length === 0 && (
                    <div className={`flex flex-col items-center justify-center py-8 text-center rounded-lg border-2 border-dashed transition-colors ${isOver ? "border-[#1f1f1f]/30 bg-[#f6f7ed]/50" : "border-black/[0.06]"}`}>
                        <p className="text-[11px] text-[#1f1f1f]/30">Drop leads here</p>
                    </div>
                )}
                {leads.map((lead) => (
                    <DraggableLead key={lead.id} lead={lead} onAssign={onAssign} />
                ))}
            </div>
        </div>
    );
};

// ─── BDA Assign Sheet ─────────────────────────────────────────────────────────

interface AssignSheetProps {
    lead: Lead | null;
    bdas: BDA[];
    onAssign: (leadId: string, bdaId: string | null) => void;
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
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm rounded-2xl bg-white border border-black/[0.06] p-5 shadow-xl"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-sm font-semibold text-[#1f1f1f]">Assign Lead</p>
                                <p className="text-xs text-[#1f1f1f]/40 mt-0.5">{lead.name} · {lead.phone}</p>
                            </div>
                            <button onClick={onClose} className="h-7 w-7 rounded-lg bg-[#f4f4f4] flex items-center justify-center text-[#1f1f1f]/40 hover:text-[#1f1f1f] transition-colors">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#1f1f1f]/25 pointer-events-none" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search BDA..."
                                className="w-full h-9 pl-9 pr-3 bg-[#f4f4f4] border border-black/[0.06] rounded-lg text-xs text-[#1f1f1f] placeholder:text-[#1f1f1f]/25 focus:outline-none focus:ring-2 focus:ring-[#1f1f1f]/10 transition-all"
                                autoFocus
                            />
                        </div>

                        {/* BDA List */}
                        <div className="space-y-1.5 max-h-64 overflow-y-auto scroll-container">
                            {filtered.map((bda) => (
                                <button
                                    key={bda.id}
                                    onClick={() => { onAssign(lead.id, bda.id); onClose(); }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left group hover:border-[#1f1f1f]/15 hover:bg-[#f6f7ed]/50 ${lead.assigned_to === bda.id ? "border-[#1f1f1f]/20 bg-[#f6f7ed]" : "border-black/[0.04] bg-white"}`}
                                >
                                    <div className={`h-8 w-8 rounded-full ${bda.avatarColor} flex items-center justify-center text-[10px] font-bold shrink-0`}>
                                        {bda.initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-[#1f1f1f]">{bda.name}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${statusBDACfg[bda.status]}`}>
                                            {bda.status}
                                        </span>
                                        {lead.assigned_to === bda.id && <Check className="h-3.5 w-3.5 text-[#1f1f1f]" />}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Unassign option */}
                        {lead.assigned_to && (
                            <button
                                onClick={() => { onAssign(lead.id, null); onClose(); }}
                                className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-xs text-[#1f1f1f]/40 hover:text-red-500 transition-colors border border-dashed border-black/[0.06] rounded-xl hover:border-red-300"
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
    const [selectedBdas, setSelectedBdas] = useState<string[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [assigningLead, setAssigningLead] = useState<Lead | null>(null);
    const [filterOpen, setFilterOpen] = useState(false);
    const [filterSearch, setFilterSearch] = useState("");
    const [addLeadOpen, setAddLeadOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<"all" | DbLeadStatus>("all");
    const filterRef = useRef<HTMLDivElement>(null);

    // Listen for global "open-add-lead-modal" event (from GlobalSearch)
    useEffect(() => {
        const handler = () => setAddLeadOpen(true);
        window.addEventListener("open-add-lead-modal", handler);
        return () => window.removeEventListener("open-add-lead-modal", handler);
    }, []);

    // Map DB leads to component Lead interface
    const leads = useMemo(() => leadsData.map(l => ({
        ...l,
        assignedTo: teamMembers.find(m => m.id === l.assigned_to)?.name || null
    })) as Lead[], [leadsData, teamMembers]);

    const bdas = useMemo(() => teamMembers.map(m => ({
        id: m.id,
        name: m.name || "Unknown BDA",
        initials: getInitials(m.name || "U"),
        status: m.status || ("active" as const),
        avatarColor: getAvatarColor(m.id)
    })) as BDA[], [teamMembers]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
                setFilterOpen(false);
                setFilterSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleAssign = useCallback((leadId: string, bdaId: string | null) => {
        assignLead(
            { leadId, bdaId },
            {
                onSuccess: () => toast.success(bdaId ? "Lead assigned" : "Assignment removed"),
                onError: (err: any) => toast.error(err?.message || "Failed to assign lead"),
            },
        );
    }, [assignLead]);

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

        updateStatus(
            { leadId, status: newStatus },
            {
                onSuccess: () => toast.success(`Moved to ${newStatus}`),
                onError: (err: any) => toast.error(err?.message || "Failed to update status"),
            },
        );
    }, [leads, updateStatus]);

    const filteredLeads = leads.filter(l => {
        const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search);
        const matchesBda = selectedBdas.length === 0 || (l.assigned_to && selectedBdas.includes(l.assigned_to));
        const matchesStatus = filterStatus === "all" || l.status === filterStatus;
        return matchesSearch && matchesBda && matchesStatus;
    });

    if (loadingLeads || loadingUsers) {
        return <div className="p-12 text-center text-[#1f1f1f]/40">Loading leads...</div>;
    }

    const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

    // Stats
    const totalLeads = leads.length;
    const unassigned = leads.filter((l) => l.assigned_to === null).length;
    const closed = leads.filter((l) => l.status === "closed").length;
    const interested = leads.filter((l) => l.status === "interested").length;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col h-full min-h-0">

                <div className="shrink-0">
                    <div className="mb-6">
                        {/* Page Title */}
                        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-[#1f1f1f] tracking-tight">Lead Management</h2>
                                <p className="text-sm text-[#1f1f1f]/40 mt-1">Drag leads across columns or assign to BDAs</p>
                            </div>
                            <button
                                onClick={() => setAddLeadOpen(true)}
                                className="h-10 px-4 rounded-xl bg-[#1f1f1f] text-white text-xs font-semibold flex items-center gap-2 hover:bg-[#1f1f1f]/90 transition-all shrink-0"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">Add Lead</span>
                            </button>
                        </div>

                        {/* Quick Stats Strip */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {[
                                { label: "Total Leads", value: totalLeads, icon: Users, color: "text-[#1f1f1f]", bg: "bg-[#f6f7ed]" },
                                { label: "Unassigned", value: unassigned, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
                                { label: "Interested", value: interested, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
                                { label: "Closed", value: closed, icon: Check, color: "text-purple-600", bg: "bg-purple-50" },
                            ].map((stat) => (
                                <div
                                    key={stat.label}
                                    className="surface-card p-4 flex items-center gap-4"
                                >
                                    <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-semibold tracking-tight leading-none mb-1 text-[#1f1f1f]">{stat.value}</p>
                                        <p className="text-[10px] text-[#1f1f1f]/30 font-medium uppercase tracking-wider leading-tight">{stat.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ── Search + Filter Bar ────────────────────────────────── */}
                        <div className="flex items-center gap-3 flex-wrap mb-5">
                            {/* Search */}
                            <div className="relative group flex-1 min-w-[200px] max-w-xs">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1f1f1f]/25 group-focus-within:text-[#1f1f1f] transition-colors pointer-events-none" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by name, phone…"
                                    className="h-10 w-full pl-10 pr-4 bg-white border border-black/[0.06] rounded-xl text-xs text-[#1f1f1f] placeholder:text-[#1f1f1f]/25 focus:outline-none focus:ring-2 focus:ring-[#1f1f1f]/10 focus:border-[#1f1f1f]/15 transition-all"
                                />
                            </div>

                            {/* Status filter pills */}
                            <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                                <Filter className="h-3.5 w-3.5 text-[#1f1f1f]/25 shrink-0" />
                                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                                {(["all", "new", "contacted", "interested", "closed"] as ("all" | DbLeadStatus)[]).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setFilterStatus(s)}
                                        className={`h-8 px-3 rounded-lg text-[11px] font-semibold capitalize border transition-all whitespace-nowrap shrink-0 ${
                                            filterStatus === s
                                                ? "bg-[#1f1f1f] text-white border-[#1f1f1f]"
                                                : "bg-white text-[#1f1f1f]/45 border-black/[0.06] hover:border-[#1f1f1f]/15 hover:text-[#1f1f1f]"
                                        }`}
                                    >
                                        {s === "all" ? `All (${totalLeads})` : `${s} (${leads.filter(l => l.status === s).length})`}
                                    </button>
                                ))}
                                </div>
                            </div>
                        </div>

                        {/* ── Assignee Filter ───────── */}
                        <div className="flex items-center gap-3 mb-5" ref={filterRef}>
                            <span className="text-[11px] font-medium text-[#1f1f1f]/40 shrink-0 select-none">Assignee</span>

                            <div className="flex items-center -space-x-1">
                                {bdas.slice(0, 6).map((bda) => {
                                    const isActive = selectedBdas.includes(bda.id);
                                    const count = leads.filter(l => l.assigned_to === bda.id).length;
                                    return (
                                        <button
                                            key={bda.id}
                                            title={`${bda.name} · ${count} lead${count !== 1 ? "s" : ""}`}
                                            onClick={() => setSelectedBdas(prev => isActive ? prev.filter(id => id !== bda.id) : [...prev, bda.id])}
                                            className={`relative h-7 w-7 rounded-full ${bda.avatarColor} flex items-center justify-center text-[9px] font-bold transition-all duration-150 focus:outline-none ${isActive
                                                ? "ring-2 ring-[#1f1f1f] ring-offset-2 ring-offset-[#f4f4f4] scale-110 z-10"
                                                : "opacity-70 hover:opacity-100 hover:scale-110 hover:z-10 ring-2 ring-white"
                                                }`}
                                        >
                                            {bda.initials}
                                            <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white ${bda.status === "active" ? "bg-emerald-400" : bda.status === "idle" ? "bg-amber-400" : "bg-gray-300"
                                                }`} />
                                        </button>
                                    );
                                })}

                                {bdas.length > 6 && (() => {
                                    const overflow = bdas.slice(6);
                                    const overflowActive = overflow.some(b => selectedBdas.includes(b.id));
                                    return (
                                        <div className="relative ml-1">
                                            <button
                                                onClick={() => setFilterOpen(v => !v)}
                                                className={`h-7 px-2 rounded-full text-[10px] font-semibold transition-all ring-2 ring-white ${overflowActive
                                                    ? "bg-[#1f1f1f] text-white ring-[#1f1f1f] scale-105"
                                                    : "bg-[#f4f4f4] text-[#1f1f1f]/50 hover:bg-[#f6f7ed] hover:text-[#1f1f1f]"
                                                    }`}
                                            >
                                                +{overflow.length}
                                            </button>
                                            {filterOpen && (() => {
                                                const filteredOverflow = overflow.filter(b =>
                                                    b.name.toLowerCase().includes(filterSearch.toLowerCase())
                                                );
                                                return (
                                                    <div
                                                        className="absolute left-0 top-full mt-2 z-50 w-56 bg-white border border-black/[0.06] rounded-xl shadow-lg overflow-hidden"
                                                    >
                                                        {/* Search */}
                                                        <div className="p-2 border-b border-black/[0.06]">
                                                            <div className="relative">
                                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[#1f1f1f]/25 pointer-events-none" />
                                                                <input
                                                                    value={filterSearch}
                                                                    onChange={(e) => setFilterSearch(e.target.value)}
                                                                    placeholder="Search BDA…"
                                                                    className="w-full h-7 pl-7 pr-2 bg-[#f4f4f4] border border-black/[0.06] rounded-lg text-[11px] text-[#1f1f1f] placeholder:text-[#1f1f1f]/25 focus:outline-none focus:ring-1 focus:ring-[#1f1f1f]/10 transition-all"
                                                                    autoFocus
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                            </div>
                                                        </div>
                                                        {/* List */}
                                                        <div className="p-1 max-h-64 overflow-y-auto scroll-container">
                                                            {filteredOverflow.length === 0 && (
                                                                <p className="text-[11px] text-[#1f1f1f]/30 text-center py-4">No results</p>
                                                            )}
                                                            {filteredOverflow.map(bda => {
                                                                const isActive = selectedBdas.includes(bda.id);
                                                                const count = leads.filter(l => l.assigned_to === bda.id).length;
                                                                return (
                                                                    <button
                                                                        key={bda.id}
                                                                        onClick={() => { setSelectedBdas(prev => isActive ? prev.filter(id => id !== bda.id) : [...prev, bda.id]); }}
                                                                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors ${isActive ? "bg-[#f6f7ed] text-[#1f1f1f]" : "text-[#1f1f1f] hover:bg-[#f4f4f4]"
                                                                            }`}
                                                                    >
                                                                        <div className={`h-6 w-6 rounded-full ${bda.avatarColor} flex items-center justify-center text-[8px] font-bold shrink-0`}>
                                                                            {bda.initials}
                                                                        </div>
                                                                        <span className="flex-1 text-left font-medium truncate">{bda.name}</span>
                                                                        <span className="text-[10px] text-[#1f1f1f]/30">{count}</span>
                                                                        {isActive && <Check className="h-3 w-3 text-[#1f1f1f]" />}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    );
                                })()}
                            </div>

                            {selectedBdas.length > 0 && (
                                <>
                                    <span className="text-black/[0.06] select-none">|</span>
                                    <button
                                        onClick={() => setSelectedBdas([])}
                                        className="flex items-center gap-1.5 h-6 pl-2 pr-1.5 rounded-full bg-[#f6f7ed] text-[#1f1f1f] border border-black/[0.06] text-[11px] font-medium hover:bg-[#1f1f1f] hover:text-white transition-colors"
                                    >
                                        <span className="mr-1">{selectedBdas.length} selected</span>
                                        <X className="h-2.5 w-2.5 opacity-60" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div> {/* end shrink-0 header */}

                {/* ── Scrollable Kanban Board (flex-1, h-full) ─────────────── */}
                <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden pb-4">
                    <div className="flex gap-3 h-full" style={{ minWidth: `${columns.length * 280}px` }}>
                        {columns.map((col) => {
                            const colLeads = filteredLeads.filter((l) => l.status === col.id);
                            return (
                                <div key={col.id} className="flex flex-col flex-1 min-w-[260px] min-h-0">
                                    <KanbanColumn
                                        colId={col.id}
                                        label={col.label}
                                        color={col.color}
                                        bg={col.bg}
                                        border={col.border}
                                        dot={col.dot}
                                        leads={colLeads}
                                        onAssign={(lead) => setAssigningLead(lead)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div> {/* end board */}

            </div> {/* end h-full flex-col */}

            {/* Drag Overlay */}
            <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
                {activeLead && <LeadCardContent lead={activeLead} isDragOverlay />}
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
        </DndContext >
    );
};

export default AdminLeads;
