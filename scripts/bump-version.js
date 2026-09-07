const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = require(packageJsonPath);

const [major, minor, patch] = packageJson.version.split('.').map(Number);

// Get the files changed in the upcoming commit
const changedFiles = execSync('git diff --cached --numstat').toString().split('\n').filter(Boolean);

let totalLinesChanged = 0;
let isMajorUpdate = false; // Usually determined manually via commit message or specific tag

changedFiles.forEach(line => {
    const parts = line.split('\t');
    if (parts.length >= 2) {
        const added = parseInt(parts[0], 10) || 0;
        const deleted = parseInt(parts[1], 10) || 0;
        totalLinesChanged += (added + deleted);
    }
});

// Look for a tag or specific message indicating major version (optional, default to normal logic)
// Since we run in a hook, we might not have the commit message yet.
// A robust way is to check the diff contents or we just stick to the line count rule.
const commitMessageFile = process.argv[2];
let commitMessage = '';
if (commitMessageFile && fs.existsSync(commitMessageFile)) {
    commitMessage = fs.readFileSync(commitMessageFile, 'utf8');
    if (commitMessage.includes('[MAJOR]')) {
        isMajorUpdate = true;
    }
}

let newVersion;

if (isMajorUpdate) {
    newVersion = `${major + 1}.0.0`;
} else if (totalLinesChanged >= 2000) {
    newVersion = `${major}.${minor + 1}.0`;
} else {
    newVersion = `${major}.${minor}.${patch + 1}`;
}

packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

// Add the modified package.json to the commit
execSync('git add package.json');

console.log(`Version bumped to ${newVersion} (Lines changed: ${totalLinesChanged})`);
