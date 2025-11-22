import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Home,
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  BarChart,
} from 'lucide-react';

const navigation = [
  { name: 'Home', href: '/pixio', icon: Home },
  { name: 'Dashboard', href: '/pixio/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/pixio/users', icon: Users },
  { name: 'Analytics', href: '/pixio/analytics', icon: BarChart },
  { name: 'Documents', href: '/pixio/documents', icon: FileText },
  { name: 'Settings', href: '/pixio/settings', icon: Settings },
];

interface PixioSidebarProps {
  className?: string;
}

export function PixioSidebar({ className }: PixioSidebarProps) {
  const [location] = useLocation();

  return (
    <div className={cn('pb-12 w-64', className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Navigation
          </h2>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;

                return (
                  <Link key={item.href} href={item.href}>
                    <a>
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        className={cn(
                          'w-full justify-start',
                          isActive && 'bg-muted'
                        )}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </Button>
                    </a>
                  </Link>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
