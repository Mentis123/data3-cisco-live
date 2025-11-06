import { useState, useEffect } from "react";
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
    triviaScore: number | null;
    combinedScore: number | null;
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
  triviaScore: number | null;
  combinedScore: number | null;
  passed: boolean | null;
  eligible: boolean | null;
}

interface ScoredSubmission {
  id: string;
  name: string;
  category: string;
  totalScore: number;
  subScores: {
    clarity: number;
    impact: number;
    technology_fit: number;
    feasibility: number;
    business_value: number;
  };
  evaluationNotes: string | null;
  createdAt: string;
}

interface SubmissionDetails {
  id: string;
  participantName: string;
  category: string;
  totalScore: number;
  subScores: {
    clarity: number;
    impact: number;
    technology_fit: number;
    feasibility: number;
    business_value: number;
  };
  solutionText: string;
  structuredJson: any;
  evaluationNotes: string | null;
  createdAt: string;
}

interface WordCloudEntry {
  id: string;
  word: string;
  count: number;
  source: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ActiveChallenger {
  attemptId: string;
  initials: string;
  category: string;
  startedAt: string;
  emailHash: string;
  firstName: string | null;
  lastName: string | null;
  elapsedMinutes: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  "SECURE_CONNECTIVITY": "bg-[#00BCF2]",
  "HYBRID_DC": "bg-[#6CC04A]",
  "COLLAB_CX": "bg-[#FF6B35]",
  "OBSERVABILITY": "bg-[#9B59B6]",
  "EDGE_IOT": "bg-[#F39C12]",
};

const CATEGORY_NAMES: Record<string, string> = {
  "SECURE_CONNECTIVITY": "Zero Trust & Secure Connectivity",
  "HYBRID_DC": "Data Centre & Hybrid Cloud",
  "COLLAB_CX": "Collaboration & Contact Centre",
  "OBSERVABILITY": "Observability & Performance",
  "EDGE_IOT": "Edge & IoT Solutions",
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
            <p className="text-xs text-muted-foreground mt-1">Out of 100 points</p>
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
                      Score: {attempt.combinedScore ?? attempt.triviaScore ?? 'N/A'}
                      {attempt.triviaScore != null && attempt.combinedScore != null && (
                        <span className="text-xs ml-1">
                          ({attempt.triviaScore} trivia + {attempt.combinedScore - attempt.triviaScore} pitch)
                        </span>
                      )} •{" "}
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

function ScoredSubmissionsTab() {
  const { toast } = useToast();
  const adminKey = localStorage.getItem("adminKey") || "";
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [submissionDetails, setSubmissionDetails] = useState<SubmissionDetails | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: submissions, isLoading, refetch } = useQuery<ScoredSubmission[]>({
    queryKey: ["/api/admin/leaderboard"],
    queryFn: async () => {
      const response = await fetch("/api/admin/leaderboard", {
        headers: { "x-admin-key": adminKey },
      });
      if (!response.ok) throw new Error("Failed to fetch scored submissions");
      return response.json();
    },
  });

  const handleDeleteSubmission = async (id: string) => {
    setIsDeleting(true);
    try {
      await apiRequest("DELETE", `/api/admin/submission/${id}`, {
        headers: { "x-admin-key": adminKey },
      });
      setDeleteConfirmId(null);
      toast({ title: "Submission deleted successfully" });
      refetch();
    } catch (error) {
      console.error("Failed to delete submission:", error);
      toast({
        title: "Failed to delete submission",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (selectedSubmissionId) {
      fetch(`/api/admin/submission/${selectedSubmissionId}`, {
        headers: { "x-admin-key": adminKey },
      })
        .then((res) => res.json())
        .then(setSubmissionDetails)
        .catch(console.error);
    }
  }, [selectedSubmissionId, adminKey]);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes > 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getScoreColor = (score: number, max: number = 10) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    if (percentage >= 40) return "text-orange-600";
    return "text-red-600";
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading scored submissions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Scored Submissions</h2>
          <p className="text-muted-foreground">{submissions?.length || 0} total submissions</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-2 px-2">Rank</th>
                  <th className="pb-2 px-2">Participant</th>
                  <th className="pb-2 px-2">Category</th>
                  <th className="pb-2 px-2">Total Score</th>
                  <th className="pb-2 px-2">Time</th>
                  <th className="pb-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions?.map((entry, index) => (
                  <tr
                    key={entry.id}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <div className="font-bold text-lg">#{index + 1}</div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="font-medium">{entry.name}</div>
                    </td>
                    <td className="py-3 px-2">
                      <Badge className={`${CATEGORY_COLORS[entry.category] || 'bg-gray-500'} text-white`}>
                        {CATEGORY_NAMES[entry.category] || entry.category}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      <div className="font-bold text-lg">{entry.totalScore}/100</div>
                      <div className="text-xs text-muted-foreground">
                        C:{entry.subScores.clarity} I:{entry.subScores.impact} T:{entry.subScores.technology_fit} F:{entry.subScores.feasibility} B:{entry.subScores.business_value}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="text-sm text-muted-foreground">
                        {formatTimeAgo(entry.createdAt)}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedSubmissionId(entry.id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteConfirmId(entry.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog
        open={!!selectedSubmissionId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSubmissionId(null);
            setSubmissionDetails(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {submissionDetails && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  Solution by {submissionDetails.participantName}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Score Breakdown */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Score Breakdown</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Pitch rubric scores (0–8 each) plus trivia performance combine for a 100-point total.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-sm text-muted-foreground mb-1">Clarity</div>
                      <div className={`text-2xl font-bold ${getScoreColor(submissionDetails.subScores.clarity)}`}>
                        {submissionDetails.subScores.clarity}/8
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-sm text-muted-foreground mb-1">Impact</div>
                      <div className={`text-2xl font-bold ${getScoreColor(submissionDetails.subScores.impact)}`}>
                        {submissionDetails.subScores.impact}/8
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-sm text-muted-foreground mb-1">Technology Fit</div>
                      <div className={`text-2xl font-bold ${getScoreColor(submissionDetails.subScores.technology_fit)}`}>
                        {submissionDetails.subScores.technology_fit}/8
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-sm text-muted-foreground mb-1">Feasibility</div>
                      <div className={`text-2xl font-bold ${getScoreColor(submissionDetails.subScores.feasibility)}`}>
                        {submissionDetails.subScores.feasibility}/8
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-sm text-muted-foreground mb-1">Business Value</div>
                      <div className={`text-2xl font-bold ${getScoreColor(submissionDetails.subScores.business_value)}`}>
                        {submissionDetails.subScores.business_value}/8
                      </div>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-3">
                      <div className="text-sm text-muted-foreground mb-1">Total Score</div>
                      <div className="text-2xl font-bold text-primary">
                        {submissionDetails.totalScore}/100
                      </div>
                    </div>
                  </div>
                </div>

                {/* Evaluation Notes */}
                {submissionDetails.evaluationNotes && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">AI Evaluation Summary</h3>
                    <div className="bg-muted rounded-lg p-4">
                      {submissionDetails.evaluationNotes}
                    </div>
                  </div>
                )}

                {/* Structured Solution */}
                {submissionDetails.structuredJson && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Structured Solution</h3>
                    <ScrollArea className="h-96 border rounded-lg p-4">
                      <div className="space-y-4">
                        {submissionDetails.structuredJson.problem_summary && (
                          <div className="bg-muted rounded-lg p-4">
                            <h4 className="font-semibold text-primary mb-2">Problem Summary</h4>
                            <p className="text-sm">{submissionDetails.structuredJson.problem_summary}</p>
                          </div>
                        )}

                        {submissionDetails.structuredJson.impact_summary && (
                          <div className="bg-muted rounded-lg p-4">
                            <h4 className="font-semibold text-primary mb-2">Impact Summary</h4>
                            <p className="text-sm whitespace-pre-line">
                              {submissionDetails.structuredJson.impact_summary}
                            </p>
                          </div>
                        )}

                        {Array.isArray(submissionDetails.structuredJson.baseline_metrics) &&
                          submissionDetails.structuredJson.baseline_metrics.length > 0 && (
                            <div className="bg-muted rounded-lg p-4">
                              <h4 className="font-semibold text-primary mb-2">Baseline Metrics</h4>
                              <div className="grid sm:grid-cols-2 gap-3">
                                {submissionDetails.structuredJson.baseline_metrics.map((metric: any, idx: number) => (
                                  <div key={idx} className="text-sm">
                                    <div className="font-medium">{metric?.name || `Metric ${idx + 1}`}</div>
                                    <div className="text-muted-foreground">{metric?.value || ""}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        {Array.isArray(submissionDetails.structuredJson.target_metrics) &&
                          submissionDetails.structuredJson.target_metrics.length > 0 && (
                            <div className="bg-muted rounded-lg p-4">
                              <h4 className="font-semibold text-primary mb-2">Target Metrics</h4>
                              <div className="grid sm:grid-cols-2 gap-3">
                                {submissionDetails.structuredJson.target_metrics.map((metric: any, idx: number) => (
                                  <div key={idx} className="text-sm">
                                    <div className="font-medium">{metric?.name || `Metric ${idx + 1}`}</div>
                                    <div className="text-muted-foreground">{metric?.target || ""}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        {Array.isArray(submissionDetails.structuredJson.action_plan) &&
                          submissionDetails.structuredJson.action_plan.length > 0 && (
                            <div className="bg-muted rounded-lg p-4">
                              <h4 className="font-semibold text-primary mb-2">Action Plan</h4>
                              <ol className="list-decimal list-inside space-y-1 text-sm">
                                {submissionDetails.structuredJson.action_plan.map((step: string, idx: number) => (
                                  <li key={idx}>{step}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Chat History */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Conversation History</h3>
                  <ScrollArea className="h-64 border rounded-lg p-4">
                    <pre className="text-sm whitespace-pre-wrap">
                      {submissionDetails.solutionText}
                    </pre>
                  </ScrollArea>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteConfirmId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>

          <p className="text-muted-foreground">
            Are you sure you want to delete this submission? This action cannot be undone.
          </p>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDeleteSubmission(deleteConfirmId)}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RaffleTab() {
  const { toast } = useToast();
  const adminKey = localStorage.getItem("adminKey") || "";
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/beta-admin/raffle-entries/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      if (!response.ok) throw new Error("Failed to delete raffle entry");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/beta-admin/raffle-entries"] });
      setDeleteConfirmId(null);
      toast({ title: "Raffle entry deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete raffle entry", variant: "destructive" });
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
                      Score: {entry.combinedScore ?? 'N/A'}
                      {entry.triviaScore != null && entry.combinedScore != null && (
                        <span className="text-xs ml-1">
                          ({entry.triviaScore} trivia + {entry.combinedScore - entry.triviaScore} pitch)
                        </span>
                      )} •{" "}
                      {new Date(entry.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-mono text-muted-foreground">
                        {entry.emailHash.slice(0, 16)}...
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Raffle Date: {entry.raffleDate}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmId(entry.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this raffle entry? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BotBarStatsTab() {
  const { toast } = useToast();
  const adminKey = localStorage.getItem("adminKey") || "";
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("all");

  const { data: submissions, isLoading } = useQuery<Array<{
    attemptId: string;
    date: string;
    category: string;
    emailHash: string | null;
    firstName: string | null;
    lastName: string | null;
    company: string | null;
    triviaScore: number | null;
    pitchScore: number | null;
    combinedScore: number;
    botBar: number;
    eligible: boolean;
    passed: boolean;
    startedAt: string;
    endedAt: string | null;
  }>>({
    queryKey: ["/api/beta-admin/bot-bar-stats"],
    queryFn: async () => {
      const response = await fetch("/api/beta-admin/bot-bar-stats", {
        headers: { "x-admin-key": adminKey },
      });
      if (!response.ok) throw new Error("Failed to fetch bot bar stats");
      return response.json();
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading bot bar statistics...</div>;
  }

  if (!submissions || submissions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No bot bar data available yet.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Bot bar stats will appear once participants complete Ring mode submissions.
        </p>
      </div>
    );
  }

  // Get unique categories and dates
  const categories = ["all", ...new Set(submissions.map(s => s.category))];
  const dates = ["all", ...new Set(submissions.map(s => s.date))].sort().reverse();

  // Filter data
  let filteredSubmissions = submissions;
  if (selectedCategory !== "all") {
    filteredSubmissions = filteredSubmissions.filter(s => s.category === selectedCategory);
  }
  if (selectedDate !== "all") {
    filteredSubmissions = filteredSubmissions.filter(s => s.date === selectedDate);
  }

  // Calculate summary stats
  const totalSubmissions = filteredSubmissions.length;
  const eligibleCount = filteredSubmissions.filter(s => s.eligible).length;
  const ineligibleCount = totalSubmissions - eligibleCount;
  const avgBotBar = filteredSubmissions.length > 0
    ? filteredSubmissions.reduce((sum, s) => sum + s.botBar, 0) / filteredSubmissions.length
    : 0;
  const avgCombinedScore = filteredSubmissions.length > 0
    ? filteredSubmissions.reduce((sum, s) => sum + s.combinedScore, 0) / filteredSubmissions.length
    : 0;

  // Group by date and bot bar to show progression
  const groupedByDateAndBotBar = filteredSubmissions.reduce((acc, sub) => {
    const key = `${sub.date}-${sub.botBar}`;
    if (!acc[key]) {
      acc[key] = {
        date: sub.date,
        botBar: sub.botBar,
        category: sub.category,
        submissions: [],
      };
    }
    acc[key].submissions.push(sub);
    return acc;
  }, {} as Record<string, { date: string; botBar: number; category: string; submissions: typeof filteredSubmissions }>);

  const groupedData = Object.values(groupedByDateAndBotBar).sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime() || b.botBar - a.botBar
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Bot Bar Statistics</h2>
          <p className="text-muted-foreground">Individual submissions showing bot bar thresholds and scores</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : CATEGORY_NAMES[cat] || cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              {dates.map((date) => (
                <SelectItem key={date} value={date}>
                  {date === "all" ? "All Dates" : new Date(date).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSubmissions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Eligible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{eligibleCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalSubmissions > 0 ? ((eligibleCount / totalSubmissions) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ineligible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{ineligibleCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalSubmissions > 0 ? ((ineligibleCount / totalSubmissions) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Bot Bar / Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgBotBar.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg Score: {avgCombinedScore.toFixed(1)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Individual Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Submission Details</CardTitle>
          <p className="text-sm text-muted-foreground">
            Individual submissions with bot bar values and scores. Bot bar is the threshold calculated at submission time.
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-6">
              {groupedData.map((group, groupIndex) => {
                const eligibleInGroup = group.submissions.filter(s => s.eligible).length;
                const ineligibleInGroup = group.submissions.length - eligibleInGroup;

                return (
                  <div key={groupIndex} className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{new Date(group.date).toLocaleDateString()}</span>
                        <Badge className={CATEGORY_COLORS[group.category] || "bg-gray-500"}>
                          {CATEGORY_NAMES[group.category] || group.category}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        <span className="font-bold">Bot Bar: {group.botBar}</span>
                        <span className="text-muted-foreground ml-3">
                          ({eligibleInGroup} eligible, {ineligibleInGroup} ineligible)
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {group.submissions.map((sub) => (
                        <div
                          key={sub.attemptId}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            sub.eligible
                              ? 'bg-green-500/10 border-green-500/30'
                              : 'bg-red-500/10 border-red-500/30'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {sub.firstName && sub.lastName
                                  ? `${sub.firstName} ${sub.lastName}`
                                  : sub.emailHash
                                  ? `User ${sub.emailHash.slice(0, 8)}`
                                  : "Anonymous"}
                              </span>
                              {sub.company && (
                                <span className="text-sm text-muted-foreground">({sub.company})</span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {new Date(sub.startedAt).toLocaleString()}
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Combined Score</div>
                              <div className={`text-lg font-bold ${
                                sub.combinedScore >= sub.botBar ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {sub.combinedScore}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Trivia: {sub.triviaScore ?? 0} + Pitch: {sub.pitchScore ?? 0}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">vs Bot Bar</div>
                              <div className={`text-lg font-bold ${
                                sub.combinedScore >= sub.botBar ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {sub.combinedScore >= sub.botBar ? '+' : ''}{sub.combinedScore - sub.botBar}
                              </div>
                            </div>

                            <div>
                              {sub.eligible ? (
                                <CheckCircle className="w-6 h-6 text-green-600" />
                              ) : (
                                <XCircle className="w-6 h-6 text-red-600" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function WordCloudTab() {
  const { toast } = useToast();
  const adminKey = localStorage.getItem("adminKey") || "";
  const [editingEntry, setEditingEntry] = useState<WordCloudEntry | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({ word: "", count: 1 });

  const { data: entries, isLoading, refetch } = useQuery<WordCloudEntry[]>({
    queryKey: ["/api/beta-admin/word-cloud"],
    queryFn: async () => {
      const response = await fetch("/api/beta-admin/word-cloud", {
        headers: { "x-admin-key": adminKey },
      });
      if (!response.ok) throw new Error("Failed to fetch word cloud entries");
      return response.json();
    },
  });

  // Fetch word cloud visualization data
  const { data: wordCloudData } = useQuery<{ text: string; value: number }[]>({
    queryKey: ["/api/word-cloud-display"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard-data");
      if (!response.ok) throw new Error("Failed to fetch word cloud display data");
      const data = await response.json();
      return data.wordCloud || [];
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const createMutation = useMutation({
    mutationFn: async (data: { word: string; count: number }) => {
      const response = await fetch("/api/beta-admin/word-cloud", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create word cloud entry");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/beta-admin/word-cloud"] });
      queryClient.invalidateQueries({ queryKey: ["/api/word-cloud-display"] });
      setCreatingNew(false);
      setFormData({ word: "", count: 1 });
      toast({ title: "Word cloud entry created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create word cloud entry", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<WordCloudEntry> }) => {
      const response = await fetch(`/api/beta-admin/word-cloud/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update word cloud entry");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/beta-admin/word-cloud"] });
      queryClient.invalidateQueries({ queryKey: ["/api/word-cloud-display"] });
      setEditingEntry(null);
      setFormData({ word: "", count: 1 });
      toast({ title: "Word cloud entry updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update word cloud entry", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/beta-admin/word-cloud/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      if (!response.ok) throw new Error("Failed to delete word cloud entry");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/beta-admin/word-cloud"] });
      queryClient.invalidateQueries({ queryKey: ["/api/word-cloud-display"] });
      setDeleteConfirmId(null);
      toast({ title: "Word cloud entry deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete word cloud entry", variant: "destructive" });
    },
  });

  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch("/api/beta-admin/word-cloud/batch-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error("Failed to delete word cloud entries");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/beta-admin/word-cloud"] });
      queryClient.invalidateQueries({ queryKey: ["/api/word-cloud-display"] });
      setSelectedIds(new Set());
      setShowBatchDeleteConfirm(false);
      toast({ title: "Selected entries deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete selected entries", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === entries?.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(entries?.map(e => e.id) || []));
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size > 0) {
      batchDeleteMutation.mutate(Array.from(selectedIds));
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading word cloud entries...</div>;
  }

  const renderWordCloudPreview = () => {
    if (!wordCloudData || wordCloudData.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Word Cloud Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <i className="fas fa-cloud text-4xl text-muted-foreground mb-4"></i>
              <p className="text-lg font-semibold mb-2">No words to display</p>
              <p className="text-muted-foreground">Add words to see them appear in the word cloud.</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    const maxValue = Math.max(...wordCloudData.map(w => w.value));

    return (
      <Card>
        <CardHeader>
          <CardTitle>Word Cloud Preview</CardTitle>
          <p className="text-sm text-muted-foreground">
            Live preview of how the word cloud appears on the leaderboard
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative min-h-[400px] max-h-[400px] overflow-hidden flex items-center justify-center bg-muted/20 rounded-lg">
            {/* Cloud background effects */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-400 rounded-full filter blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-400 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-400 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Word cloud */}
            <div className="relative w-full h-full flex items-center justify-center p-4">
              {wordCloudData.slice(0, 8).map((word, index) => {
                if (index === 0) {
                  // Biggest word - centered with animation
                  return (
                    <div
                      key={word.text}
                      className="absolute"
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 30,
                      }}
                    >
                      <span
                        className="inline-block px-3 py-2 rounded-lg border-2 border-cyan-400/40 bg-gray-800/80 backdrop-blur-sm text-cyan-300 shadow-lg shadow-cyan-400/20 hover:border-cyan-400/60 hover:shadow-cyan-400/40 hover:bg-gray-800/90 word-cloud-float-1"
                        style={{
                          fontSize: 'clamp(32px, 7vw, 48px)',
                          opacity: 1,
                          textShadow: '0 0 10px rgba(34, 211, 238, 0.5)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {word.text}
                        <span className="ml-1 opacity-60" style={{ fontSize: '0.4em' }}>({word.value})</span>
                      </span>
                    </div>
                  );
                } else if (index < 5) {
                  // Medium words - with peripheral animations
                  const positions = [
                    { x: -150, y: -80 },  // Top-left
                    { x: 160, y: -60 },   // Top-right
                    { x: -140, y: 90 },   // Bottom-left
                    { x: 150, y: 70 }     // Bottom-right
                  ];
                  const pos = positions[index - 1];
                  return (
                    <div
                      key={word.text}
                      className="absolute"
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                        zIndex: 20,
                      }}
                    >
                      <span
                        className={`inline-block px-3 py-2 rounded-lg border-2 border-cyan-400/40 bg-gray-800/80 backdrop-blur-sm text-cyan-300 shadow-lg shadow-cyan-400/20 hover:border-cyan-400/60 hover:shadow-cyan-400/40 hover:bg-gray-800/90 whitespace-nowrap word-cloud-peripheral-${(index % 3) + 1}`}
                        style={{
                          fontSize: 'clamp(18px, 4vw, 28px)',
                          opacity: 0.95,
                          textShadow: '0 0 10px rgba(34, 211, 238, 0.5)',
                          animationDelay: `${index * 0.5}s`,
                        }}
                      >
                        {word.text}
                        <span className="ml-1 opacity-50" style={{ fontSize: '0.5em' }}>({word.value})</span>
                      </span>
                    </div>
                  );
                } else {
                  // Small words - with drift animation
                  const positions = [
                    { x: -200, y: -120 },   // Top-left
                    { x: 0, y: 150 },       // Bottom center
                    { x: 180, y: -100 }     // Top-right
                  ];
                  const pos = positions[index - 5];
                  return (
                    <div
                      key={word.text}
                      className="absolute word-cloud-drift"
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                        zIndex: 10,
                        animationDelay: `${index * 0.5}s`,
                      }}
                    >
                      <span
                        className="inline-block px-3 py-2 rounded-lg border-2 border-cyan-400/40 bg-gray-800/80 backdrop-blur-sm text-cyan-300 shadow-lg shadow-cyan-400/20 hover:border-cyan-400/60 hover:shadow-cyan-400/40 hover:bg-gray-800/90 whitespace-nowrap"
                        style={{
                          fontSize: 'clamp(14px, 3vw, 20px)',
                          opacity: 0.8,
                          textShadow: '0 0 10px rgba(34, 211, 238, 0.5)',
                        }}
                      >
                        {word.text}
                        <span className="ml-1 opacity-40" style={{ fontSize: '0.5em' }}>({word.value})</span>
                      </span>
                    </div>
                  );
                }
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Word Cloud Visual Preview */}
      {renderWordCloudPreview()}

      {/* Word Cloud Management */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Word Cloud Management</h2>
          <p className="text-muted-foreground">
            Manage words displayed in the word cloud ({entries?.length || 0} entries)
            {selectedIds.size > 0 && (
              <span className="ml-2 text-primary font-medium">
                {selectedIds.size} selected
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              onClick={() => setShowBatchDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedIds.size})
            </Button>
          )}
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const response = await fetch("/api/beta-admin/word-cloud/sync", {
                  method: "POST",
                  headers: { "x-admin-key": adminKey },
                });
                if (!response.ok) throw new Error("Failed to sync");
                const result = await response.json();
                toast({ title: "Success", description: result.message });
                refetch();
              } catch (error) {
                toast({
                  title: "Sync failed",
                  description: "Could not sync word cloud from submissions",
                  variant: "destructive"
                });
              }
            }}
          >
            <i className="fas fa-sync w-4 h-4 mr-2"></i>
            Sync from Submissions
          </Button>
          <Button onClick={() => setCreatingNew(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Word
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          {/* Select All Header */}
          <div className="flex items-center gap-2 pb-3 mb-3 border-b">
            <input
              type="checkbox"
              checked={selectedIds.size === entries?.length && entries?.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-gray-300 cursor-pointer"
            />
            <span className="text-sm font-medium text-muted-foreground">
              Select All
            </span>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {entries?.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(entry.id)}
                      onChange={() => toggleSelection(entry.id)}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-lg">{entry.word}</span>
                        <Badge variant="outline">Count: {entry.count}</Badge>
                        <Badge variant={entry.source === "manual" ? "default" : "secondary"}>
                          {entry.source}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Created: {new Date(entry.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingEntry(entry);
                        setFormData({ word: entry.word, count: entry.count });
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteConfirmId(entry.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={!!editingEntry || creatingNew}
        onOpenChange={(open) => {
          if (!open) {
            setEditingEntry(null);
            setCreatingNew(false);
            setFormData({ word: "", count: 1 });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Edit Word" : "Add New Word"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="word">Word</Label>
              <Input
                id="word"
                value={formData.word}
                onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                placeholder="Enter word"
                required
              />
            </div>
            <div>
              <Label htmlFor="count">Count (Weight)</Label>
              <Input
                id="count"
                type="number"
                min="1"
                value={formData.count}
                onChange={(e) =>
                  setFormData({ ...formData, count: parseInt(e.target.value) || 1 })
                }
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingEntry(null);
                  setCreatingNew(false);
                  setFormData({ word: "", count: 1 });
                }}
              >
                Cancel
              </Button>
              <Button type="submit">{editingEntry ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Word?</DialogTitle>
          </DialogHeader>
          <p>This will remove the word from the word cloud management. Are you sure?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Delete Confirmation */}
      <Dialog open={showBatchDeleteConfirm} onOpenChange={() => setShowBatchDeleteConfirm(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Selected Words?</DialogTitle>
          </DialogHeader>
          <p>
            This will remove {selectedIds.size} word{selectedIds.size !== 1 ? 's' : ''} from the word cloud management.
            Are you sure?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBatchDelete}
            >
              Delete {selectedIds.size} Word{selectedIds.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LeaderboardTab() {
  const { toast } = useToast();
  const adminKey = localStorage.getItem("adminKey") || "";
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  const { data: challengers, isLoading, refetch } = useQuery<ActiveChallenger[]>({
    queryKey: ["/api/admin/leaderboard/active-challengers"],
    queryFn: async () => {
      const response = await fetch("/api/admin/leaderboard/active-challengers", {
        headers: { "x-admin-key": adminKey },
      });
      if (!response.ok) throw new Error("Failed to fetch active challengers");
      return response.json();
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const removeMutation = useMutation({
    mutationFn: async (attemptId: string) => {
      const response = await fetch(`/api/admin/leaderboard/active-challenger/${attemptId}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      if (!response.ok) throw new Error("Failed to remove challenger");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leaderboard/active-challengers"] });
      setDeleteConfirmId(null);
      toast({ title: "Challenger removed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to remove challenger", variant: "destructive" });
    },
  });

  const clearStaleMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/leaderboard/clear-stale", {
        method: "POST",
        headers: { "x-admin-key": adminKey },
      });
      if (!response.ok) throw new Error("Failed to clear stale challengers");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leaderboard/active-challengers"] });
      toast({ title: `Cleared ${data.count} stale challengers` });
    },
    onError: () => {
      toast({ title: "Failed to clear stale challengers", variant: "destructive" });
    },
  });

  const clearAllActiveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/leaderboard/clear-all-active", {
        method: "POST",
        headers: { "x-admin-key": adminKey },
      });
      if (!response.ok) throw new Error("Failed to clear all active challengers");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leaderboard/active-challengers"] });
      setShowClearAllConfirm(false);
      toast({ title: `Cleared ${data.count} active challengers` });
    },
    onError: () => {
      toast({ title: "Failed to clear all active challengers", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading active challengers...</div>
        </CardContent>
      </Card>
    );
  }

  const activeCount = challengers?.length || 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Active Challengers ({activeCount})</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Users currently "in the ring" on the leaderboard
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => clearStaleMutation.mutate()}
                variant="outline"
                disabled={clearStaleMutation.isPending || activeCount === 0}
              >
                Clear Stale Entries
              </Button>
              <Button
                onClick={() => setShowClearAllConfirm(true)}
                variant="destructive"
                disabled={clearAllActiveMutation.isPending || activeCount === 0}
              >
                Clear All Active
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!challengers || challengers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active challengers
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Initials</th>
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Category</th>
                    <th className="text-left p-3 font-medium">Started</th>
                    <th className="text-left p-3 font-medium">Elapsed</th>
                    <th className="text-left p-3 font-medium">Email Hash</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {challengers.map((challenger) => (
                    <tr key={challenger.attemptId} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-mono">{challenger.initials}</td>
                      <td className="p-3">
                        {challenger.firstName && challenger.lastName
                          ? `${challenger.firstName} ${challenger.lastName}`
                          : <span className="text-muted-foreground">N/A</span>}
                      </td>
                      <td className="p-3">
                        <Badge className={CATEGORY_COLORS[challenger.category]}>
                          {CATEGORY_NAMES[challenger.category] || challenger.category}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {new Date(challenger.startedAt).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className={challenger.elapsedMinutes > 10 ? "text-destructive font-medium" : ""}>
                          {challenger.elapsedMinutes}m
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">
                        {challenger.emailHash.slice(0, 12)}...
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteConfirmId(challenger.attemptId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Challenger</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to force-end this challenger's ring attempt? This will remove them from the "In The Ring" display on the leaderboard.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && removeMutation.mutate(deleteConfirmId)}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showClearAllConfirm} onOpenChange={() => setShowClearAllConfirm(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Active Challengers?</DialogTitle>
          </DialogHeader>
          <p>
            This will force-end ALL active ring attempts ({activeCount} challenger{activeCount !== 1 ? 's' : ''})
            and clear the entire "ACTIVE NOW" display. This action cannot be undone. Are you sure?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearAllConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => clearAllActiveMutation.mutate()}
            >
              Clear All ({activeCount})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DBAdminTab() {
  const { toast } = useToast();
  const adminKey = localStorage.getItem("adminKey") || "";
  const [raffleDate, setRaffleDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedWinner, setSelectedWinner] = useState<any>(null);
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);

  // Fetch DB stats
  const { data: dbStats, refetch: refetchStats } = useQuery({
    queryKey: ["/api/beta-admin/db-stats"],
    queryFn: async () => {
      const response = await fetch("/api/beta-admin/db-stats", {
        headers: { "x-admin-key": adminKey },
      });
      if (!response.ok) throw new Error("Failed to fetch DB stats");
      return response.json();
    },
  });

  // Fetch existing raffle draw for selected date
  const { data: existingDraw, refetch: refetchDraw } = useQuery({
    queryKey: ["/api/beta-admin/raffle-draw", raffleDate],
    queryFn: async () => {
      const response = await fetch(`/api/beta-admin/raffle-draw/${raffleDate}`, {
        headers: { "x-admin-key": adminKey },
      });
      if (!response.ok) throw new Error("Failed to fetch raffle draw");
      return response.json();
    },
    enabled: !!raffleDate,
  });

  // Clear leaderboard cache mutation
  const clearLeaderboardMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/beta-admin/clear-leaderboard-cache", {
        method: "POST",
        headers: { "x-admin-key": adminKey },
      });
      if (!response.ok) throw new Error("Failed to clear leaderboard cache");
      return response.json();
    },
    onSuccess: (data) => {
      setClearLeaderboardConfirm(false);
      toast({
        title: "Leaderboard cache cleared",
        description: `Cleared ${data.deletedCount} cached entries`
      });
      refetchStats();
    },
    onError: () => {
      toast({ title: "Failed to clear leaderboard cache", variant: "destructive" });
    },
  });

  // Select raffle winner mutation
  const selectWinnerMutation = useMutation({
    mutationFn: async (date: string) => {
      const response = await fetch("/api/beta-admin/select-raffle-winner", {
        method: "POST",
        headers: {
          "x-admin-key": adminKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raffleDate: date }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to select winner");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setSelectedWinner(data);
      setShowWinnerDialog(true);
      toast({ title: "Raffle winner selected!" });
      refetchStats();
      refetchDraw();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to select winner",
        description: error.message,
        variant: "destructive"
      });
    },
  });


  return (
    <div className="space-y-6">
      {/* DB Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle>Database Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          {dbStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{dbStats.totalUsers || 0}</div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{dbStats.totalAttempts || 0}</div>
                <div className="text-sm text-muted-foreground">Total Attempts</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{dbStats.totalSubmissions || 0}</div>
                <div className="text-sm text-muted-foreground">Total Submissions</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{dbStats.totalRaffleEntries || 0}</div>
                <div className="text-sm text-muted-foreground">Raffle Entries</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{dbStats.leaderboardCacheEntries || 0}</div>
                <div className="text-sm text-muted-foreground">Cached Leaderboards</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{dbStats.totalTriviaItems || 0}</div>
                <div className="text-sm text-muted-foreground">Trivia Items</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{dbStats.totalRaffleDraws || 0}</div>
                <div className="text-sm text-muted-foreground">Raffle Draws</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{dbStats.wordCloudEntries || 0}</div>
                <div className="text-sm text-muted-foreground">Word Cloud Entries</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">Loading statistics...</div>
          )}
        </CardContent>
      </Card>

      {/* Raffle Management */}
      <Card>
        <CardHeader>
          <CardTitle>Raffle Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Select Winner with Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Date Selection and Actions */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="raffle-date">Select Raffle Date</Label>
                <Input
                  id="raffle-date"
                  type="date"
                  value={raffleDate}
                  onChange={(e) => setRaffleDate(e.target.value)}
                  className="max-w-xs"
                />
              </div>
              <div>
                <Button
                  onClick={() => selectWinnerMutation.mutate(raffleDate)}
                  disabled={selectWinnerMutation.isPending}
                >
                  {selectWinnerMutation.isPending ? "Selecting Winner..." : "Select Raffle Winner"}
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Randomly selects a winner from eligible entries for the selected date.
                  Uses a cryptographically verifiable random seed.
                </p>
              </div>
            </div>

            {/* Right Column: Winner Details or Placeholder */}
            <div className="border rounded-lg p-4 bg-muted/50">
              {existingDraw && existingDraw.winner ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Winner Drawn</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Name:</span>
                      <p className="font-medium">
                        {existingDraw.winner.firstName && existingDraw.winner.lastName
                          ? `${existingDraw.winner.firstName} ${existingDraw.winner.lastName}`
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Email:</span>
                      <p className="font-medium">
                        {existingDraw.winner.email || <span className="italic text-muted-foreground">Not available</span>}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Category:</span>
                      <p className="font-medium">{existingDraw.winner.category}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Draw Time:</span>
                      <p className="text-sm">{new Date(existingDraw.draw.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Admin User:</span>
                      <p className="text-sm">{existingDraw.draw.adminUser}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[200px]">
                  <p className="text-muted-foreground text-center">
                    Please select the raffle winner when ready.
                  </p>
                </div>
              )}
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Winner Display Dialog */}
      <Dialog open={showWinnerDialog} onOpenChange={setShowWinnerDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Raffle Winner Selected!</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {selectedWinner && (
              <>
                <div className="p-6 bg-primary/10 rounded-lg border-2 border-primary">
                  <h3 className="text-2xl font-bold mb-2">Winner Details</h3>
                  <div className="space-y-2">
                    <div><strong>Name:</strong> {selectedWinner.winner.firstName} {selectedWinner.winner.lastName}</div>
                    <div><strong>Email:</strong> {selectedWinner.winner.email || <span className="text-muted-foreground italic">Not available</span>}</div>
                    <div><strong>Category:</strong> {selectedWinner.winner.category}</div>
                    <div><strong>Entry Date:</strong> {new Date(selectedWinner.winner.createdAt).toLocaleString()}</div>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Verification Details</h4>
                  <div className="space-y-1 text-sm font-mono">
                    <div><strong>RNG Seed:</strong> <code className="text-xs break-all">{selectedWinner.draw.rngSeed}</code></div>
                    <div><strong>Total Entries:</strong> {selectedWinner.totalEntries}</div>
                    <div><strong>Selected Index:</strong> {selectedWinner.selectedIndex}</div>
                    <div><strong>Draw Time:</strong> {new Date(selectedWinner.draw.createdAt).toLocaleString()}</div>
                    <div><strong>Admin User:</strong> {selectedWinner.draw.adminUser}</div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  This draw has been recorded in the database and can be verified using the RNG seed.
                </p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowWinnerDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
            <TabsTrigger value="submissions">Scored Submissions</TabsTrigger>
            <TabsTrigger value="wordcloud">Word Cloud</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="botbarstats">Bot Bar Stats</TabsTrigger>
            <TabsTrigger value="dbadmin">DB Admin</TabsTrigger>
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

          <TabsContent value="submissions">
            <ScoredSubmissionsTab />
          </TabsContent>

          <TabsContent value="wordcloud">
            <WordCloudTab />
          </TabsContent>

          <TabsContent value="leaderboard">
            <LeaderboardTab />
          </TabsContent>

          <TabsContent value="botbarstats">
            <BotBarStatsTab />
          </TabsContent>

          <TabsContent value="dbadmin">
            <DBAdminTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
