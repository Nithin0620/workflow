import re

def fix():
    with open('src/components/issues/kanban-board.tsx', 'r') as f:
        content = f.read()

    # Fix the misplaced useRef
    content = content.replace(
"""export function KanbanBoard({
  const searchInputRef = useRef<HTMLInputElement>(null);""",
"""export function KanbanBoard({"""
    )

    # Re-insert the useRef in the correct place inside the component body
    target = """}) {
  const [columns, setColumns] = useState<BoardColumnItem[]>("""

    replacement = """}) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [columns, setColumns] = useState<BoardColumnItem[]>("""

    content = content.replace(target, replacement)

    with open('src/components/issues/kanban-board.tsx', 'w') as f:
        f.write(content)

fix()
