import { Card as CardType } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, AlignLeft, Calendar } from "lucide-react";
import { format, isPast, isToday } from "date-fns";

interface BoardCardProps {
  card: CardType;
  onClick: () => void;
}

const BoardCard = ({ card, onClick }: BoardCardProps) => {
  const isOverdue = card.deadline ? isPast(new Date(card.deadline)) && !isToday(new Date(card.deadline)) : false;
  const isDueToday = card.deadline ? isToday(new Date(card.deadline)) : false;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border border-border/50 bg-kanban-card p-3 hover:bg-kanban-card-hover shadow-sm hover:shadow-md transition-all duration-150 cursor-grab active:cursor-grabbing active:shadow-lg active:scale-[1.02] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {card.labels.length > 0 && (
        <div className="flex gap-1.5 mb-2 flex-wrap">
          {card.labels.map((label) => (
            <span key={label.id} className="h-1.5 w-8 rounded-full" style={{ backgroundColor: `hsl(${label.color})` }} />
          ))}
        </div>
      )}

      <p className="text-sm font-medium leading-snug mb-2">{card.title}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          {card.description && <AlignLeft className="h-3.5 w-3.5" />}
          {card.hasComments && (
            <span className="flex items-center gap-0.5 text-xs">
              <MessageSquare className="h-3.5 w-3.5" />
              {card.comments.length}
            </span>
          )}
          {card.deadline && (
            <span className={`flex items-center gap-1 text-xs rounded px-1.5 py-0.5 font-medium ${
              isOverdue ? "bg-destructive/10 text-destructive" : isDueToday ? "bg-warning/10 text-warning" : "bg-secondary"
            }`}>
              <Calendar className="h-3 w-3" />
              {format(new Date(card.deadline), "MMM d")}
            </span>
          )}
        </div>

        {card.assignees.length > 0 && (
          <div className="flex -space-x-1.5">
            {card.assignees.slice(0, 3).map((user) => (
              <Avatar key={user.id} className="h-6 w-6 border-2 border-kanban-card">
                <AvatarFallback className="text-[9px] bg-secondary font-medium">{user.initials}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        )}
      </div>
    </button>
  );
};

export default BoardCard;
