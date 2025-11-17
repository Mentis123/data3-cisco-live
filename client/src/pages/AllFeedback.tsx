import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronDown, ChevronRight, Star, Download } from "lucide-react";
import { categoryLabels } from "@/features/chatbot/validation";
import { Input } from "@/components/ui/input";

interface FeedbackRecord {
  id: string;
  emailHash: string | null;
  sessionToken: string | null;
  category: string;
  rating: number;
  message: string;
  page: string;
  status: string;
  createdAt: string;
}

export default function AllFeedback() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Check if admin key is already in localStorage
  useEffect(() => {
    const adminKey = localStorage.getItem("adminKey");
    if (adminKey === "cisco-live-melbourne-2025") {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch feedback when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchFeedback();
    }
  }, [isAuthenticated, filterStatus]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const adminKey = localStorage.getItem("adminKey");
      const url = filterStatus === "all"
        ? "/api/admin/feedback"
        : `/api/admin/feedback?status=${filterStatus}`;

      const response = await fetch(url, {
        headers: {
          "x-admin-key": adminKey || "",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch feedback");
      }

      const data = await response.json();
      setFeedback(data);
    } catch (err) {
      console.error("Error fetching feedback:", err);
      setError("Failed to load feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "cisco-live-melbourne-2025") {
      localStorage.setItem("adminKey", password);
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Invalid password");
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryBadgeClass = (category: string): string => {
    const badgeMap: Record<string, string> = {
      "ui-ux": "bg-purple-600",
      "gameplay": "bg-blue-600",
      "trivia": "bg-green-600",
      "technical": "bg-red-600",
      "feature-request": "bg-orange-600",
      "other": "bg-gray-600",
    };
    return badgeMap[category] || "bg-gray-600";
  };

  const getStatusBadgeClass = (status: string): string => {
    const badgeMap: Record<string, string> = {
      "pending": "bg-yellow-600",
      "reviewed": "bg-blue-600",
      "resolved": "bg-green-600",
      "dismissed": "bg-gray-600",
    };
    return badgeMap[status] || "bg-gray-600";
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  const handleDownloadCSV = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      // Create CSV content
      const headers = [
        "ID",
        "Date",
        "Rating",
        "Category",
        "Status",
        "Page",
        "Message",
        "Email Hash",
        "Session Token",
      ];

      const rows = feedback.map((item) => [
        item.id,
        formatDate(item.createdAt),
        item.rating.toString(),
        categoryLabels[item.category] || item.category,
        item.status,
        item.page,
        item.message,
        item.emailHash || "",
        item.sessionToken || "",
      ]);

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `feedback_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading CSV:", error);
      alert("Failed to download CSV. Please try again.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full">
                Access Feedback
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading && feedback.length === 0) {
    return <div className="p-8 text-center">Loading feedback...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
        </Link>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Feedback</h2>
          <p className="text-muted-foreground">
            {feedback.length} {filterStatus === "all" ? "total" : filterStatus} feedback entries
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownloadCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </Button>
        </div>
      </div>

      {/* Filter by status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("all")}
            >
              All
            </Button>
            <Button
              variant={filterStatus === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("pending")}
            >
              Pending
            </Button>
            <Button
              variant={filterStatus === "reviewed" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("reviewed")}
            >
              Reviewed
            </Button>
            <Button
              variant={filterStatus === "resolved" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("resolved")}
            >
              Resolved
            </Button>
            <Button
              variant={filterStatus === "dismissed" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("dismissed")}
            >
              Dismissed
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-semibold">Date/Time</th>
                  <th className="text-left p-3 font-semibold">Rating</th>
                  <th className="text-left p-3 font-semibold">Category</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Page</th>
                  <th className="text-left p-3 font-semibold">Message</th>
                </tr>
              </thead>
              <tbody>
                {feedback.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-muted-foreground">
                      No feedback entries found
                    </td>
                  </tr>
                ) : (
                  feedback.map((item) => {
                    const isExpanded = expandedRows.has(item.id);
                    return (
                      <tr
                        key={item.id}
                        className="border-b hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-3 text-sm">{formatDate(item.createdAt)}</td>
                        <td className="p-3">{renderStars(item.rating)}</td>
                        <td className="p-3">
                          <Badge className={`${getCategoryBadgeClass(item.category)} text-white`}>
                            {categoryLabels[item.category] || item.category}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={`${getStatusBadgeClass(item.status)} text-white`}>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {item.page}
                          </code>
                        </td>
                        <td className="p-3">
                          <div>
                            <button
                              onClick={() => toggleRow(item.id)}
                              className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                              <span className={!isExpanded ? "line-clamp-2" : ""}>
                                {item.message}
                              </span>
                            </button>
                            {isExpanded && (
                              <div className="mt-2 p-3 bg-muted/50 rounded-md text-sm space-y-2">
                                <div>
                                  <strong>Full Message:</strong>
                                  <p className="mt-1 whitespace-pre-wrap">{item.message}</p>
                                </div>
                                {item.emailHash && (
                                  <div>
                                    <strong>Email Hash:</strong>
                                    <p className="mt-1 text-xs font-mono">{item.emailHash}</p>
                                  </div>
                                )}
                                {item.sessionToken && (
                                  <div>
                                    <strong>Session Token:</strong>
                                    <p className="mt-1 text-xs font-mono break-all">
                                      {item.sessionToken}
                                    </p>
                                  </div>
                                )}
                                <div>
                                  <strong>Feedback ID:</strong>
                                  <p className="mt-1 text-xs font-mono">{item.id}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
