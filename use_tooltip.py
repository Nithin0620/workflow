import re

with open('src/components/issues/issue-card.tsx', 'r') as f:
    content = f.read()

if 'import { Tooltip } from "@/components/ui/tooltip";' not in content:
    content = content.replace(
        'import { formatIssueKey } from "@/lib/utils";',
        'import { formatIssueKey } from "@/lib/utils";\nimport { Tooltip } from "@/components/ui/tooltip";'
    )

old_estimate = r'<span\s+title=\{`Story Points: \$\{issue\.estimate\} pts`\}\s+className="rounded bg-neutral-800 px-1\.5 py-0\.5 text-\[10px\] font-bold text-neutral-200 border border-neutral-700 font-mono cursor-help"\s*>\s*\{issue\.estimate\} pts\s*</span>'
new_estimate = r'''<Tooltip content={`Story Points: ${issue.estimate} pts`}>
              <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-bold text-neutral-200 border border-neutral-700 font-mono cursor-help">
                {issue.estimate} pts
              </span>
            </Tooltip>'''
content = re.sub(old_estimate, new_estimate, content)

old_priority = r'<div\s+title=\{`Priority: \$\{issue\.priority\.charAt\(0\) \+ issue\.priority\.slice\(1\)\.toLowerCase\(\)\.replace\(\'_\', \' \'\)\}`\}\s+className="cursor-help"\s*>\s*\{PRIORITY_ICONS\[issue\.priority\]\}\s*</div>'
new_priority = r'''<Tooltip content={`Priority: ${issue.priority.charAt(0) + issue.priority.slice(1).toLowerCase().replace('_', ' ')}`}>
            <div className="cursor-help">
              {PRIORITY_ICONS[issue.priority]}
            </div>
          </Tooltip>'''
content = re.sub(old_priority, new_priority, content)

with open('src/components/issues/issue-card.tsx', 'w') as f:
    f.write(content)
