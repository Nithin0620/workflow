import re

def fix():
    with open('src/components/issues/kanban-board.tsx', 'r') as f:
        content = f.read()

    target = """}: KanbanBoardProps) {
  // Ensure default 6 columns fallback if initialColumns is empty"""

    replacement = """}: KanbanBoardProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Ensure default 6 columns fallback if initialColumns is empty"""

    content = content.replace(target, replacement)

    with open('src/components/issues/kanban-board.tsx', 'w') as f:
        f.write(content)

fix()
