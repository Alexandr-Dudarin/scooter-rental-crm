CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(160) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scooters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number VARCHAR(32) NOT NULL,
  model VARCHAR(80) NOT NULL,
  status VARCHAR(16) NOT NULL
    CHECK (status IN ('available', 'in_use', 'maintenance', 'offline')),
  battery_level SMALLINT NOT NULL CHECK (battery_level BETWEEN 0 AND 100),
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS scooters_active_number_unique
  ON scooters (number)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS scooters_status_idx
  ON scooters (status)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scooter_id UUID NOT NULL REFERENCES scooters(id),
  user_name VARCHAR(80) NOT NULL,
  user_phone VARCHAR(24) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status VARCHAR(16) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed')),
  CHECK (
    (status = 'active' AND ended_at IS NULL)
    OR (status = 'completed' AND ended_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS rentals_one_active_per_scooter
  ON rentals (scooter_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS rentals_status_started_idx
  ON rentals (status, started_at DESC);
