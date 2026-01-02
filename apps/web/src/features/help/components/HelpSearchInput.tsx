import { Search } from "lucide-react";
import { Input } from "@/components/ui";

interface HelpSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function HelpSearchInput({
  value,
  onChange,
  placeholder = "Search help articles...",
}: HelpSearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9"
        autoFocus
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden h-5 -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
        F1
      </kbd>
    </div>
  );
}
