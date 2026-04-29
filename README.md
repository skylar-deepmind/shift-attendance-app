# Shift Attendance App

## Fake Data Seeding (Auth -> Profiles -> Employees)

This project includes a faker-based seed script that follows the current data chain:

1. Create auth users in Supabase Auth
2. Upsert `profiles` with generated `employee_id`
3. Upsert `employees` where `employees.id = profiles.employee_id`

Optional: also generate weekly shifts for active employees.

### Required environment variables

The seed script automatically reads `.env.local` and `.env` from the project root.
You still need to provide a Supabase service role key for admin user creation:

```bash
export VITE_SUPABASE_URL="https://<your-project-ref>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
```

### Optional environment variables

```bash
export SEED_USER_COUNT=80
export SEED_DEFAULT_PASSWORD="SeedPass#123456"
export SEED_EMAIL_DOMAIN="seed.local"
export SEED_WITH_SHIFTS=true
export SEED_SHIFT_WEEKS=2
```

### Run with pnpm

```bash
pnpm seed:fake
```

### Notes

1. Use this only in development or test projects.
2. Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code.
3. If `locations` table is empty, the script will stop and ask you to seed locations first.
