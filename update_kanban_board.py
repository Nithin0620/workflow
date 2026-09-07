import re

def update_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # 1. Add imports
    content = content.replace(
        'import { useState, useEffect, useMemo } from "react";',
        'import { useState, useEffect, useMemo, useRef } from "react";\nimport { motion, AnimatePresence } from "framer-motion";'
    )

    # 2. Add useRef
    # Find start of KanbanBoard function
    func_start = content.find('export function KanbanBoard')
    if func_start == -1:
        print("KanbanBoard not found")
        return

    # Find the next line
    newline_pos = content.find('\n', func_start)
    content = content[:newline_pos+1] + '  const searchInputRef = useRef<HTMLInputElement>(null);\n' + content[newline_pos+1:]

    # 3. Update the search input section
    old_search_block = """          <div className="relative" data-tour="board-search">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search issues..."
              className="w-full sm:w-32 sm:w-44 rounded-xl border border-neutral-800 bg-neutral-950 py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
            />
          </div>"""

    new_search_block = """          <div className="relative" data-tour="board-search">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search issues..."
              className="w-full sm:w-32 sm:w-44 rounded-xl border border-neutral-800 bg-neutral-950 py-1.5 pl-8 pr-8 text-xs text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
            />
            <AnimatePresence>
              {search.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => {
                    setSearch("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-2.5 text-neutral-500 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>"""

    content = content.replace(old_search_block, new_search_block)

    with open(filename, 'w') as f:
        f.write(content)
    print("Updated " + filename)

update_file('src/components/issues/kanban-board.tsx')
