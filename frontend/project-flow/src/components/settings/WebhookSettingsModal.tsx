import { useState } from "react";
import { Trash2, Plus, Webhook } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface WebhookEntry {
  id: string;
  url: string;
  event: string;
  enabled: boolean;
}

const EVENT_TYPES = [
  { value: "task.created", label: "Task Created" },
  { value: "task.completed", label: "Task Completed" },
  { value: "task.assigned", label: "Task Assigned" },
  { value: "task.status_changed", label: "Task Status Changed" },
  { value: "comment.added", label: "Comment Added" },
  { value: "member.invited", label: "Member Invited" },
];

const INITIAL_WEBHOOKS: WebhookEntry[] = [
  { id: "wh1", url: "https://hooks.slack.com/services/T00/B00/abc", event: "task.completed", enabled: true },
  { id: "wh2", url: "https://api.example.com/webhooks/tasks", event: "task.created", enabled: false },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function WebhookSettingsModal({ open, onClose }: Props) {
  const [webhooks, setWebhooks] = useState<WebhookEntry[]>(INITIAL_WEBHOOKS);
  const [newUrl, setNewUrl] = useState("");
  const [newEvent, setNewEvent] = useState("");

  const handleCreate = () => {
    if (!newUrl.trim()) return toast.error("Please enter a payload URL");
    if (!newEvent) return toast.error("Please select an event type");
    try {
      new URL(newUrl);
    } catch {
      return toast.error("Please enter a valid URL");
    }

    const webhook: WebhookEntry = {
      id: `wh${Date.now()}`,
      url: newUrl.trim(),
      event: newEvent,
      enabled: true,
    };
    setWebhooks((prev) => [...prev, webhook]);
    setNewUrl("");
    setNewEvent("");
    toast.success("Webhook created");
  };

  const toggleWebhook = (id: string) => {
    setWebhooks((prev) =>
      prev.map((wh) => (wh.id === id ? { ...wh, enabled: !wh.enabled } : wh))
    );
  };

  const deleteWebhook = (id: string) => {
    setWebhooks((prev) => prev.filter((wh) => wh.id !== id));
    toast.success("Webhook deleted");
  };

  const getEventLabel = (value: string) =>
    EVENT_TYPES.find((e) => e.value === value)?.label || value;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-primary" />
            Outbound Integrations
          </DialogTitle>
          <DialogDescription>
            Send real-time event payloads to external services when actions occur in your workspace.
          </DialogDescription>
        </DialogHeader>

        {/* Add New Webhook */}
        <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Webhook</h4>
          <Input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://your-service.com/webhook"
            className="h-9 text-sm"
          />
          <div className="flex items-center gap-2">
            <Select value={newEvent} onValueChange={setNewEvent}>
              <SelectTrigger className="h-9 text-sm flex-1">
                <SelectValue placeholder="Select event type..." />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleCreate} className="gap-1.5 shrink-0">
              <Plus className="h-3.5 w-3.5" />
              Create
            </Button>
          </div>
        </div>

        {/* Active Webhooks */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Active Webhooks
          </h4>
          {webhooks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No webhooks configured</p>
          ) : (
            <div className="space-y-2">
              {webhooks.map((wh) => (
                <div
                  key={wh.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 bg-background hover:bg-accent/30 sidebar-transition"
                >
                  <Switch
                    checked={wh.enabled}
                    onCheckedChange={() => toggleWebhook(wh.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium truncate">{wh.url}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Event: <span className="font-medium text-foreground/70">{getEventLabel(wh.event)}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => deleteWebhook(wh.id)}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 sidebar-transition shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
