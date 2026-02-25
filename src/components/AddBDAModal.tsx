import { useState, useCallback, useRef, useEffect } from "react";
import {
    X,
    Upload,
    FileText,
    UserPlus,
    AlertCircle,
    CheckCircle2,
    Download,
    Trash2,
    Phone,
    User,
    Mail,
    Loader2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useTeam } from "@/hooks/useTeam";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddBDAModalProps {
    open: boolean;
    onClose: () => void;
}

type Tab = "manual" | "csv";

interface CSVRow {
    name: string;
    email: string;
    phone?: string;
}

interface ValidationError {
    row: number;
    field: string;
    message: string;
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
    if (!phone || !phone.trim()) return true; // optional
    return PHONE_REGEX.test(phone.trim());
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };

    const delimiter = lines[0].includes("\t") ? "\t" : ",";
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/['"]/g, ""));
    const rows = lines.slice(1).map(l => l.split(delimiter).map(c => c.trim().replace(/^['"]|['"]$/g, "")));
    return { headers, rows };
}

function validateCSV(headers: string[], rows: string[][]): { parsed: CSVRow[]; errors: ValidationError[] } {
    const errors: ValidationError[] = [];
    const parsed: CSVRow[] = [];

    const nameIdx = headers.indexOf("name");
    const emailIdx = headers.indexOf("email");
    const phoneIdx = headers.indexOf("phone");

    if (nameIdx === -1) errors.push({ row: 0, field: "header", message: 'Missing required column "name"' });
    if (emailIdx === -1) errors.push({ row: 0, field: "header", message: 'Missing required column "email"' });
    if (errors.length > 0) return { parsed, errors };

    const seenEmails = new Set<string>();

    rows.forEach((cols, i) => {
        const rowNum = i + 2;
        const name = cols[nameIdx] || "";
        const email = cols[emailIdx] || "";
        const phone = phoneIdx >= 0 ? (cols[phoneIdx] || "") : "";

        if (!name && !email) return;

        if (!validateName(name))
            errors.push({ row: rowNum, field: "name", message: `Row ${rowNum}: Name is too short or empty` });

        if (!validateEmail(email))
            errors.push({ row: rowNum, field: "email", message: `Row ${rowNum}: Invalid email "${email}"` });

        if (phone && !validatePhone(phone))
            errors.push({ row: rowNum, field: "phone", message: `Row ${rowNum}: Invalid phone "${phone}"` });

        const normalizedEmail = email.toLowerCase().trim();
        if (seenEmails.has(normalizedEmail))
            errors.push({ row: rowNum, field: "email", message: `Row ${rowNum}: Duplicate email "${email}"` });
        seenEmails.add(normalizedEmail);

        if (errors.filter(e => e.row === rowNum).length === 0) {
            parsed.push({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined });
        }
    });

    return { parsed, errors };
}

// ─── Component ────────────────────────────────────────────────────────────────

const AddBDAModal = ({ open, onClose }: AddBDAModalProps) => {
    const { addMember, addMembersBulk, addingMember, addingBulk } = useTeam();

    const [tab, setTab] = useState<Tab>("manual");

    // Manual
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [manualError, setManualError] = useState<string | null>(null);
    const [manualSuccess, setManualSuccess] = useState(false);

    // CSV
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvPreview, setCsvPreview] = useState<CSVRow[] | null>(null);
    const [csvErrors, setCsvErrors] = useState<ValidationError[]>([]);
    const [csvSuccess, setCsvSuccess] = useState(0);
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setTab("manual");
            setName(""); setEmail(""); setPhone("");
            setManualError(null); setManualSuccess(false);
            setCsvFile(null); setCsvPreview(null); setCsvErrors([]); setCsvSuccess(0);
        }
    }, [open]);

    // ── Manual ─────────────────────────────────────────────────────────
    const handleManualSubmit = useCallback(async () => {
        setManualError(null);
        setManualSuccess(false);

        if (!validateName(name)) { setManualError("Name must be at least 2 characters"); return; }
        if (!validateEmail(email)) { setManualError("Please enter a valid email address"); return; }
        if (phone && !validatePhone(phone)) { setManualError("Please enter a valid phone number"); return; }

        try {
            await addMember({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined });
            setManualSuccess(true);
            setName(""); setEmail(""); setPhone("");
            setTimeout(() => setManualSuccess(false), 2500);
        } catch {
            setManualError("Failed to add team member. Please try again.");
        }
    }, [name, email, phone, addMember]);

    // ── File Processing (CSV + XLSX) ────────────────────────────────
    const parseXLSX = useCallback(async (file: File): Promise<{ headers: string[]; rows: string[][] }> => {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const raw: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        if (raw.length === 0) return { headers: [], rows: [] };
        const headers = raw[0].map(h => String(h).trim().toLowerCase());
        const rows = raw.slice(1).map(r => r.map(c => String(c).trim()));
        return { headers, rows };
    }, []);

    const processFile = useCallback(async (file: File) => {
        setCsvFile(file); setCsvErrors([]); setCsvPreview(null); setCsvSuccess(0);

        const ext = file.name.toLowerCase().split(".").pop();
        let headers: string[] = [];
        let rows: string[][] = [];

        if (ext === "xlsx" || ext === "xls") {
            ({ headers, rows } = await parseXLSX(file));
        } else {
            const text = await file.text();
            ({ headers, rows } = parseCSV(text));
        }

        if (headers.length === 0) {
            setCsvErrors([{ row: 0, field: "file", message: "File is empty or could not be parsed" }]);
            return;
        }
        const { parsed, errors } = validateCSV(headers, rows);
        setCsvErrors(errors);
        setCsvPreview(parsed);
    }, [parseXLSX]);

    const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];
    const isAcceptedFile = (file: File) => {
        const ext = "." + file.name.toLowerCase().split(".").pop();
        return ACCEPTED_EXTENSIONS.includes(ext);
    };

    const handleFileDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && isAcceptedFile(file)) processFile(file);
        else setCsvErrors([{ row: 0, field: "file", message: "Please upload a .csv or .xlsx file" }]);
    }, [processFile]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    }, [processFile]);

    const handleCSVImport = useCallback(async () => {
        if (!csvPreview || csvPreview.length === 0) return;
        try {
            await addMembersBulk(csvPreview.map(r => ({ name: r.name, email: r.email, phone: r.phone })));
            setCsvSuccess(csvPreview.length);
            setCsvPreview(null); setCsvFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err: any) {
            const msg = err?.message || "Failed to import members. Please try again.";
            setCsvErrors([{ row: 0, field: "import", message: msg }]);
        }
    }, [csvPreview, addMembersBulk]);

    const downloadSample = useCallback(() => {
        const csv = `name,email,phone\nRahul Sharma,rahul@company.com,+91 98765 43210\nPriya Patel,priya@company.com,+91 87654 32109`;
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "bda_sample.csv"; a.click();
        URL.revokeObjectURL(url);
    }, []);

    if (!open) return null;
    const isBusy = addingMember || addingBulk;

    return (
        <>
            <div onClick={isBusy ? undefined : onClose} className="fixed inset-0 bg-black/25 backdrop-blur-sm z-50" />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg rounded-2xl bg-white border border-black/[0.06] shadow-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]">
                    <div>
                        <h3 className="text-sm font-semibold text-[#1f1f1f] tracking-tight">Add Team Member</h3>
                        <p className="text-xs text-[#1f1f1f]/40 mt-0.5">Add manually or import from CSV / Excel</p>
                    </div>
                    <button onClick={onClose} disabled={isBusy} className="h-7 w-7 rounded-lg bg-[#f4f4f4] flex items-center justify-center text-[#1f1f1f]/40 hover:text-[#1f1f1f] transition-colors disabled:opacity-40">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-black/[0.06]">
                    {([{ id: "manual" as Tab, label: "Add Manually", icon: UserPlus }, { id: "csv" as Tab, label: "Import CSV / Excel", icon: Upload }] as const).map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-all border-b-2 ${tab === t.id ? "text-[#1f1f1f] border-[#1f1f1f]" : "text-[#1f1f1f]/35 border-transparent hover:text-[#1f1f1f]/60"}`}>
                            <t.icon className="h-3.5 w-3.5" />{t.label}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="p-6 max-h-[60vh] overflow-y-auto scroll-container">
                    {/* ── Manual ── */}
                    {tab === "manual" && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-[11px] font-semibold text-[#1f1f1f]/50 uppercase tracking-wider block mb-1.5">Full Name *</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1f1f1f]/20 pointer-events-none" />
                                    <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rahul Sharma" className="w-full h-10 pl-10 pr-4 bg-[#f4f4f4] border border-black/[0.06] rounded-xl text-xs text-[#1f1f1f] placeholder:text-[#1f1f1f]/25 focus:outline-none focus:ring-2 focus:ring-[#1f1f1f]/10 focus:border-[#1f1f1f]/15 transition-all" autoFocus />
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-[#1f1f1f]/50 uppercase tracking-wider block mb-1.5">Email Address *</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1f1f1f]/20 pointer-events-none" />
                                    <input value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. rahul@company.com" className="w-full h-10 pl-10 pr-4 bg-[#f4f4f4] border border-black/[0.06] rounded-xl text-xs text-[#1f1f1f] placeholder:text-[#1f1f1f]/25 focus:outline-none focus:ring-2 focus:ring-[#1f1f1f]/10 focus:border-[#1f1f1f]/15 transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-[#1f1f1f]/50 uppercase tracking-wider block mb-1.5">Phone <span className="text-[#1f1f1f]/25 normal-case">(optional)</span></label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1f1f1f]/20 pointer-events-none" />
                                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +91 98765 43210" className="w-full h-10 pl-10 pr-4 bg-[#f4f4f4] border border-black/[0.06] rounded-xl text-xs text-[#1f1f1f] placeholder:text-[#1f1f1f]/25 focus:outline-none focus:ring-2 focus:ring-[#1f1f1f]/10 focus:border-[#1f1f1f]/15 transition-all" />
                                </div>
                            </div>

                            {manualError && (
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200/60 text-red-600">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" /><span className="text-xs font-medium">{manualError}</span>
                                </div>
                            )}
                            {manualSuccess && (
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-600">
                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /><span className="text-xs font-medium">Team member added successfully!</span>
                                </div>
                            )}

                        </div>
                    )}

                    {/* ── CSV ── */}
                    {tab === "csv" && (
                        <div className="space-y-5">
                            {/* Format */}
                            <div className="rounded-xl border border-black/[0.06] overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-2.5 bg-[#f6f7ed] border-b border-black/[0.06]">
                                    <div className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-[#1f1f1f]/50" /><span className="text-[11px] font-semibold text-[#1f1f1f]/60">Required Format (CSV / Excel)</span></div>
                                    <button onClick={downloadSample} className="flex items-center gap-1.5 text-[10px] font-semibold text-[#1f1f1f]/50 hover:text-[#1f1f1f] transition-colors"><Download className="h-3 w-3" />Download Sample</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead><tr className="bg-[#f4f4f4]">
                                            <th className="text-left px-4 py-2 text-[#1f1f1f]/50 font-semibold">name <span className="text-red-400">*</span></th>
                                            <th className="text-left px-4 py-2 text-[#1f1f1f]/50 font-semibold">email <span className="text-red-400">*</span></th>
                                            <th className="text-left px-4 py-2 text-[#1f1f1f]/50 font-semibold">phone <span className="text-[#1f1f1f]/25 font-normal">(optional)</span></th>
                                        </tr></thead>
                                        <tbody className="divide-y divide-black/[0.04]">
                                            <tr><td className="px-4 py-2 text-[#1f1f1f]/60">Rahul Sharma</td><td className="px-4 py-2 text-[#1f1f1f]/60">rahul@company.com</td><td className="px-4 py-2 text-[#1f1f1f]/40">+91 98765 43210</td></tr>
                                            <tr><td className="px-4 py-2 text-[#1f1f1f]/60">Priya Patel</td><td className="px-4 py-2 text-[#1f1f1f]/60">priya@company.com</td><td className="px-4 py-2 text-[#1f1f1f]/40">+91 87654 32109</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Drop zone */}
                            <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleFileDrop} onClick={() => fileInputRef.current?.click()} className={`flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${dragging ? "border-[#1f1f1f]/40 bg-[#f6f7ed]/60" : csvFile ? "border-emerald-300 bg-emerald-50/30" : "border-black/[0.08] hover:border-[#1f1f1f]/20 hover:bg-[#f4f4f4]/50"}`}>
                                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileSelect} />
                                {csvFile ? (
                                    <>
                                        <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center"><FileText className="h-5 w-5 text-emerald-600" /></div>
                                        <div className="text-center"><p className="text-xs font-semibold text-[#1f1f1f]">{csvFile.name}</p><p className="text-[10px] text-[#1f1f1f]/30 mt-0.5">{(csvFile.size / 1024).toFixed(1)} KB · Click to replace</p></div>
                                    </>
                                ) : (
                                    <>
                                        <div className="h-10 w-10 rounded-xl bg-[#f4f4f4] flex items-center justify-center"><Upload className="h-5 w-5 text-[#1f1f1f]/30" /></div>
                                        <div className="text-center"><p className="text-xs font-medium text-[#1f1f1f]/60">Drop your file here or <span className="text-[#1f1f1f] font-semibold underline underline-offset-2">browse</span></p><p className="text-[10px] text-[#1f1f1f]/25 mt-0.5">Supports .csv and .xlsx files up to 5 MB</p></div>
                                    </>
                                )}
                            </div>

                            {/* Errors */}
                            {csvErrors.length > 0 && (
                                <div className="rounded-xl border border-red-200/60 bg-red-50/50 overflow-hidden">
                                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-red-200/40"><AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" /><span className="text-xs font-semibold text-red-600">{csvErrors.length} validation {csvErrors.length === 1 ? "error" : "errors"}</span></div>
                                    <div className="max-h-32 overflow-y-auto px-4 py-2 space-y-1 scroll-container">{csvErrors.map((err, i) => <p key={i} className="text-[11px] text-red-500/80">{err.message}</p>)}</div>
                                </div>
                            )}

                            {/* Preview */}
                            {csvPreview && csvPreview.length > 0 && csvErrors.length === 0 && (
                                <div className="rounded-xl border border-black/[0.06] overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#f4f4f4] border-b border-black/[0.06]">
                                        <span className="text-[11px] font-semibold text-[#1f1f1f]/60">Preview · {csvPreview.length} member{csvPreview.length !== 1 ? "s" : ""} ready</span>
                                        <button onClick={() => { setCsvFile(null); setCsvPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="flex items-center gap-1 text-[10px] font-medium text-[#1f1f1f]/35 hover:text-red-500 transition-colors"><Trash2 className="h-3 w-3" />Clear</button>
                                    </div>
                                    <div className="overflow-x-auto max-h-48 overflow-y-auto scroll-container">
                                        <table className="w-full text-xs">
                                            <thead><tr className="bg-[#f4f4f4]/60">
                                                <th className="text-left px-4 py-1.5 text-[#1f1f1f]/40 font-medium">#</th>
                                                <th className="text-left px-4 py-1.5 text-[#1f1f1f]/40 font-medium">Name</th>
                                                <th className="text-left px-4 py-1.5 text-[#1f1f1f]/40 font-medium">Email</th>
                                                <th className="text-left px-4 py-1.5 text-[#1f1f1f]/40 font-medium">Phone</th>
                                            </tr></thead>
                                            <tbody className="divide-y divide-black/[0.04]">
                                                {csvPreview.map((row, i) => (
                                                    <tr key={i} className="hover:bg-[#f6f7ed]/30">
                                                        <td className="px-4 py-1.5 text-[#1f1f1f]/25">{i + 1}</td>
                                                        <td className="px-4 py-1.5 text-[#1f1f1f]">{row.name}</td>
                                                        <td className="px-4 py-1.5 text-[#1f1f1f]/60">{row.email}</td>
                                                        <td className="px-4 py-1.5 text-[#1f1f1f]/40">{row.phone || "—"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {csvSuccess > 0 && (
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-600">
                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /><span className="text-xs font-medium">Successfully imported {csvSuccess} member{csvSuccess !== 1 ? "s" : ""}!</span>
                                </div>
                            )}

                        </div>
                    )}
                </div>

                {/* Fixed Footer */}
                {tab === "manual" && (
                    <div className="px-6 py-4 border-t border-black/[0.06] bg-white">
                        <button onClick={handleManualSubmit} disabled={isBusy || !name.trim() || !email.trim()} className="w-full h-10 rounded-xl bg-[#1f1f1f] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#1f1f1f]/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                            {addingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-3.5 w-3.5" />Add Member</>}
                        </button>
                    </div>
                )}
                {tab === "csv" && csvPreview && csvPreview.length > 0 && csvErrors.length === 0 && (
                    <div className="px-6 py-4 border-t border-black/[0.06] bg-white">
                        <button onClick={handleCSVImport} disabled={isBusy} className="w-full h-10 rounded-xl bg-[#1f1f1f] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#1f1f1f]/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                            {addingBulk ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="h-3.5 w-3.5" />Import {csvPreview.length} Member{csvPreview.length !== 1 ? "s" : ""}</>}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default AddBDAModal;
