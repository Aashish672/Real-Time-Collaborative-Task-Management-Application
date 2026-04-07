import { User, Workspace, Board, List, Card, Notification, Label } from "@/types";

export const currentUser: User = {
  id: "u1",
  name: "Alex Morgan",
  email: "alex@example.com",
  avatar: "",
  initials: "AM",
};

export const users: User[] = [
  currentUser,
  { id: "u2", name: "Jamie Chen", email: "jamie@example.com", avatar: "", initials: "JC" },
  { id: "u3", name: "Sam Rivera", email: "sam@example.com", avatar: "", initials: "SR" },
  { id: "u4", name: "Taylor Kim", email: "taylor@example.com", avatar: "", initials: "TK" },
  { id: "u5", name: "Casey Brooks", email: "casey@example.com", avatar: "", initials: "CB" },
];

export const labels: Label[] = [
  { id: "l1", name: "Bug", color: "0 72% 51%" },
  { id: "l2", name: "Feature", color: "217 91% 60%" },
  { id: "l3", name: "Enhancement", color: "142 71% 45%" },
  { id: "l4", name: "Urgent", color: "38 92% 50%" },
];

const cards1: Card[] = [
  {
    id: "c1", title: "Design new landing page mockups", description: "Create high-fidelity mockups for the new marketing landing page. Include desktop and mobile variants.", listId: "list1",
    assignees: [users[0], users[1]], deadline: "2026-04-10", hasComments: true, comments: [
      { id: "cm1", text: "Started working on the hero section", author: users[1], createdAt: "2026-04-05T10:00:00Z" },
    ], position: 0, labels: [labels[1]], createdAt: "2026-04-01T08:00:00Z",
  },
  {
    id: "c2", title: "Set up CI/CD pipeline", description: "", listId: "list1",
    assignees: [users[2]], deadline: "2026-04-15", hasComments: false, comments: [], position: 1, labels: [labels[2]], createdAt: "2026-04-02T09:00:00Z",
  },
  {
    id: "c3", title: "Fix authentication redirect bug", description: "Users are being redirected to 404 after OAuth login.", listId: "list1",
    assignees: [users[0]], deadline: "2026-04-05", hasComments: true, comments: [
      { id: "cm2", text: "Reproduced on staging", author: users[0], createdAt: "2026-04-04T14:00:00Z" },
    ], position: 2, labels: [labels[0], labels[3]], createdAt: "2026-04-03T11:00:00Z",
  },
];

const cards2: Card[] = [
  {
    id: "c4", title: "Implement user profile page", description: "Build the user profile page with edit functionality.", listId: "list2",
    assignees: [users[1], users[3]], deadline: "2026-04-12", hasComments: false, comments: [], position: 0, labels: [labels[1]], createdAt: "2026-04-02T10:00:00Z",
  },
  {
    id: "c5", title: "API rate limiting", description: "Add rate limiting middleware to prevent abuse.", listId: "list2",
    assignees: [users[2]], deadline: null, hasComments: false, comments: [], position: 1, labels: [labels[2]], createdAt: "2026-04-03T08:00:00Z",
  },
];

const cards3: Card[] = [
  {
    id: "c6", title: "Code review: payment module", description: "Review the Stripe integration PR.", listId: "list3",
    assignees: [users[3]], deadline: "2026-04-08", hasComments: true, comments: [
      { id: "cm3", text: "Looks good, minor comments left", author: users[3], createdAt: "2026-04-06T16:00:00Z" },
    ], position: 0, labels: [], createdAt: "2026-04-04T09:00:00Z",
  },
];

const cards4: Card[] = [
  {
    id: "c7", title: "Deploy v2.1 to production", description: "Completed deployment of v2.1.", listId: "list4",
    assignees: [users[0], users[2]], deadline: "2026-04-03", hasComments: false, comments: [], position: 0, labels: [labels[2]], createdAt: "2026-04-01T07:00:00Z",
  },
];

const lists: List[] = [
  { id: "list1", title: "To Do", boardId: "b1", cards: cards1, position: 0 },
  { id: "list2", title: "In Progress", boardId: "b1", cards: cards2, position: 1 },
  { id: "list3", title: "In Review", boardId: "b1", cards: cards3, position: 2 },
  { id: "list4", title: "Done", boardId: "b1", cards: cards4, position: 3 },
];

export const boards: Board[] = [
  { id: "b1", name: "Product Launch", workspaceId: "w1", color: "217 91% 60%", lists, updatedAt: "2026-04-06T12:00:00Z" },
  { id: "b2", name: "Marketing Q2", workspaceId: "w1", color: "142 71% 45%", lists: [], updatedAt: "2026-04-05T09:00:00Z" },
  { id: "b3", name: "Engineering Sprint 14", workspaceId: "w2", color: "38 92% 50%", lists: [], updatedAt: "2026-04-04T15:00:00Z" },
];

export const workspaces: Workspace[] = [
  {
    id: "w1", name: "Acme Inc.", description: "Main workspace for Acme Inc. projects",
    members: [users[0], users[1], users[2], users[3]],
    boards: [boards[0], boards[1]], createdAt: "2026-01-15T08:00:00Z",
  },
  {
    id: "w2", name: "Side Projects", description: "Personal and side project workspace",
    members: [users[0], users[4]],
    boards: [boards[2]], createdAt: "2026-02-20T10:00:00Z",
  },
];

export const notifications: Notification[] = [
  { id: "n1", message: "Jamie Chen moved 'Design landing page' to In Progress", type: "move", read: false, createdAt: "2026-04-07T09:30:00Z", user: users[1] },
  { id: "n2", message: "You were assigned to 'Fix auth redirect bug'", type: "assignment", read: false, createdAt: "2026-04-07T08:15:00Z", user: users[2] },
  { id: "n3", message: "Taylor Kim commented on 'Code review: payment module'", type: "comment", read: true, createdAt: "2026-04-06T16:00:00Z", user: users[3] },
  { id: "n4", message: "Casey Brooks mentioned you in 'API rate limiting'", type: "mention", read: true, createdAt: "2026-04-06T14:30:00Z", user: users[4] },
];
