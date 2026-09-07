import re

with open('src/components/issues/issue-card.tsx', 'r') as f:
    content = f.read()

if 'import { Tooltip } from "@/components/ui/tooltip";' not in content:
    content = content.replace(
        'import { formatIssueKey } from "@/lib/utils";',
        'import { formatIssueKey } from "@/lib/utils";\nimport { Tooltip } from "@/components/ui/tooltip";'
    )

with open('src/components/issues/issue-card.tsx', 'w') as f:
    f.write(content)
