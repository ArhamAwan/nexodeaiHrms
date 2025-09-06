"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
}

export default function AddEmployeeModal({ isOpen, onClose, onCreated }: AddEmployeeModalProps) {
  const [loading, setLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ email: string; tempPassword?: string } | null>(null);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  async function copyToClipboard(text: string, label?: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label ? `${label} ` : ""}copied to clipboard`);
    } catch {
      toast.error("Failed to copy. Please copy manually.");
    }
  }

  async function addEmployee(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        email: formData.get("email") as string,
        role: formData.get("role") as string,
      };

      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (res.ok) {
        const result = await res.json();
        setSuccessInfo({ email: data.email, tempPassword: result.tempPassword });
        toast.success("Employee created successfully");
        await onCreated();
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Failed to create employee");
      }
    } catch (error) {
      console.error("Error creating employee:", error);
      toast.error(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" 
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white/10 backdrop-blur-xl border border-white/20 text-white w-full max-w-lg rounded-2xl p-6 shadow-2xl glass-light" 
        onClick={(e) => e.stopPropagation()}
      >
        {!successInfo ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-lg text-white">New Employee</h4>
              <button 
                onClick={onClose} 
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={addEmployee} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input 
                name="firstName" 
                placeholder="First name" 
                required 
                className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder:text-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40" 
              />
              <input 
                name="lastName" 
                placeholder="Last name" 
                required 
                className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder:text-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40" 
              />
              <input 
                name="email" 
                type="email" 
                placeholder="Email" 
                required 
                className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder:text-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 md:col-span-2" 
              />
              <select 
                name="role" 
                className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 md:col-span-2"
              >
                <option value="EMPLOYEE" className="bg-gray-800 text-white">Employee</option>
                <option value="HR" className="bg-gray-800 text-white">HR</option>
                <option value="MANAGER" className="bg-gray-800 text-white">Manager</option>
                <option value="ADMIN" className="bg-gray-800 text-white">Admin</option>
              </select>
              
              <div className="flex gap-3 mt-2 md:col-span-2">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white transition-colors disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Employee"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-lg text-white">Employee Created</h4>
              <button 
                onClick={() => { setSuccessInfo(null); onClose(); }} 
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                <span>📧</span>
                <div className="flex-1">
                  <div className="text-sm text-white/70">Email</div>
                  <div className="font-medium break-all">{successInfo.email}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(successInfo.email, "Email")}
                  className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 border border-white/20 text-sm"
                >
                  Copy
                </button>
              </div>
              {successInfo.tempPassword && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                  <span>🔑</span>
                  <div className="flex-1">
                    <div className="text-sm text-white/70">Temporary Password</div>
                    <div className="font-medium break-all">{successInfo.tempPassword}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(successInfo.tempPassword!, "Password")}
                    className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 border border-white/20 text-sm"
                  >
                    Copy
                  </button>
                </div>
              )}
              <p className="text-sm text-white/70">⚠️ Share this password with the employee and ask them to change it on first login.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => copyToClipboard(`${successInfo.email}${successInfo.tempPassword ? `\n${successInfo.tempPassword}` : ""}`, "Details")}
                  className="flex-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white transition-colors"
                >
                  Copy All
                </button>
                <button 
                  onClick={() => { setSuccessInfo(null); onClose(); }}
                  className="flex-1 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
