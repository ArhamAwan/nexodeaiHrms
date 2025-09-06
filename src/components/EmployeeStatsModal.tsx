"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

interface EmployeeStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
}

interface EmployeeStats {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    address: string | null;
    designation: string | null;
    joinedAt: string;
    user: {
      id: string;
      email: string;
      role: string;
      status: string;
      createdAt: string;
    };
    department: {
      id: string;
      name: string;
    } | null;
  };
  attendance: {
    totalDays: number;
    totalHours: number;
    recent: Array<{
      day: string;
      checkIn: string | null;
      checkOut: string | null;
      hoursWorked: number | null;
      status: string;
    }>;
  };
  leaves: {
    totalLeaves: number;
    totalDays: number;
    recent: Array<{
      type: string;
      startDate: string;
      endDate: string;
      days: number;
      status: string;
      reason: string | null;
      createdAt: string;
    }>;
  };
  timeLogs: {
    totalLogs: number;
    totalDuration: number;
    recent: Array<{
      startTime: string;
      endTime: string | null;
      duration: number | null;
      description: string | null;
      project: string | null;
    }>;
  };
}

export default function EmployeeStatsModal({ isOpen, onClose, employeeId, employeeName }: EmployeeStatsModalProps) {
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'leaves' | 'timeLogs'>('overview');

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && employeeId) {
      loadStats();
    }
  }, [isOpen, employeeId]);

  async function loadStats() {
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${employeeId}/stats`, {
        credentials: "include"
      });
      
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to load employee stats:", errorData.error || `HTTP ${res.status}`);
        toast.error(errorData.error || "Failed to load employee statistics");
      }
    } catch (error) {
      console.error("Error loading employee stats:", error);
      toast.error("Network error while loading employee statistics");
    } finally {
      setLoading(false);
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" 
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-card text-foreground w-full max-w-4xl max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col min-h-0" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Employee Statistics</h2>
            <p className="text-muted-foreground">{employeeName}</p>
          </div>
          <button 
            onClick={onClose} 
            className="px-3 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading stats...</p>
          </div>
        ) : stats ? (
          <div className="flex flex-col h-full min-h-0">
            {/* Tabs */}
            <div className="flex border-b">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'attendance', label: 'Attendance' },
                { id: 'leaves', label: 'Leaves' },
                { id: 'timeLogs', label: 'Time Logs' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Employee Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Employee Information</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Name:</span> {stats.employee.firstName} {stats.employee.lastName}</div>
                        <div><span className="font-medium">Email:</span> {stats.employee.user.email}</div>
                        <div><span className="font-medium">Role:</span> {stats.employee.user.role}</div>
                        <div><span className="font-medium">Department:</span> {stats.employee.department?.name || 'Not assigned'}</div>
                        <div><span className="font-medium">Joined:</span> {formatDate(stats.employee.joinedAt)}</div>
                        <div><span className="font-medium">Status:</span> 
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            stats.employee.user.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {stats.employee.user.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Quick Stats</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{stats.attendance.totalDays}</div>
                          <div className="text-muted-foreground">Days Worked</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{stats.attendance.totalHours?.toFixed(1) || 0}</div>
                          <div className="text-muted-foreground">Total Hours</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{stats.leaves.totalLeaves}</div>
                          <div className="text-muted-foreground">Leaves Taken</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{stats.timeLogs.totalLogs}</div>
                          <div className="text-muted-foreground">Time Logs</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'attendance' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Attendance Records</h3>
                    <div className="text-sm text-muted-foreground">
                      Total: {stats.attendance.totalDays} days, {stats.attendance.totalHours?.toFixed(1) || 0} hours
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Date</th>
                          <th className="text-left p-2">Check In</th>
                          <th className="text-left p-2">Check Out</th>
                          <th className="text-left p-2">Hours</th>
                          <th className="text-left p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.attendance.recent.map((record, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{formatDate(record.day)}</td>
                            <td className="p-2">{record.checkIn ? formatDateTime(record.checkIn) : '-'}</td>
                            <td className="p-2">{record.checkOut ? formatDateTime(record.checkOut) : '-'}</td>
                            <td className="p-2">{record.hoursWorked ? `${record.hoursWorked.toFixed(1)}h` : '-'}</td>
                            <td className="p-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                record.status === 'PRESENT' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {record.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'leaves' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Leave Records</h3>
                    <div className="text-sm text-muted-foreground">
                      Total: {stats.leaves.totalLeaves} leaves, {stats.leaves.totalDays} days
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {stats.leaves.recent.map((leave, index) => (
                      <div key={index} className="bg-muted/50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{leave.type}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(leave.startDate)} - {formatDate(leave.endDate)} ({leave.days} days)
                            </div>
                            {leave.reason && (
                              <div className="text-sm mt-1">{leave.reason}</div>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            leave.status === 'APPROVED' 
                              ? 'bg-green-100 text-green-800' 
                              : leave.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {leave.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'timeLogs' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Time Log Records</h3>
                    <div className="text-sm text-muted-foreground">
                      Total: {stats.timeLogs.totalLogs} logs, {formatDuration(stats.timeLogs.totalDuration)}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {stats.timeLogs.recent.map((log, index) => (
                      <div key={index} className="bg-muted/50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{log.project || 'No Project'}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatDateTime(log.startTime)} - {log.endTime ? formatDateTime(log.endTime) : 'Ongoing'}
                            </div>
                            {log.description && (
                              <div className="text-sm mt-1">{log.description}</div>
                            )}
                          </div>
                          <div className="text-sm font-medium">
                            {log.duration ? formatDuration(log.duration) : 'Ongoing'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Failed to load employee statistics</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
