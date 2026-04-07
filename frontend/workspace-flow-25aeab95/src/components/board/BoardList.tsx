import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { List, Card as CardType } from "@/types";
import BoardCard from "./BoardCard";
import AddCardInput from "./AddCardInput";

interface BoardListProps {
  list: List;
  onCardClick: (card: CardType) => void;
  onAddCard: (listId: string, title: string) => void;
  onDeleteList: (listId: string) => void;
  onRenameList: (listId: string, title: string) => void;
}

const BoardList = ({ list, onCardClick, onAddCard, onDeleteList, onRenameList }: BoardListProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(list.title);

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      onRenameList(list.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-kanban-list border border-border/30 max-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1">
            <Input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveTitle(); if (e.key === "Escape") setIsEditing(false); }}
              className="h-7 text-sm font-semibold"
            />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSaveTitle}><Check className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(false)}><X className="h-3.5 w-3.5" /></Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{list.title}</h3>
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-secondary px-1.5 text-[10px] font-medium text-muted-foreground">
                {list.cards.length}
              </span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setEditTitle(list.title); setIsEditing(true); }}><Pencil className="mr-2 h-4 w-4" /> Rename</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDeleteList(list.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 scrollbar-thin">
        {list.cards.map((card) => (
          <BoardCard key={card.id} card={card} onClick={() => onCardClick(card)} />
        ))}
      </div>

      {/* Add card */}
      <div className="px-2 pb-2">
        <AddCardInput onAdd={(title) => onAddCard(list.id, title)} />
      </div>
    </div>
  );
};

export default BoardList;
