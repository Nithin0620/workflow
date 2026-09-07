const fs = require('fs');

let content = fs.readFileSync('src/components/common/header.tsx', 'utf8');
content = content.replace(
  `import { CommandPalette } from "@/components/common/command-palette";`,
  `import { CommandPalette } from "@/components/common/command-palette";\nimport { ThemeToggle } from "@/components/theme/theme-toggle";`
);
// replace duplicate toggle
content = content.replace(
  `            <ThemeToggle />
            <ThemeToggle />`,
  `            <ThemeToggle />`
);

fs.writeFileSync('src/components/common/header.tsx', content);
