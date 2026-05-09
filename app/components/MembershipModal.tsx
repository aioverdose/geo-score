"use client";

import { X, Check } from "lucide-react";
import { upgradeToPro } from "@/lib/mock-auth";

interface MembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: "limit-reached" | "pro-feature";
  auditRemaining?: number;
}

export default function MembershipModal({
  isOpen,
  onClose,
  reason,
  auditRemaining,
}: MembershipModalProps) {
  if (!isOpen) return null;

  const handleUpgrade = () => {
    upgradeToPro();
    onClose();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-96 overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Upgrade to Pro</h2>
            <p className="text-cyan-100 text-sm mt-1">
              {reason === "limit-reached"
                ? `You've used your ${5 - (auditRemaining || 0)} free audits this month`
                : "This feature is available on Pro"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/10 p-2 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Comparison Table */}
          <div className="grid grid-cols-2 gap-6">
            {/* Free Tier */}
            <div className="border border-slate-700 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-200">Free</h3>
              <div className="space-y-3">
                {[
                  "5 audits/month",
                  "NAP audit",
                  "AI Visibility check",
                  "Quick Fix Wizard",
                  "Trends chart",
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-400">
                    <Check size={16} className="text-emerald-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
                {["PDF Reports", "Review Automation", "Unlimited audits"].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <X size={16} className="text-slate-600 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro Tier */}
            <div className="border-2 border-cyan-500 rounded-lg p-6 space-y-4 bg-cyan-500/5 relative">
              <div className="absolute -top-3 left-4 bg-cyan-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                RECOMMENDED
              </div>
              <h3 className="text-lg font-bold text-cyan-400">Pro - $19/month</h3>
              <div className="space-y-3">
                {[
                  "Unlimited audits",
                  "NAP audit",
                  "AI Visibility check",
                  "Quick Fix Wizard",
                  "Trends chart",
                  "PDF Reports ⭐",
                  "Review Automation ⭐",
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check size={16} className="text-cyan-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition"
            >
              Maybe Later
            </button>
            <button
              onClick={handleUpgrade}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-semibold transition"
            >
              Upgrade Now (Demo)
            </button>
          </div>

          <p className="text-xs text-slate-500 text-center">
            💡 This is a demo. In production, "Upgrade Now" will open Stripe Checkout.
          </p>
        </div>
      </div>
    </div>
  );
}
