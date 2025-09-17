import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-lg font-semibold md:text-2xl font-headline">Settings</h1>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-4">
        <div className="flex flex-col items-center gap-1 text-center">
          <Settings className="w-12 h-12 text-muted-foreground" />
          <h3 className="mt-4 text-2xl font-bold tracking-tight">Coming Soon</h3>
          <p className="text-sm text-muted-foreground">
            Manage your account and application settings here.
          </p>
        </div>
      </div>
    </div>
  );
}
