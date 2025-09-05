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
          alert(`Employee created successfully!\n\nTemporary password: ${result.tempPassword}\n\nPlease share this with the employee and ask them to change it on first login.`);
        } else {
          alert("Employee created successfully!");
        }
        onCreated();
        onClose();
      } else {
        const d = await res.json().catch(() => ({}));
        alert(`Failed to create employee: ${d.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating employee:", error);
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" 
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-card text-foreground w-full max-w-lg rounded-2xl border p-6 shadow-2xl" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-lg">New Employee</h4>
          <button 
            onClick={onClose} 
            className="px-3 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={addEmployee} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input 
            name="firstName" 
            placeholder="First name" 
            required 
            className="px-3 py-2 rounded-xl bg-muted text-foreground placeholder:text-muted-foreground border border-border focus:bg-card focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
          <input 
            name="lastName" 
            placeholder="Last name" 
            required 
            className="px-3 py-2 rounded-xl bg-muted text-foreground placeholder:text-muted-foreground border border-border focus:bg-card focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
          <input 
            name="email" 
            type="email" 
            placeholder="Email" 
            required 
            className="px-3 py-2 rounded-xl bg-muted text-foreground placeholder:text-muted-foreground border border-border focus:bg-card focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2" 
          />
          <select 
            name="role" 
            className="px-3 py-2 rounded-xl bg-muted text-foreground border border-border focus:bg-card focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="HR">HR</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
          
          <div className="flex gap-3 mt-2 md:col-span-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-colors disabled:opacity-50"
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
