import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TopNav from "@/components/layout/TopNav";
import BoardList from "@/components/board/BoardList";
import TaskDetailModal from "@/components/board/TaskDetailModal";
import { boards as initialBoards, currentUser } from "@/data/mockData";
import { Board, Card as CardType, List } from "@/types";
import { toast } from "sonner";

const BoardView = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [boards, setBoards] = useState<Board[]>(initialBoards);
  const board = boards.find((b) => b.id === boardId);

  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [showAddList, setShowAddList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");

  if (!board) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav title="Board not found" />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">This board doesn't exist.</p>
            <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  const updateBoard = (updater: (b: Board) => Board) => {
    setBoards((prev) => prev.map((b) => b.id === boardId ? updater(b) : b));
  };

  const handleAddCard = (listId: string, title: string) => {
    const newCard: CardType = {
      id: `c${Date.now()}`, title, description: "", listId,
      assignees: [], deadline: null, hasComments: false, comments: [],
      position: 0, labels: [], createdAt: new Date().toISOString(),
    };
    updateBoard((b) => ({
      ...b,
      lists: b.lists.map((l) => l.id === listId ? { ...l, cards: [...l.cards, newCard] } : l),
    }));
  };

  const handleAddList = () => {
    if (!newListTitle.trim()) return;
    const newList: List = {
      id: `list${Date.now()}`, title: newListTitle.trim(), boardId: board.id,
      cards: [], position: board.lists.length,
    };
    updateBoard((b) => ({ ...b, lists: [...b.lists, newList] }));
    setNewListTitle("");
    setShowAddList(false);
    toast.success("List added");
  };

  const handleDeleteList = (listId: string) => {
    updateBoard((b) => ({ ...b, lists: b.lists.filter((l) => l.id !== listId) }));
    toast.success("List deleted");
  };

  const handleRenameList = (listId: string, title: string) => {
    updateBoard((b) => ({ ...b, lists: b.lists.map((l) => l.id === listId ? { ...l, title } : l) }));
  };

  const handleUpdateCard = (updatedCard: CardType) => {
    updateBoard((b) => ({
      ...b,
      lists: b.lists.map((l) => ({
        ...l,
        cards: l.cards.map((c) => c.id === updatedCard.id ? updatedCard : c),
      })),
    }));
  };

  return (
    <div className="flex min-h-screen flex-col bg-kanban-bg">
      <TopNav title={board.name} subtitle="Board" />
      <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">{board.name}</h2>
      </div>

      {/* Board content */}
      <div className="flex-1 overflow-x-auto px-4 pb-6 lg:px-6">
        <div className="flex gap-4 items-start">
          {board.lists.map((list) => (
            <BoardList
              key={list.id}
              list={list}
              onCardClick={setSelectedCard}
              onAddCard={handleAddCard}
              onDeleteList={handleDeleteList}
              onRenameList={handleRenameList}
            />
          ))}

          {/* Add list */}
          {showAddList ? (
            <div className="w-72 shrink-0 rounded-xl bg-kanban-list border border-border/30 p-3 space-y-2">
              <Input
                autoFocus
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddList(); if (e.key === "Escape") setShowAddList(false); }}
                placeholder="List title..."
                className="h-9"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddList}>Add list</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowAddList(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddList(true)}
              className="flex w-72 shrink-0 items-center gap-2 rounded-xl border border-dashed border-border/50 bg-kanban-list/50 px-4 py-3 text-sm text-muted-foreground hover:bg-kanban-list hover:border-border transition-colors"
            >
              <Plus className="h-4 w-4" /> Add another list
            </button>
          )}
        </div>
      </div>

      <TaskDetailModal
        card={selectedCard}
        open={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        onUpdate={handleUpdateCard}
      />
    </div>
  );
};

export default BoardView;
