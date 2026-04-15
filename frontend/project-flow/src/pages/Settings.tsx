import { useState } from "react";
import { Settings as SettingsIcon, Webhook, Building2, ChevronLeft } from "lucide-react";
import WebhookSettingsModal from "@/components/settings/WebhookSettingsModal";
import GeneralSettings from "@/components/settings/GeneralSettings";
import { cn } from "@/lib/utils";

type SettingsView = "list" | "general" | "webhooks";

export default function SettingsPage() {
  const [view, setView] = useState<SettingsView>("list");
  const [webhookOpen, setWebhookOpen] = useState(false);

  const settingsCards = [
    {
      id: "general",
      title: "General",
      description: "Manage workspace name, logo, and unique slug.",
      icon: Building2,
      action: () => setView("general"),
    },
    {
      id: "webhooks",
      title: "Outbound Integrations",
      description: "Configure webhooks to send real-time events to external services.",
      icon: Webhook,
      action: () => setWebhookOpen(true),
    },
  ];

  if (view === "general") {
    return (
      <div className="max-w-4xl animate-in fade-in slide-in-from-left-2 duration-300">
        <button 
          onClick={() => setView("list")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Settings
        </button>
        
        <div className="flex items-center gap-2.5 mb-8">
            <Building2 className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">General Settings</h1>
        </div>

        <GeneralSettings />
      </div>
    );
  }

  return (
    <div className="max-w-3xl animate-in fade-in duration-300">
      <div className="flex items-center gap-2.5 mb-8">
        <SettingsIcon className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Workspace Settings</h1>
      </div>

      <div className="grid gap-4">
        {settingsCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={card.action}
              className="flex items-center gap-5 rounded-2xl border border-border bg-card p-5 text-left hover:bg-accent/30 hover:border-border/80 transition-all group shadow-sm hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all shrink-0">
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold text-foreground">{card.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{card.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <WebhookSettingsModal open={webhookOpen} onClose={() => setWebhookOpen(false)} />
    </div>
  );
}
