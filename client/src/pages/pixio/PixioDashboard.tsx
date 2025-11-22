import { PixioLayout } from '@/components/pixio/layout/PixioLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  CreditCard,
  DollarSign,
  Download,
  Users,
  TrendingUp,
} from 'lucide-react';

export default function PixioDashboard() {
  const stats = [
    {
      title: 'Total Revenue',
      value: '$45,231.89',
      change: '+20.1% from last month',
      icon: DollarSign,
    },
    {
      title: 'Subscriptions',
      value: '+2,350',
      change: '+180.1% from last month',
      icon: Users,
    },
    {
      title: 'Sales',
      value: '+12,234',
      change: '+19% from last month',
      icon: CreditCard,
    },
    {
      title: 'Active Now',
      value: '+573',
      change: '+201 since last hour',
      icon: Activity,
    },
  ];

  const recentActivity = [
    { id: 1, user: 'Alice Johnson', action: 'Created new project', time: '2 minutes ago' },
    { id: 2, user: 'Bob Smith', action: 'Updated profile', time: '5 minutes ago' },
    { id: 3, user: 'Carol White', action: 'Completed task', time: '10 minutes ago' },
    { id: 4, user: 'David Brown', action: 'Uploaded file', time: '15 minutes ago' },
    { id: 5, user: 'Eve Davis', action: 'Joined team', time: '20 minutes ago' },
  ];

  return (
    <PixioLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening today.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button>Create New</Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="grid gap-4 lg:grid-cols-7">
          {/* Overview */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>
                Your performance metrics for this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="analytics" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>
                <TabsContent value="analytics" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Completion Rate</div>
                      <div className="text-sm text-muted-foreground">87%</div>
                    </div>
                    <Progress value={87} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">User Engagement</div>
                      <div className="text-sm text-muted-foreground">72%</div>
                    </div>
                    <Progress value={72} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Performance Score</div>
                      <div className="text-sm text-muted-foreground">94%</div>
                    </div>
                    <Progress value={94} />
                  </div>
                </TabsContent>
                <TabsContent value="reports" className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    No reports available yet. Generate your first report to see data here.
                  </p>
                </TabsContent>
                <TabsContent value="notifications" className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    You're all caught up! No new notifications.
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates from your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {activity.user.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.user}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.action}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {activity.time}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Widgets */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                Create New Project
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Invite Team Member
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Generate Report
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">API</span>
                <Badge variant="default">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <Badge variant="default">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Storage</span>
                <Badge variant="default">Operational</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-24">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div>
                  <div className="text-3xl font-bold">98.5%</div>
                  <div className="text-xs text-muted-foreground">Uptime</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PixioLayout>
  );
}
