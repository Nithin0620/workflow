with open('src/components/common/command-palette.tsx', 'r') as f:
    content = f.read()

content = content.replace('workspaceId = "",\n}: CommandPaletteProps) {', 'workspaceId = "",\n}: CommandPaletteProps) {\n  const searchInputRef = useRef<HTMLInputElement>(null);')

with open('src/components/common/command-palette.tsx', 'w') as f:
    f.write(content)
