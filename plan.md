1. **Workspace Layout Shell**: Update `src/components/common/workspace-layout-shell.tsx` to include an `isMobileOpen` state and pass it down. Update `src/components/common/sidebar.tsx` to use classes like `hidden md:flex` and an overlay for mobile. Update `src/components/common/header.tsx` to add a hamburger menu button that triggers `onToggleMobileSidebar`.
2. **Verify Layout Shell**: Use `read_file` to confirm the edits to `workspace-layout-shell.tsx`, `sidebar.tsx`, and `header.tsx` were applied correctly.
3. **Fix Responsive Widths**: Run `sed` to replace specific hardcoded widths in specific components:
    - In `src/components/banners/banner-strip.tsx`, replace `w-14` with `w-full sm:w-14`.
    - In `src/components/issues/sprints-dialog.tsx`, replace `w-48` with `w-full sm:w-48`.
    - In `src/components/issues/attachment-section.tsx`, replace `w-14` with `w-full sm:w-14`.
    - In `src/components/discussions/discussion-composer.tsx`, replace `w-80` with `w-[calc(100vw-2rem)] sm:w-80` for the mention popover.
    - In `src/components/discussions/discussion-thread-drawer.tsx`, replace `w-96` with `w-full sm:w-96`.
4. **Verify Fixes**: Use `git diff` to ensure the responsive replacements are correct and haven't broken syntax.
5. **Dashboard Checks**: Use `read_file` to review grid and flex layouts in `src/components/dashboard/dashboard-view.tsx` to verify if they are fully responsive.
6. **Pre-commit step**: Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
7. **Run Tests**: Run `pnpm test` and `pnpm run test:e2e` to verify changes haven't broken core functionality.
