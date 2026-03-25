import { useState, useRef, useEffect } from "react";
import { Minus, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/Button";
import { useUser } from "@/context/UserContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const CUSTOMER_TOKEN_KEY = "cycle_harmony_customer_token";

const normalizeApiBase = (value: string) => value.replace(/\/+$/, "");

const getChatbotEndpointCandidates = () => {
  const configuredBase = normalizeApiBase(API_BASE_URL.trim() || "/api");
  const candidates = new Set<string>();

  candidates.add(`${configuredBase}/chatbot/chat`);

  if (!/\/api$/i.test(configuredBase)) {
    candidates.add(`${configuredBase}/api/chatbot/chat`);
  }

  candidates.add("/api/chatbot/chat");

  return Array.from(candidates);
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatBotWidget() {
  const { isLoggedIn } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(() =>
    sessionStorage.getItem("chatbot_session_id")
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionStorage.setItem("chatbot_session_id", sessionId || "");
  }, [sessionId]);

  useEffect(() => {
    if (!isOpen || isMinimized) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ block: "end" });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [messages, isOpen, isMinimized]);

  const sendChatRequest = async (userMessage: string, sessionId?: string) => {
    const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
    let lastPayload: any = null;

    for (const endpoint of getChatbotEndpointCandidates()) {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          message: userMessage,
          sessionId: sessionId || undefined,
        }),
      });

      const data = await res.json();
      lastPayload = data;

      if (res.ok || data?.message !== "Route not found") {
        return data;
      }
    }

    return lastPayload;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const data = await sendChatRequest(userMessage, sessionId || undefined);

      if (data.success) {
        if (data.sessionId) setSessionId(data.sessionId);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message || "Sorry, something went wrong. Please try again.",
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Unable to connect. Please check your connection and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-full p-2 md:p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center gap-2"
          aria-label="Open Chat"
        >
          <Sparkles className="h-4 w-4 md:h-6 md:w-6" />
          <span className="font-medium pr-2 text-sm md:text-base">Ask Me</span>
        </button>
      )}

      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 bg-card border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${isMinimized ? "w-72 max-w-[80vw]" : "w-[90vw] md:w-96 max-h-[80vh]"}`}>
          <div
            className={`bg-gradient-to-r from-primary to-primary/80 p-4 flex items-center justify-between flex-shrink-0 ${isMinimized ? "cursor-pointer" : ""}`}
            onClick={isMinimized ? () => setIsMinimized(false) : undefined}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
              <h3 className="font-semibold text-primary-foreground">{isMinimized ? "Ask Me" : "AI Assistant"}</h3>
            </div>
            {!isMinimized && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(true);
                }}
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                aria-label="Minimize Chat"
              >
                <Minus className="h-5 w-5" />
              </button>
            )}
          </div>

          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
                {messages.length === 0 && (
                  <div className="text-muted-foreground text-sm">
                    <p className="mb-2">Ask me about seed cycling and our laddus!</p>
                    {!isLoggedIn && (
                      <p className="mb-2 text-xs">
                        Log in to get personalized help with your orders and cycle information.
                      </p>
                    )}
                    <ul className="space-y-1 text-xs">
                      <li>• What is seed cycling?</li>
                      <li>• Tell me about Phase 1</li>
                      <li>• What are the benefits?</li>
                      <li>• How do I take these?</li>
                      {isLoggedIn && <li>• What is my latest order status?</li>}
                    </ul>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 text-foreground"
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted/50 rounded-lg px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="p-4 border-t border-border flex-shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything..."
                    className="flex-1 px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isLoading}
                  />
                  <Button type="submit" disabled={isLoading || !input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
