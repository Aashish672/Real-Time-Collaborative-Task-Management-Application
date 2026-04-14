import { useState } from "react";
import { Settings, Webhook, Building2, Shield } from "lucide-react";
import WebhookSettingsModal from "@/components/settings/WebhookSettingsModal";

export default function SettingsPage() {
  const [webhookOpen, setWebhookOpen] = useState(false);

  const settingsCards = [
    {
      title: "Outbound Integrations",
      description: "Configure webhooks to send real-time events to external services.",
      icon: Webhook,
      action: () => setWebhookOpen(true),
    },
    {
      title: "General",
      description: "Workspace name, logo, and default preferences.",
      icon: Building2,
      action: () => {},
    },
    {
      title: "Security",
      description: "Manage API keys, SSO, and authentication policies.",
      icon: Shield,
      action: () => {},
    },
  ];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2.5 mb-6">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold text-foreground">Workspace Settings</h1>
      </div>

      <div className="grid gap-3">
        {settingsCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.title}
              onClick={card.action}
              className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 text-left hover:bg-accent/30 hover:border-border/80 sidebar-transition group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground group-hover:text-foreground sidebar-transition shrink-0">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{card.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <WebhookSettingsModal open={webhookOpen} onClose={() => setWebhookOpen(false)} />
    </div>
  );
}
