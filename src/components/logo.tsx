import { Landmark } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Landmark className="h-8 w-8 text-primary" />
      <h1
        className="text-xl font-bold text-foreground transition-opacity duration-200 group-data-[state=collapsed]/sidebar:opacity-0 group-data-[collapsible=icon]/sidebar-wrapper:opacity-0"
      >
        HashFinance
      </h1>
    </div>
  );
}
