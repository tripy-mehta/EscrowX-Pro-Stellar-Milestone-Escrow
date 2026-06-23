create table users (
  id uuid primary key default gen_random_uuid(),
  wallet_address text unique not null,
  username text not null,
  rating numeric default 0,
  created_at timestamptz default now()
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  client uuid references users(id),
  freelancer uuid references users(id),
  status text not null,
  amount numeric not null,
  contract_job_id text,
  created_at timestamptz default now()
);

create table milestones (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id),
  title text not null,
  amount numeric not null,
  status text not null,
  auto_release_at timestamptz,
  evidence_hash text
);

create table disputes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id),
  milestone_id uuid references milestones(id),
  evidence_hash text not null,
  status text not null,
  created_at timestamptz default now()
);
