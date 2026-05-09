"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, Copy, ExternalLink } from "lucide-react";
import type { ActionItem } from "@/lib/action-items";
import type { NAPAudit } from "@/lib/nap-parser";

interface QuickFixWizardProps {
  actionItems: ActionItem[];
  audit: NAPAudit;
}

export default function QuickFixWizard({ actionItems, audit }: QuickFixWizardProps) {
  const [wizardStep, setWizardStep] = useState(0);
  const [fixedSteps, setFixedSteps] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);

  if (actionItems.length === 0) {
    return (
      <div className="p-8 text-center space-y-3">
        <Check size={32} className="mx-auto text-emerald-400 opacity-50" />
        <p className="text-slate-400 font-medium">All NAP data is consistent across sources!</p>
        <p className="text-xs text-slate-500">No action items needed. Your business is optimized.</p>
      </div>
    );
  }

  const currentItem = actionItems[wizardStep];
  const isFixed = fixedSteps.has(wizardStep);
  const napText = `${audit.canonical.name}\n${audit.canonical.address || ""}\n${
    audit.canonical.phone || ""
  }`;

  const handleCopyNAP = async () => {
    await navigator.clipboard.writeText(napText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleFixed = () => {
    const newFixed = new Set(fixedSteps);
    if (newFixed.has(wizardStep)) {
      newFixed.delete(wizardStep);
    } else {
      newFixed.add(wizardStep);
    }
    setFixedSteps(newFixed);
  };

  return (
    <div className="p-5 space-y-5">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">
            Issue {wizardStep + 1} of {actionItems.length}
          </span>
          <span className="text-slate-500">{fixedSteps.size} fixed</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-cyan-500 h-full transition-all duration-300"
            style={{ width: `${((wizardStep + 1) / actionItems.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Item */}
      <div className={`border rounded-lg p-6 space-y-4 transition-opacity ${isFixed ? "opacity-60" : ""}`}>
        {/* Priority & Platform */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded text-xs font-bold ${
                currentItem.priority === "high"
                  ? "bg-red-900/40 text-red-400"
                  : currentItem.priority === "medium"
                    ? "bg-yellow-900/40 text-yellow-400"
                    : "bg-blue-900/40 text-blue-400"
              }`}
            >
              {currentItem.priority.toUpperCase()}
            </span>
            <span className="text-lg font-semibold text-slate-200">{currentItem.platform}</span>
          </div>
          <span className="text-xs bg-slate-700 text-slate-400 px-3 py-1 rounded">+{currentItem.impactPoints} pts</span>
        </div>

        {/* Fix Description */}
        <div>
          <p className="text-sm text-slate-300 mb-2 font-medium">{currentItem.fix}</p>
          <p className="text-xs text-slate-500 leading-relaxed">{currentItem.issue}</p>
        </div>

        {/* Steps */}
        <div className="bg-slate-800/50 rounded border border-slate-700/50 p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Steps to Fix</p>
          <ol className="space-y-2">
            {currentItem.steps.map((step, idx) => (
              <li key={idx} className="flex gap-2 text-xs text-slate-300">
                <span className="font-semibold text-slate-500 flex-shrink-0 min-w-fit">{idx + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-slate-700">
          <button
            onClick={() => window.open(currentItem.directUrl, "_blank")}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            Open {currentItem.platform} <ExternalLink size={14} />
          </button>
          <button
            onClick={handleCopyNAP}
            className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Copy size={14} />
            {copied ? "Copied" : "Copy NAP"}
          </button>
        </div>

        {/* Fixed Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer pt-2">
          <input
            type="checkbox"
            checked={isFixed}
            onChange={handleToggleFixed}
            className="w-4 h-4 rounded border border-slate-600 bg-slate-800 accent-emerald-500"
          />
          <span className="text-xs text-slate-400">Mark as fixed</span>
        </label>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWizardStep(Math.max(0, wizardStep - 1))}
          disabled={wizardStep === 0}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <div className="flex gap-1">
          {actionItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setWizardStep(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === wizardStep ? "bg-cyan-500 w-6" : fixedSteps.has(idx) ? "bg-emerald-500" : "bg-slate-700"
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setWizardStep(Math.min(actionItems.length - 1, wizardStep + 1))}
          disabled={wizardStep === actionItems.length - 1}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
