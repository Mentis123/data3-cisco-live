import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Star, MessageSquare, Calendar, MapPin, CheckCircle, Clock, Lightbulb } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface FeedbackItem {
  id: string;
  category: string;
  rating: number;
  message: string;
  page: string;
  status: string;
  createdAt: string | Date;
  emailHash: string | null;
  sessionToken: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  "ui-ux": "UI/UX Design",
  "gameplay": "Gameplay Experience",
  "trivia": "Trivia Content",
  "technical": "Technical Issue",
  "feature-request": "Feature Request",
  "other": "Other",
};

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    variant: "secondary" as const,
    icon: Clock,
    color: "text-yellow-500",
  },
  reviewed: {
    label: "Reviewed",
    variant: "default" as const,
    icon: CheckCircle,
    color: "text-blue-500",
  },
  implemented: {
    label: "Implemented",
    variant: "default" as const,
    icon: Lightbulb,
    color: "text-green-500",
  },
};

export function FeedbackTab() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const adminKey = localStorage.getItem("adminKey") || "";
  const { toast } = useToast();

  const { data: feedback = [], isLoading, error } = useQuery<FeedbackItem[]>({
    queryKey: ["/api/admin/feedback", statusFilter],
    queryFn: async () => {
      const url = statusFilter === "all"
        ? "/api/admin/feedback"
        : `/api/admin/feedback?status=${statusFilter}`;

      const response = await fetch(url, {
        headers: { "x-admin-key": adminKey },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch feedback");
      }

      return response.json();
    },
    enabled: !!adminKey,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/admin/feedback/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feedback"] });
      toast({
        title: "Status updated",
        description: "Feedback status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update feedback status.",
        variant: "destructive",
      });
    },
  });

  // Calculate statistics
  const stats = {
    total: feedback.length,
    pending: feedback.filter((f) => f.status === "pending").length,
    reviewed: feedback.filter((f) => f.status === "reviewed").length,
    implemented: feedback.filter((f) => f.status === "implemented").length,
    avgRating: feedback.length > 0
      ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
      : "0.0",
  };

  const handleStatusChange = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  if (!adminKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            Please enter your admin key to view feedback.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>
            Failed to load feedback. Please check your admin key and try again.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardDescription className="text-xs sm:text-sm">Total Feedback</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardDescription className="text-xs sm:text-sm">Pending</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl text-yellow-500">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardDescription className="text-xs sm:text-sm">Reviewed</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl text-blue-500">{stats.reviewed}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardDescription className="text-xs sm:text-sm">Implemented</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl text-green-500">{stats.implemented}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="pb-2 sm:pb-3">
            <CardDescription className="text-xs sm:text-sm">Avg Rating</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl">{stats.avgRating} ⭐</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>User Feedback</CardTitle>
              <CardDescription>
                Review and manage user feedback submissions
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Feedback</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="implemented">Implemented</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading feedback...
            </div>
          ) : feedback.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No feedback found.
            </div>
          ) : (
            <div className="space-y-4">
              {feedback.map((item) => {
                const StatusIcon = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG]?.icon || Clock;
                const statusConfig = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG];

                return (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                      <div className="space-y-3 sm:space-y-4">
                        {/* Header Row */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {CATEGORY_LABELS[item.category] || item.category}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span className="hidden sm:inline">{item.page}</span>
                                <span className="sm:hidden">{item.page.split('/').pop() || 'Home'}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span className="hidden sm:inline">{format(new Date(item.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                                <span className="sm:hidden">{format(new Date(item.createdAt), "MMM d, h:mm a")}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {renderStars(item.rating)}
                              <span className="text-sm font-medium">
                                {item.rating}/5
                              </span>
                            </div>
                          </div>

                          <Select
                            value={item.status}
                            onValueChange={(value) => handleStatusChange(item.id, value)}
                            disabled={updateStatusMutation.isPending}
                          >
                            <SelectTrigger className="w-full sm:w-[160px]">
                              <div className="flex items-center gap-2">
                                <StatusIcon className={`h-4 w-4 ${statusConfig?.color}`} />
                                <span>{statusConfig?.label || item.status}</span>
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-yellow-500" />
                                  Pending
                                </div>
                              </SelectItem>
                              <SelectItem value="reviewed">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-blue-500" />
                                  Reviewed
                                </div>
                              </SelectItem>
                              <SelectItem value="implemented">
                                <div className="flex items-center gap-2">
                                  <Lightbulb className="h-4 w-4 text-green-500" />
                                  Implemented
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Message */}
                        <div className="flex gap-2 sm:gap-3">
                          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <p className="text-sm leading-relaxed">{item.message}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
