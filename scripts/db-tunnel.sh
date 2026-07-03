#!/usr/bin/env bash
# Opens an SSH tunnel to the production DB on localhost:5433
set -e

ssh -N -L 5432:localhost:5432 ros &
TUNNEL_PID=$!
echo "DB tunnel open on localhost:5432 (PID $TUNNEL_PID)"
echo "Close with: kill $TUNNEL_PID"

wait $TUNNEL_PID
