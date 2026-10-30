-- ============================================================
-- SKEMA DATABASE SUPABASE: MONITORING DAPUR MBG
-- Jalankan script ini di: Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================

-- 1. Buat Tabel Perangkat (Devices)
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    online BOOLEAN DEFAULT false,
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Masukkan device default jika belum ada
INSERT INTO public.devices (id, device_code, name, location, online)
VALUES ('90812a96-cd50-4b98-b99c-c21a88175d31', 'MBG-001', 'Monitoring Dapur MBG', 'Dapur MBG', true)
ON CONFLICT (device_code) DO NOTHING;

-- 2. Buat Tabel Pembacaan Sensor (Sensor Readings)
CREATE TABLE IF NOT EXISTS public.sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    temperature NUMERIC(5,2),
    humidity NUMERIC(5,2),
    gas_adc INTEGER,
    gas_detected BOOLEAN DEFAULT false,
    suhu_naik BOOLEAN DEFAULT false,
    alarm_active BOOLEAN DEFAULT false,
    recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Index untuk mempercepat query berdasarkan recorded_at
CREATE INDEX IF NOT EXISTS idx_sensor_readings_recorded_at 
ON public.sensor_readings(recorded_at DESC);

-- 3. Konfigurasi Row Level Security (RLS)
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

-- Policy untuk devices
DROP POLICY IF EXISTS "Izinkan baca devices" ON public.devices;
DROP POLICY IF EXISTS "Izinkan update devices" ON public.devices;
DROP POLICY IF EXISTS "Izinkan insert devices" ON public.devices;

CREATE POLICY "Izinkan baca devices"
    ON public.devices FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Izinkan update devices"
    ON public.devices FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Izinkan insert devices"
    ON public.devices FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Policy untuk sensor_readings
DROP POLICY IF EXISTS "Izinkan baca sensor_readings" ON public.sensor_readings;
DROP POLICY IF EXISTS "Izinkan insert sensor_readings" ON public.sensor_readings;

CREATE POLICY "Izinkan baca sensor_readings"
    ON public.sensor_readings FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Izinkan insert sensor_readings"
    ON public.sensor_readings FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 4. Aktifkan Realtime untuk tabel sensor_readings
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings;

