import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Folder, FileText, X, CornerDownLeft, Command } from "lucide-react";
import { useSearch } from "@/hooks/useSearch";
import { cn } from "@/lib/utils";

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const { data: results, isLoading } = useSearch(query);

  const flatResults = [
    ...(results?.projects.map(p => ({ ...p, type: 'project' })) || []),
    ...(results?.tasks.map(t => ({ ...t, type: 'task' })) || [])
  ];

  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isOpen]);

  const handleSelect = useCallback((item: any) => {
    if (item.type === 'project') {
      navigate(`/projects/${item.id}`);
    } else {
      navigate(`/projects/${item.project_id}?task=${item.id}`);
    }
    setIsOpen(false);
  }, [navigate]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (flatResults[selectedIndex]) {
        handleSelect(flatResults[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 sm:px-6 md:pt-[15vh]">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Command Palette */}
      <div className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center px-4 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <input
            autoFocus
            className="flex-1 py-4 bg-transparent outline-none text-base placeholder:text-muted-foreground"
            placeholder="Type to search projects or tasks..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={onKeyDown}
          />
          <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-md border border-border bg-muted/50 text-[10px] font-medium text-muted-foreground mr-2">
            <Command className="h-2.5 w-2.5" />
            <span>K</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div 
          ref={scrollRef}
          className={cn(
            "max-h-[60vh] overflow-y-auto py-2",
            flatResults.length === 0 && !isLoading && query.length >= 2 ? "px-4 py-10 text-center" : ""
          )}
        >
          {isLoading && query.length >= 2 ? (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Searching...</span>
            </div>
          ) : query.length < 2 ? (
            <div className="px-4 py-8 text-center space-y-2">
               <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Search className="h-6 w-6" />
               </div>
               <p className="text-sm font-semibold text-foreground">Global Search</p>
               <p className="text-xs text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                  Enter at least 2 characters to search across all your projects and tasks in this workspace.
               </p>
            </div>
          ) : flatResults.length > 0 ? (
            <div className="space-y-4 px-2">
               {results?.projects.length ? (
                <div>
                   <h3 className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Projects</h3>
                   {results.projects.map((project, idx) => {
                     const isSelected = selectedIndex === idx;
                     return (
                        <div
                          key={project.id}
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 group",
                            isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent/50"
                          )}
                          onClick={() => handleSelect({ ...project, type: 'project' })}
                          onMouseEnter={() => setSelectedIndex(idx)}
                        >
                           <div className={cn(
                             "h-9 w-9 rounded-lg flex items-center justify-center",
                             isSelected ? "bg-white/20" : "bg-primary/10 text-primary"
                           )}>
                              <Folder className="h-5 w-5" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{project.name}</p>
                           </div>
                           {isSelected && <CornerDownLeft className="h-4 w-4 opacity-70" />}
                        </div>
                     );
                   })}
                </div>
               ) : null}

               {results?.tasks.length ? (
                <div>
                   <h3 className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tasks</h3>
                   {results.tasks.map((task, idx) => {
                     const realIdx = (results?.projects.length || 0) + idx;
                     const isSelected = selectedIndex === realIdx;
                     return (
                        <div
                          key={task.id}
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 group",
                            isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent/50"
                          )}
                          onClick={() => handleSelect({ ...task, type: 'task' })}
                          onMouseEnter={() => setSelectedIndex(realIdx)}
                        >
                           <div className={cn(
                             "h-9 w-9 rounded-lg flex items-center justify-center",
                             isSelected ? "bg-white/20" : "bg-blue-500/10 text-blue-500"
                           )}>
                              <FileText className="h-5 w-5" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{task.title}</p>
                              <p className={cn(
                                "text-[10px] truncate",
                                isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                              )}>
                                Status: <span className="capitalize">{task.status.replace('_', ' ')}</span>
                              </p>
                           </div>
                           {isSelected && <CornerDownLeft className="h-4 w-4 opacity-70" />}
                        </div>
                     );
                   })}
                </div>
               ) : null}
            </div>
          ) : (
             <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                  <Search className="h-6 w-6" />
                </div>
                <div className="text-center">
                   <p className="text-sm font-semibold text-foreground">No matches found</p>
                   <p className="text-xs text-muted-foreground">We couldn't find anything matching "{query}"</p>
                </div>
             </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 bg-muted/30 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground font-medium">
           <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><CornerDownLeft className="h-3 w-3" /> Select</span>
              <span className="flex items-center gap-1">↑↓ Navigate</span>
              <span className="flex items-center gap-1">Esc Close</span>
           </div>
           <p>Workspace Search</p>
        </div>
      </div>
    </div>
  );
}
