import re

def update_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # 1. Add imports
    content = content.replace(
        'import { useState, useEffect, useTransition } from "react";',
        'import { useState, useEffect, useTransition, useRef } from "react";\nimport { motion, AnimatePresence } from "framer-motion";'
    )

    # 2. Add useRef
    target_func = """export function DiscussionSearchDialog({
  workspaceId,
  orgSlug,
  workspaceSlug,
  isOpen,
  onClose,
}: DiscussionSearchDialogProps) {"""

    replacement_func = target_func + "\n  const searchInputRef = useRef<HTMLInputElement>(null);"
    content = content.replace(target_func, replacement_func)

    # 3. Update the search input section
    old_search_block = """          <input
            type="text"
            placeholder="Search all discussion messages, threads, topics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full rounded-xl bg-neutral-900/60 pl-9 pr-8 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-white transition"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2.5 text-neutral-500 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}"""

    new_search_block = """          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search all discussion messages, threads, topics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full rounded-xl bg-neutral-900/60 pl-9 pr-8 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-white transition"
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
                className="absolute right-2.5 text-neutral-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>"""

    content = content.replace(old_search_block, new_search_block)

    with open(filename, 'w') as f:
        f.write(content)
    print("Updated " + filename)

update_file('src/components/discussions/discussion-search-dialog.tsx')
