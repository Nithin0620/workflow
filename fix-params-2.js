const fs = require('fs');
const { execSync } = require('child_process');

const files = execSync('find src/app/api -name "route.ts"').toString().trim().split('\n');

files.forEach(file => {
  if (!file) return;

  let content = fs.readFileSync(file, 'utf8');

  // Undo the regex mess up
  content = content.replace(/\{ params \}: \{ params: Promise<\{ \[a-zA-Z\]\*Id: string \}> \}/g, ''); // This probably didn't do anything because of the brackets, but let's just rewrite properly.

  // It's safer to just replace all variations with the correct string based on file path
  if (file.includes('[workspaceId]')) {
      content = content.replace(/\{ params \}: \{ params: Promise<.*?> \}/g, '{ params }: { params: Promise<{ workspaceId: string }> }');
  } else if (file.includes('[projectId]')) {
      content = content.replace(/\{ params \}: \{ params: Promise<.*?> \}/g, '{ params }: { params: Promise<{ projectId: string }> }');
  } else if (file.includes('[issueId]')) {
      content = content.replace(/\{ params \}: \{ params: Promise<.*?> \}/g, '{ params }: { params: Promise<{ issueId: string }> }');
  } else if (file.includes('[notificationId]')) {
      content = content.replace(/\{ params \}: \{ params: Promise<.*?> \}/g, '{ params }: { params: Promise<{ notificationId: string }> }');
  } else if (file.includes('[channelId]')) {
      content = content.replace(/\{ params \}: \{ params: Promise<.*?> \}/g, '{ params }: { params: Promise<{ channelId: string }> }');
  } else if (file.includes('[...nextauth]')) {
      // Nothing needed here usually
  }

  // Revert broadcast to events because I checked it was called events.ts originally in realtime dir
  content = content.replace(/@\/lib\/realtime\/broadcast/g, '@/lib/realtime/events');

  fs.writeFileSync(file, content);
  console.log('Fixed', file);
});
