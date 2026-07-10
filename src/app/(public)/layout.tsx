import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  let unreadNotifications = 0;
  if (user) {
    unreadNotifications = await prisma.notification.count({
      where: { userId: user.id, read: false },
    });
  }

  return (
    <>
      <Navbar user={user ? { role: user.role, name: user.name, unreadNotifications } : null} />
      <main className="flex-1 min-h-[calc(100vh-4rem)]">{children}</main>
      <Footer />
    </>
  );
}
