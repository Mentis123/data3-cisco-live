import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PixioLayout } from '@/components/pixio/layout/PixioLayout';
import { usePixioConfigContext } from '@/components/pixio/providers/PixioConfigProvider';
import { ArrowRight, Zap, Shield, Gauge } from 'lucide-react';

export default function PixioHome() {
  const { config } = usePixioConfigContext();

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Built with modern tech stack for optimal performance',
    },
    {
      icon: Shield,
      title: 'Secure by Default',
      description: 'Production-ready security with JWT authentication',
    },
    {
      icon: Gauge,
      title: 'Fully Customizable',
      description: 'Configure everything via JSON - no code changes needed',
    },
  ];

  return (
    <PixioLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-12">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Welcome to {config?.branding.appName || 'Pixio'}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Production-ready headless frontend built with React, Tailwind, and shadcn/ui.
            Fully customizable and ready to deploy.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link href="/pixio/dashboard">
              <a>
                <Button size="lg" className="gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </Link>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-4xl">1,234</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Sessions</CardDescription>
              <CardTitle className="text-4xl">234</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>API Requests</CardDescription>
              <CardTitle className="text-4xl">12.4K</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Uptime</CardDescription>
              <CardTitle className="text-4xl">99.9%</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Start Guide</CardTitle>
            <CardDescription>
              Get up and running with Pixio in minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">1. Customize Your Branding</h3>
              <p className="text-sm text-muted-foreground">
                Edit <code className="px-2 py-1 bg-muted rounded">public/config/pixio.config.json</code> to change colors, logo, and app name
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">2. Configure Features</h3>
              <p className="text-sm text-muted-foreground">
                Enable or disable features in the config file without touching code
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">3. Connect Your Backend</h3>
              <p className="text-sm text-muted-foreground">
                The API client is already configured to use your existing Express backend
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PixioLayout>
  );
}
