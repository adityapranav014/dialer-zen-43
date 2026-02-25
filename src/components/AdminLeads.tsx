import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragOverlay,
    closestCorners,
} from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Phone,
    Clock,
    UserCheck,
    GripVertical,
    ChevronRight,
    X,
    Check,
    Search,
    AlertCircle,
    TrendingUp,
    MessageSquare,
    MoreHorizontal,
} from "lucide-react";
import { useLeads, LeadStatus as DbLeadStatus } from "@/hooks/useLeads";
import { useUsers } from "@/hooks/useUsers";

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadStatus = "unassigned" | DbLeadStatus;

interface Lead {
    id: string;
    name: string;
    phone: string;
    status: LeadStatus;
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
    "from-violet-500 to-purple-600", "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600", "from-orange-500 to-amber-600",
    "from-pink-500 to-rose-600", "from-cyan-500 to-blue-600",
    "from-lime-500 to-green-600", "from-fuchsia-500 to-pink-600",
];
const getAvatarColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return avatarColors[Math.abs(hash) % avatarColors.length];
};
const getInitials = (n: string) => n.split(" ").map(w => w[0]).join("").toUpperCase();

// ─── Column Config ────────────────────────────────────────────────────────────

const columns: { id: LeadStatus; label: string; color: string; bg: string; border: string; dot: string }[] = [
    { id: "unassigned", label: "Unassigned", color: "text-muted-foreground", bg: "bg-muted/30", border: "border-border/40", dot: "bg-muted-foreground" },
    { id: "new", label: "New", color: "text-primary", bg: "bg-primary/8", border: "border-primary/20", dot: "bg-primary" },
    { id: "contacted", label: "Contacted", color: "text-blue-400", bg: "bg-blue-500/8", border: "border-blue-500/20", dot: "bg-blue-400" },
    { id: "interested", label: "Interested", color: "text-success", bg: "bg-success/8", border: "border-success/20", dot: "bg-success" },
    { id: "closed", label: "Closed", color: "text-purple-400", bg: "bg-purple-500/8", border: "border-purple-500/20", dot: "bg-purple-400" },
];

const statusBDACfg: Record<string, string> = {
    active: "bg-success/15 text-success border-success/25",
    idle: "bg-warning/15 text-warning border-warning/25",
    offline: "bg-muted/60 text-muted-foreground border-border",
};

// ─── Sortable Lead Card ───────────────────────────────────────────────────────

interface SortableLeadProps {
    lead: Lead;
    isDraggingOverlay?: boolean;
    onAssign: (lead: Lead) => void;
}

const SortableLead = ({ lead, isDraggingOverlay = false, onAssign }: SortableLeadProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
    };

    const initials = lead.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

    return (
        <div ref={setNodeRef} style={style}>
            <div
                className={`bento-card p-4 cursor-grab active:cursor-grabbing select-none group border-border/40 hover:border-primary/40 ${isDraggingOverlay ? "shadow-2xl ring-2 ring-primary/40 rotate-1 scale-105 bg-card/90" : ""}`}
            >
                <div className="flex items-start gap-4">
                    {/* Drag handle */}
                    <button
                        {...attributes}
                        {...listeners}
                        className="mt-1 text-muted-foreground/30 hover:text-primary transition-colors cursor-grab active:cursor-grabbing touch-none shrink-0"
                    >
                        <GripVertical className="h-4 w-4" />
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                            <p className="text-xs font-bold text-foreground truncate tracking-tight">{lead.name}</p>
                            {lead.value && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0 tracking-tighter">{lead.value}</span>}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium">
                            <div className="flex items-center gap-1 opacity-70">
                                <Phone className="h-3 w-3" />
                                {lead.phone}
                            </div>
                        </div>

                        {lead.assignedTo && (
                            <div className="mt-3 flex items-center gap-2 px-2 py-1.5 rounded-lg bg-secondary/50 border border-border/40">
                                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[7px] font-bold text-primary">
                                    {lead.assignedTo.split(" ").map(n => n[0]).join("")}
                                </div>
                                <span className="text-[10px] font-bold text-foreground/80 tracking-tight truncate">{lead.assignedTo}</span>
                            </div>
                        )}

                        <div className="flex items-center justify-between mt-4">
                            <span className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                <Clock className="h-3 w-3" />
                                {timeAgo(lead.created_at)}
                            </span>
                            <button
                                onClick={() => onAssign(lead)}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:text-primary/80 transition-all uppercase tracking-widest"
                            >
                                <UserCheck className="h-3 w-3" />
                                {lead.assignedTo ? "Reassign" : "Assign"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Kanban Column ────────────────────────────────────────────────────────────

interface KanbanColumnProps {
    colId: LeadStatus;
    label: string;
    color: string;
    bg: string;
    border: string;
    dot: string;
    leads: Lead[];
    onAssign: (lead: Lead) => void;
    isOver: boolean;
}

const KanbanColumn = ({ colId, label, color, bg, border, dot, leads, onAssign, isOver }: KanbanColumnProps) => {
    return (
        <div
            className={`flex flex-col rounded-xl border transition-all duration-200 min-h-0 h-full ${bg} ${border} ${isOver ? "ring-2 ring-primary/50 border-primary/40 shadow-lg shadow-primary/10" : ""}`}
            style={{ minWidth: "240px" }}
        >
            {/* Column Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/40 shrink-0">
                <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${dot}`} />
                    <span className={`text-xs font-bold ${color}`}>{label}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color} bg-current/10`} style={{ backgroundColor: "currentColor", opacity: 1 }}>
                    <span className="relative" style={{ color: "inherit" }}>{leads.length}</span>
                </span>
            </div>

            {/* Leads */}
            <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2 p-2 flex-1 overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar">
                    {leads.length === 0 && (
                        <div className={`flex flex-col items-center justify-center py-8 text-center rounded-lg border-2 border-dashed transition-colors ${isOver ? "border-primary/50 bg-primary/5" : "border-border/30"}`}>
                            <p className="text-[11px] text-muted-foreground/50">Drop leads here</p>
                        </div>
                    )}
                    {leads.map((lead) => (
                        <SortableLead key={lead.id} lead={lead} onAssign={onAssign} />
                    ))}
                </div>
            </SortableContext>
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
        <AnimatePresence>
            {lead && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />
                    {/* Sheet */}
                    <motion.div
                        initial={{ opacity: 0, y: "100%", x: "-50%" }}
                        animate={{ opacity: 1, y: "-50%", x: "-50%" }}
                        exit={{ opacity: 0, y: "100%", x: "-50%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed top-1/2 left-1/2 z-50 w-full max-w-sm rounded-2xl glass-heavy border border-border/80 p-5 shadow-2xl"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-sm font-bold text-foreground">Assign Lead</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{lead.name} · {lead.phone}</p>
                            </div>
                            <button onClick={onClose} className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search BDA..."
                                className="w-full h-9 pl-9 pr-3 glass rounded-lg text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                                autoFocus
                            />
                        </div>

                        {/* BDA List */}
                        <div className="space-y-1.5 max-h-64 overflow-y-auto no-scrollbar">
                            {filtered.map((bda) => (
                                <button
                                    key={bda.id}
                                    onClick={() => { onAssign(lead.id, bda.id); onClose(); }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left group hover:border-primary/40 hover:bg-primary/8 ${lead.assigned_to === bda.id ? "border-primary/50 bg-primary/10" : "border-border/40 bg-muted/20"}`}
                                >
                                    <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${bda.avatarColor} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                                        {bda.initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-foreground">{bda.name}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${statusBDACfg[bda.status]}`}>
                                            {bda.status}
                                        </span>
                                        {lead.assigned_to === bda.id && <Check className="h-3.5 w-3.5 text-primary" />}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Unassign option */}
                        {lead.assigned_to && (
                            <button
                                onClick={() => { onAssign(lead.id, null); onClose(); }}
                                className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground hover:text-destructive transition-colors border border-dashed border-border/40 rounded-xl hover:border-destructive/40"
                            >
                                <AlertCircle className="h-3 w-3" />
                                Remove assignment
                            </button>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// ─── Main AdminLeads ──────────────────────────────────────────────────────────

const AdminLeads = () => {
    const { allLeads: leadsData, loading: loadingLeads, updateStatus, assignLead } = useLeads();
    const { bdas: bdasData, loading: loadingUsers } = useUsers();

    const [search, setSearch] = useState("");
    const [selectedBdas, setSelectedBdas] = useState<string[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);
    const [assigningLead, setAssigningLead] = useState<Lead | null>(null);
    const [filterOpen, setFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    // Map DB leads to component Lead interface
    const leads = useMemo(() => leadsData.map(l => ({
        ...l,
        assignedTo: bdasData.find(b => b.user_id === l.assigned_to)?.display_name || null
    })) as Lead[], [leadsData, bdasData]);

    const bdas = useMemo(() => bdasData.map(b => ({
        id: b.user_id,
        name: b.display_name || "Unknown BDA",
        initials: getInitials(b.display_name || "U"),
        status: "active" as const, // Mocked for now
        avatarColor: getAvatarColor(b.user_id)
    })) as BDA[], [bdasData]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
                setFilterOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));

    const getColumnForLead = useCallback((leadId: string): LeadStatus | null => {
        const lead = leads.find((l) => l.id === leadId);
        return lead ? lead.status : null;
    }, [leads]);

    const getColumnForId = useCallback((id: string): LeadStatus | null => {
        if (columns.find((c) => c.id === id)) return id as LeadStatus;
        return getColumnForLead(id);
    }, [getColumnForLead]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        setOverId(event.over?.id as string ?? null);
    };

    const handleAssign = (leadId: string, bdaId: string | null) => {
        assignLead({ leadId, bdaId });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setOverId(null);
        if (!over) return;

        const leadId = active.id as string;
        const overId = over.id as string;

        // If dropped on a column
        if (columns.map(c => c.id).includes(overId as LeadStatus)) {
            updateStatus({ leadId, status: overId as DbLeadStatus });
            return;
        }

        // If dropped on another lead, get that lead's column
        const overLead = leads.find(l => l.id === overId);
        if (overLead) {
            updateStatus({ leadId, status: overLead.status as DbLeadStatus });
        }
    };

    const filteredLeads = leads.filter(l => {
        const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search);
        const matchesBda = selectedBdas.length === 0 || (l.assigned_to && selectedBdas.includes(l.assigned_to));
        return matchesSearch && matchesBda;
    });

    if (loadingLeads || loadingUsers) {
        return <div className="p-12 text-center text-muted-foreground">Loading leads...</div>;
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
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            {/* ── Viewport-filling flex column ──────────────────────────── */}
            <div className="flex flex-col h-full min-h-0">

                {/* ── Sticky Header (shrink-0 — never scrolls) ─────────────── */}
                <div className="shrink-0">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                    >
                        {/* Page Title */}
                        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                            <div>
                                <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Lead Management</h2>
                                <p className="text-sm text-muted-foreground mt-1 font-medium">Drag leads across columns or assign to BDAs</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative group">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search leads…"
                                        className="h-10 pl-10 pr-4 glass-heavy rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 border border-border/40 transition-all w-48 sm:w-64"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Strip */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {[
                                { label: "Total Leads", value: totalLeads, icon: Users, color: "text-primary", bg: "bg-primary/5", border: "border-primary/20 text-primary" },
                                { label: "Unassigned", value: unassigned, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/5", border: "border-amber-500/20 text-amber-500" },
                                { label: "Interested", value: interested, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/5", border: "border-emerald-500/20 text-emerald-500" },
                                { label: "Closed", value: closed, icon: Check, color: "text-indigo-400", bg: "bg-indigo-500/5", border: "border-indigo-500/20 text-indigo-400" },
                            ].map((stat, i) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bento-card p-4 flex items-center gap-4 border border-border/40"
                                >
                                    <div className={`h-10 w-10 rounded-xl ${stat.bg} ${stat.border} flex items-center justify-center border shrink-0`}>
                                        <stat.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-extrabold tracking-tight leading-none mb-1">{stat.value}</p>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60 leading-tight">{stat.label}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* ── Assignee Filter — exact Jira board pattern ───────── */}
                        <div className="flex items-center gap-3 mb-5" ref={filterRef}>
                            {/* "Assignee" label button — clicking clears filter like Jira */}
                            <span className="text-[11px] font-medium text-muted-foreground shrink-0 select-none">Assignee</span>

                            {/* Avatar row — first 6 visible, rest in +N chip */}
                            <div className="flex items-center -space-x-1">
                                {bdas.slice(0, 6).map((bda) => {
                                    const isActive = selectedBdas.includes(bda.id);
                                    const count = leads.filter(l => l.assigned_to === bda.id).length;
                                    return (
                                        <button
                                            key={bda.id}
                                            title={`${bda.name} · ${count} lead${count !== 1 ? "s" : ""}`}
                                            onClick={() => setSelectedBdas(prev => isActive ? prev.filter(id => id !== bda.id) : [...prev, bda.id])}
                                            className={`relative h-7 w-7 rounded-full bg-gradient-to-br ${bda.avatarColor} flex items-center justify-center text-[9px] font-bold text-white transition-all duration-150 focus:outline-none ${isActive
                                                ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 z-10"
                                                : "opacity-70 hover:opacity-100 hover:scale-110 hover:z-10 ring-2 ring-background"
                                                }`}
                                        >
                                            {bda.initials}
                                            {/* Status dot */}
                                            <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background ${bda.status === "active" ? "bg-emerald-400" : bda.status === "idle" ? "bg-amber-400" : "bg-muted-foreground/50"
                                                }`} />
                                        </button>
                                    );
                                })}

                                {/* +N overflow chip */}
                                {bdas.length > 6 && (() => {
                                    const overflow = bdas.slice(6);
                                    const overflowActive = overflow.some(b => selectedBdas.includes(b.id));
                                    return (
                                        <div className="relative ml-1">
                                            <button
                                                onClick={() => setFilterOpen(v => !v)}
                                                className={`h-7 px-2 rounded-full text-[10px] font-bold transition-all ring-2 ring-background ${overflowActive
                                                    ? "bg-primary text-white ring-primary scale-105"
                                                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                                                    }`}
                                            >
                                                +{overflow.length}
                                            </button>
                                            <AnimatePresence>
                                                {filterOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 4, scale: 0.96 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 4, scale: 0.96 }}
                                                        transition={{ duration: 0.12 }}
                                                        className="absolute left-0 top-full mt-2 z-50 w-48 bg-popover border border-border/80 rounded-xl shadow-2xl overflow-hidden"
                                                    >
                                                        <div className="p-1">
                                                            {overflow.map(bda => {
                                                                const isActive = selectedBdas.includes(bda.id);
                                                                const count = leads.filter(l => l.assigned_to === bda.id).length;
                                                                return (
                                                                    <button
                                                                        key={bda.id}
                                                                        onClick={() => { setSelectedBdas(prev => isActive ? prev.filter(id => id !== bda.id) : [...prev, bda.id]); setFilterOpen(false); }}
                                                                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors ${isActive ? "bg-primary/12 text-primary" : "text-foreground hover:bg-muted/50"
                                                                            }`}
                                                                    >
                                                                        <div className={`h-6 w-6 rounded-full bg-gradient-to-br ${bda.avatarColor} flex items-center justify-center text-[8px] font-bold text-white shrink-0`}>
                                                                            {bda.initials}
                                                                        </div>
                                                                        <span className="flex-1 text-left font-medium truncate">{bda.name}</span>
                                                                        <span className="text-[10px] text-muted-foreground">{count}</span>
                                                                        {isActive && <Check className="h-3 w-3 text-primary" />}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Separator + active state — clear chip */}
                            {selectedBdas.length > 0 && (
                                <>
                                    <span className="text-border/60 select-none">|</span>
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.85 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.85 }}
                                        onClick={() => setSelectedBdas([])}
                                        className="flex items-center gap-1.5 h-6 pl-2 pr-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-medium hover:bg-primary/15 transition-colors"
                                    >
                                        <span className="mr-1">{selectedBdas.length} selected</span>
                                        <X className="h-2.5 w-2.5 opacity-60 hover:opacity-100" />
                                    </motion.button>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div> {/* end shrink-0 header */}

                {/* ── Scrollable Kanban Board (flex-1, h-full) ─────────────── */}
                <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden pb-4">
                    <div className="flex gap-3 h-full" style={{ minWidth: `${columns.length * 260}px` }}>
                        {columns.map((col) => {
                            const colLeads = filteredLeads.filter((l) => l.status === col.id);
                            const isOver = overId
                                ? (overId === col.id || getColumnForLead(overId) === col.id)
                                : false;
                            return (
                                <div key={col.id} className="flex flex-col flex-1 min-w-[240px] min-h-0">
                                    <KanbanColumn
                                        colId={col.id}
                                        label={col.label}
                                        color={col.color}
                                        bg={col.bg}
                                        border={col.border}
                                        dot={col.dot}
                                        leads={colLeads}
                                        onAssign={(lead) => setAssigningLead(lead)}
                                        isOver={isOver && activeId !== null}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div> {/* end board */}

            </div> {/* end h-full flex-col */}

            {/* Drag Overlay */}
            <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
                {activeLead && (
                    <SortableLead lead={activeLead} isDraggingOverlay onAssign={() => { }} />
                )}
            </DragOverlay>

            {/* Assign Sheet */}
            <AssignSheet
                lead={assigningLead}
                bdas={bdas}
                onAssign={handleAssign}
                onClose={() => setAssigningLead(null)}
            />
        </DndContext >
    );
};

export default AdminLeads;
