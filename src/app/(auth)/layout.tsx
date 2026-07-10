export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-muted/20 px-4 py-12">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/[0.02] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/[0.02] rounded-full blur-3xl pointer-events-none" />
      {children}
    </div>
  );
}
