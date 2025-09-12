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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DetailedEntry {
  id: string;
  name: string;
  category: string;
  totalScore: number;
  subScores: {
    outcome: number;
    fit: number;
    feasibility: number;
    impact: number;
    observability: number;
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
    outcome: number;
    fit: number;
    feasibility: number;
    impact: number;
    observability: number;
  };
  solutionText: string;
  structuredJson: any;
  evaluationNotes: string | null;
  createdAt: string;
}

interface Data3Stat {
  id: string;
  title: string;
  value: string;
  description: string | null;
  category: string;
  displayOrder: number;
  createdAt?: string;
}

const CATEGORY_NAMES: Record<string, string> = {
  "SECURE_CONNECTIVITY": "Zero Trust & Secure Connectivity",
  "HYBRID_DC": "Data Centre & Hybrid Cloud",
  "COLLAB_CX": "Collaboration & Contact Centre",
  "OBSERVABILITY": "Observability & Performance",
  "EDGE_IOT": "Edge & IoT Solutions"
};

// Consistent color scheme matching Leaderboard.tsx
const CATEGORY_COLORS: Record<string, string> = {
  "SECURE_CONNECTIVITY": "bg-[#00BCF2]",  // Cyan
  "HYBRID_DC": "bg-[#6CC04A]",            // Green  
  "COLLAB_CX": "bg-[#FF6B35]",            // Orange
  "OBSERVABILITY": "bg-[#9B59B6]",        // Purple
  "EDGE_IOT": "bg-[#F39C12]"              // Yellow
};

// Stats Management Component
function StatsManagement({ editingStat, setEditingStat, creatingNewStat, setCreatingNewStat, statFilter, setStatFilter }: {
  editingStat: Data3Stat | null;
  setEditingStat: (stat: Data3Stat | null) => void;
  creatingNewStat: boolean;
  setCreatingNewStat: (creating: boolean) => void;
  statFilter: string;
  setStatFilter: (filter: string) => void;
}) {
  const { toast } = useToast();
  const adminKey = localStorage.getItem('adminKey') || '';
  
  // Fetch stats
  const { data: stats, isLoading, refetch } = useQuery<Data3Stat[]>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats', {
        headers: { 'x-admin-key': adminKey }
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: !!adminKey
  });

  // Create stat mutation
  const createStat = useMutation({
    mutationFn: async (newStat: Omit<Data3Stat, 'id' | 'createdAt'>) => {
      const response = await fetch('/api/admin/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify(newStat)
      });
      if (!response.ok) throw new Error('Failed to create stat');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Stat created successfully" });
      refetch();
      setCreatingNewStat(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create stat", variant: "destructive" });
    }
  });

  // Update stat mutation
  const updateStat = useMutation({
    mutationFn: async ({ id, ...data }: Data3Stat) => {
      const response = await fetch(`/api/admin/stats/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update stat');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Stat updated successfully" });
      refetch();
      setEditingStat(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update stat", variant: "destructive" });
    }
  });

  // Delete stat mutation
  const deleteStat = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/stats/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey }
      });
      if (!response.ok) throw new Error('Failed to delete stat');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Stat deleted successfully" });
      refetch();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete stat", variant: "destructive" });
    }
  });

  // Filter stats
  const filteredStats = stats?.filter(stat => 
    statFilter === 'ALL' || stat.category === statFilter
  ) || [];

  const categories = ['SCALE', 'EXPERTISE', 'INFRASTRUCTURE', 'SECURITY', 'CLOUD', 'NETWORKING'];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Data<sup>#</sup>3 Stats Management</CardTitle>
              <p className="text-muted-foreground mt-1">Manage the stats displayed on the leaderboard</p>
            </div>
            <Button onClick={() => setCreatingNewStat(true)} data-testid="button-add-stat">
              <i className="fas fa-plus mr-2"></i>
              Add New Stat
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter */}
          <div className="mb-4">
            <Label htmlFor="category-filter">Filter by Category</Label>
            <Select value={statFilter} onValueChange={setStatFilter}>
              <SelectTrigger id="category-filter" className="w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stats Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-2 px-2">Order</th>
                  <th className="pb-2 px-2">Title</th>
                  <th className="pb-2 px-2">Value</th>
                  <th className="pb-2 px-2">Description</th>
                  <th className="pb-2 px-2">Category</th>
                  <th className="pb-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredStats.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No stats found
                    </td>
                  </tr>
                ) : (
                  filteredStats.sort((a, b) => a.displayOrder - b.displayOrder).map((stat) => (
                    <tr key={stat.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">{stat.displayOrder}</td>
                      <td className="py-3 px-2 font-semibold">{stat.title}</td>
                      <td className="py-3 px-2 text-primary font-bold">{stat.value}</td>
                      <td className="py-3 px-2 text-sm text-muted-foreground">{stat.description || '-'}</td>
                      <td className="py-3 px-2">
                        <Badge variant="secondary">{stat.category}</Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingStat(stat)}
                            data-testid={`button-edit-stat-${stat.id}`}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this stat?')) {
                                deleteStat.mutate(stat.id);
                              }
                            }}
                            data-testid={`button-delete-stat-${stat.id}`}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={!!editingStat || creatingNewStat} onOpenChange={(open) => {
        if (!open) {
          setEditingStat(null);
          setCreatingNewStat(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStat ? 'Edit Stat' : 'Create New Stat'}</DialogTitle>
          </DialogHeader>
          <StatForm
            stat={editingStat}
            categories={categories}
            onSubmit={(data) => {
              if (editingStat) {
                updateStat.mutate({ ...editingStat, ...data });
              } else {
                createStat.mutate(data);
              }
            }}
            onCancel={() => {
              setEditingStat(null);
              setCreatingNewStat(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

// Stat Form Component
function StatForm({ stat, categories, onSubmit, onCancel }: {
  stat: Data3Stat | null;
  categories: string[];
  onSubmit: (data: Omit<Data3Stat, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    title: stat?.title || '',
    value: stat?.value || '',
    description: stat?.description || '',
    category: stat?.category || 'SCALE',
    displayOrder: stat?.displayOrder || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="value">Value</Label>
        <Input
          id="value"
          value={formData.value}
          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
          placeholder="e.g., 1,500+ or 24/7"
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Additional context"
        />
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger id="category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="displayOrder">Display Order</Label>
        <Input
          id="displayOrder"
          type="number"
          value={formData.displayOrder}
          onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
          required
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{stat ? 'Update' : 'Create'}</Button>
      </DialogFooter>
    </form>
  );
}

export default function AdminLeaderboard() {
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [submissionDetails, setSubmissionDetails] = useState<SubmissionDetails | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPasswordError, setShowPasswordError] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingStat, setEditingStat] = useState<Data3Stat | null>(null);
  const [creatingNewStat, setCreatingNewStat] = useState(false);
  const [statFilter, setStatFilter] = useState<string>("ALL");
  const { toast } = useToast();

  const { data: leaderboard, isLoading, refetch } = useQuery<DetailedEntry[]>({
    queryKey: ["/api/admin/leaderboard"],
    enabled: isAuthenticated,
  });

  const handleDeleteSubmission = async (id: string) => {
    setIsDeleting(true);
    try {
      await apiRequest("DELETE", `/api/admin/submission/${id}`);
      setDeleteConfirmId(null);
      refetch(); // Refresh the leaderboard
    } catch (error) {
      console.error("Failed to delete submission:", error);
      alert("Failed to delete submission. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Fetch submission details when an entry is selected
  useEffect(() => {
    if (selectedSubmissionId) {
      apiRequest("GET", `/api/admin/submission/${selectedSubmissionId}`)
        .then(res => res.json())
        .then(setSubmissionDetails)
        .catch(console.error);
    }
  }, [selectedSubmissionId]);

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

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "password") {
      // Store the admin key in localStorage for API calls
      localStorage.setItem('adminKey', 'cisco-live-melbourne-2025');
      setIsAuthenticated(true);
      setShowPasswordError(false);
    } else {
      setShowPasswordError(true);
      setTimeout(() => setShowPasswordError(false), 2000);
    }
  };

  // Password Protection Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Admin Access Required</CardTitle>
              <Link href="/">
                <Button variant="outline" size="sm">
                  <i className="fas fa-arrow-left mr-2"></i>
                  Back
                </Button>
              </Link>
            </div>
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
                    showPasswordError ? 'border-destructive ring-2 ring-destructive' : 'border-border'
                  }`}
                  placeholder="Enter password"
                  autoFocus
                  data-testid="input-admin-password"
                />
                {showPasswordError && (
                  <p className="text-destructive text-sm mt-2">Incorrect password</p>
                )}
              </div>
              <Button type="submit" className="w-full" data-testid="button-submit-password">
                <i className="fas fa-lock mr-2"></i>
                Access Admin Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-2xl font-bold mb-4">Loading Admin Dashboard...</div>
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Admin Leaderboard Dashboard</h1>
            <Link href="/">
              <Button variant="outline">
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Home
              </Button>
            </Link>
          </div>
          <p className="text-muted-foreground">
            Click on any entry to view the complete solution and scoring breakdown
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Total Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{leaderboard?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {leaderboard && leaderboard.length > 0
                  ? Math.round(leaderboard.reduce((sum, e) => sum + e.totalScore, 0) / leaderboard.length)
                  : 0}
                /50
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Top Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {leaderboard && leaderboard.length > 0 ? leaderboard[0].totalScore : 0}/50
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different admin sections */}
        <Tabs defaultValue="submissions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="stats">Data<sup className="text-primary">#</sup>3 Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle>All Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="pb-2 px-2">Rank</th>
                        <th className="pb-2 px-2">Participant</th>
                        <th className="pb-2 px-2">Category</th>
                        <th className="pb-2 px-2">Total Score</th>
                        <th className="pb-2 px-2">Evaluation</th>
                        <th className="pb-2 px-2">Time</th>
                        <th className="pb-2 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard?.map((entry, index) => (
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
                            <div className="font-bold text-lg">{entry.totalScore}/50</div>
                          </td>
                          <td className="py-3 px-2">
                            {entry.evaluationNotes && (
                              <div className="text-sm text-muted-foreground max-w-xs truncate">
                                {entry.evaluationNotes}
                              </div>
                            )}
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
                                onClick={() => setSelectedSubmissionId(entry.id)}
                                data-testid={`button-view-details-${index}`}
                              >
                                <i className="fas fa-eye mr-2"></i>
                                View Details
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteConfirmId(entry.id)}
                                data-testid={`button-delete-${index}`}
                              >
                                <i className="fas fa-trash mr-2"></i>
                                Delete
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
          </TabsContent>

          <TabsContent value="stats">
            <StatsManagement 
              editingStat={editingStat}
              setEditingStat={setEditingStat}
              creatingNewStat={creatingNewStat}
              setCreatingNewStat={setCreatingNewStat}
              statFilter={statFilter}
              setStatFilter={setStatFilter}
            />
          </TabsContent>
        </Tabs>
      </div>

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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-sm text-muted-foreground mb-1">Business Outcome</div>
                      <div className={`text-2xl font-bold ${getScoreColor(submissionDetails.subScores.outcome)}`}>
                        {submissionDetails.subScores.outcome}/10
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-sm text-muted-foreground mb-1">Cisco Fit</div>
                      <div className={`text-2xl font-bold ${getScoreColor(submissionDetails.subScores.fit)}`}>
                        {submissionDetails.subScores.fit}/10
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-sm text-muted-foreground mb-1">Feasibility</div>
                      <div className={`text-2xl font-bold ${getScoreColor(submissionDetails.subScores.feasibility)}`}>
                        {submissionDetails.subScores.feasibility}/10
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-sm text-muted-foreground mb-1">Impact</div>
                      <div className={`text-2xl font-bold ${getScoreColor(submissionDetails.subScores.impact)}`}>
                        {submissionDetails.subScores.impact}/10
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-sm text-muted-foreground mb-1">Observability</div>
                      <div className={`text-2xl font-bold ${getScoreColor(submissionDetails.subScores.observability)}`}>
                        {submissionDetails.subScores.observability}/10
                      </div>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-3">
                      <div className="text-sm text-muted-foreground mb-1">Total Score</div>
                      <div className="text-2xl font-bold text-primary">
                        {submissionDetails.totalScore}/50
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
                        {/* Problem Summary */}
                        {submissionDetails.structuredJson.problem_summary && (
                          <div className="bg-muted rounded-lg p-4">
                            <h4 className="font-semibold text-primary mb-2">Problem Summary</h4>
                            <p className="text-sm">{submissionDetails.structuredJson.problem_summary}</p>
                          </div>
                        )}
                        
                        {/* Category & Cisco Products */}
                        <div className="grid md:grid-cols-2 gap-4">
                          {submissionDetails.structuredJson.chosen_category && (
                            <div className="bg-muted rounded-lg p-4">
                              <h4 className="font-semibold text-primary mb-2">Category</h4>
                              <Badge className="text-sm">
                                {submissionDetails.structuredJson.chosen_category.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                          )}
                          
                          {submissionDetails.structuredJson.cisco_products && (
                            <div className="bg-muted rounded-lg p-4">
                              <h4 className="font-semibold text-primary mb-2">Cisco Products</h4>
                              <div className="flex flex-wrap gap-1">
                                {submissionDetails.structuredJson.cisco_products.map((product: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {product}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Current State */}
                        {submissionDetails.structuredJson.current_state && (
                          <div className="bg-muted rounded-lg p-4">
                            <h4 className="font-semibold text-primary mb-2">Current State</h4>
                            {submissionDetails.structuredJson.current_state.baseline_kpis && (
                              <div className="mb-2">
                                <h5 className="text-sm font-medium mb-1">KPIs</h5>
                                <div className="grid grid-cols-2 gap-2">
                                  {submissionDetails.structuredJson.current_state.baseline_kpis.map((kpi: any, idx: number) => (
                                    <div key={idx} className="text-xs">
                                      <span className="font-medium">{kpi.name}:</span> {kpi.value}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {submissionDetails.structuredJson.current_state.constraints && (
                              <div>
                                <h5 className="text-sm font-medium mb-1">Constraints</h5>
                                <ul className="list-disc list-inside text-xs space-y-0.5">
                                  {submissionDetails.structuredJson.current_state.constraints.map((constraint: string, idx: number) => (
                                    <li key={idx}>{constraint}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Target State */}
                        {submissionDetails.structuredJson.target_state && (
                          <div className="bg-muted rounded-lg p-4">
                            <h4 className="font-semibold text-primary mb-2">Target State</h4>
                            {submissionDetails.structuredJson.target_state.kpis && (
                              <div>
                                <h5 className="text-sm font-medium mb-1">Target KPIs</h5>
                                <div className="grid grid-cols-2 gap-2">
                                  {submissionDetails.structuredJson.target_state.kpis.map((kpi: any, idx: number) => (
                                    <div key={idx} className="text-xs">
                                      <span className="font-medium">{kpi.name}:</span> {kpi.target}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Rollout Plan */}
                        {submissionDetails.structuredJson.rollout_plan && (
                          <div className="bg-muted rounded-lg p-4">
                            <h4 className="font-semibold text-primary mb-2">Rollout Plan</h4>
                            <ul className="space-y-2">
                              {submissionDetails.structuredJson.rollout_plan.map((phase: string, idx: number) => (
                                <li key={idx} className="text-sm">
                                  <span className="font-medium">Phase {idx + 1}:</span> {phase}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Integration Points */}
                        {submissionDetails.structuredJson.integration_points && (
                          <div className="bg-muted rounded-lg p-4">
                            <h4 className="font-semibold text-primary mb-2">Integration Points</h4>
                            <div className="flex flex-wrap gap-1">
                              {submissionDetails.structuredJson.integration_points.map((point: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {point}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Risks */}
                        {submissionDetails.structuredJson.risks && (
                          <div className="bg-muted rounded-lg p-4">
                            <h4 className="font-semibold text-primary mb-2">Risks</h4>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {submissionDetails.structuredJson.risks.map((risk: string, idx: number) => (
                                <li key={idx}>{risk}</li>
                              ))}
                            </ul>
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

                {/* Metadata */}
                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Category: {CATEGORY_NAMES[submissionDetails.category]}</span>
                    <span>Submitted: {new Date(submissionDetails.createdAt).toLocaleString()}</span>
                  </div>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete this submission? This action cannot be undone.
            </p>
            
            <div className="flex gap-2 justify-end">
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
                data-testid="button-confirm-delete"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash mr-2"></i>
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}