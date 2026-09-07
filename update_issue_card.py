import re

with open('src/components/issues/issue-card.tsx', 'r') as f:
    content = f.read()

# Replace estimate span
old_estimate = r'<span className="rounded bg-neutral-800 px-1\.5 py-0\.5 text-\[10px\] font-bold text-neutral-200 border border-neutral-700 font-mono">\s*\{issue\.estimate\} pts\s*</span>'
new_estimate = r'''<span
              title={`Story Points: ${issue.estimate} pts`}
              className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-bold text-neutral-200 border border-neutral-700 font-mono cursor-help"
            >
              {issue.estimate} pts
            </span>'''
content = re.sub(old_estimate, new_estimate, content)

# Replace priority div
old_priority = r'<div title=\{issue\.priority\}>\{PRIORITY_ICONS\[issue\.priority\]\}</div>'
new_priority = r'''<div
            title={`Priority: ${issue.priority.charAt(0) + issue.priority.slice(1).toLowerCase().replace('_', ' ')}`}
            className="cursor-help"
          >
            {PRIORITY_ICONS[issue.priority]}
          </div>'''
content = re.sub(old_priority, new_priority, content)

with open('src/components/issues/issue-card.tsx', 'w') as f:
    f.write(content)
