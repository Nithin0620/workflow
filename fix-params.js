const fs = require('fs');
const { execSync } = require('child_process');

const files = execSync('find src/app/api -name "route.ts"').toString().trim().split('\n');

files.forEach(file => {
  if (!file) return;

  let content = fs.readFileSync(file, 'utf8');

  // 1. Replace params type signature (handling the case where the previous sed messed it up)
  content = content.replace(/\{ params \}: \{ params: Promise<\{ ([a-zA-Z]+Id): string \}> \}/g, '{ params }: { params: Promise<{ $1: string }> }');
  content = content.replace(/\{ params \}: \{ params: \{ ([a-zA-Z]+Id): string \} \}/g, '{ params }: { params: Promise<{ $1: string }> }');

  // 2. Replace param extraction
  content = content.replace(/const \{ ([a-zA-Z]+Id) \} = params;/g, 'const { $1 } = await params;');

  // 3. Fix events import
  content = content.replace(/@\/lib\/realtime\/events/g, '@/lib/realtime/broadcast');

  fs.writeFileSync(file, content);
  console.log('Fixed', file);
});
