export type Priority = "high" | "medium" | "low" | "none";
export type Status = "todo" | "in_progress" | "in_review" | "done";

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  labels: Label[];
  assignees: any[];
  subtasks: any[];
  comments: any[];
  project_id: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: Status;
  title: string;
  color: string;
}

export const COLUMNS: Column[] = [
  { id: "todo", title: "To Do", color: "hsl(220 9% 46%)" },
  { id: "in_progress", title: "In Progress", color: "hsl(217 91% 60%)" },
  { id: "in_review", title: "In Review", color: "hsl(38 92% 50%)" },
  { id: "done", title: "Done", color: "hsl(142 71% 45%)" },
];

export const LABELS: Label[] = [
  { id: "l1", name: "Frontend", color: "hsl(217 91% 60%)" },
  { id: "l2", name: "Backend", color: "hsl(142 71% 45%)" },
  { id: "l3", name: "Bug", color: "hsl(0 84% 60%)" },
  { id: "l4", name: "Design", color: "hsl(280 67% 55%)" },
  { id: "l5", name: "DevOps", color: "hsl(38 92% 50%)" },
  { id: "l6", name: "Docs", color: "hsl(190 80% 42%)" },
];

