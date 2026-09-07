import { requireWhiteboardAccess } from "@/lib/auth/session";
import { getWhiteboardById } from "@/actions/whiteboards";
import { WhiteboardCanvas } from "@/components/whiteboard/whiteboard-canvas";
import { notFound } from "next/navigation";

interface WhiteboardDetailPageProps {
  params: Promise<{
    orgSlug: string;
    workspaceSlug: string;
    boardId: string;
  }>;
}

export default async function WhiteboardDetailPage({ params }: WhiteboardDetailPageProps) {
  const { boardId } = await params;

  try {
    const { data: whiteboard, currentUserId, canEdit } = await getWhiteboardById(boardId);

    if (!whiteboard) {
      notFound();
    }

    const linkedProjects = whiteboard.projects.map((p) => p.project);

    return (
      <div className="flex h-full w-full flex-col overflow-hidden bg-black text-white">
        <WhiteboardCanvas
          whiteboardId={whiteboard.id}
          currentUserId={currentUserId}
          initialData={whiteboard.data}
          title={whiteboard.title}
          canEdit={canEdit}
          linkedProjects={linkedProjects}
        />
      </div>
    );
  } catch (err) {
    notFound();
  }
}
