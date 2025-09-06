"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { FileText, Clock } from "lucide-react";

interface TimerReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (report: { type: string; content: string }) => Promise<void>;
  workDuration: number; // in seconds
}

export default function TimerReportModal({ isOpen, onClose, onSubmit, workDuration }: TimerReportModalProps) {
  const [type, setType] = useState("DAILY");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Please describe what you worked on");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ type, content });
      setContent("");
      setType("DAILY");
      onClose();
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report");
    } finally {
      setLoading(false);
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      // Don't allow closing by clicking backdrop - report is mandatory
      toast.warning("Please submit a report before closing");
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" 
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white/10 backdrop-blur-xl border border-white/20 text-white w-full max-w-lg rounded-2xl p-6 shadow-2xl glass-light" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-lg text-white">Work Report Required</h4>
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <Clock className="w-4 h-4" />
                <span>Worked for {formatDuration(workDuration)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-white/80 text-sm">
            📝 Please describe what you accomplished during this work session before stopping the timer.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Report Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40"
            >
              <option value="DAILY" className="bg-gray-800 text-white">Daily Report</option>
              <option value="TASK" className="bg-gray-800 text-white">Task Report</option>
              <option value="PROJECT" className="bg-gray-800 text-white">Project Report</option>
              <option value="CUSTOM" className="bg-gray-800 text-white">Custom Report</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">What did you work on?</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe your tasks, accomplishments, and any important updates..."
              className="w-full px-3 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 placeholder:text-white/50 resize-none"
              rows={4}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="submit" 
              disabled={loading || !content.trim()}
              className="flex-1 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Submit Report & Stop Timer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
