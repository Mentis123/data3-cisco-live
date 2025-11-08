import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PRIssue {
  id: string;
  title: string;
  description: string;
  prNumbers: number[];
  category: string;
  initialStatus: 'in-flight' | 'unconfirmed' | 'resolved';
  lastPRDate: string;
}

const initialIssues: PRIssue[] = [
  // LEADERBOARD ISSUES
  {
    id: 'wheel-spin-video',
    title: 'Wheel Spin Video Location',
    description: 'Multiple attempts to locate wheel_spin.mp4 in git',
    prNumbers: [483, 482],
    category: 'Leaderboard',
    initialStatus: 'unconfirmed',
    lastPRDate: '2025-11-08'
  },
  {
    id: 'category-keywords-filter',
    title: 'Category Keywords in Word Cloud',
    description: 'Filter out category keywords during sync',
    prNumbers: [481],
    category: 'Leaderboard',
    initialStatus: 'unconfirmed',
    lastPRDate: '2025-11-08'
  },
  {
    id: 'offline-status-badge',
    title: 'Offline Status Badge',
    description: 'Troubleshoot and remove offline badge from leaderboard header',
    prNumbers: [480],
    category: 'Leaderboard',
    initialStatus: 'unconfirmed',
    lastPRDate: '2025-11-08'
  },
  {
    id: 'leaderboard-categories-graph',
    title: 'Leaderboard Categories Graph Data',
    description: 'Ensure category chart derives data from leaderboard entries correctly',
    prNumbers: [479, 442],
    category: 'Leaderboard',
    initialStatus: 'unconfirmed',
    lastPRDate: '2025-11-08'
  },
  {
    id: 'leaderboard-timezone',
    title: 'Leaderboard Timezone Display',
    description: 'Fix leaderboard filtering to respect Melbourne timezone',
    prNumbers: [476],
    category: 'Leaderboard',
    initialStatus: 'unconfirmed',
    lastPRDate: '2025-11-08'
  },
  {
    id: 'leaderboard-fullscreen',
    title: 'Leaderboard Fullscreen Regression',
    description: 'Debug fullscreen functionality regression',
    prNumbers: [459],
    category: 'Leaderboard',
    initialStatus: 'unconfirmed',
    lastPRDate: '2025-11-06'
  },
  {
    id: 'leaderboard-loading',
    title: 'Leaderboard Loading Issues',
    description: 'Multiple fixes for leaderboard loading errors - subsequent work on leaderboard features suggests this is resolved',
    prNumbers: [465, 461, 457, 455],
    category: 'Leaderboard',
    initialStatus: 'resolved',
    lastPRDate: '2025-11-07'
  },

  // SPRINT COACH ISSUES
  {
    id: 'sprint-coach-freeze',
    title: 'Sprint Coach Freeze',
    description: 'Fix sprint coach freezing issue',
    prNumbers: [473],
    category: 'Sprint Coach',
    initialStatus: 'unconfirmed',
    lastPRDate: '2025-11-07'
  },
  {
    id: 'sprint-coach-chat',
    title: 'Sprint Coach Chat Reply Issues',
    description: 'Fix chatbot reply issues',
    prNumbers: [444],
    category: 'Sprint Coach',
    initialStatus: 'unconfirmed',
    lastPRDate: '2025-11-06'
  },
  {
    id: 'chat-auto-scroll',
    title: 'Chat Auto-scroll',
    description: 'Enhanced auto-scroll behavior for Sprint Coach chat messages',
    prNumbers: [466, 464],
    category: 'Sprint Coach',
    initialStatus: 'unconfirmed',
    lastPRDate: '2025-11-07'
  },

  // RAFFLE/WINNER ISSUES
  {
    id: 'raffle-winner-reveal',
    title: 'Raffle Winner Reveal',
    description: 'Add spectacular raffle winner reveal with arcade-style video frame - recent polling fallback added',
    prNumbers: [483, 482, 463],
    category: 'Raffle',
    initialStatus: 'in-flight',
    lastPRDate: '2025-11-08'
  },
  {
    id: 'raffle-entry-eligibility',
    title: 'Raffle Entry Eligibility',
    description: 'Update trivia attempts with combined scores for raffle eligibility',
    prNumbers: [460],
    category: 'Raffle',
    initialStatus: 'unconfirmed',
    lastPRDate: '2025-11-06'
  },

  // TRIVIA ISSUES
  {
    id: 'trivia-score-calculation',
    title: 'Trivia Score Calculation',
    description: 'Fix score calculation for trivia games',
    prNumbers: [470],
    category: 'Trivia',
    initialStatus: 'unconfirmed',
    lastPRDate: '2025-11-07'
  },
  {
    id: 'trivia-launch-errors',
    title: 'Trivia Launch Errors',
    description: 'Multiple fixes for trivia start/launch errors (409 conflict, start after email)',
    prNumbers: [440, 439, 438],
    category: 'Trivia',
    initialStatus: 'unconfirmed',
    lastPRDate: '2025-11-06'
  },

  // SUBMISSIONS/PROJECT PITCH
  {
    id: 'project-pitch-score',
    title: 'Project Pitch Score Display',
    description: 'Fix project pitch score display in submissions',
    prNumbers: [477],
    category: 'Submissions',
    initialStatus: 'unconfirmed',
    lastPRDate: '2025-11-08'
  },
  {
    id: 'scored-submissions-bug',
    title: 'Scored Submissions Database Entry',
    description: 'Fix scored submissions entering database incorrectly',
    prNumbers: [452],
    category: 'Submissions',
    initialStatus: 'unconfirmed',
    lastPRDate: '2025-11-06'
  },

  // RING/NAVIGATION
  {
    id: 'ring-run-validation',
    title: 'Ring Run Validation',
    description: 'Fix ring run validation logic',
    prNumbers: [471],
    category: 'Ring Navigation',
    initialStatus: 'unconfirmed',
    lastPRDate: '2025-11-07'
  },
  {
    id: 'ring-category-redirect',
    title: 'Ring Category Redirect',
    description: 'Fix ring category redirect issues',
    prNumbers: [436],
    category: 'Ring Navigation',
    initialStatus: 'unconfirmed',
    lastPRDate: '2025-11-06'
  },

  // UI/UX ISSUES
  {
    id: 'fullscreen-button-position',
    title: 'Fullscreen Button Position',
    description: 'Move fullscreen button to bottom',
    prNumbers: [469],
    category: 'UI/UX',
    initialStatus: 'unconfirmed',
    lastPRDate: '2025-11-07'
  },
  {
    id: 'game-result-message',
    title: 'Game Result Message',
    description: 'Add game result message display',
    prNumbers: [468],
    category: 'UI/UX',
    initialStatus: 'unconfirmed',
    lastPRDate: '2025-11-07'
  },
  {
    id: 'jsx-closing-tags',
    title: 'JSX Closing Tags',
    description: 'Fix JSX closing tag errors',
    prNumbers: [467],
    category: 'UI/UX',
    initialStatus: 'resolved',
    lastPRDate: '2025-11-07'
  },
  {
    id: 'typescript-compilation',
    title: 'TypeScript Compilation Errors',
    description: 'Fix TypeScript compilation errors causing Vercel deployment failure',
    prNumbers: [458],
    category: 'UI/UX',
    initialStatus: 'resolved',
    lastPRDate: '2025-11-06'
  }
];

const STORAGE_KEY = 'pr-status-tracker-v1';

type StatusType = 'in-flight' | 'unconfirmed' | 'resolved';

export default function PRStatusTracker() {
  const [issues, setIssues] = useState<Map<string, StatusType>>(new Map());
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<StatusType | 'all'>('all');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setIssues(new Map(Object.entries(parsed)));
      } catch (e) {
        console.error('Failed to parse saved status', e);
        initializeStatuses();
      }
    } else {
      initializeStatuses();
    }
  }, []);

  // Save to localStorage whenever issues change
  useEffect(() => {
    if (issues.size > 0) {
      const obj = Object.fromEntries(issues);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    }
  }, [issues]);

  const initializeStatuses = () => {
    const map = new Map<string, StatusType>();
    initialIssues.forEach(issue => {
      map.set(issue.id, issue.initialStatus);
    });
    setIssues(map);
  };

  const updateStatus = (id: string, status: StatusType) => {
    setIssues(prev => {
      const next = new Map(prev);
      next.set(id, status);
      return next;
    });
  };

  const getStatusBadgeVariant = (status: StatusType) => {
    switch (status) {
      case 'resolved':
        return 'default'; // green
      case 'in-flight':
        return 'secondary'; // yellow/orange
      case 'unconfirmed':
        return 'destructive'; // red
      default:
        return 'outline';
    }
  };

  const categories = ['all', ...new Set(initialIssues.map(i => i.category))];

  const filteredIssues = initialIssues.filter(issue => {
    const status = issues.get(issue.id) || issue.initialStatus;
    const categoryMatch = filterCategory === 'all' || issue.category === filterCategory;
    const statusMatch = filterStatus === 'all' || status === filterStatus;
    return categoryMatch && statusMatch;
  });

  const getStatusCounts = () => {
    const counts = { 'in-flight': 0, unconfirmed: 0, resolved: 0 };
    initialIssues.forEach(issue => {
      const status = issues.get(issue.id) || issue.initialStatus;
      counts[status]++;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            PR Status Tracker
          </h1>
          <p className="text-gray-400 mb-4">
            Last 50 PRs analyzed • Track issue resolution status
          </p>

          {/* Status Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gray-800 border-red-500/30 p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Unconfirmed</span>
                <Badge variant="destructive" className="text-lg px-3 py-1">
                  {statusCounts.unconfirmed}
                </Badge>
              </div>
            </Card>
            <Card className="bg-gray-800 border-yellow-500/30 p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">In-Flight</span>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {statusCounts['in-flight']}
                </Badge>
              </div>
            </Card>
            <Card className="bg-gray-800 border-green-500/30 p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Resolved</span>
                <Badge variant="default" className="text-lg px-3 py-1">
                  {statusCounts.resolved}
                </Badge>
              </div>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as StatusType | 'all')}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            >
              <option value="all">All</option>
              <option value="unconfirmed">Unconfirmed</option>
              <option value="in-flight">In-Flight</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={initializeStatuses}
              variant="outline"
              className="bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              Reset All
            </Button>
          </div>
        </div>

        {/* Issues List */}
        <div className="space-y-4">
          {filteredIssues.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700 p-8 text-center">
              <p className="text-gray-400">No issues match the current filters</p>
            </Card>
          ) : (
            filteredIssues.map(issue => {
              const status = issues.get(issue.id) || issue.initialStatus;
              return (
                <Card
                  key={issue.id}
                  className={`bg-gray-800 border-gray-700 p-6 transition-all hover:border-gray-600 ${
                    status === 'resolved' ? 'opacity-75' : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">
                          {issue.title}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {issue.category}
                        </Badge>
                      </div>

                      <p className="text-gray-400 mb-3">{issue.description}</p>

                      <div className="flex flex-wrap gap-2 items-center text-sm">
                        <span className="text-gray-500">PRs:</span>
                        {issue.prNumbers.map(num => (
                          <Badge key={num} variant="outline" className="text-xs">
                            #{num}
                          </Badge>
                        ))}
                        <span className="text-gray-500 ml-2">•</span>
                        <span className="text-gray-500">{issue.lastPRDate}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 min-w-[140px]">
                      <div className="mb-2">
                        <Badge variant={getStatusBadgeVariant(status)} className="w-full justify-center">
                          {status === 'in-flight' ? 'In-Flight' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-1">
                        <Button
                          size="sm"
                          variant={status === 'unconfirmed' ? 'destructive' : 'outline'}
                          onClick={() => updateStatus(issue.id, 'unconfirmed')}
                          className="text-xs px-2"
                        >
                          ?
                        </Button>
                        <Button
                          size="sm"
                          variant={status === 'in-flight' ? 'secondary' : 'outline'}
                          onClick={() => updateStatus(issue.id, 'in-flight')}
                          className="text-xs px-2"
                        >
                          ⚡
                        </Button>
                        <Button
                          size="sm"
                          variant={status === 'resolved' ? 'default' : 'outline'}
                          onClick={() => updateStatus(issue.id, 'resolved')}
                          className="text-xs px-2"
                        >
                          ✓
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Legend */}
        <Card className="bg-gray-800 border-gray-700 p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4">Status Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <Badge variant="destructive" className="mb-2">Unconfirmed (?)</Badge>
              <p className="text-gray-400">
                Issue was fixed but never explicitly confirmed as working. Needs validation.
              </p>
            </div>
            <div>
              <Badge variant="secondary" className="mb-2">In-Flight (⚡)</Badge>
              <p className="text-gray-400">
                Issue is actively being worked on. Recent PRs address this but more work may be needed.
              </p>
            </div>
            <div>
              <Badge variant="default" className="mb-2">Resolved (✓)</Badge>
              <p className="text-gray-400">
                Issue is confirmed resolved. Either validated or subsequent work suggests it's working.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
