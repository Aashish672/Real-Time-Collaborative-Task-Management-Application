import { useState, useEffect } from "react";
import { User, Activity, CreditCard, Shield, Globe, Lock, Mail, ExternalLink } from "lucide-react";
import UserAvatar from "@/components/shared/UserAvatar";
import { cn } from "@/lib/utils";
import { useProfile, useUpdateProfile, useAssignedTasks } from "@/hooks/useApi";
import { toast } from "sonner";

type Tab = "profile" | "activity" | "cards";

const MOCK_ACTIVITY = [
    { id: 1, action: "moved", target: "Fix Auth Bug", context: "to In Review", time: "2 hours ago" },
    { id: 2, action: "commented on", target: "API endpoints", context: '"Looks good to me!"', time: "5 hours ago" },
    { id: 3, action: "completed", target: "Design onboarding", context: "", time: "Yesterday at 4:30 PM" },
    { id: 4, action: "was assigned to", target: "Setup Redis", context: "by Sarah Kim", time: "2 days ago" },
];

export default function Profile() {
    const { data: user, isLoading: profileLoading } = useProfile();
    const { data: assignedTasks = [], isLoading: tasksLoading } = useAssignedTasks();
    const updateProfile = useUpdateProfile();

    const [activeTab, setActiveTab] = useState<Tab>("profile");
    const [visibility, setVisibility] = useState<"public" | "private">("public");

    // Local state for editing (though we'd typically use a form library or just sync with mutation)
    const [name, setName] = useState(user?.full_name || "");

    useEffect(() => {
        if (user) setName(user.full_name);
    }, [user]);

    const handleUpdateProfile = async (updates: any) => {
        try {
            await updateProfile.mutateAsync(updates);
            toast.success("Profile updated!");
        } catch (err) {
            toast.error("Failed to update profile.");
        }
    };

    if (profileLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center gap-6 mb-10">
                <div className="relative group p-1 rounded-full border-2 border-primary/20 bg-background shadow-lg">
                    <UserAvatar name={user?.full_name || "User"} src={user?.avatar_url} size="xl" className="h-24 w-24 md:h-32 md:w-32" />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs font-medium opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
                        Change Avatar
                        <input type="file" className="hidden" />
                    </label>
                </div>
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold text-foreground">{user?.full_name}</h1>
                    <p className="text-muted-foreground mt-1">{user?.email}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                            <Activity className="h-3 w-3" />
                            {assignedTasks.length} active tasks
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">
                            <Globe className="h-3 w-3" />
                            {visibility === "public" ? "Public Profile" : "Private Profile"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border mb-8">
                {[
                    { id: "profile", label: "Profile and Visibility", icon: User },
                    { id: "activity", label: "Activity", icon: Activity },
                    { id: "cards", label: "Cards", icon: CreditCard },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === tab.id
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === "profile" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-8">
                            <section>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">About You</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase">Full Name</label>
                                        <div className="flex gap-2">
                                            <input
                                                className="flex-1 bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Your full name"
                                            />
                                            <button 
                                                onClick={() => handleUpdateProfile({ full_name: name })}
                                                disabled={updateProfile.isPending || name === user?.full_name}
                                                className="px-3 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase">Email Address</label>
                                            <div className="flex items-center gap-2 px-3 py-2 bg-secondary/30 border border-border rounded-lg text-sm text-muted-foreground">
                                                <Mail className="h-4 w-4" />
                                                {user?.email}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Visibility</h3>
                                <div className="space-y-4">
                                    <div
                                        onClick={() => setVisibility("public")}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                            visibility === "public" ? "border-primary bg-primary/5" : "border-border hover:border-border/80"
                                        )}
                                    >
                                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                                            <Globe className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-foreground">Public</p>
                                            <p className="text-xs text-muted-foreground">Anyone on the internet can see your profile.</p>
                                        </div>
                                        {visibility === "public" && <div className="h-2 w-2 rounded-full bg-primary" />}
                                    </div>

                                    <div
                                        onClick={() => setVisibility("private")}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                            visibility === "private" ? "border-primary bg-primary/5" : "border-border hover:border-border/80"
                                        )}
                                    >
                                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary text-muted-foreground">
                                            <Lock className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-foreground">Private</p>
                                            <p className="text-xs text-muted-foreground">Only your workspace members can see your profile.</p>
                                        </div>
                                        {visibility === "private" && <div className="h-2 w-2 rounded-full bg-primary" />}
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="space-y-6">
                            <div className="p-5 rounded-xl border border-border bg-card">
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-primary" />
                                    Workspace Access
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground font-medium">Acme Corp</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground uppercase tracking-tighter">Admin</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground font-medium">Personal</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground uppercase tracking-tighter">Owner</span>
                                    </div>
                                </div>
                                <button className="w-full mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80">
                                    Managed permissions
                                    <ExternalLink className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "activity" && (
                    <div className="max-w-2xl space-y-8">
                        {MOCK_ACTIVITY.map((item, idx) => (
                            <div key={item.id} className="relative pl-8 group">
                                {idx !== MOCK_ACTIVITY.length - 1 && (
                                    <div className="absolute left-[11px] top-6 bottom-[-20px] w-px bg-border" />
                                )}
                                <div className="absolute left-0 top-1 h-[22px] w-[22px] rounded-full border-2 border-primary/20 bg-background flex items-center justify-center">
                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                </div>
                                <div className="p-3 rounded-lg hover:bg-secondary/20 transition-colors">
                                    <p className="text-sm text-foreground leading-relaxed">
                                        You <span className="font-medium">{item.action}</span> <span className="text-primary font-semibold underline underline-offset-4 decoration-primary/30">{item.target}</span> {item.context}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1.5">{item.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === "cards" && (
                    <div className="space-y-4">
                        {assignedTasks.map((task: any) => (
                            <Link 
                                key={task.id} 
                                to={`/projects/${task.project_id}`}
                                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all hover:shadow-md group cursor-pointer"
                            >
                                <div className={cn(
                                    "h-2 w-2 rounded-full",
                                    task.priority === "high" || task.priority === "urgent" ? "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]" :
                                        task.priority === "medium" ? "bg-amber-500" : "bg-primary"
                                )} />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-foreground truncate">{task.title}</h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No date"}</p>
                                </div>
                                <div className="flex items-center gap-4 text-right">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-1 rounded">
                                        {task.status.replace("_", " ")}
                                    </span>
                                    <div className="text-muted-foreground group-hover:text-primary transition-colors">
                                        <ExternalLink className="h-4 w-4" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                        {assignedTasks.length === 0 && (
                            <div className="py-20 text-center">
                                <CreditCard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="text-muted-foreground">No active tasks assigned to you.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

