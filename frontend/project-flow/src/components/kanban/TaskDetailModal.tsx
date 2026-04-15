import { useState, useCallback } from "react";
import { format } from "date-fns";
import {
  X, AlertTriangle, ArrowUp, ArrowDown, ArrowRight,
  Upload, Trash2, Sparkles, Check, XIcon, Send,
  CalendarIcon, Paperclip, FileText, Image as ImageIcon, Loader2,
} from "lucide-react";
import type { Task, Status, Priority, Label, Subtask } from "@/types/kanban";
import { COLUMNS } from "@/types/kanban";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "@/components/shared/UserAvatar";
import { cn } from "@/lib/utils";
import { useCreateComment, useCreateSubtask, useToggleSubtask, useDeleteSubtask, useGenerateAiSubtasks, useWorkspaces, useDeleteTask, useAddTaskLabel, useRemoveTaskLabel, useAddTaskAssignee, useRemoveTaskAssignee, useTaskAttachments, useUploadAttachment, useDeleteAttachment } from "@/hooks/useApi";
import { API_BASE_URL } from "@/lib/api";

const priorityOptions: { value: Priority; label: string; icon: React.ElementType; color: string }[] = [
  { value: "high", label: "High", icon: AlertTriangle, color: "text-destructive" },
  { value: "medium", label: "Medium", icon: ArrowUp, color: "text-amber-500" },
  { value: "low", label: "Low", icon: ArrowDown, color: "text-primary" },
  { value: "none", label: "None", icon: ArrowRight, color: "text-muted-foreground" },
];

interface Props {
  task: any;
  open: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  members: any[];
  labels: any[];
}

export default function TaskDetailModal({ task, open, onClose, onUpdate, members, labels }: Props) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{ id: string; title: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const taskId = task.id;
  const projectId = task.project_id;
  
  const createCommentMutation = useCreateComment(projectId);
  const createSubtaskMutation = useCreateSubtask(projectId);
  const toggleSubtaskMutation = useToggleSubtask(projectId);
  const deleteSubtaskMutation = useDeleteSubtask(projectId);
  const deleteTaskMutation = useDeleteTask(projectId);
  const addLabelMutation = useAddTaskLabel(projectId);
  const removeLabelMutation = useRemoveTaskLabel(projectId);
  const addAssigneeMutation = useAddTaskAssignee(projectId);
  const removeAssigneeMutation = useRemoveTaskAssignee(projectId);

  const { data: attachments = [], isLoading: attachmentsLoading } = useTaskAttachments(taskId);
  const uploadAttachmentMutation = useUploadAttachment(projectId);
  const deleteAttachmentMutation = useDeleteAttachment(projectId);

  const save = useCallback((updates: Partial<Task>) => {
    if (!taskId) return;
    onUpdate(taskId, updates);
  }, [taskId, onUpdate]);

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) save({ title: title.trim() });
  };

  const handleDescBlur = () => {
    if (description !== task.description) save({ description });
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim() || !taskId) return;
    try {
        await createSubtaskMutation.mutateAsync({ taskId, title: newSubtask.trim() });
        setNewSubtask("");
    } catch (err) {}
  };

  const handleToggleSubtask = async (id: string) => {
    if (!taskId || !id) return;
    try {
        await toggleSubtaskMutation.mutateAsync({ taskId, subtaskId: id });
    } catch (err) {}
  };

  const handleDeleteSubtask = async (id: string) => {
    if (!taskId || !id) return;
    try {
        await deleteSubtaskMutation.mutateAsync({ taskId, subtaskId: id });
    } catch (err) {}
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !taskId) return;
    try {
        await createCommentMutation.mutateAsync({ taskId, text: newComment.trim() });
        setNewComment("");
    } catch (err) {}
  };

  const handleDeleteTask = async () => {
    if (!confirm("Are you sure you want to delete this task?") || !taskId) return;
    try {
        await deleteTaskMutation.mutateAsync(taskId);
        onClose();
    } catch (err) {}
  };

  const handleAddLabel = async (labelId: string) => {
    if (!taskId || task.labels?.find((l: any) => l.id === labelId)) return;
    try {
        await addLabelMutation.mutateAsync({ taskId, labelId });
    } catch (err) {}
  };

  const handleRemoveLabel = async (labelId: string) => {
    if (!taskId) return;
    try {
        await removeLabelMutation.mutateAsync({ taskId, labelId });
    } catch (err) {}
  };

  const handleAddAssignee = async (userId: string) => {
    if (!taskId || task.assignees?.find((a: any) => a.id === userId)) return;
    try {
        await addAssigneeMutation.mutateAsync({ taskId, userId });
    } catch (err) {}
  };

  const handleRemoveAssignee = async (userId: string) => {
    if (!taskId) return;
    try {
        await removeAssigneeMutation.mutateAsync({ taskId, userId });
    } catch (err) {}
  };

  const { data: workspaces = [] } = useWorkspaces();
  const generateAiMutation = useGenerateAiSubtasks(projectId);

  const handleAiBreakdown = async () => {
    if (!taskId) return;
    try {
        setAiLoading(true);
        await generateAiMutation.mutateAsync(taskId);
        setAiLoading(false);
    } catch (err) {
        setAiLoading(false);
    }
  };

  const keepAiSuggestion = async (suggestion: { id: string; title: string }) => {
    if (!taskId) return;
    try {
        await createSubtaskMutation.mutateAsync({ taskId, title: suggestion.title });
        setAiSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
    } catch (err) {}
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !taskId) return;

    try {
        setIsUploading(true);
        await uploadAttachmentMutation.mutateAsync({ taskId, file });
        setIsUploading(false);
    } catch (err) {
        setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    if (!id || !confirm("Are you sure you want to delete this attachment?")) return;
    try {
        await deleteAttachmentMutation.mutateAsync(id);
    } catch (err) {}
  };

  const completedCount = task.subtasks?.filter((s: any) => s.is_done).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const dueDate = task.due_date ? new Date(task.due_date) : undefined;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 gap-0 overflow-hidden shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{task.title}</DialogTitle>
          <DialogDescription>Task details and activity</DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 max-h-[85vh]">
          {/* Left Column - 70% */}
          <div className="flex-1 min-w-0 overflow-y-auto p-8 pr-6 space-y-8 border-r border-border bg-card">
            {/* Title */}
            <div className="space-y-1">
                <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="w-full text-2xl font-bold text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground focus:ring-0 truncate"
                placeholder="Task title..."
                />
            </div>

            {/* Description */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <FileText className="h-3.5 w-3.5" /> Description
                </div>
                <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescBlur}
                placeholder="Add a detailed description..."
                className="min-h-[120px] resize-none border-border/50 bg-secondary/10 text-sm leading-relaxed sidebar-transition hover:bg-secondary/20"
                />
            </div>

            {/* Subtasks */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 uppercase tracking-wide">
                    <CheckSquare className="h-4 w-4 text-primary" /> Subtasks
                  </h3>
                  {totalSubtasks > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {completedCount}/{totalSubtasks}
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAiBreakdown}
                  disabled={aiLoading}
                  className="gap-1.5 text-xs border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" /> Gemini Breakdown
                    </>
                  )}
                </Button>
              </div>

              {/* Progress bar */}
              {totalSubtasks > 0 && (
                <div className="h-2 rounded-full bg-secondary/50 mb-4 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary sidebar-transition"
                    style={{ width: `${(completedCount / totalSubtasks) * 100}%` }}
                  />
                </div>
              )}

              {/* Subtask list */}
              <div className="space-y-1">
                {task.subtasks?.map((sub: any) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-secondary/30 group"
                  >
                    <Checkbox
                      checked={sub.is_done}
                      onCheckedChange={() => handleToggleSubtask(sub.id)}
                    />
                    <span className={cn("text-sm flex-1", sub.is_done && "line-through text-muted-foreground")}>
                      {sub.title}
                    </span>
                    <button onClick={() => handleDeleteSubtask(sub.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-4 pl-1">
                <Input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                  placeholder="Add a subtask..."
                  className="h-9 text-sm border-border bg-background"
                />
                <Button size="sm" onClick={handleAddSubtask} disabled={!newSubtask.trim()} className="shrink-0 h-9 font-bold px-4">
                  Add
                </Button>
              </div>
            </div>

            {/* Attachments */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 uppercase tracking-wide">
                  <Paperclip className="h-4 w-4 text-primary" /> Attachments
                </h3>
                <div className="relative">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                  <label htmlFor="file-upload">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="gap-1.5 text-xs cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 px-1">
                        {isUploading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        Upload
                      </div>
                    </Button>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {attachments.map((file: any) => {
                  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.filename);
                  return (
                    <div
                      key={file.id}
                      className="group relative flex items-center gap-3 p-2 rounded-lg border border-border/50 bg-secondary/10 hover:bg-secondary/20 transition-all overflow-hidden"
                    >
                      <div className="h-10 w-10 shrink-0 rounded bg-background flex items-center justify-center overflow-hidden border border-border/50">
                        {isImage ? (
                          <img
                            src={`${API_BASE_URL}${file.url}`}
                            alt={file.filename}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate" title={file.filename}>
                          {file.filename}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(file.uploaded_at), "MMM d")}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={`${API_BASE_URL}${file.url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 px-1.5 rounded bg-background hover:bg-accent text-muted-foreground hover:text-foreground shadow-sm border border-border/50"
                        >
                          <Send className="h-3 w-3" />
                        </a>
                        <button
                          onClick={() => handleDeleteAttachment(file.id)}
                          className="p-1 px-1.5 rounded bg-background hover:bg-destructive/10 text-muted-foreground hover:text-destructive shadow-sm border border-border/50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {attachments.length === 0 && !attachmentsLoading && (
                  <div className="col-span-2 py-4 text-center rounded-lg border border-dashed border-border/50 bg-secondary/5">
                    <p className="text-[11px] text-muted-foreground font-medium italic">No attachments yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Activity / Comments */}
            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 uppercase tracking-wide font-bold">
                <Send className="h-4 w-4 text-primary" /> Activity
              </h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {task.comments?.length === 0 && (
                  <p className="text-xs text-muted-foreground py-10 text-center italic">No activity yet. Be the first to comment!</p>
                )}
                {task.comments?.map((c: any) => (
                  <div key={c.id} className="flex gap-3">
                    <UserAvatar name={c.user?.full_name || "Unknown"} src={c.user?.avatar_url} size="sm" />
                    <div className="flex-1 min-w-0 bg-secondary/10 rounded-xl p-3 border border-border/50">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-xs font-bold text-foreground">{c.user?.full_name || "Unknown"}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(c.created_at), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap">{c.text || c.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-3 mt-6">
                <UserAvatar name="User" size="sm" />
                <div className="flex-1 space-y-2">
                    <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="min-h-[100px] resize-none text-sm border-border focus:ring-1 focus:ring-primary bg-background shadow-inner"
                    />
                    <div className="flex justify-end">
                        <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()} className="font-bold px-6 shadow-md">
                            Post Comment
                        </Button>
                    </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - 30% metadata */}
          <div className="w-[300px] shrink-0 p-6 space-y-6 overflow-y-auto bg-secondary/20">
            <div>
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Properties</h3>
                <div className="space-y-5">
                    {/* Status */}
                    <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 px-0.5">
                        STATUS
                    </label>
                    <Select value={task.status} onValueChange={(v: any) => save({ status: v })}>
                        <SelectTrigger className="h-9 text-xs font-medium border-border/60 bg-background/50">
                        <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                        {COLUMNS.map((col) => (
                            <SelectItem key={col.id} value={col.id}>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color }} />
                                {col.title}
                            </div>
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    </div>

                    {/* Priority */}
                    <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 px-0.5">
                        PRIORITY
                    </label>
                    <Select value={task.priority} onValueChange={(v: any) => save({ priority: v })}>
                        <SelectTrigger className="h-9 text-xs font-medium border-border/60 bg-background/50">
                        <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                        {priorityOptions.map((p) => {
                            const Icon = p.icon;
                            return (
                            <SelectItem key={p.value} value={p.value}>
                                <div className="flex items-center gap-2">
                                <Icon className={cn("h-3.5 w-3.5", p.color)} />
                                {p.label}
                                </div>
                            </SelectItem>
                            );
                        })}
                        </SelectContent>
                    </Select>
                    </div>

                    {/* Labels */}
                    <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 px-0.5">
                        LABELS
                    </label>
                    <div className="flex flex-wrap gap-1 mb-2 min-h-[1.5rem]">
                        {task.labels?.map((l: any) => (
                        <Badge
                            key={l.id}
                            className="text-[9px] h-5 px-1.5 gap-1 shrink-0 bg-transparent border-border hover:bg-secondary/50 items-center justify-between"
                            style={{ borderColor: `${l.color}80`, color: l.color }}
                        >
                            {l.name}
                            <XIcon className="h-2 w-2 cursor-pointer ml-1" onClick={() => handleRemoveLabel(l.id)} />
                        </Badge>
                        ))}
                    </div>
                    <Select onValueChange={(v) => handleAddLabel(v)}>
                        <SelectTrigger className="h-8 text-[11px] border-border/40 bg-background/30">
                        <SelectValue placeholder="Add label..." />
                        </SelectTrigger>
                        <SelectContent>
                        {labels.filter(l => !task.labels?.find((tl: any) => tl.id === l.id)).map((l: any) => (
                            <SelectItem key={l.id} value={l.id}>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                                {l.name}
                            </div>
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    </div>

                    {/* Assignees */}
                    <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 px-0.5">
                        ASSIGNEES
                    </label>
                    <div className="space-y-1.5 mb-2">
                        {task.assignees?.map((a: any) => (
                        <div key={a.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-background/50 border border-border/40 group">
                            <UserAvatar name={a.full_name} src={a.avatar_url} size="xs" />
                            <span className="text-[11px] font-medium text-foreground truncate flex-1">{a.full_name}</span>
                            <button 
                                onClick={() => handleRemoveAssignee(a.id)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-secondary transition-opacity"
                            >
                                <XIcon className="h-2.5 w-2.5" />
                            </button>
                        </div>
                        ))}
                    </div>
                    
                    <Select onValueChange={(v) => handleAddAssignee(v)}>
                        <SelectTrigger className="w-full text-[10px] font-bold h-7 border-dashed flex items-center justify-center gap-1.5 border-border/60 bg-transparent hover:bg-secondary/30">
                             Assign member
                        </SelectTrigger>
                        <SelectContent>
                            {members.filter(m => !task.assignees?.find((ta: any) => ta.id === m.id)).map((m: any) => (
                                <SelectItem key={m.id} value={m.id}>
                                    <div className="flex items-center gap-2">
                                        <UserAvatar name={m.full_name} src={m.avatar_url} size="xs" />
                                        <span>{m.full_name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    </div>

                    {/* Due Date */}
                    <div className="space-y-1.5 pt-2">
                        <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 px-0.5">
                            DUE DATE
                        </label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-xs font-medium h-9 border-border/60 bg-background/50", !dueDate && "text-muted-foreground")}>
                                <CalendarIcon className="h-3.5 w-3.5 mr-2" />
                                {dueDate ? format(dueDate, "MMM d, yyyy") : "Set due date"}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={dueDate}
                                onSelect={(d) => save({ due_date: d ? d.toISOString() : undefined })}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-border mt-auto">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleDeleteTask}
                    className="w-full text-destructive hover:bg-destructive/10 text-[11px] font-bold uppercase tracking-wider h-8"
                >
                    Delete Task
                </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CheckSquare(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
}

