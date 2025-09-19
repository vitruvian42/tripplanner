import { Plane } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 text-xl font-bold text-primary', className)}>
      <Plane className="h-6 w-6" />
      <span className="font-headline">Trippy</span>
    </div>
  );
}
