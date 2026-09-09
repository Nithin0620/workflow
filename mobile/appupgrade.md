# Mobile UI Upgrade — Animation & Flow

Goal: Replace every `ActivityIndicator` spinner, add smooth animated transitions between all screens, and make every interaction feel instant and fluid.

---

## Phase 1 — Core Animation Infrastructure

Foundation components and global layout changes. Everything else builds on this.

| # | Task | Files | Status |
|---|------|-------|--------|
| 1.1 | Create `<Skeleton>` component — animated shimmer placeholder using Reanimated `useSharedValue` + `withRepeat` | `components/ui/Skeleton.tsx` | DONE |
| 1.2 | Create `<FadeInView>` wrapper — reusable `FadeInDown` with configurable delay for staggered list entry | `components/ui/FadeInView.tsx` | DONE |
| 1.3 | Add screen transition animations — `animation: "slide_from_right"` on all Stack layouts | `app/_layout.tsx`, `app/(auth)/_layout.tsx`, `app/(public)/_layout.tsx` | DONE |
| 1.4 | Tab icon scale animation — `useAnimatedStyle` spring scale on focus in tab bar | `app/(auth)/(tabs)/_layout.tsx` | DONE |
| 1.5 | Card press spring — replace `active:scale-[0.99]` with Reanimated `withSpring(0.97)` | `components/ui/Card.tsx` | DONE |

---

## Phase 2 — Screen-by-Screen Animations

Apply the infrastructure to every screen. Staggered entry, skeleton loading, animated list updates.

| # | Task | Files | Status |
|---|------|-------|--------|
| 2.1 | Home tab — replace spinner with skeleton shimmer, staggered workspace card entry, welcome card slide-in | `app/(auth)/(tabs)/index.tsx` | DONE |
| 2.2 | Projects tab — skeleton, animated workspace chip switcher, staggered project cards | `app/(auth)/(tabs)/projects.tsx` | DONE |
| 2.3 | Discussions tab — skeleton, staggered channel cards | `app/(auth)/(tabs)/discussions.tsx` | DONE |
| 2.4 | Settings tab — staggered profile card + section entry, save check icon spring | `app/(auth)/(tabs)/settings.tsx` | DONE |
| 2.5 | Notifications — skeleton, staggered notification items, animated unread→read transition | `app/(auth)/notifications.tsx` | DONE |
| 2.6 | Workspace detail — hero card slide-in, module grid stagger, project list stagger | `app/(auth)/(tabs)/workspace/[id]/index.tsx` | DONE |
| 2.7 | Workspace sub-routes — apply skeleton + stagger to analytics, search, discussions, project board, issue detail/create, whiteboards | `workspace/[id]/**/*.tsx` | DONE |

---

## Phase 3 — Polish & Refinement

Edge cases, accessibility, and final touches.

| # | Task | Files | Status |
|---|------|-------|--------|
| 3.1 | Input focus glow — animated indigo border pulse on TextInput focus | `GlowField`, `login.tsx`, `register.tsx`, `settings.tsx` | DONE |
| 3.2 | Pull-to-refresh polish — animated card refresh feedback | All FlatList screens | DONE |
| 3.3 | Exit animations — `FadeOut` on list item removal | All FlatList screens | DONE |
| 3.4 | Reduced motion — respect `AccessibilityInfo.isReduceMotionEnabled` | `use-reduce-motion.ts`, `Skeleton`, `FadeInView`, `Card`, `GlowField`, landing | DONE |
| 3.5 | Landing page — hero text slide-up, feature cards staggered reveal, CTA scale-in | `app/(public)/index.tsx` | DONE |
