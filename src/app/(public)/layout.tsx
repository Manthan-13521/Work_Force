import { getCurrentUser } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <>
      <Navbar user={user ? { role: user.role, name: user.name } : null} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
