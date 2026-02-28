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
    Loader2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useLeads, LeadStatus } from "@/hooks/useLeads";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddLeadModalProps {
    open: boolean;
    onClose: () => void;
}

type Tab = "manual" | "csv";

interface CSVRow {
    name: string;
    phone: string;
    status?: string;
}

interface ValidationError {
    row: number;
    field: string;
    message: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_STATUSES: LeadStatus[] = ["new", "contacted", "interested", "closed"];

const PHONE_REGEX = /^[\+]?[\d\s\-\(\)]{7,20}$/;

function validatePhone(phone: string): boolean {
    return PHONE_REGEX.test(phone.trim());
}

function validateName(name: string): boolean {
    return name.trim().length >= 2;
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
    const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    if (lines.length === 0) return { headers: [], rows: [] };

    const delimiter = lines[0].includes("\t") ? "\t" : ",";
    const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
    const rows = lines.slice(1).map((l) => l.split(delimiter).map((c) => c.trim().replace(/^['"]|['"]$/g, "")));

    return { headers, rows };
}

function validateCSV(headers: string[], rows: string[][]): { parsed: CSVRow[]; errors: ValidationError[] } {
    const errors: ValidationError[] = [];
    const parsed: CSVRow[] = [];

    // Check required headers
    const nameIdx = headers.indexOf("name");
    const phoneIdx = headers.indexOf("phone");

    if (nameIdx === -1) {
        errors.push({ row: 0, field: "header", message: 'Missing required column "name"' });
    }
    if (phoneIdx === -1) {
        errors.push({ row: 0, field: "header", message: 'Missing required column "phone"' });
    }
    if (errors.length > 0) return { parsed, errors };

    const statusIdx = headers.indexOf("status");
    const seenPhones = new Set<string>();

    rows.forEach((cols, i) => {
        const rowNum = i + 2; // 1-indexed, +1 for header

        const name = cols[nameIdx] || "";
        const phone = cols[phoneIdx] || "";
        const status = statusIdx >= 0 ? (cols[statusIdx] || "").toLowerCase() : "";

        if (!name && !phone) return; // skip completely blank rows

        if (!validateName(name)) {
            errors.push({ row: rowNum, field: "name", message: `Row ${rowNum}: Name is too short or empty` });
        }

        if (!validatePhone(phone)) {
            errors.push({ row: rowNum, field: "phone", message: `Row ${rowNum}: Invalid phone number "${phone}"` });
        }

        if (status && !VALID_STATUSES.includes(status as LeadStatus)) {
            errors.push({
                row: rowNum,
                field: "status",
                message: `Row ${rowNum}: Invalid status "${status}"  (allowed: ${VALID_STATUSES.join(", ")})`,
            });
        }

        const normalizedPhone = phone.replace(/[\s\-\(\)]/g, "");
        if (seenPhones.has(normalizedPhone)) {
            errors.push({ row: rowNum, field: "phone", message: `Row ${rowNum}: Duplicate phone "${phone}"` });
        }
        seenPhones.add(normalizedPhone);

        if (errors.filter((e) => e.row === rowNum).length === 0) {
            parsed.push({
                name: name.trim(),
                phone: phone.trim(),
                status: status || undefined,
            });
        }
    });

    return { parsed, errors };
}

// ─── Component ────────────────────────────────────────────────────────────────

const AddLeadModal = ({ open, onClose }: AddLeadModalProps) => {
    const { addLead, addLeadsBulk, addingLead, addingBulk } = useLeads();

    const [tab, setTab] = useState<Tab>("manual");

    // Manual form state
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [status, setStatus] = useState<LeadStatus>("new");
    const [manualError, setManualError] = useState<string | null>(null);
    const [manualSuccess, setManualSuccess] = useState(false);

    // CSV state
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvPreview, setCsvPreview] = useState<CSVRow[] | null>(null);
    const [csvErrors, setCsvErrors] = useState<ValidationError[]>([]);
    const [csvSuccess, setCsvSuccess] = useState<number>(0);
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset on close/open
    useEffect(() => {
        if (open) {
            setTab("manual");
            setName("");
            setPhone("");
            setStatus("new");
            setManualError(null);
            setManualSuccess(false);
            setCsvFile(null);
            setCsvPreview(null);
            setCsvErrors([]);
            setCsvSuccess(0);
        }
    }, [open]);

    // ── Manual Submit ──────────────────────────────────────────────────
    const handleManualSubmit = useCallback(async () => {
        setManualError(null);
        setManualSuccess(false);

        if (!validateName(name)) {
            setManualError("Name must be at least 2 characters");
            return;
        }
        if (!validatePhone(phone)) {
            setManualError("Please enter a valid phone number");
            return;
        }

        try {
            await addLead({ name: name.trim(), phone: phone.trim(), status });
            setManualSuccess(true);
            setName("");
            setPhone("");
            setStatus("new");
            setTimeout(() => setManualSuccess(false), 2500);
        } catch (err: any) {
            setManualError(err?.message || "Failed to add lead. Please try again.");
        }
    }, [name, phone, status, addLead]);

    // ── File Processing (CSV + XLSX) ─────────────────────────────────
    const parseXLSX = useCallback(async (file: File): Promise<{ headers: string[]; rows: string[][] }> => {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const raw: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        if (raw.length === 0) return { headers: [], rows: [] };
        const headers = raw[0].map((h) => String(h).trim().toLowerCase());
        const rows = raw.slice(1).map((r) => r.map((c) => String(c).trim()));
        return { headers, rows };
    }, []);

    const processFile = useCallback(async (file: File) => {
        setCsvFile(file);
        setCsvErrors([]);
        setCsvPreview(null);
        setCsvSuccess(0);

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

    const handleFileDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file && isAcceptedFile(file)) {
                processFile(file);
            } else {
                setCsvErrors([{ row: 0, field: "file", message: "Please upload a .csv or .xlsx file" }]);
            }
        },
        [processFile],
    );

    const handleFileSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
        },
        [processFile],
    );

    const handleCSVImport = useCallback(async () => {
        if (!csvPreview || csvPreview.length === 0) return;
        setCsvSuccess(0);

        try {
            const leadsToAdd = csvPreview.map((r) => ({
                name: r.name,
                phone: r.phone,
                status: (r.status as LeadStatus) || undefined,
            }));
            await addLeadsBulk(leadsToAdd);
            setCsvSuccess(leadsToAdd.length);
            setCsvPreview(null);
            setCsvFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err: any) {
            const msg = err?.message || "Failed to import leads. Please try again.";
            setCsvErrors([{ row: 0, field: "import", message: msg }]);
        }
    }, [csvPreview, addLeadsBulk]);

    const downloadSampleCSV = useCallback(() => {
        const sample = `name,phone,status\nRahul Sharma,+91 98765 43210,new\nPriya Patel,+91 87654 32109,contacted\nAmit Singh,+91 76543 21098,interested`;
        const blob = new Blob([sample], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "leads_sample.csv";
        a.click();
        URL.revokeObjectURL(url);
    }, []);

    if (!open) return null;

    const isBusy = addingLead || addingBulk;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={isBusy ? undefined : onClose}
                className="fixed inset-0 bg-black/25 backdrop-blur-sm z-50 transition-opacity"
            />

            {/* Modal */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xl rounded-2xl bg-card border border-border shadow-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground tracking-tight">Add Leads</h3>
                        <p className="text-xs text-foreground/40 mt-0.5">Add manually or import from CSV / Excel</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isBusy}
                        className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors disabled:opacity-40"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border">
                    {(
                        [
                            { id: "manual" as Tab, label: "Add Manually", icon: UserPlus },
                            { id: "csv" as Tab, label: "Import CSV / Excel", icon: Upload },
                        ] as const
                    ).map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-all border-b-2 ${
                                tab === t.id
                                    ? "text-foreground border-foreground"
                                    : "text-foreground/35 border-transparent hover:text-foreground/60"
                            }`}
                        >
                            <t.icon className="h-3.5 w-3.5" />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="p-6 max-h-[60vh] overflow-y-auto scroll-container">
                    {/* ────── Manual Tab ────── */}
                    {tab === "manual" && (
                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider block mb-1.5">
                                    Full Name *
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/20 pointer-events-none" />
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Rahul Sharma"
                                        className="w-full h-10 pl-10 pr-4 bg-muted border border-border rounded-xl text-xs text-foreground placeholder:text-foreground/25 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/15 transition-all"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider block mb-1.5">
                                    Phone Number *
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/20 pointer-events-none" />
                                    <input
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="e.g. +91 98765 43210"
                                        className="w-full h-10 pl-10 pr-4 bg-muted border border-border rounded-xl text-xs text-foreground placeholder:text-foreground/25 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/15 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider block mb-1.5">
                                    Initial Status
                                </label>
                                <div className="flex gap-2">
                                    {VALID_STATUSES.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setStatus(s)}
                                            className={`flex-1 py-2 rounded-lg text-[11px] font-semibold capitalize border transition-all ${
                                                status === s
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-card text-foreground/50 border-border hover:border-foreground/20 hover:text-foreground"
                                            }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Error / Success */}
                            {manualError && (
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200/60 text-red-600">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    <span className="text-xs font-medium">{manualError}</span>
                                </div>
                            )}
                            {manualSuccess && (
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-600">
                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                    <span className="text-xs font-medium">Lead added successfully!</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ────── CSV Tab ────── */}
                    {tab === "csv" && (
                        <div className="space-y-5">
                            {/* Format info */}
                            <div className="rounded-xl border border-border overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-2.5 bg-accent border-b border-border">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-3.5 w-3.5 text-foreground/50" />
                                        <span className="text-[11px] font-semibold text-foreground/60">
                                            Required Format (CSV / Excel)
                                        </span>
                                    </div>
                                    <button
                                        onClick={downloadSampleCSV}
                                        className="flex items-center gap-1.5 text-[10px] font-semibold text-foreground/50 hover:text-foreground transition-colors"
                                    >
                                        <Download className="h-3 w-3" />
                                        Download Sample
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="bg-muted">
                                                <th className="text-left px-4 py-2 text-foreground/50 font-semibold">
                                                    name <span className="text-red-400">*</span>
                                                </th>
                                                <th className="text-left px-4 py-2 text-foreground/50 font-semibold">
                                                    phone <span className="text-red-400">*</span>
                                                </th>
                                                <th className="text-left px-4 py-2 text-foreground/50 font-semibold">
                                                    status{" "}
                                                    <span className="text-foreground/25 font-normal">(optional)</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-foreground/[0.04]">
                                            <tr>
                                                <td className="px-4 py-2 text-foreground/60">Rahul Sharma</td>
                                                <td className="px-4 py-2 text-foreground/60">+91 98765 43210</td>
                                                <td className="px-4 py-2 text-foreground/40">new</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-2 text-foreground/60">Priya Patel</td>
                                                <td className="px-4 py-2 text-foreground/60">+91 87654 32109</td>
                                                <td className="px-4 py-2 text-foreground/40">contacted</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="px-4 py-2 bg-muted/50 border-t border-foreground/[0.04]">
                                    <p className="text-[10px] text-foreground/30">
                                        Status accepts: <span className="font-medium">new</span>,{" "}
                                        <span className="font-medium">contacted</span>,{" "}
                                        <span className="font-medium">interested</span>,{" "}
                                        <span className="font-medium">closed</span>. Defaults to "new" if omitted.
                                    </p>
                                </div>
                            </div>

                            {/* Drop zone */}
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragging(true);
                                }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={handleFileDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                                    dragging
                                        ? "border-foreground/40 bg-accent/60"
                                        : csvFile
                                        ? "border-emerald-300 bg-emerald-50/30 dark:border-emerald-700 dark:bg-emerald-950/20"
                                        : "border-border hover:border-foreground/20 hover:bg-muted/50"
                                }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                                {csvFile ? (
                                    <>
                                        <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-semibold text-foreground">{csvFile.name}</p>
                                            <p className="text-[10px] text-foreground/30 mt-0.5">
                                                {(csvFile.size / 1024).toFixed(1)} KB · Click to replace
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                                            <Upload className="h-5 w-5 text-foreground/30" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-medium text-foreground/60">
                                                Drop your file here or{" "}
                                                <span className="text-foreground font-semibold underline underline-offset-2">
                                                    browse
                                                </span>
                                            </p>
                                            <p className="text-[10px] text-foreground/25 mt-0.5">
                                                Supports .csv and .xlsx files up to 5 MB
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Validation errors */}
                            {csvErrors.length > 0 && (
                                <div className="rounded-xl border border-red-200/60 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/30 overflow-hidden">
                                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-red-200/40 dark:border-red-900/30">
                                        <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                        <span className="text-xs font-semibold text-red-600">
                                            {csvErrors.length} validation {csvErrors.length === 1 ? "error" : "errors"}{" "}
                                            found
                                        </span>
                                    </div>
                                    <div className="max-h-32 overflow-y-auto px-4 py-2 space-y-1 scroll-container">
                                        {csvErrors.map((err, i) => (
                                            <p key={i} className="text-[11px] text-red-500/80">
                                                {err.message}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Preview */}
                            {csvPreview && csvPreview.length > 0 && csvErrors.length === 0 && (
                                <div className="rounded-xl border border-border overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-2.5 bg-muted border-b border-border">
                                        <span className="text-[11px] font-semibold text-foreground/60">
                                            Preview · {csvPreview.length} lead{csvPreview.length !== 1 ? "s" : ""} ready
                                        </span>
                                        <button
                                            onClick={() => {
                                                setCsvFile(null);
                                                setCsvPreview(null);
                                                if (fileInputRef.current) fileInputRef.current.value = "";
                                            }}
                                            className="flex items-center gap-1 text-[10px] font-medium text-foreground/35 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            Clear
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto max-h-48 overflow-y-auto scroll-container">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="bg-muted/60">
                                                    <th className="text-left px-4 py-1.5 text-foreground/40 font-medium">
                                                        #
                                                    </th>
                                                    <th className="text-left px-4 py-1.5 text-foreground/40 font-medium">
                                                        Name
                                                    </th>
                                                    <th className="text-left px-4 py-1.5 text-foreground/40 font-medium">
                                                        Phone
                                                    </th>
                                                    <th className="text-left px-4 py-1.5 text-foreground/40 font-medium">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-foreground/[0.04]">
                                                {csvPreview.map((row, i) => (
                                                    <tr key={i} className="hover:bg-accent/30">
                                                        <td className="px-4 py-1.5 text-foreground/25">{i + 1}</td>
                                                        <td className="px-4 py-1.5 text-foreground">{row.name}</td>
                                                        <td className="px-4 py-1.5 text-foreground/60">{row.phone}</td>
                                                        <td className="px-4 py-1.5">
                                                            <span className="text-[10px] font-medium text-foreground/40 capitalize">
                                                                {row.status || "new"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* CSV success */}
                            {csvSuccess > 0 && (
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-600">
                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                    <span className="text-xs font-medium">
                                        Successfully imported {csvSuccess} lead{csvSuccess !== 1 ? "s" : ""}!
                                    </span>
                                </div>
                            )}

                        </div>
                    )}
                </div>

                {/* ── Fixed Footer — buttons outside scrollable area ── */}
                {tab === "manual" && (
                    <div className="px-6 py-4 border-t border-border bg-card">
                        <button
                            onClick={handleManualSubmit}
                            disabled={isBusy || !name.trim() || !phone.trim()}
                            className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {addingLead ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <UserPlus className="h-3.5 w-3.5" />
                                    Add Lead
                                </>
                            )}
                        </button>
                    </div>
                )}
                {tab === "csv" && csvPreview && csvPreview.length > 0 && csvErrors.length === 0 && (
                    <div className="px-6 py-4 border-t border-border bg-card">
                        <button
                            onClick={handleCSVImport}
                            disabled={isBusy}
                            className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {addingBulk ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Upload className="h-3.5 w-3.5" />
                                    Import {csvPreview.length} Lead{csvPreview.length !== 1 ? "s" : ""}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default AddLeadModal;
