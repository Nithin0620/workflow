pnpm run build && pnpm run start &
SERVER_PID=$!
echo "Waiting for server..."
until curl -s http://localhost:3000 > /dev/null; do
    sleep 2
done
echo "Server is up! Running tests..."
pnpm run test:e2e --project chromium
kill $SERVER_PID
