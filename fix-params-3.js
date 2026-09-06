const fs = require('fs');
const { execSync } = require('child_process');

const files = execSync('find src/app/api -name "route.ts"').toString().trim().split('\n');

files.forEach(file => {
  if (!file) return;

  let content = fs.readFileSync(file, 'utf8');

  // The first script messed up the parameter destructuring.
  content = content.replace(/const \{ [a-zA-Z]+Id \} = await params;/g, (match) => {
    // We need to restore it to standard way. NextJS 16 requires await params for RouteHandlers
    // But since the GET function signature doesn't declare `params`, we need to make sure it exists
    return match; // It actually looks fine, but the function signature must be missing `params`.
  });

  // Make sure the function signature is correct
  content = content.replace(/export async function (GET|POST|PATCH|DELETE|PUT)\(req: Request\) \{/g, 'export async function $1(req: Request, { params }: { params: Promise<{ [key: string]: string }> }) {');

  // Revert this: { params }: { params: Promise<{ [key: string]: string }> }) {
  // It should be: req: Request, { params }: { params: Promise<{ workspaceId: string }> }

  fs.writeFileSync(file, content);
  console.log('Fixed', file);
});
