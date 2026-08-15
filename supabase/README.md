# Supabase setup

The migration in `migrations/0001_initial_multitenant.sql` creates the ShiftGuard relational model, seeds the four application roles and enables Row Level Security.

## Apply the migration

Run the migration in the Supabase SQL editor or through the Supabase CLI connected to the target project. A new user created through the app receives an organization and an `admin` profile through the `on_auth_user_created` trigger. Additional users and role changes should be provisioned by an administrator or a controlled server-side workflow.

## Frontend configuration

Copy `.env.example` to `.env.local` and fill in the public project URL and anonymous key from Supabase:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

`.env.local` is ignored by Git. Never put a service-role key in the frontend or in a committed file.

## Security model

Every tenant-owned row has an `organization_id`. The helper functions `current_organization_id()` and `current_user_role()` derive scope from the authenticated profile. RLS policies enforce organization isolation in the database; frontend checks are only a UX layer and are not the security boundary.

The `admin` role has organization administration rights, `manager` can create and edit employee and shift data, `auditor` can read compliance data and reports, and `employee` can read only the employee's own shifts. The employee-specific restriction is enforced in the `shifts` select policy.
