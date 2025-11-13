import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Download, ArrowLeft, FileArchive } from "lucide-react";
import { CATEGORY_BADGE_CLASSES, getCategoryName } from "@/constants/categories";

interface SubmissionSummary {
  id: string;
  name: string;
  category: string;
  totalScore: number;
  createdAt: string;
}

export default function ExportSubmissions() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState("2025-11-10");
  const [endDate, setEndDate] = useState("2025-11-13");
  const [isDownloading, setIsDownloading] = useState(false);

  const adminKey = localStorage.getItem('adminKey') || '';

  // Fetch submissions preview for the date range
  const { data: submissions = [], isLoading } = useQuery<SubmissionSummary[]>({
    queryKey: ['/api/admin/leaderboard', startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return [];

      try {
        const response = await apiRequest(
          `/api/admin/leaderboard?date=${startDate}`,
          {
            headers: { 'x-admin-key': adminKey }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch submissions');
        }

        const data = await response.json();

        // Filter by date range
        return data.filter((entry: any) => {
          const entryDate = new Date(entry.createdAt);
          const start = new Date(startDate);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          return entryDate >= start && entryDate <= end;
        });
      } catch (error) {
        console.error('Error fetching submissions:', error);
        return [];
      }
    },
    enabled: !!startDate && !!endDate && !!adminKey,
  });

  const handleDownload = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Missing dates",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    if (!adminKey) {
      toast({
        title: "Authentication required",
        description: "Admin key not found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);

    try {
      const url = `/api/admin/export-submissions?startDate=${startDate}&endDate=${endDate}`;

      const response = await fetch(url, {
        headers: {
          'x-admin-key': adminKey,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to export submissions');
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `submissions_${startDate}_to_${endDate}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Export successful",
        description: `Downloaded ${submissions.length} submissions as ZIP file`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export submissions",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin-leaderboard">
            <Button variant="ghost" className="mb-4 text-slate-300 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <FileArchive className="h-10 w-10 text-cyan-400" />
                Export Submissions
              </h1>
              <p className="text-slate-400 text-lg">
                Download submission data with chat transcripts as a ZIP file
              </p>
            </div>
          </div>
        </div>

        {/* Date Selection Card */}
        <Card className="mb-6 bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-cyan-400" />
              Select Date Range
            </CardTitle>
            <CardDescription className="text-slate-400">
              Choose the start and end dates for the submissions you want to export
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-slate-300">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-slate-300">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="text-slate-300">
                {isLoading ? (
                  <span className="text-slate-400">Loading submissions...</span>
                ) : (
                  <span>
                    Found <span className="font-bold text-cyan-400">{submissions.length}</span> submission{submissions.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <Button
                onClick={handleDownload}
                disabled={isDownloading || submissions.length === 0}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                {isDownloading ? 'Downloading...' : 'Download ZIP'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Submissions Preview */}
        {submissions.length > 0 && (
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Submissions Preview</CardTitle>
              <CardDescription className="text-slate-400">
                These submissions will be included in the export
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-white">{submission.name}</span>
                        <Badge className={CATEGORY_BADGE_CLASSES[submission.category]}>
                          {getCategoryName(submission.category)}
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-400">
                        {new Date(submission.createdAt).toLocaleString('en-AU', {
                          timeZone: 'Australia/Melbourne',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-cyan-400">
                        {submission.totalScore} pts
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Export Information */}
        <Card className="mt-6 bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">What's Included in the Export</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-3">
            <p>The exported ZIP file will contain:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong className="text-white">submissions_summary.csv</strong> - Spreadsheet with all key metrics and scores</li>
              <li><strong className="text-white">submissions_detailed.json</strong> - Complete structured data in JSON format</li>
              <li><strong className="text-white">individual_submissions/</strong> - Folder with individual text files for each submission including:
                <ul className="list-circle list-inside ml-6 mt-2 space-y-1 text-sm">
                  <li>Submission details (date, name, email, category)</li>
                  <li>All scores (total and sub-scores)</li>
                  <li>Complete project information (problem, impact, metrics, action plan, etc.)</li>
                  <li>Full Sprint Coach chat transcript</li>
                </ul>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
