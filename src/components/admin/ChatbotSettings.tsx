import { useState, useEffect } from "react";
import { Settings, BookOpen, MessageSquare, History, Plus, Trash2, RefreshCw, Send, Bot, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { ChatHistory } from "./ChatHistory";

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const SOURCE_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'faq', label: 'FAQ' },
  { value: 'product', label: 'Product' },
  { value: 'seed', label: 'Seed (script)' },
  { value: 'website', label: 'Website' },
  { value: 'other', label: 'Other' }
];

const CATEGORY_OPTIONS = [
  { value: 'faq', label: 'FAQ' },
  { value: 'product', label: 'Product' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'contact', label: 'Contact' },
  { value: 'ingredients', label: 'Ingredients' },
  { value: 'benefits', label: 'Benefits' },
  { value: 'general', label: 'General' }
];

type Tab = 'settings' | 'knowledge' | 'test' | 'history';

interface KnowledgeChunk {
  id: string;
  text: string;
  source: string;
  category: string;
  createdAt: string;
}

interface CustomerFieldOption {
  key: string;
  label: string;
}

export function ChatbotSettings() {
  const [activeTab, setActiveTab] = useState<Tab>('knowledge');
  const [chunks, setChunks] = useState<KnowledgeChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [addText, setAddText] = useState('');
  const [addSource, setAddSource] = useState('manual');
  const [addCategory, setAddCategory] = useState('faq');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Test chat state
  const [testMessages, setTestMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [testInput, setTestInput] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testSessionId, setTestSessionId] = useState<string | null>(null);
  const [availableCustomerFields, setAvailableCustomerFields] = useState<CustomerFieldOption[]>([]);
  const [allowedCustomerFields, setAllowedCustomerFields] = useState<string[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchChunks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/chatbot/knowledge`, { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.data) {
        setChunks(data.data);
      } else {
        toast.error(data.message || "Failed to load knowledge");
      }
    } catch (err) {
      toast.error("Failed to load knowledge");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'knowledge') fetchChunks();
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      setSettingsLoading(true);
      const res = await fetch(`${API_BASE_URL}/chatbot/settings`, { credentials: 'include' });
      const data = await res.json();

      if (data.success && data.data) {
        setAvailableCustomerFields(data.data.availableCustomerFields || []);
        setAllowedCustomerFields(data.data.allowedCustomerFields || []);
      } else {
        toast.error(data.message || "Failed to load chatbot settings");
      }
    } catch (err) {
      toast.error("Failed to load chatbot settings");
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'settings' && availableCustomerFields.length === 0) {
      fetchSettings();
    }
  }, [activeTab, availableCustomerFields.length]);

  const handleAddChunk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addText.trim() || adding) return;
    try {
      setAdding(true);
      const res = await fetch(`${API_BASE_URL}/chatbot/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: addText.trim(), source: addSource, category: addCategory })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Text added to RAG knowledge base");
        setAddText('');
        fetchChunks();
      } else {
        toast.error(data.message || "Failed to add");
      }
    } catch (err) {
      toast.error("Failed to add knowledge");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteChunk = async (id: string) => {
    if (deletingId) return;
    try {
      setDeletingId(id);
      const res = await fetch(`${API_BASE_URL}/chatbot/knowledge/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Chunk removed");
        fetchChunks();
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch (err) {
      toast.error("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTestSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim() || testLoading) return;
    const msg = testInput.trim();
    setTestInput('');
    setTestMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setTestLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/chatbot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: msg, sessionId: testSessionId })
      });
      const data = await res.json();
      if (data.success) {
        if (data.sessionId) setTestSessionId(data.sessionId);
        setTestMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setTestMessages((prev) => [...prev, { role: 'assistant', content: data.message || "Error" }]);
      }
    } catch (err) {
      setTestMessages((prev) => [...prev, { role: 'assistant', content: "Connection error" }]);
    } finally {
      setTestLoading(false);
    }
  };

  const handleFieldToggle = (fieldKey: string, checked: boolean) => {
    setAllowedCustomerFields((prev) => (
      checked
        ? [...new Set([...prev, fieldKey])]
        : prev.filter((field) => field !== fieldKey)
    ));
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      const res = await fetch(`${API_BASE_URL}/chatbot/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ allowedCustomerFields })
      });
      const data = await res.json();

      if (data.success && data.data) {
        setAllowedCustomerFields(data.data.allowedCustomerFields || []);
        setAvailableCustomerFields(data.data.availableCustomerFields || []);
        toast.success("Chatbot customer data settings saved");
      } else {
        toast.error(data.message || "Failed to save chatbot settings");
      }
    } catch (err) {
      toast.error("Failed to save chatbot settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'knowledge', label: 'Knowledge (RAG)', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'test', label: 'Test Chat', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'history', label: 'Chat History', icon: <History className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Bot className="w-6 h-6 text-pink-500" />
          Chatbot Settings
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage RAG knowledge base, test the chatbot, and view customer chat history.
        </p>
      </div>

      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {tabs.map((t) => (
          <Button
            key={t.id}
            variant={activeTab === t.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(t.id)}
            className={activeTab === t.id ? "bg-pink-600 hover:bg-pink-700" : ""}
          >
            {t.icon}
            <span className="ml-2">{t.label}</span>
          </Button>
        ))}
      </div>

      {activeTab === 'knowledge' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Add Text to RAG Knowledge Base</h3>
            <p className="text-sm text-gray-500 mb-4">
              Add text chunks that the chatbot will use to answer customer questions. Each chunk is embedded and matched by semantic similarity.
            </p>
            <form onSubmit={handleAddChunk} className="space-y-4">
              <div>
                <Label htmlFor="add-text">Text content</Label>
                <Textarea
                  id="add-text"
                  value={addText}
                  onChange={(e) => setAddText(e.target.value)}
                  placeholder="e.g. Phase I Laddu is for days 1-14 of your cycle. It contains flaxseeds and pumpkin seeds..."
                  rows={4}
                  className="mt-1"
                  disabled={adding}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="add-source">Source</Label>
                  <Select value={addSource} onValueChange={setAddSource} disabled={adding}>
                    <SelectTrigger id="add-source" className="mt-1">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="add-category">Category</Label>
                  <Select value={addCategory} onValueChange={setAddCategory} disabled={adding}>
                    <SelectTrigger id="add-category" className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={adding || !addText.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                {adding ? "Adding..." : "Add to Knowledge Base"}
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Knowledge Chunks ({chunks.length})</h3>
              <Button variant="outline" size="sm" onClick={fetchChunks} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-8 h-8 text-pink-500 animate-spin" />
              </div>
            ) : chunks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No knowledge chunks yet. Add text above or run the seed script to populate default FAQs.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {chunks.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 border border-gray-200 rounded-lg flex justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap line-clamp-3">{c.text}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {c.source} · {c.category} · {formatDate(c.createdAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteChunk(c.id)}
                      disabled={deletingId === c.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'test' && (
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Test RAG Chatbot</h3>
          <p className="text-sm text-gray-500 mb-4">
            Test the chatbot with the same API used on the homepage. Uses your RAG knowledge base when available.
          </p>
          <div className="border rounded-lg overflow-hidden flex flex-col max-h-[400px]">
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] bg-gray-50/50">
              {testMessages.length === 0 && (
                <p className="text-sm text-gray-500">Send a message to test the chatbot...</p>
              )}
              {testMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm flex items-start gap-2 ${
                      m.role === 'user' ? 'bg-pink-600 text-white' : 'bg-white border border-gray-200'
                    }`}
                  >
                    {m.role === 'user' ? <User className="w-4 h-4 shrink-0" /> : <Bot className="w-4 h-4 shrink-0 text-pink-500" />}
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
              {testLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-lg px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={handleTestSend} className="p-4 border-t flex gap-2">
              <Input
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Ask about seed cycling, laddus..."
                disabled={testLoading}
              />
              <Button type="submit" disabled={testLoading || !testInput.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </Card>
      )}

      {activeTab === 'history' && <ChatHistory />}

      {activeTab === 'settings' && (
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Chatbot Settings</h3>
          <p className="text-sm text-gray-500 mb-6">
            Choose which logged-in customer fields the chatbot is allowed to access. Ensure <code className="bg-gray-100 px-1 rounded">GEMINI_API_KEY</code> is set for RAG.
          </p>

          {settingsLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-8 h-8 text-pink-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Customer Data Access</h4>
                <div className="space-y-3">
                  {availableCustomerFields.map((field) => (
                    <label
                      key={field.key}
                      htmlFor={`field-${field.key}`}
                      className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50"
                    >
                      <Checkbox
                        id={`field-${field.key}`}
                        checked={allowedCustomerFields.includes(field.key)}
                        onCheckedChange={(checked) => handleFieldToggle(field.key, checked === true)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{field.label}</p>
                        <p className="text-xs text-gray-500">{field.key}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveSettings} disabled={savingSettings}>
                  {savingSettings ? "Saving..." : "Save Settings"}
                </Button>
                <Button variant="outline" onClick={fetchSettings} disabled={settingsLoading || savingSettings}>
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
