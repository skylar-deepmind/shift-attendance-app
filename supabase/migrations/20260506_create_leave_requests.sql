create extension if not exists pgcrypto;

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type text not null check (
    leave_type in ('annual', 'sick', 'personal', 'unpaid', 'other')
  ),
  start_date date not null,
  end_date date not null,
  duration_days integer not null check (duration_days > 0),
  reason text,
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'rejected', 'cancelled')
  ),
  reviewer_id uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leave_requests_date_range_check check (end_date >= start_date)
);

create index if not exists leave_requests_employee_id_idx
  on public.leave_requests(employee_id);

create index if not exists leave_requests_status_idx
  on public.leave_requests(status);

create index if not exists leave_requests_date_idx
  on public.leave_requests(start_date, end_date);

create or replace function public.set_leave_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_leave_requests_updated_at on public.leave_requests;

create trigger set_leave_requests_updated_at
before update on public.leave_requests
for each row
execute function public.set_leave_requests_updated_at();
