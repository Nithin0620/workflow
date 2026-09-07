pnpm run build && pnpm run start &
SERVER_PID=$!
sleep 15
pnpm run test:e2e --project chromium
kill $SERVER_PID
