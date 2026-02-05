
"use client";

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import ExportReport from '@/components/export-report';
import { PdfExport } from '@/components/pdf-export';
import { useApp } from '@/hooks/use-app';

const pageTitles: { [key: string]: string } = {
  '/dashboard': 'Dashboard Overview',
  '/check-in': 'Daily Expense Check-in',
  '/goals': 'Financial Goals',
  '/expenses': 'Expense Analysis',
  '/fixed-expenses': 'Fixed Expenses Analysis',
  '/emergency-fund': 'Emergency Fund',
  '/onboarding': 'Welcome to FinMate',
  '/settings': 'Profile Settings',
  '/help': 'Help & User Guide',
};

export function DashboardHeader() {
  const pathname = usePathname();
  const { profile } = useApp();

  const title = pageTitles[pathname] || 'FinMate';
  const firstName = profile?.name ? profile.name.split(' ')[0] : 'User';

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 lg:px-8">
      <SidebarTrigger className="md:hidden" />
      <h1 className="flex-1 text-xl font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center gap-4 mr-2">
        <div className="flex items-center gap-2">
          <ExportReport />
          <PdfExport />
        </div>
        <div className="h-8 w-px bg-border mx-2 hidden md:block" />
        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          Hello, <span className="text-foreground">{firstName}</span>
        </span>
      </div>
    </header>
  );
}
