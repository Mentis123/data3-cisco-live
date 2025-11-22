import { useState, ReactNode } from 'react';
import { PixioHeader } from './PixioHeader';
import { PixioSidebar } from './PixioSidebar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { PixioConfigProvider } from '../providers/PixioConfigProvider';

interface PixioLayoutProps {
  children: ReactNode;
}

export function PixioLayout({ children }: PixioLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <PixioConfigProvider>
      <div className="relative min-h-screen">
        <PixioHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex">
          {/* Desktop sidebar */}
          <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16 border-r">
            <PixioSidebar />
          </aside>

          {/* Mobile sidebar */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="p-0 w-64">
              <div className="pt-16">
                <PixioSidebar />
              </div>
            </SheetContent>
          </Sheet>

          {/* Main content */}
          <main className="flex-1 md:pl-64">
            <div className="container py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </PixioConfigProvider>
  );
}
