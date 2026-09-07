import re

def update_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # 1. Add imports
    content = content.replace(
        'import { useEffect, useRef, useState } from "react";',
        'import { useEffect, useRef, useState } from "react";\nimport { motion, AnimatePresence } from "framer-motion";'
    )

    # 2. Add searchInputRef
    target_func = """export function CommandPalette({
  isOpen,
  onClose,
  workspaceId,
  orgSlug,
  workspaceSlug,
}: CommandPaletteProps) {"""

    replacement_func = target_func + "\n  const searchInputRef = useRef<HTMLInputElement>(null);"
    content = content.replace(target_func, replacement_func)

    # 3. Update the search input section
    old_search_block = """        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-neutral-900 px-4 py-3.5 bg-black">
          <Search className="h-4 w-4 text-neutral-400 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownInput}
            placeholder="Type a command, project, or issue key..."
            className="w-full bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none"
          />"""

    new_search_block = """        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-neutral-900 px-4 py-3.5 bg-black">
          <Search className="h-4 w-4 text-neutral-400 shrink-0" />
          <input
            ref={searchInputRef}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownInput}
            placeholder="Type a command, project, or issue key..."
            className="w-full bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none pr-8"
          />
          <AnimatePresence>
            {query.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                onClick={() => {
                  setQuery("");
                  searchInputRef.current?.focus();
                }}
                className="text-neutral-500 hover:text-white shrink-0 -ml-8 mr-2"
              >
                <X className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>"""

    content = content.replace(old_search_block, new_search_block)

    with open(filename, 'w') as f:
        f.write(content)
    print("Updated " + filename)

update_file('src/components/common/command-palette.tsx')
