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
import { Users, Search, Filter, Plus, UserCheck, Clock, Trash2, Eye } from "lucide-react";

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
            const data = await deduplicatedFetch("/api/employees") as { employees?: any[] };
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
        
        // Poll online status every 30 seconds (reduced from 10s)
        const interval = setInterval(loadOnlineStatus, 30000);
        
        return () => clearInterval(interval);
    }, []);

    // Poll active timers every 30s (reduced from 10s)
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
        const id = setInterval(fetchActivity, 30000);
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
                // Remove employee from local state immediately for better responsiveness
                setRows(prevRows => prevRows.filter(emp => emp.id !== employeeId));
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
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white drop-shadow-lg">Employees</h1>
                        <p className="text-white/70 text-sm drop-shadow-md">Manage your team members and their information</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-white drop-shadow-lg">{rows.length}</div>
                    <div className="text-white/60 text-sm">Total Employees</div>
                </div>
            </div>

            {/* Search and Filter Section */}
            <div className="relative p-6 rounded-2xl premium-shadow overflow-hidden
                glass-light
                ring-1 ring-offset-white/20 ring-white/20 ring-offset-2 
                shadow-button hover:shadow-button-hover transition-all duration-300
                hover:bg-white/15 hover:border-white/40 hover:ring-white/30 hover:ring-offset-4 hover:ring-offset-black/20
                before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-shine before:pointer-events-none before:rounded-2xl
                after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/3 after:via-transparent after:to-transparent after:pointer-events-none after:rounded-2xl">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Search className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white drop-shadow-lg">Search & Filter</h3>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                        <input 
                            value={q} 
                            onChange={(e) => setQ(e.target.value)} 
                            placeholder="Search by name or email..." 
                            className="w-full pl-10 pr-4 py-3 rounded-xl glass-light text-white placeholder:text-white/60 border border-white/30 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                        <select 
                            value={role} 
                            onChange={(e) => setRole(e.target.value)} 
                            className="pl-10 pr-8 py-3 rounded-xl glass-light text-white border border-white/30 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
                        >
                            <option value="ALL" className="bg-gray-800 text-white">All Roles</option>
                            <option value="EMPLOYEE" className="bg-gray-800 text-white">Employee</option>
                            <option value="HR" className="bg-gray-800 text-white">HR</option>
                            <option value="MANAGER" className="bg-gray-800 text-white">Manager</option>
                            <option value="ADMIN" className="bg-gray-800 text-white">Admin</option>
                        </select>
                    </div>
                </div>
            </div>

            {(user?.role === "ADMIN" || user?.role === "HR") && (
                <div className="relative p-6 rounded-2xl premium-shadow overflow-hidden
                    glass-light
                    ring-1 ring-offset-white/20 ring-white/20 ring-offset-2 
                    shadow-button hover:shadow-button-hover transition-all duration-300
                    hover:bg-white/15 hover:border-white/40 hover:ring-white/30 hover:ring-offset-4 hover:ring-offset-black/20
                    before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-shine before:pointer-events-none before:rounded-2xl
                    after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/3 after:via-transparent after:to-transparent after:pointer-events-none after:rounded-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Plus className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white drop-shadow-lg">Add New Employee</h3>
                                <p className="text-white/70 text-sm">Onboard a new team member to the system</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Employee</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Employees Table Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <UserCheck className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="text-xl font-semibold text-white drop-shadow-lg">Employee Directory</h2>
                    </div>
                    <div className="text-sm text-white/60">
                        Showing {pageRows.length} of {filtered.length} employees
                    </div>
                </div>

                <div className="relative rounded-2xl premium-shadow overflow-hidden
                    glass-light
                    ring-1 ring-offset-white/20 ring-white/20 ring-offset-2 
                    shadow-button hover:shadow-button-hover transition-all duration-300
                    hover:bg-white/15 hover:border-white/40 hover:ring-white/30 hover:ring-offset-4 hover:ring-offset-black/20
                    before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-shine before:pointer-events-none before:rounded-2xl
                    after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/3 after:via-transparent after:to-transparent after:pointer-events-none after:rounded-2xl">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/20">
                                <TableHead className="w-[40px] text-white/80 font-semibold">Status</TableHead>
                                <TableHead className="text-white/80 font-semibold">Employee</TableHead>
                                <TableHead className="text-white/80 font-semibold">Contact</TableHead>
                                <TableHead className="text-white/80 font-semibold">Role</TableHead>
                                <TableHead className="text-white/80 font-semibold">Department</TableHead>
                                <TableHead className="text-white/80 font-semibold">Online Status</TableHead>
                                <TableHead className="text-white/80 font-semibold">Live Timer</TableHead>
                                {user?.role === "ADMIN" && <TableHead className="text-white/80 font-semibold">Actions</TableHead>}
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
                                    className="hover:bg-white/5 cursor-pointer border-white/10 group"
                                    onClick={() => openEmployeeStats(emp.id, `${emp.firstName} ${emp.lastName}`)}
                                >
                                    <TableCell>
                                        <div className="flex items-center justify-center">
                                            <span 
                                                className={`inline-block w-3 h-3 rounded-full ${
                                                    emp.user?.id && online[emp.user.id] 
                                                        ? "bg-green-400 online-indicator animate-pulse" 
                                                        : "bg-gray-400"
                                                }`} 
                                                title={emp.user?.id && online[emp.user.id] ? "Online" : "Offline"}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                                <span className="text-white font-semibold text-sm">
                                                    {emp.firstName?.[0]?.toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">{emp.firstName} {emp.lastName}</div>
                                                <div className="text-white/60 text-xs">{emp.designation || "Employee"}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-white/80">{emp.user?.email}</div>
                                        {emp.phone && <div className="text-white/60 text-xs">{emp.phone}</div>}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                            emp.user?.role === "ADMIN" ? "bg-red-500/20 text-red-300 border-red-400/30" :
                                            emp.user?.role === "MANAGER" ? "bg-purple-500/20 text-purple-300 border-purple-400/30" :
                                            emp.user?.role === "HR" ? "bg-blue-500/20 text-blue-300 border-blue-400/30" :
                                            "bg-green-500/20 text-green-300 border-green-400/30"
                                        }`}>
                                            {emp.user?.role}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-white/80">{emp.department?.name ?? "-"}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            <span 
                                                className={`inline-block w-2 h-2 rounded-full ${
                                                    emp.user?.id && online[emp.user.id] 
                                                        ? "bg-green-400 animate-pulse" 
                                                        : "bg-gray-400"
                                                }`} 
                                            />
                                            <span className={`text-sm font-medium ${
                                                emp.user?.id && online[emp.user.id] 
                                                    ? "text-green-400" 
                                                    : "text-white/60"
                                            }`}>
                                                {emp.user?.id && online[emp.user.id] ? "Online" : "Offline"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {activeTimers[emp.id] ? (() => {
                                            const startMs = new Date(activeTimers[emp.id].startTime).getTime();
                                            const diff = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
                                            const h = String(Math.floor(diff / 3600)).padStart(2, "0");
                                            const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
                                            const s = String(diff % 60).padStart(2, "0");
                                            return (
                                                <div className="flex items-center space-x-2">
                                                    <Clock className="w-3 h-3 text-green-400" />
                                                    <span className="font-mono text-sm text-green-400">{h}:{m}:{s}</span>
                                                </div>
                                            );
                                        })() : <span className="text-white/60">—</span>}
                                    </TableCell>
                                    {user?.role === "ADMIN" && (
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEmployeeStats(emp.id, `${emp.firstName} ${emp.lastName}`);
                                                    }}
                                                    className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                                                    title="View details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteEmployee(emp.id, `${emp.firstName} ${emp.lastName}`);
                                                    }}
                                                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                                                    title="Delete employee"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-white/80">
                    Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} employees
                </div>
                <div className="flex items-center space-x-2">
                    <button 
                        disabled={page <= 1} 
                        onClick={() => setPage((p) => Math.max(1, p - 1))} 
                        className="px-4 py-2 rounded-xl glass-light text-white disabled:opacity-50 hover:bg-white/10 transition-all duration-200 flex items-center space-x-2"
                    >
                        <span>Previous</span>
                    </button>
                    <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                            if (pageNum > totalPages) return null;
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setPage(pageNum)}
                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        page === pageNum
                                            ? "bg-blue-600 text-white"
                                            : "glass-light text-white/80 hover:bg-white/10 hover:text-white"
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>
                    <button 
                        disabled={page >= totalPages} 
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))} 
                        className="px-4 py-2 rounded-xl glass-light text-white disabled:opacity-50 hover:bg-white/10 transition-all duration-200 flex items-center space-x-2"
                    >
                        <span>Next</span>
                    </button>
                </div>
            </div>
            
            <AddEmployeeModal 
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onCreated={async () => {
                    // Reload employees list after adding new employee
                    await load();
                }}
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