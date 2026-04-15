import { useNavigate, Link } from "react-router-dom";
import { FolderKanban, Sparkles, Zap, Globe, Github, Linkedin, ArrowRight, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

export default function LandingPage() {
  const { token, user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && token && user) {
      navigate("/dashboard");
    }
  }, [token, user, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-foreground selection:bg-primary/30 selection:text-primary-foreground overflow-x-hidden">
      {/* Background Orbs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl">
        <div className="flex items-center justify-between px-6 py-3 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-lg p-1.5 shadow-lg shadow-primary/20">
              <FolderKanban className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">TaskFlow</span>
          </div>

          <div className="flex items-center gap-6">
             <Link 
               to="/login" 
               className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
             >
               Log In
             </Link>
             <Link 
               to="/signup" 
               className="relative group px-5 py-2 rounded-xl bg-primary text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
             >
               Sign Up
               <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
             </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-40 pb-20 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold mb-8 animate-fade-in">
          <Sparkles className="w-3 h-3" />
          <span>New: Agentic AI Workflows in Beta</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
          Manage Tasks at the <br />
          <span className="bg-gradient-to-r from-primary via-purple-400 to-blue-400 bg-clip-text text-transparent">
            Speed of Thought
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-12">
          An enterprise-grade Kanban board powered by AI agentic workflows and real-time webhook integrations. Build, track, and scale effortlessly.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Link 
            to="/signup" 
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-primary text-lg font-bold text-white transition-all hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] hover:scale-[1.02]"
          >
            Start for Free
          </Link>
          <button className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-white/10 bg-white/5 text-lg font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
            Watch Demo
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Product Preview */}
        <div className="relative max-w-5xl mx-auto group perspective-1000">
           <div className="absolute -inset-4 bg-primary/20 rounded-[2.5rem] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
           <div className="relative rounded-[2rem] border border-white/10 bg-black/50 overflow-hidden shadow-2xl transform rotate-x-6 rotate-y--4 hover:rotate-0 transition-transform duration-700 ease-out">
            <img 
              src="/assets/kanban_mockup.png" 
              alt="TaskFlow Dashboard Mockup" 
              className="w-full h-auto"
            />
           </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="group p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-md hover:bg-white/[0.05] transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-24 h-24 text-primary" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white">Agentic AI Breakdowns</h3>
            <p className="text-muted-foreground leading-relaxed">
              Turn vague ideas into actionable subtasks instantly using Google Gemini. Your personal AI project assistant.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-md hover:bg-white/[0.05] transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-24 h-24 text-blue-400" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white">Event-Driven Webhooks</h3>
            <p className="text-muted-foreground leading-relaxed">
              Connect your workspace to thousands of apps with reliable, asynchronous event dispatching and automation.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-md hover:bg-white/[0.05] transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Globe className="w-24 h-24 text-purple-400" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white">Lightning Fast</h3>
            <p className="text-muted-foreground leading-relaxed">
              Optimized with Redis caching and real-time synchronization. A high-performance experience that keeps up with you.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-primary" />
            <span className="font-bold text-white">TaskFlow</span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Built by Aashish Kumar Singh. &copy; 2026 TaskFlow.
          </p>

          <div className="flex items-center gap-6">
            <a 
              href="https://github.com/Aashish672" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-white transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
            <a 
              href="https://www.linkedin.com/in/aashish672/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-white transition-colors"
            >
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
