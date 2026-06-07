# Supabase keep-alive (Fly.io)

A one-shot container that sends a single lightweight query to Supabase on a
daily schedule. Supabase free-tier projects pause after 7 days of inactivity;
this resets that timer so the database stays live even after app development
stops.

Unlike a GitHub Action (which GitHub disables after 60 days of repo
inactivity), a Fly scheduled machine keeps running indefinitely.

## One-time setup

Run these from inside this `fly-keepalive/` directory. Install the CLI first if
needed: https://fly.io/docs/flyctl/install/ — then `fly auth login`.

```bash
# 1. Create the app (the name must be globally unique — change if taken).
fly apps create reefa-supabase-keepalive

# 2. Store your Supabase credentials as Fly secrets (injected as env vars).
#    Use the same values as NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
fly secrets set \
  SUPABASE_URL="https://YOUR-PROJECT.supabase.co" \
  SUPABASE_ANON_KEY="your-anon-key" \
  -a reefa-supabase-keepalive

# 3. Build the image and push it to Fly's registry (does not deploy a service).
fly deploy --build-only --push -a reefa-supabase-keepalive
#    Copy the image reference it prints, e.g.:
#    registry.fly.io/reefa-supabase-keepalive:deployment-01J...

# 4. Create a machine that auto-runs the image once a day, then stops.
fly machine run registry.fly.io/reefa-supabase-keepalive:deployment-01J... \
  --schedule daily \
  -a reefa-supabase-keepalive
```

## Test / verify

```bash
# Run it right now instead of waiting for the schedule:
fly machine list -a reefa-supabase-keepalive          # find the machine id
fly machine start <machine-id> -a reefa-supabase-keepalive

# Watch the output:
fly logs -a reefa-supabase-keepalive
```

You should see `HTTP status: 200` and `inactivity timer reset.`

## Notes

- `--schedule` accepts `hourly`, `daily`, `weekly`, `monthly`. `daily` is plenty
  for a 7-day pause window; even `weekly` would technically work but leaves no
  margin.
- The machine only runs for a few seconds per day, so the cost is negligible
  (well under the price of a coffee per month on Fly's pay-as-you-go).
- To change the query, edit `ping.sh`, then re-run step 3 and update the machine
  image with `fly machine update <machine-id> --image <new-ref>`.
