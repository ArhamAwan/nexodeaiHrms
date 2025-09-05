"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { onPresence } from "@/lib/realtime";
import { useAppSelector } from "@/store";
import { toast } from "sonner";
import { deduplicatedFetch } from "@/lib/cache";
import AddEmployeeModal from "@/components/AddEmployeeModal";
import EmployeeStatsModal from "@/components/EmployeeStatsModal";

const PAGE_SIZE = 10;

export default function EmployeesClient() {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [online, setOnline] = useState<Record<string, boolean>>({});
    const searchParams = useSearchParams();
    const [q, setQ] = useState("");
    const [role, setRole] = useState("ALL");
    const [page, setPage] = useState(1);
    const user = useAppSelector((s) => s.auth.user);
    const [activeTimers, setActiveTimers] = useState<Record<string, { startTime: string }>>({});

    const load = useCallback(async () => {
        try {
            const data = await deduplicatedFetch("/api/employees");
            setRows(data.employees ?? []);
        } catch (error) {
            console.error("Failed to load employees:", error);
            toast.error("Failed to load employees");
        }
    }, []);

    useEffect(() => {
        (async () => {
            try {
                await load();
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Load online status from API
    useEffect(() => {
        const loadOnlineStatus = async () => {
            try {
                const res = await fetch('/api/users/online', {
                    credentials: 'include'
                });
                if (res.ok) {
                    const data = await res.json();
                    const onlineMap: Record<string, boolean> = {};
                    data.onlineUsers.forEach((userId: string) => {
                        onlineMap[userId] = true;
                    });
                    setOnline(onlineMap);
                }
            } catch (error) {
                console.error('Failed to load online status:', error);
            }
        };

        loadOnlineStatus();
        
        // Poll online status every 10 seconds
        const interval = setInterval(loadOnlineStatus, 10000);
        
        return () => clearInterval(interval);
    }, []);

    // Poll active timers every 10s
    useEffect(() => {
        let mounted = true;
        const fetchActivity = async () => {
            const res = await fetch("/api/employees/activity", { cache: "no-store" });
            if (!res.ok) return;
            const data = await res.json();
            if (!mounted) return;
            const map: Record<string, { startTime: string }> = {};
            (data.active as any[]).forEach((a) => { map[a.employeeId] = { startTime: a.startTime }; });
            setActiveTimers(map);
        };
        fetchActivity();
        const id = setInterval(fetchActivity, 10000);
        return () => { mounted = false; clearInterval(id); };
    }, []);

    // Force re-render every second to update elapsed display
    const [, forceTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => forceTick((n) => (n + 1) % 100000), 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        const initial = searchParams?.get("q") ?? "";
        if (initial) setQ(initial);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        return rows.filter((r) => {
            const matchesTerm = term ? `${r.firstName} ${r.lastName}`.toLowerCase().includes(term) || r.user?.email?.toLowerCase().includes(term) : true;
            const matchesRole = role === "ALL" ? true : r.user?.role === role;
            return matchesTerm && matchesRole;
        });
    }, [rows, q, role]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    useEffect(() => { setPage(1); }, [q, role]);

    const SkeletonRow = () => (
        <TableRow>
            <TableCell colSpan={6}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
        </TableRow>
    );


    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<{id: string, name: string} | null>(null);

    async function deleteEmployee(employeeId: string, employeeName: string) {
        if (!confirm(`Are you sure you want to delete ${employeeName}? This action cannot be undone.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/employees?id=${employeeId}`, {
                method: "DELETE",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (res.ok) {
                toast.success("Employee deleted successfully");
                // Force fresh fetch by bypassing cache
                try {
                    const data = await fetch("/api/employees", { cache: "no-store" });
                    if (data.ok) {
                        const result = await data.json();
                        setRows(result.employees ?? []);
                    }
                } catch (error) {
                    console.error("Failed to reload employees:", error);
                    await load(); // Fallback to normal load
                }
            } else {
                const data = await res.json().catch(() => ({}));
                if (res.status === 403) {
                    toast.error("You don't have permission to delete employees. Admin access required.");
                } else if (res.status === 401) {
                    toast.error("Please log in to perform this action.");
                } else {
                    toast.error(data.error || `Failed to delete employee (${res.status})`);
                }
            }
        } catch (error) {
            console.error("Error deleting employee:", error);
            toast.error("Network error. Please check your connection and try again.");
        }
    }

    function openEmployeeStats(employeeId: string, employeeName: string) {
        setSelectedEmployee({ id: employeeId, name: employeeName });
        setIsStatsModalOpen(true);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h1 className="text-2xl font-bold text-foreground">Employees</h1>
                <div className="flex gap-2">
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email" className="px-3 py-2 rounded-xl bg-muted text-foreground placeholder:text-muted-foreground border border-border focus:bg-card focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" />
                    <select value={role} onChange={(e) => setRole(e.target.value)} className="px-3 py-2 rounded-xl bg-muted text-foreground border border-border focus:bg-card focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="ALL">All roles</option>
                        <option value="EMPLOYEE">Employee</option>
                        <option value="HR">HR</option>
                        <option value="MANAGER">Manager</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                </div>
            </div>

            {(user?.role === "ADMIN" || user?.role === "HR") && (
                <div className="bg-card rounded-2xl border premium-shadow p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">Add Employee</h3>
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-colors"
                        >
                            Open
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-card rounded-2xl border premium-shadow overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[32px]" />
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Live Timer</TableHead>
                            {user?.role === "ADMIN" && <TableHead>Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <>
                                <SkeletonRow />
                                <SkeletonRow />
                                <SkeletonRow />
                            </>
                        ) : pageRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={user?.role === "ADMIN" ? 7 : 6}>No employees found</TableCell>
                            </TableRow>
                        ) : (
                            pageRows.map((emp) => (
                                <TableRow 
                                    key={emp.id} 
                                    className="hover:bg-muted cursor-pointer"
                                    onClick={() => openEmployeeStats(emp.id, `${emp.firstName} ${emp.lastName}`)}
                                >
                                    <TableCell>
                                        <span 
                                            className={`inline-block w-2.5 h-2.5 rounded-full ${
                                                emp.user?.id && online[emp.user.id] 
                                                    ? "bg-green-500 online-indicator animate-pulse" 
                                                    : "bg-gray-300"
                                            }`} 
                                            title={emp.user?.id && online[emp.user.id] ? "Online" : "Offline"}
                                        />
                                    </TableCell>
                                    <TableCell>{emp.firstName} {emp.lastName}</TableCell>
                                    <TableCell>{emp.user?.email}</TableCell>
                                    <TableCell><span className="px-2 py-0.5 rounded-full text-xs bg-muted text-foreground">{emp.user?.role}</span></TableCell>
                                    <TableCell>{emp.department?.name ?? "-"}</TableCell>
                                    <TableCell>
                                        {emp.user?.id && online[emp.user.id] ? (
                                            <span className="text-emerald-600 font-medium">Online</span>
                                        ) : (
                                            <span className="text-muted-foreground">Offline</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {activeTimers[emp.id] ? (() => {
                                            const startMs = new Date(activeTimers[emp.id].startTime).getTime();
                                            const diff = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
                                            const h = String(Math.floor(diff / 3600)).padStart(2, "0");
                                            const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
                                            const s = String(diff % 60).padStart(2, "0");
                                            return <span className="font-mono text-sm text-foreground">{h}:{m}:{s}</span>;
                                        })() : <span className="text-muted-foreground">—</span>}
                                    </TableCell>
                                    {user?.role === "ADMIN" && (
                                        <TableCell>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteEmployee(emp.id, `${emp.firstName} ${emp.lastName}`);
                                                }}
                                                className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                                                title="Delete employee"
                                            >
                                                Delete
                                            </button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Page {page} of {totalPages}</div>
                <div className="flex gap-2">
                    <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1.5 rounded-lg bg-muted text-foreground disabled:opacity-50">Prev</button>
                    <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1.5 rounded-lg bg-muted text-foreground disabled:opacity-50">Next</button>
                </div>
            </div>
            
            <AddEmployeeModal 
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onCreated={load}
            />
            
            {selectedEmployee && (
                <EmployeeStatsModal
                    isOpen={isStatsModalOpen}
                    onClose={() => {
                        setIsStatsModalOpen(false);
                        setSelectedEmployee(null);
                    }}
                    employeeId={selectedEmployee.id}
                    employeeName={selectedEmployee.name}
                />
            )}
        </div>
    );
}


