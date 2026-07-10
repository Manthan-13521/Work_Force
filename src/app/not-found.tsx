import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-muted mb-6">
          <span className="text-3xl font-bold text-muted-foreground">404</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight mb-2">Page not found</h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/">
          <Button className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go home
          </Button>
        </Link>
      </div>
    </div>
  );
}
