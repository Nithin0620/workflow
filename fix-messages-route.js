const fs = require('fs');

const file = 'src/app/api/discussions/[discussionId]/messages/route.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/"NEW_MESSAGE"/g, '"MESSAGE_SENT"');

fs.writeFileSync(file, content);
console.log('Fixed', file);
