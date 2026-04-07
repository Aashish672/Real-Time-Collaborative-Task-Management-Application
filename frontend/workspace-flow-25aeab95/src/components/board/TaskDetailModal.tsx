import { useState } from "react";
import { format } from "date-fns";
import { AlignLeft, Calendar as CalendarIcon, MessageSquare, Users as UsersIcon, X, Send } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card as CardType, User, Comment } from "@/types";
import { users, currentUser } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface TaskDetailModalProps {
  card: CardType | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (card: CardType) => void;
}

const TaskDetailModal = ({ card, open, onClose, onUpdate }: TaskDetailModalProps) => {
  const [title, setTitle] = useState(card?.title ?? "");
  const [description, setDescription] = useState(card?.description ?? "");
  const [deadline, setDeadline] = useState<Date | undefined>(card?.deadline ? new Date(card.deadline) : undefined);
  const [assignees, setAssignees] = useState<User[]>(card?.assignees ?? []);
  const [comments, setComments] = useState<Comment[]>(card?.comments ?? []);
  const [newComment, setNewComment] = useState("");

  if (!card) return null;

  const handleSave = () => {
    onUpdate({
      ...card,
      title, description,
      deadline: deadline ? deadline.toISOString().split("T")[0] : null,
      assignees, comments,
      hasComments: comments.length > 0,
    });
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = { id: `cm${Date.now()}`, text: newComment.trim(), author: currentUser, createdAt: new Date().toISOString() };
    setComments((prev) => [...prev, comment]);
    setNewComment("");
  };

  const toggleAssignee = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    setAssignees((prev) => prev.find((a) => a.id === userId) ? prev.filter((a) => a.id !== userId) : [...prev, user]);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { handleSave(); onClose(); } }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
        <div className="p-6 space-y-6">
          {/* Title */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-semibold border-0 px-0 h-auto focus-visible:ring-0 bg-transparent"
            placeholder="Task title"
          />

          {/* Labels */}
          {card.labels.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {card.labels.map((label) => (
                <span key={label.id} className="text-xs font-medium px-2.5 py-1 rounded-full text-primary-foreground" style={{ backgroundColor: `hsl(${label.color})` }}>
                  {label.name}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="md:col-span-2 space-y-5">
              {/* Description */}
              <div>
                <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                  <AlignLeft className="h-4 w-4" /> Description
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a more detailed description..."
                  className="min-h-[120px] resize-none"
                />
              </div>

              <Separator />

              {/* Comments */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                  <MessageSquare className="h-4 w-4" /> Comments
                </div>
                <div className="space-y-3 mb-4">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-2.5">
                      <Avatar className="h-7 w-7 mt-0.5 shrink-0">
                        <AvatarFallback className="text-[10px] bg-secondary">{c.author.initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-medium">{c.author.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(c.createdAt), "MMM d, h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    onKeyDown={(e) => { if (e.key === "Enter") addComment(); }}
                    className="flex-1"
                  />
                  <Button size="icon" onClick={addComment} className="shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Assignees */}
              <div>
                <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                  <UsersIcon className="h-4 w-4" /> Assignees
                </div>
                <Select onValueChange={toggleAssignee}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Add member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        <span className="flex items-center gap-2">
                          {assignees.find((a) => a.id === u.id) ? "✓ " : ""}{u.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {assignees.map((a) => (
                    <span key={a.id} className="flex items-center gap-1 text-xs bg-secondary rounded-full px-2 py-1">
                      {a.initials}
                      <button onClick={() => toggleAssignee(a.id)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Deadline */}
              <div>
                <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                  <CalendarIcon className="h-4 w-4" /> Deadline
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !deadline && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadline ? format(deadline, "PPP") : "Set deadline"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={deadline} onSelect={setDeadline} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
                {deadline && (
                  <Button variant="ghost" size="sm" className="mt-1 text-xs text-muted-foreground" onClick={() => setDeadline(undefined)}>
                    Remove deadline
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailModal;
