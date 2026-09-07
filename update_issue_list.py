import re

with open('src/components/issues/issue-list-view.tsx', 'r') as f:
    content = f.read()

if 'import { Tooltip } from "@/components/ui/tooltip";' not in content:
    content = content.replace(
        'import { formatIssueKey } from "@/lib/utils";',
        'import { formatIssueKey } from "@/lib/utils";\nimport { Tooltip } from "@/components/ui/tooltip";'
    )

old_priority = r'<div className=\{`flex items-center gap-1\.5 font-medium \$\{priority\.color\}`\}>\s*<PriorityIcon className="h-3\.5 w-3\.5" />\s*<span>\{priority\.label\}</span>\s*</div>'
new_priority = r'''<Tooltip content={`Priority: ${priority.label}`}>
                      <div className={`flex items-center gap-1.5 font-medium ${priority.color} cursor-help`}>
                        <PriorityIcon className="h-3.5 w-3.5" />
                        <span>{priority.label}</span>
                      </div>
                    </Tooltip>'''
content = re.sub(old_priority, new_priority, content)

old_estimate = r'<span className="rounded bg-neutral-900 border border-neutral-800 px-1\.5 py-0\.5 font-mono text-\[10px\] font-bold text-neutral-400">\s*\{issue\.estimate\} pts\s*</span>'
new_estimate = r'''<Tooltip content={`Story Points: ${issue.estimate} pts`}>
                        <span className="rounded bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-neutral-400 cursor-help">
                          {issue.estimate} pts
                        </span>
                      </Tooltip>'''
content = re.sub(old_estimate, new_estimate, content)

with open('src/components/issues/issue-list-view.tsx', 'w') as f:
    f.write(content)
