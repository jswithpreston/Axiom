"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";

export default function SettingsPage() {
  const [dailyStudyHours, setDailyStudyHours] = useState<number>(8);

  return (
    <>
      <TopBar title="Settings" subtitle="System configuration" />

      <div className="flex flex-col gap-6 p-4 md:p-6">
        <Card title="STUDY PREFERENCES">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="daily-hours"
                className="text-xs uppercase tracking-wider text-axiom-muted"
              >
                Daily Study Hours
              </label>
              <input
                id="daily-hours"
                type="number"
                min={1}
                max={24}
                value={dailyStudyHours}
                onChange={(e) =>
                  setDailyStudyHours(
                    Math.max(1, Math.min(24, Number(e.target.value)))
                  )
                }
                className="w-32 rounded-md border border-axiom-border bg-axiom-bg px-3 py-2 text-sm text-axiom-text outline-none transition-colors focus:border-axiom-accent focus:ring-1 focus:ring-axiom-accent"
              />
            </div>

            <p className="text-xs text-axiom-muted">
              Settings are stored locally.
            </p>
          </div>
        </Card>

        <Card title="SYSTEM">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-axiom-muted">Version</span>
              <span className="text-sm text-axiom-text">Axiom v1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-axiom-muted">Engine</span>
              <span className="text-sm text-axiom-text">
                SM-2 Spaced Repetition
              </span>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
