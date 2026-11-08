import Link from "next/link";
import "@/modules/shared/ui/assets/styles/globals.css";

export default function RootNotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground antialiased">
        <div className="flex flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-4xl font-bold">404</h1>
          <p className="text-muted-foreground">This page could not be found.</p>
          <Link
            href="/"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Return Home
          </Link>
        </div>
      </body>
    </html>
  );
}
