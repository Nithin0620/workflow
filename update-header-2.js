const fs = require('fs');
let content = fs.readFileSync('src/components/common/header.tsx', 'utf8');

// The file was reset due to git operations in CI fixing, so `import { ThemeToggle }` was not added properly.
content = content.replace(
  `import { CommandPalette } from "./command-palette";`,
  `import { CommandPalette } from "./command-palette";\nimport { ThemeToggle } from "@/components/theme/theme-toggle";`
);

content = content.replace(
  `{/* User profile & Logout */}`,
  `<div className="mr-2 border-r border-neutral-800 dark:border-neutral-200 pr-2">
            <ThemeToggle />
          </div>\n          {/* User profile & Logout */}`
);

fs.writeFileSync('src/components/common/header.tsx', content);
