import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AddCardInputProps {
  onAdd: (title: string) => void;
}

const AddCardInput = ({ onAdd }: AddCardInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");

  const handleSubmit = () => {
    if (title.trim()) {
      onAdd(title.trim());
      setTitle("");
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      setIsOpen(false);
      setTitle("");
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
      >
        <Plus className="h-4 w-4" /> Add a card
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter a title for this card..."
        className="min-h-[60px] resize-none text-sm bg-kanban-card border-border/50"
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSubmit}>Add card</Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setIsOpen(false); setTitle(""); }}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default AddCardInput;
