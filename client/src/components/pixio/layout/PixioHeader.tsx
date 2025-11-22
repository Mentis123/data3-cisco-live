import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { usePixioConfigContext } from '../providers/PixioConfigProvider';
import { Menu, Search, Bell } from 'lucide-react';

interface PixioHeaderProps {
  onMenuClick?: () => void;
}

export function PixioHeader({ onMenuClick }: PixioHeaderProps) {
  const { config } = usePixioConfigContext();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Menu button for mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo and Brand */}
        <Link href="/pixio">
          <a className="flex items-center space-x-2">
            {config?.branding.logoUrl && (
              <img
                src={config.branding.logoUrl}
                alt={config.branding.appName}
                className="h-8 w-8"
              />
            )}
            <span className="font-bold text-xl hidden sm:inline-block">
              {config?.branding.appName || 'Pixio'}
            </span>
          </a>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
