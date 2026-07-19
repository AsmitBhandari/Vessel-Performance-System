import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  getChatSessions,
  createChatSession,
  deleteChatSession,
  getChatMessages,
  sendChatMessage,
  getVessels,
} from "@/services/api";
import type { ChatSession, ChatMessage, VesselInfo } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  Send,
  Loader2,
  Compass,
  MessageSquare,
  Anchor,
  Calendar,
  Wrench,
} from "lucide-react";

export default function ChatPage() {
  usePageTitle("AI Assistant");

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [vessels, setVessels] = useState<VesselInfo[]>([]);
  const [selectedVesselId, setSelectedVesselId] = useState<number | null>(null);
  
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [activeMeta, setActiveMeta] = useState<{
    vesselId: number | null;
    startDate: string | null;
    endDate: string | null;
    tools: string[];
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const skipLoadMessagesRef = useRef(false);

  // Load initial data
  useEffect(() => {
    loadSessions();
    getVessels()
      .then((data) => setVessels(data))
      .catch((err) => console.error("Error loading vessels", err));
  }, []);

  // Load messages whenever current session changes
  useEffect(() => {
    if (currentSession) {
      if (skipLoadMessagesRef.current) {
        skipLoadMessagesRef.current = false;
        setSelectedVesselId(currentSession.vesselId);
        setActiveMeta(null);
        return;
      }
      loadMessages(currentSession.id);
      setSelectedVesselId(currentSession.vesselId);
      setActiveMeta(null);
    } else {
      setMessages([]);
      setSelectedVesselId(null);
      setActiveMeta(null);
    }
  }, [currentSession]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const loadSessions = async () => {
    try {
      const data = await getChatSessions();
      setSessions(data);
      if (data.length > 0 && !currentSession) {
        setCurrentSession(data[0]);
      }
    } catch (err) {
      console.error("Failed to load chat sessions", err);
    }
  };

  const loadMessages = async (sessionId: number) => {
    try {
      const data = await getChatMessages(sessionId);
      setMessages(data);
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  };

  const handleCreateSession = async () => {
    try {
      const newSession = await createChatSession(selectedVesselId);
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSession(newSession);
    } catch (err) {
      console.error("Failed to create session", err);
    }
  };

  const handleDeleteSession = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this conversation?")) return;
    try {
      await deleteChatSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
      }
    } catch (err) {
      console.error("Failed to delete session", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    let sessionToUse = currentSession;
    if (!sessionToUse) {
      try {
        sessionToUse = await createChatSession(selectedVesselId);
        setSessions((prev) => [sessionToUse!, ...prev]);
        skipLoadMessagesRef.current = true;
        setCurrentSession(sessionToUse);
      } catch (err) {
        console.error("Failed to auto-create session", err);
        return;
      }
    }

    const userMessageContent = inputMessage.trim();
    setInputMessage("");
    setIsSending(true);

    // Optimistically add user message to state
    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      sessionId: sessionToUse.id,
      role: "user",
      content: userMessageContent,
      vesselId: selectedVesselId,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    // Setup placeholder assistant message for streaming
    const tempAssistantMsgId = Date.now() + 1;
    const tempAssistantMsg: ChatMessage = {
      id: tempAssistantMsgId,
      sessionId: sessionToUse.id,
      role: "assistant",
      content: "",
      vesselId: selectedVesselId,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempAssistantMsg]);

    let streamBuffer = "";

    await sendChatMessage(
      sessionToUse.id,
      userMessageContent,
      selectedVesselId,
      {
        onChunk: (chunk) => {
          streamBuffer += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempAssistantMsgId ? { ...msg, content: streamBuffer } : msg
            )
          );
        },
        onInfo: (meta) => {
          setActiveMeta(meta);
        },
        onDone: () => {
          setIsSending(false);
          loadSessions(); // Reload sessions to update titles and timestamps
        },
        onError: (err) => {
          setIsSending(false);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempAssistantMsgId
                ? { ...msg, content: `⚠️ Error: ${err}. Please check your credentials.` }
                : msg
            )
          );
        },
      }
    );
  };

  const getVesselName = (id: number | null) => {
    if (!id) return "None";
    const vessel = vessels.find((v) => v.id === id);
    return vessel ? vessel.vesselName : "Unknown";
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-background text-foreground overflow-hidden">
      {/* ── Left Sidebar: Chat Sessions ── */}
      <aside className="w-64 border-r border-border/50 bg-card/30 flex flex-col shrink-0">
        <div className="p-3 border-b border-border/50">
          <Button
            onClick={handleCreateSession}
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-8">
              No conversations yet.
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => setCurrentSession(s)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 ${
                  currentSession?.id === s.id
                    ? "bg-primary/15 text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden mr-2">
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{s.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive rounded transition-all duration-150 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ── Main Chat Screen ── */}
      <main className="flex-1 flex flex-col bg-background/50 overflow-hidden relative">
        {/* Top Control Bar */}
        <div className="h-14 border-b border-border/50 bg-card/25 backdrop-blur-sm px-4 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Vessel Context:
            </h2>
            <select
              value={selectedVesselId || ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                setSelectedVesselId(val);
                if (currentSession) {
                  // Keep UI selection and session context in sync
                  currentSession.vesselId = val;
                }
              }}
              className="bg-background/80 border border-border/60 rounded-md px-2 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
              <option value="">All Vessels / Auto-Detect</option>
              {vessels.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vesselName}
                </option>
              ))}
            </select>
          </div>

          {activeMeta && (
            <div className="hidden lg:flex items-center gap-4 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-md border border-border/40">
                <Anchor className="h-3.5 w-3.5 text-primary" />
                <span>Vessel: <strong>{getVesselName(activeMeta.vesselId)}</strong></span>
              </div>
              {activeMeta.startDate && activeMeta.endDate && (
                <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-md border border-border/40">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span>Period: <strong>{activeMeta.startDate} to {activeMeta.endDate}</strong></span>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-md border border-border/40" title={activeMeta.tools.join(", ")}>
                <Wrench className="h-3.5 w-3.5 text-primary" />
                <span>Tools Run: <strong>{activeMeta.tools.length}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto space-y-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(var(--primary),0.15)] border border-primary/20 animate-pulse">
                <Compass className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold tracking-tight">VPRO Maritime AI Assistant</h3>
                <p className="text-sm text-muted-foreground">
                  Ask me anything about vessel performance, fuel consumption, speed trends, noon reports, or weather anomalies.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                {[
                  "Show fuel consumption trend for April",
                  "Compare speed and slip from last week",
                  "Summarize the recent noon reports",
                  "Identify any weather anomalies or warning insights",
                ].map((promptText) => (
                  <button
                    key={promptText}
                    onClick={() => setInputMessage(promptText)}
                    className="p-3 text-left text-xs bg-card/40 border border-border/50 hover:bg-card/75 rounded-xl hover:border-primary/50 transition-all duration-200"
                  >
                    {promptText} &rarr;
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 max-w-3xl ${
                  m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center font-bold text-xs uppercase shadow-sm border ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground border-primary/20"
                      : "bg-muted text-muted-foreground border-border/80"
                  }`}
                >
                  {m.role === "user" ? "U" : "AI"}
                </div>

                {/* Message Box */}
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary/15 text-foreground border border-primary/25 rounded-tr-none"
                      : "bg-card/70 border border-border/50 rounded-tl-none prose prose-invert max-w-none prose-xs"
                  }`}
                >
                  {m.role === "user" ? (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content || "Generating response..."}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))
          )}
          
          {isSending && messages[messages.length - 1]?.content === "" && (
            <div className="flex gap-3 max-w-3xl mr-auto">
              <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground border border-border/80 flex items-center justify-center font-bold text-xs uppercase animate-pulse">
                AI
              </div>
              <div className="bg-card/70 border border-border/50 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="p-4 border-t border-border/50 bg-card/25 backdrop-blur-sm shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              required
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask a question about voyages, fuel ROB, weather risk, or insights..."
              className="flex-1 bg-background/80 border border-border/60 rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              disabled={isSending}
            />
            <Button
              type="submit"
              disabled={isSending || !inputMessage.trim()}
              className="rounded-xl px-4 flex items-center gap-2 shadow-sm font-semibold"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
