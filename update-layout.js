const fs = require('fs');

let layout = fs.readFileSync('src/app/layout.tsx', 'utf8');

layout = layout.replace(
  `import { ThemeProvider } from "@/components/theme/theme-provider";\nimport { ThemeProvider } from "@/components/theme/theme-provider";`,
  `import { ThemeProvider } from "@/components/theme/theme-provider";`
);

layout = layout.replace(
  `<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <SmoothScrollProvider>{children}</SmoothScrollProvider>
          </ThemeProvider>
          </ThemeProvider>`,
  `<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <SmoothScrollProvider>{children}</SmoothScrollProvider>
          </ThemeProvider>`
);

fs.writeFileSync('src/app/layout.tsx', layout);
