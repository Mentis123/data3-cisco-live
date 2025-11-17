import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { getCategoryName } from "@/constants/categories";

interface SubmissionRecord {
  submissionId: string;
  submissionDate: string;
  participantId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  category: string;
  totalScore: number;
  subScores: {
    clarity: number;
    impact: number;
    technology_fit: number;
    feasibility: number;
    business_value: number;
  };
  structuredData: {
    problem_summary?: string;
    impact_summary?: string;
  };
  evaluationNotes: string | null;
  solutionText: string;
  chatTranscript: Array<{ role: string; content: string }>;
}

const CATEGORY_BADGE_MAP: Record<string, string> = {
  "security": "bg-red-600",
  "networking": "bg-blue-600",
  "collaboration": "bg-purple-600",
  "observability": "bg-green-600",
  "data_center": "bg-orange-600",
  "automation": "bg-teal-600",
};

export default function AllSubmissions() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPasswordError, setShowPasswordError] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    const adminKey = localStorage.getItem("adminKey");
    if (adminKey === "cisco-live-melbourne-2025") {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubmissions();
    }
  }, [isAuthenticated]);

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      const adminKey = localStorage.getItem("adminKey");
      const response = await fetch("/api/admin/all-submissions", {
        headers: {
          "x-admin-key": adminKey || "",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch submissions");
      }

      const data = await response.json();
      setSubmissions(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching submissions:", err);
      setError("Failed to load submissions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCSV = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const adminKey = localStorage.getItem("adminKey");
      const response = await fetch("/api/admin/download-submissions-csv", {
        headers: {
          "x-admin-key": adminKey || "",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to download CSV");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `all_submissions_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading CSV:", error);
      alert("Failed to download CSV. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleRow = (submissionId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Admin Access</CardTitle>
            <p className="text-center text-muted-foreground">
              View all submissions
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
                Access Submissions
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
            <h1 className="text-3xl font-bold">All Submissions</h1>
            <p className="text-muted-foreground">
              {submissions.length} total submission{submissions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleDownloadCSV}>
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
            <Link href="/admin">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="p-4 text-destructive">
              {error}
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading submissions...</p>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr className="text-left">
                      <th className="py-3 px-4 font-semibold">#</th>
                      <th className="py-3 px-4 font-semibold">Date</th>
                      <th className="py-3 px-4 font-semibold">Participant</th>
                      <th className="py-3 px-4 font-semibold">Email</th>
                      <th className="py-3 px-4 font-semibold">Category</th>
                      <th className="py-3 px-4 font-semibold">Total Score</th>
                      <th className="py-3 px-4 font-semibold">Sub-Scores</th>
                      <th className="py-3 px-4 font-semibold">Problem Summary</th>
                      <th className="py-3 px-4 font-semibold">Impact Summary</th>
                      <th className="py-3 px-4 font-semibold">Evaluation Notes</th>
                      <th className="py-3 px-4 font-semibold">Chat Transcript</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission, index) => {
                      const isExpanded = expandedRows.has(submission.submissionId);
                      return (
                        <tr
                          key={submission.submissionId}
                          className="border-b hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-3 px-4 text-muted-foreground">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {formatDate(submission.submissionDate)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium">
                              {submission.firstName} {submission.lastName}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {submission.email || 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={`${CATEGORY_BADGE_MAP[submission.category] || 'bg-gray-500'} text-white`}>
                              {getCategoryName(submission.category)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-lg">
                              {submission.totalScore}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-xs space-y-1">
                              <div>C: {submission.subScores.clarity}</div>
                              <div>I: {submission.subScores.impact}</div>
                              <div>T: {submission.subScores.technology_fit}</div>
                              <div>F: {submission.subScores.feasibility}</div>
                              <div>B: {submission.subScores.business_value}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm max-w-xs">
                            <div className="line-clamp-2">
                              {submission.structuredData?.problem_summary || 'N/A'}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm max-w-xs">
                            <div className="line-clamp-2">
                              {submission.structuredData?.impact_summary || 'N/A'}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm max-w-xs">
                            <div className="line-clamp-2">
                              {submission.evaluationNotes || 'N/A'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => toggleRow(submission.submissionId)}
                                className="w-full"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronDown className="w-4 h-4 mr-1" />
                                    Hide
                                  </>
                                ) : (
                                  <>
                                    <ChevronRight className="w-4 h-4 mr-1" />
                                    Show
                                  </>
                                )}
                              </Button>
                              {isExpanded && (
                                <div className="mt-2 p-3 bg-muted/50 rounded-md text-sm max-w-md max-h-96 overflow-y-auto">
                                  {submission.chatTranscript && submission.chatTranscript.length > 0 ? (
                                    <div className="space-y-3">
                                      {submission.chatTranscript.map((msg, idx) => (
                                        <div key={idx} className="border-b pb-2 last:border-b-0">
                                          <div className={`font-semibold mb-1 ${msg.role === 'user' ? 'text-blue-600' : 'text-green-600'}`}>
                                            {msg.role === 'user' ? 'PARTICIPANT' : 'SPRINT COACH'}:
                                          </div>
                                          <div className="text-xs whitespace-pre-wrap">{msg.content}</div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-muted-foreground">No chat transcript available</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
