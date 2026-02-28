import { useState, useEffect } from "react";
import {
    X,
    UserPlus,
    AlertCircle,
    CheckCircle2,
    Phone,
    User,
    Mail,
    Lock,
    Loader2,
    ShieldCheck,
} from "lucide-react";
import { useTeam, MemberRole } from "@/hooks/useTeam";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddBDAModalProps {
    open: boolean;
    onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\+]?[\d\s\-\(\)]{7,20}$/;

function validateEmail(email: string): boolean {
    return EMAIL_REGEX.test(email.trim());
}

function validateName(name: string): boolean {
    return name.trim().length >= 2;
}

function validatePhone(phone: string): boolean {
    if (!phone || !phone.trim()) return true;
    return PHONE_REGEX.test(phone.trim());
}

// ─── Component ────────────────────────────────────────────────────────────────

const AddBDAModal = ({ open, onClose }: AddBDAModalProps) => {
    const { addMember, addingMember } = useTeam();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<MemberRole>("member");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (open) {
            setName(""); setEmail(""); setPhone(""); setPassword("");
            setRole("member"); setError(null); setSuccess(false);
        }
    }, [open]);

    const handleSubmit = async () => {
        setError(null);
        setSuccess(false);

        if (!validateName(name)) { setError("Name must be at least 2 characters"); return; }
        if (!validateEmail(email)) { setError("Please enter a valid email address"); return; }
        if (phone && !validatePhone(phone)) { setError("Please enter a valid phone number"); return; }
        if (password.length < 4) { setError("Password must be at least 4 characters"); return; }

        try {
            await addMember({
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim() || undefined,
                password,
                role,
            });
            setSuccess(true);
            setName(""); setEmail(""); setPhone(""); setPassword("");
            setRole("member");
            setTimeout(() => setSuccess(false), 2500);
        } catch (err: any) {
            setError(err?.message || "Failed to add team member. Please try again.");
        }
    };

    if (!open) return null;

    return (
        <>
            <div onClick={addingMember ? undefined : onClose} className="fixed inset-0 bg-black/25 backdrop-blur-sm z-50" />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xl rounded-2xl bg-card border border-border shadow-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground tracking-tight">Add Team Member</h3>
                        <p className="text-xs text-foreground/40 mt-0.5">Add a new member to this company</p>
                    </div>
                    <button onClick={onClose} disabled={addingMember} className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors disabled:opacity-40">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[60vh] overflow-y-auto scroll-container">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider block mb-1.5">Full Name *</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/20 pointer-events-none" />
                                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rahul Sharma" className="w-full h-10 pl-10 pr-4 bg-muted border border-border rounded-xl text-xs text-foreground placeholder:text-foreground/25 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/15 transition-all" autoFocus />
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider block mb-1.5">Email Address *</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/20 pointer-events-none" />
                                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. rahul@company.com" className="w-full h-10 pl-10 pr-4 bg-muted border border-border rounded-xl text-xs text-foreground placeholder:text-foreground/25 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/15 transition-all" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider block mb-1.5">Password *</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/20 pointer-events-none" />
                                <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Min 4 characters" className="w-full h-10 pl-10 pr-4 bg-muted border border-border rounded-xl text-xs text-foreground placeholder:text-foreground/25 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/15 transition-all" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider block mb-1.5">Phone <span className="text-foreground/25 normal-case">(optional)</span></label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/20 pointer-events-none" />
                                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +91 98765 43210" className="w-full h-10 pl-10 pr-4 bg-muted border border-border rounded-xl text-xs text-foreground placeholder:text-foreground/25 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/15 transition-all" />
                            </div>
                        </div>
                        </div>

                        {/* Role selector */}
                        <div>
                            <label className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider block mb-1.5">Role</label>
                            <div className="flex gap-2">
                                {(["member", "admin"] as MemberRole[]).map(r => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setRole(r)}
                                        className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border text-xs font-semibold transition-all ${
                                            role === r
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-muted text-foreground/45 border-border hover:border-foreground/15"
                                        }`}
                                    >
                                        {r === "admin" && <ShieldCheck className="h-3.5 w-3.5" />}
                                        {r === "member" && <User className="h-3.5 w-3.5" />}
                                        {r.charAt(0).toUpperCase() + r.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800 text-red-600 dark:text-red-400">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" /><span className="text-xs font-medium">{error}</span>
                            </div>
                        )}
                        {success && (
                            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /><span className="text-xs font-medium">Team member added successfully!</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border bg-card">
                    <button onClick={handleSubmit} disabled={addingMember || !name.trim() || !email.trim() || password.length < 4} className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                        {addingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-3.5 w-3.5" />Add Member</>}
                    </button>
                </div>
            </div>
        </>
    );
};

export default AddBDAModal;
