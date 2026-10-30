import { useCallback, useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "../supabase";

export const DEMO_READINGS = [
  { id: 1, recorded_at: null, time: "08.00", temperature: 26.2, humidity: 61, gas_adc: 82, gas_detected: false, suhu_naik: false, alarm_active: false },
  { id: 2, recorded_at: null, time: "08.15", temperature: 26.5, humidity: 60, gas_adc: 87, gas_detected: false, suhu_naik: false, alarm_active: false },
  { id: 3, recorded_at: null, time: "08.30", temperature: 26.8, humidity: 59, gas_adc: 91, gas_detected: false, suhu_naik: false, alarm_active: false },
  { id: 4, recorded_at: null, time: "08.45", temperature: 27.1, humidity: 58, gas_adc: 96, gas_detected: false, suhu_naik: false, alarm_active: false },
  { id: 5, recorded_at: null, time: "09.00", temperature: 27.4, humidity: 58, gas_adc: 103, gas_detected: false, suhu_naik: false, alarm_active: false },
  { id: 6, recorded_at: null, time: "09.15", temperature: 27.0, humidity: 59, gas_adc: 99, gas_detected: false, suhu_naik: false, alarm_active: false },
  { id: 7, recorded_at: null, time: "09.30", temperature: 27.3, humidity: 57, gas_adc: 108, gas_detected: false, suhu_naik: false, alarm_active: false },
  { id: 8, recorded_at: null, time: "09.45", temperature: 27.6, humidity: 56, gas_adc: 114, gas_detected: false, suhu_naik: false, alarm_active: false },
  { id: 9, recorded_at: null, time: "10.00", temperature: 28.1, humidity: 55, gas_adc: 119, gas_detected: false, suhu_naik: true, alarm_active: false },
  { id: 10, recorded_at: null, time: "10.15", temperature: 28.5, humidity: 54, gas_adc: 124, gas_detected: false, suhu_naik: true, alarm_active: false },
  { id: 11, recorded_at: null, time: "10.30", temperature: 28.3, humidity: 55, gas_adc: 117, gas_detected: false, suhu_naik: false, alarm_active: false },
  { id: 12, recorded_at: null, time: "10.45", temperature: 27.9, humidity: 56, gas_adc: 110, gas_detected: false, suhu_naik: false, alarm_active: false },
];

export const DEMO_DEVICES = [
  {
    id: "MBG-001",
    name: "Sensor Dapur Utama",
    location: "Dapur MBG Lt. 1",
    is_online: true,
    last_seen: new Date().toISOString(),
    firmware_version: "v1.2.3",
  },
];

export function useSensorData() {
  // Jika Supabase terkonfigurasi, mulai dengan data kosong (bukan demo)
  const [readings, setReadings] = useState(supabaseConfigured ? [] : DEMO_READINGS);
  const [devices, setDevices] = useState(supabaseConfigured ? [] : DEMO_DEVICES);
  const [source, setSource] = useState(supabaseConfigured ? "supabase" : "demo");
  const [loading, setLoading] = useState(supabaseConfigured); // true saat pertama fetch
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchReadings = useCallback(async () => {
    if (!supabaseConfigured) {
      setLastUpdated(new Date());
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("sensor_readings")
        .select("*")                              // ambil semua kolom
        .order("recorded_at", { ascending: false })
        .limit(50);
      if (fetchErr) throw fetchErr;
      // Terhubung — set data apapun hasilnya (kosong = menunggu sensor)
      setReadings(data?.length ? data.reverse() : []);
      setSource("supabase");
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDevices = useCallback(async () => {
    if (!supabaseConfigured) return;
    try {
      const { data, error: devErr } = await supabase
        .from("devices")
        .select("*")
        .order("name");
      if (devErr) throw devErr;
      if (data?.length) {
        setDevices(
          data.map((d) => {
            const latestReading = readings[readings.length - 1];
            const hasRecent = latestReading?.recorded_at
              ? Date.now() - new Date(latestReading.recorded_at).getTime() < 180000
              : Boolean(d.online);
            return {
              ...d,
              is_online: d.online || hasRecent,
              last_seen: latestReading?.recorded_at || d.last_seen,
            };
          })
        );
      }
    } catch {
      // Tabel devices mungkin belum ada data
    }
  }, [readings]);

  useEffect(() => {
    fetchReadings();
    fetchDevices();

    if (!supabaseConfigured) return;

    // Real-time subscription untuk data sensor baru
    const channel = supabase
      .channel("sensor-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sensor_readings" },
        (payload) => {
          setReadings((prev) => {
            const next = [...prev.slice(-49), payload.new];
            return next;
          });
          setLastUpdated(new Date());
          setSource("supabase");
        }
      )
      .subscribe();

    // Poll devices setiap 30 detik
    const devInterval = setInterval(fetchDevices, 30_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(devInterval);
    };
  }, [fetchReadings, fetchDevices]);

  const refresh = useCallback(() => {
    fetchReadings();
    fetchDevices();
  }, [fetchReadings, fetchDevices]);

  return { readings, devices, source, loading, error, lastUpdated, refresh };
}
