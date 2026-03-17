import { useState, useEffect } from "react";
import { MessageSquare, Phone, User, RefreshCw, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ContactMessage {
  _id: string;
  name: string;
  phone: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function ContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/contact`, { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.data) {
        setMessages(data.data);
      } else {
        toast.error(data.message || "Failed to load messages");
      }
    } catch (err) {
      toast.error("Failed to load contact messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/contact/${id}/read`, {
        method: 'PATCH',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.map(m => m._id === id ? { ...m, read: true } : m));
      }
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const unreadCount = messages.filter(m => !m.read).length;

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
          <h2 className="text-xl font-bold text-gray-900">Contact Messages</h2>
          {unreadCount > 0 && (
            <Badge className="bg-pink-100 text-pink-700">{unreadCount} new</Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetchMessages}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">No contact messages yet</p>
            <p className="text-sm text-gray-500">Messages from the /contact form will appear here</p>
          </div>
        ) : (
          messages.map((msg) => (
            <Card
              key={msg._id}
              className={`p-6 transition-all ${!msg.read ? 'bg-pink-50/50 border-pink-200' : 'bg-white/80'}`}
            >
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {!msg.read && (
                      <Badge className="bg-pink-100 text-pink-700">New</Badge>
                    )}
                    <span className="text-xs text-gray-400 font-mono">
                      {formatDate(msg.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-gray-900">{msg.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <a
                      href={`tel:${msg.phone}`}
                      className="text-pink-600 hover:underline"
                    >
                      {msg.phone}
                    </a>
                  </div>
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
                {!msg.read && (
                  <div className="flex items-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsRead(msg._id)}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark read
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
