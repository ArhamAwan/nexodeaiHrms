"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
}

export default function AddEmployeeModal({ isOpen, onClose, onCreated }: AddEmployeeModalProps) {
  const [loading, setLoading] = useState(false);

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
        if (result.tempPassword) {
          alert(`✅ Employee created successfully!\n\n📧 Email: ${data.email}\n🔑 Temporary Password: ${result.tempPassword}\n\n⚠️ Please share this password with the employee and ask them to change it on first login.`);
        } else {
          alert(`✅ Employee created successfully!\n\n📧 Email: ${data.email}`);
        }
        onCreated();
        onClose();
      } else {
        const d = await res.json().catch(() => ({}));
        alert(`❌ Failed to create employee: ${d.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating employee:", error);
      alert(`❌ Error creating employee: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      </div>
    </div>,
    document.body
  );
}
