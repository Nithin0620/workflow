import { getCurrentUser } from "@/lib/auth/session";
import { PublicNavbar } from "@/components/common/public-navbar";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  const workspaceUrl = user?.workspaceMembers[0]?.workspace?.organization
    ? `/${user.workspaceMembers[0].workspace.organization.slug}/${user.workspaceMembers[0].workspace.slug}`
    : null;

  return (
    <>
      <PublicNavbar theme="dark" workspaceUrl={workspaceUrl} />
      {children}
    </>
  );
}
