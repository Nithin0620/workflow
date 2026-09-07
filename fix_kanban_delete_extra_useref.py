import re

def fix():
    with open('src/components/issues/kanban-board.tsx', 'r') as f:
        content = f.read()

    # Remove the incorrect one we added
    content = content.replace(
"""}) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [columns, setColumns] = useState<BoardColumnItem[]>(""",
"""}) {
  const [columns, setColumns] = useState<BoardColumnItem[]>("""
    )

    with open('src/components/issues/kanban-board.tsx', 'w') as f:
        f.write(content)

fix()
