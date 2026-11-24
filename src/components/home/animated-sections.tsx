"use client";

import dynamic from "next/dynamic";

// These components all rely on framer-motion which must run client-side only.
// Keeping ssr:false inside a client component satisfies Next.js 16's restriction.

export const AnimatedSaasObjects = dynamic(
  () => import("./animated-saas-objects").then((m) => m.AnimatedSaasObjects),
  { ssr: false }
);

export const MacKanbanMockup = dynamic(
  () => import("./mac-kanban-mockup").then((m) => m.MacKanbanMockup),
  { ssr: false }
);

export const LiveKanbanDemo = dynamic(
  () => import("./live-kanban-demo").then((m) => m.LiveKanbanDemo),
  { ssr: false }
);
