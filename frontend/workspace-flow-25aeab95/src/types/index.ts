export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  initials: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  members: User[];
  boards: Board[];
  createdAt: string;
}

export interface Board {
  id: string;
  name: string;
  workspaceId: string;
  color: string;
  lists: List[];
  updatedAt: string;
}

export interface List {
  id: string;
  title: string;
  boardId: string;
  cards: Card[];
  position: number;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  listId: string;
  assignees: User[];
  deadline: string | null;
  hasComments: boolean;
  comments: Comment[];
  position: number;
  labels: Label[];
  createdAt: string;
}

export interface Comment {
  id: string;
  text: string;
  author: User;
  createdAt: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'assignment' | 'move' | 'comment' | 'mention';
  read: boolean;
  createdAt: string;
  user: User;
}
