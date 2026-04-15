import { useState } from "react";
import { Trash2, Plus, Webhook as WebhookIcon, Play, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useWorkspace } from "@/context/WorkspaceContext";
import { 
  useWorkspaceWebhooks, 
  useCreateWebhook, 
  useDeleteWebhook, 
  useToggleWebhook, 
  useTestWebhook 
} from "@/hooks/useApi";

const EVENT_TYPES = [
  { value: "task.created", label: "Task Created" },
  { value: "task.completed", label: "Task Completed" },
  { value: "task.assigned", label: "Task Assigned" },
  { value: "task.status_changed", label: "Task Status Changed" },
  { value: "comment.added", label: "Comment Added" },
  { value: "member.invited", label: "Member Invited" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function WebhookSettingsModal({ open, onClose }: Props) {
  const { activeWorkspaceId } = useWorkspace();
  const { data: webhooks = [], isLoading } = useWorkspaceWebhooks(activeWorkspaceId || undefined);
  
  const createMutation = useCreateWebhook(activeWorkspaceId || undefined);
  const deleteMutation = useDeleteWebhook(activeWorkspaceId || undefined);
  const toggleMutation = useToggleWebhook(activeWorkspaceId || undefined);
  const testMutation = useTestWebhook();

  const [newUrl, setNewUrl] = useState("");
  const [newEvent, setNewEvent] = useState("");

  const handleCreate = async () => {
    if (!newUrl.trim()) return toast.error("Please enter a payload URL");
    if (!newEvent) return toast.error("Please select an event type");
    try {
      new URL(newUrl);
    } catch {
      return toast.error("Please enter a valid URL");
    }

    try {
      await createMutation.mutateAsync({ url: newUrl.trim(), event_type: newEvent });
      setNewUrl("");
      setNewEvent("");
      toast.success("Webhook created");
    } catch (err) {
      toast.error("Failed to create webhook");
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleMutation.mutateAsync(id);
    } catch (err) {
      toast.error("Failed to toggle webhook");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Webhook deleted");
    } catch (err) {
      toast.error("Failed to delete webhook");
    }
  };

  const handleTest = async (id: string) => {
    try {
      await testMutation.mutateAsync(id);
      toast.success("Test payload dispatched!");
    } catch (err) {
      toast.error("Failed to dispatch test payload");
    }
  };

  const getEventLabel = (value: string) =>
    EVENT_TYPES.find((e) => e.value === value)?.label || value;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <WebhookIcon className="h-5 w-5 text-primary" />
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
            <Button 
                size="sm" 
                onClick={handleCreate} 
                className="gap-1.5 shrink-0"
                disabled={createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Create
            </Button>
          </div>
        </div>

        {/* Active Webhooks */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Active Webhooks
          </h4>
          {isLoading ? (
             <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
             </div>
          ) : webhooks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No webhooks configured</p>
          ) : (
            <div className="space-y-2">
              {webhooks.map((wh: any) => (
                <div
                  key={wh.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 bg-background hover:bg-accent/30 sidebar-transition"
                >
                  <Switch
                    checked={wh.is_active}
                    onCheckedChange={() => handleToggle(wh.id)}
                    disabled={toggleMutation.isPending}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium truncate">{wh.url}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Event: <span className="font-medium text-foreground/70">{getEventLabel(wh.event_type)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                        onClick={() => handleTest(wh.id)}
                        title="Test Webhook"
                        className="rounded-md p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 sidebar-transition shrink-0"
                        disabled={testMutation.isPending}
                    >
                        {testMutation.isPending && testMutation.variables === wh.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                    </button>
                    <button
                        onClick={() => handleDelete(wh.id)}
                        className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 sidebar-transition shrink-0"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
