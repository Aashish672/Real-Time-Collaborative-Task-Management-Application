import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

const WS_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/^http/, "ws");

export function useWorkspaceSocket(workspaceId: string | undefined) {
    const queryClient = useQueryClient();
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);

    const connect = useCallback(() => {
        if (!workspaceId) return;
        
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const url = `${WS_BASE_URL}/ws/workspace/${workspaceId}?token=${token}`;
        const ws = new WebSocket(url);

        ws.onopen = () => {
            console.log(`WebSocket connected to workspace: ${workspaceId}`);
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("WebSocket message received:", data);

                if (data.type === "TASKS_UPDATED") {
                    // Invalidate project-specific tasks
                    queryClient.invalidateQueries({ queryKey: ["tasks", data.project_id] });
                    // Also invalidate stats or other related queries if needed
                    queryClient.invalidateQueries({ queryKey: ["project", data.project_id] });
                } else if (data.type === "COMMENT_ADDED") {
                    // Invalidate comments for the specific task
                    queryClient.invalidateQueries({ queryKey: ["comments", data.task_id] });
                }
            } catch (err) {
                console.error("Failed to parse WebSocket message", err);
            }
        };

        ws.onclose = (event) => {
            console.log(`WebSocket disconnected (code: ${event.code})`);
            // Attempt to reconnect after 3 seconds if not a normal closure
            if (event.code !== 1000 && workspaceId) {
                reconnectTimeoutRef.current = window.setTimeout(connect, 3000);
            }
        };

        ws.onerror = (err) => {
            console.error("WebSocket error:", err);
            ws.close();
        };

        socketRef.current = ws;
    }, [workspaceId, queryClient]);

    useEffect(() => {
        connect();

        return () => {
            if (socketRef.current) {
                socketRef.current.close(1000, "Component unmounted");
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [connect]);

    return socketRef.current;
}
