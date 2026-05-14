import { useState, useEffect } from "react";
import { MessageSquare, RefreshCw, User, Bot } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ChatMessage {
  role: string;
  content: string;
  createdAt: string;
}

interface ChatSession {
  sessionId: string;
  messageCount: number;
  lastActivity: string;
  customerName?: string | null;
  customerCode?: string | null;
  messages: ChatMessage[];
}

export function ChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/chatbot/chats`, { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.data) {
        setSessions(data.data);
      } else {
        toast.error(data.message || "Failed to load chat history");
      }
    } catch (err) {
      toast.error("Failed to load chat history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-gray-900">Customer Chat History</h2>
        </div>
        <Button variant="outline" size="sm" onClick={fetchChats}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <p className="text-sm text-gray-500">
        Chat conversations from the homepage AI assistant. All customer messages and responses are saved in the database.
      </p>

      {sessions.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No chat conversations yet.</p>
          <p className="text-sm mt-1">Chats will appear here when customers use the AI assistant on the homepage.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.sessionId} className="overflow-hidden">
              <button
                onClick={() => setExpandedSession(expandedSession === session.sessionId ? null : session.sessionId)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-pink-500" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {session.customerName || "Guest Customer"}
                    </p>
                    {session.customerCode && (
                      <p className="text-xs text-gray-500">
                        Customer ID: {session.customerCode}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Session {session.sessionId.slice(0, 8)}... · {session.messageCount} messages · Last activity {formatDate(session.lastActivity)}
                    </p>
                  </div>
                </div>
                <span className="text-gray-400">
                  {expandedSession === session.sessionId ? "▼" : "▶"}
                </span>
              </button>

              {expandedSession === session.sessionId && (
                <div className="border-t border-gray-100 p-4 bg-gray-50/50 max-h-96 overflow-y-auto space-y-3">
                  {session.messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm flex items-start gap-2 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-white border border-gray-200 text-gray-800"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <User className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Bot className="w-4 h-4 flex-shrink-0 mt-0.5 text-pink-500" />
                        )}
                        <div>
                          <p className="text-xs opacity-75 mb-0.5">
                            {msg.role === "user" ? "Customer" : "Assistant"}
                            {msg.createdAt && ` · ${formatDate(msg.createdAt)}`}
                          </p>
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
