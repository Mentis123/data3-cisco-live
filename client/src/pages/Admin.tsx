import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Plus, Download, Eye, CheckCircle, XCircle } from "lucide-react";
import { FeedbackTab } from "@/components/admin/FeedbackTab";

interface BetaAdminOverview {
  stats: {
    totalAttempts: number;
    passedAttempts: number;
    avgScore: number;
    passRate: number;
    ringAttempts: number;
    dojoAttempts: number;
    raffleEntries: number;
  };
  recentAttempts: Array<{
    id: string;
    category: string;
    mode: string;
    totalScore: number;
    passed: boolean;
    eligible: boolean;
    startedAt: string;
    endedAt: string | null;
    emailHash: string | null;
    firstName: string | null;
    lastName: string | null;
    company: string | null;
  }>;
}

interface TriviaItem {
  id: string;
  category: string;
  stem: string;
  choices: string[];
  correctIndex: number;
  dropIndex: number;
  hint9s: string;
  difficulty: number;
  tags: string[];
  explanation: string | null;
  active: boolean;
  version: number;
  stats: {
    timesShown: number;
    timesCorrect: number;
    correctRate: number;
  };
}

interface RaffleEntry {
  id: string;
  raffleDate: string;
  category: string;
  emailHash: string;
  attemptId: string;
  createdAt: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  role: string | null;
  totalScore: number | null;
  passed: boolean | null;
  eligible: boolean | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  "SECURE_CONNECTIVITY": "bg-[#00BCF2]",
  "HYBRID_DC": "bg-[#6CC04A]",
  "COLLAB_CX": "bg-[#FF6B35]",
  "OBSERVABILITY": "bg-[#9B59B6]",
  "EDGE_IOT": "bg-[#F39C12]",
};

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Easy",
  2: "Medium",
  3: "Hard",
};

function OverviewTab() {
  const adminKey = localStorage.getItem("adminKey") || "";

  const { data, isLoading } = useQuery<BetaAdminOverview>({
    queryKey: ["/api/beta-admin/overview"],
    queryFn: async () => {
      const response = await fetch("/api/beta-admin/overview", {
        headers: { "x-admin-key": adminKey },
      });
      if (!response.ok) throw new Error("Failed to fetch overview");
      return response.json();
    },
    refetchInterval: 5000,
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading overview...</div>;
  }

  if (!data) {
    return <div className="text-center py-8">No data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.stats.totalAttempts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ring: {data.stats.ringAttempts} | Dojo: {data.stats.dojoAttempts}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.stats.passRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.stats.passedAttempts} / {data.stats.totalAttempts} passed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.stats.avgScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of 30 points</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Raffle Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.stats.raffleEntries}</div>
            <p className="text-xs text-muted-foreground mt-1">Eligible participants</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Attempts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attempts</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {data.recentAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {attempt.firstName && attempt.lastName
                          ? `${attempt.firstName} ${attempt.lastName}`
                          : attempt.emailHash
                          ? `User ${attempt.emailHash.slice(0, 8)}`
                          : "Anonymous"}
                      </span>
                      <Badge className={CATEGORY_COLORS[attempt.category] || "bg-gray-500"}>
                        {attempt.category}
                      </Badge>
                      <Badge variant={attempt.mode === "ring" ? "default" : "outline"}>
                        {attempt.mode.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {attempt.company && <span>{attempt.company} • </span>}
                      Score: {attempt.totalScore} •{" "}
                      {new Date(attempt.startedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {attempt.passed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    {attempt.eligible && (
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700">
                        Raffle
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function TriviaManagementTab() {
  const [editingItem, setEditingItem] = useState<TriviaItem | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { toast } = useToast();
  const adminKey = localStorage.getItem("adminKey") || "";

  const { data: items, isLoading } = useQuery<TriviaItem[]>({
    queryKey: ["/api/beta-admin/trivia-items"],
    queryFn: async () => {
      const response = await fetch("/api/beta-admin/trivia-items", {
        headers: { "x-admin-key": adminKey },
      });
      if (!response.ok) throw new Error("Failed to fetch trivia items");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<TriviaItem>) => {
      const response = await fetch("/api/beta-admin/trivia-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create trivia item");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/beta-admin/trivia-items"] });
      setCreatingNew(false);
      toast({ title: "Trivia item created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create trivia item", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TriviaItem> }) => {
      const response = await fetch(`/api/beta-admin/trivia-items/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update trivia item");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/beta-admin/trivia-items"] });
      setEditingItem(null);
      toast({ title: "Trivia item updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update trivia item", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/beta-admin/trivia-items/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      if (!response.ok) throw new Error("Failed to deactivate trivia item");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/beta-admin/trivia-items"] });
      setDeleteConfirmId(null);
      toast({ title: "Trivia item deactivated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to deactivate trivia item", variant: "destructive" });
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading trivia items...</div>;
  }

  const activeItems = items?.filter((item) => item.active) || [];
  const inactiveItems = items?.filter((item) => !item.active) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Trivia Question Bank</h2>
          <p className="text-muted-foreground">
            {activeItems.length} active • {inactiveItems.length} inactive
          </p>
        </div>
        <Button onClick={() => setCreatingNew(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({activeItems.length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({inactiveItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {activeItems.map((item) => (
                <TriviaItemCard
                  key={item.id}
                  item={item}
                  onEdit={() => setEditingItem(item)}
                  onDelete={() => setDeleteConfirmId(item.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="inactive">
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {inactiveItems.map((item) => (
                <TriviaItemCard
                  key={item.id}
                  item={item}
                  onEdit={() => setEditingItem(item)}
                  onDelete={() => setDeleteConfirmId(item.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Edit/Create Dialog */}
      <TriviaItemDialog
        item={editingItem}
        isOpen={!!editingItem || creatingNew}
        onClose={() => {
          setEditingItem(null);
          setCreatingNew(false);
        }}
        onSave={(data) => {
          if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Question?</DialogTitle>
          </DialogHeader>
          <p>This will mark the question as inactive. It won't appear in new decks.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TriviaItemCard({
  item,
  onEdit,
  onDelete,
}: {
  item: TriviaItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className={!item.active ? "opacity-50" : ""}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={CATEGORY_COLORS[item.category] || "bg-gray-500"}>
                {item.category}
              </Badge>
              <Badge variant="outline">{DIFFICULTY_LABELS[item.difficulty] || "Unknown"}</Badge>
              {!item.active && <Badge variant="destructive">Inactive</Badge>}
              <span className="text-xs text-muted-foreground">
                Shown: {item.stats.timesShown} • Correct: {item.stats.correctRate}%
              </span>
            </div>
            <p className="font-medium mb-2">{item.stem}</p>
            <ul className="text-sm space-y-1">
              {item.choices.map((choice, index) => (
                <li
                  key={index}
                  className={index === item.correctIndex ? "text-green-600 font-medium" : ""}
                >
                  {index === item.correctIndex && "✓ "}
                  {choice}
                  {index === item.dropIndex && " (drops at 9s)"}
                </li>
              ))}
            </ul>
            {item.explanation && (
              <p className="text-sm text-muted-foreground mt-2 italic">
                Explanation: {item.explanation}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TriviaItemDialog({
  item,
  isOpen,
  onClose,
  onSave,
}: {
  item: TriviaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<TriviaItem>) => void;
}) {
  const [formData, setFormData] = useState<Partial<TriviaItem>>({
    category: item?.category || "SECURE_CONNECTIVITY",
    stem: item?.stem || "",
    choices: item?.choices || ["", "", "", ""],
    correctIndex: item?.correctIndex ?? 0,
    dropIndex: item?.dropIndex ?? 3,
    hint9s: item?.hint9s || "",
    difficulty: item?.difficulty ?? 2,
    tags: item?.tags || [],
    explanation: item?.explanation || "",
    active: item?.active ?? true,
    version: item?.version ?? 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Question" : "Create New Question"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SECURE_CONNECTIVITY">Zero Trust & Security</SelectItem>
                  <SelectItem value="HYBRID_DC">Data Centre & Hybrid Cloud</SelectItem>
                  <SelectItem value="COLLAB_CX">Collaboration & Contact Centre</SelectItem>
                  <SelectItem value="OBSERVABILITY">Observability & Performance</SelectItem>
                  <SelectItem value="EDGE_IOT">Edge & IoT Solutions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Difficulty</Label>
              <Select
                value={String(formData.difficulty)}
                onValueChange={(value) => setFormData({ ...formData, difficulty: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Easy</SelectItem>
                  <SelectItem value="2">Medium</SelectItem>
                  <SelectItem value="3">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Question</Label>
            <Textarea
              value={formData.stem}
              onChange={(e) => setFormData({ ...formData, stem: e.target.value })}
              required
              rows={3}
            />
          </div>

          <div>
            <Label>Choices</Label>
            {formData.choices?.map((choice, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <Input
                  value={choice}
                  onChange={(e) => {
                    const newChoices = [...(formData.choices || [])];
                    newChoices[index] = e.target.value;
                    setFormData({ ...formData, choices: newChoices });
                  }}
                  placeholder={`Choice ${index + 1}`}
                  required
                />
                <input
                  type="radio"
                  name="correct"
                  checked={formData.correctIndex === index}
                  onChange={() => setFormData({ ...formData, correctIndex: index })}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Drop Index (at 9s)</Label>
              <Select
                value={String(formData.dropIndex)}
                onValueChange={(value) => setFormData({ ...formData, dropIndex: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formData.choices?.map((_, index) => (
                    <SelectItem key={index} value={String(index)}>
                      Choice {index + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Active</Label>
              <Select
                value={String(formData.active)}
                onValueChange={(value) => setFormData({ ...formData, active: value === "true" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Hint (shown at 9s)</Label>
            <Input
              value={formData.hint9s}
              onChange={(e) => setFormData({ ...formData, hint9s: e.target.value })}
            />
          </div>

          <div>
            <Label>Explanation (optional)</Label>
            <Textarea
              value={formData.explanation || ""}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{item ? "Update" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RaffleTab() {
  const { toast } = useToast();
  const adminKey = localStorage.getItem("adminKey") || "";

  const { data: entries, isLoading } = useQuery<RaffleEntry[]>({
    queryKey: ["/api/beta-admin/raffle-entries"],
    queryFn: async () => {
      const response = await fetch("/api/beta-admin/raffle-entries", {
        headers: { "x-admin-key": adminKey },
      });
      if (!response.ok) throw new Error("Failed to fetch raffle entries");
      return response.json();
    },
  });

  const exportToCSV = () => {
    if (!entries || entries.length === 0) {
      toast({ title: "No raffle entries to export", variant: "destructive" });
      return;
    }

    const headers = [
      "ID",
      "Date",
      "Category",
      "First Name",
      "Last Name",
      "Company",
      "Role",
      "Email Hash",
      "Score",
      "Passed",
      "Eligible",
      "Created At",
    ];

    const rows = entries.map((entry) => [
      entry.id,
      entry.raffleDate,
      entry.category,
      entry.firstName || "",
      entry.lastName || "",
      entry.company || "",
      entry.role || "",
      entry.emailHash,
      entry.totalScore || "",
      entry.passed ? "Yes" : "No",
      entry.eligible ? "Yes" : "No",
      new Date(entry.createdAt).toLocaleString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `raffle-entries-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({ title: "Raffle entries exported successfully" });
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading raffle entries...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Raffle Entries</h2>
          <p className="text-muted-foreground">{entries?.length || 0} total entries</p>
        </div>
        <Button onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {entries?.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {entry.firstName && entry.lastName
                          ? `${entry.firstName} ${entry.lastName}`
                          : `User ${entry.emailHash.slice(0, 8)}`}
                      </span>
                      <Badge className={CATEGORY_COLORS[entry.category] || "bg-gray-500"}>
                        {entry.category}
                      </Badge>
                      {entry.eligible && (
                        <Badge className="bg-green-500">Eligible</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {entry.company && <span>{entry.company} • </span>}
                      {entry.role && <span>{entry.role} • </span>}
                      Score: {entry.totalScore} •{" "}
                      {new Date(entry.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-muted-foreground">
                      {entry.emailHash.slice(0, 16)}...
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Raffle Date: {entry.raffleDate}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPasswordError, setShowPasswordError] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "password") {
      localStorage.setItem("adminKey", "cisco-live-melbourne-2025");
      setIsAuthenticated(true);
      setShowPasswordError(false);
    } else {
      setShowPasswordError(true);
      setTimeout(() => setShowPasswordError(false), 2000);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Admin Access</CardTitle>
            <p className="text-center text-muted-foreground">
              Manage trivia questions, raffle entries, and view analytics
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Enter Admin Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                    showPasswordError ? "border-destructive ring-2 ring-destructive" : "border-border"
                  }`}
                  placeholder="Enter password"
                  autoFocus
                />
                {showPasswordError && (
                  <p className="text-destructive text-sm mt-2">Incorrect password</p>
                )}
              </div>
              <Button type="submit" className="w-full">
                Access Admin Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage trivia experience and raffle entries
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trivia">Trivia Bank</TabsTrigger>
            <TabsTrigger value="raffle">Raffle Entries</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="trivia">
            <TriviaManagementTab />
          </TabsContent>

          <TabsContent value="raffle">
            <RaffleTab />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
