import Link from "next/link";

export function HeaderLogo() {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/"
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground/5 border border-border/50">
          <span className="text-[10px] font-bold">A</span>
        </div>
        <span className="text-xs font-medium hidden sm:inline">Arcadia</span>
      </Link>
    </div>
  );
}
