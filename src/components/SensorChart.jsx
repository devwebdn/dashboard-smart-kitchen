import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Waves } from "lucide-react";

function tooltipStyle() {
  return {
    border: "1px solid #e4e7ec",
    borderRadius: 12,
    boxShadow: "0 8px 24px rgba(16,24,40,0.10)",
    fontSize: 12,
    fontFamily: "'DM Sans', sans-serif",
  };
}

function tickStyle() {
  return { fill: "#98a2b3", fontSize: 11, fontFamily: "'DM Sans', sans-serif" };
}

/* ── Temperature Chart ── */
export function TemperatureChart({ data }) {
  return (
    <article className="panel" id="analytics">
      <div className="panel-head">
        <div>
          <h3>Tren Suhu</h3>
          <p>Perubahan suhu dalam periode pemantauan</p>
        </div>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-dot" style={{ background: "#f97316" }} />
            Suhu (°C)
          </span>
        </div>
      </div>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 6, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#f2f4f7" />
            <XAxis dataKey="time" tickLine={false} axisLine={false} tick={tickStyle()} minTickGap={24} />
            <YAxis tickLine={false} axisLine={false} tick={tickStyle()} domain={["dataMin - 1.5", "dataMax + 1.5"]} />
            <Tooltip contentStyle={tooltipStyle()} formatter={(v) => [`${Number(v).toFixed(1)} °C`, "Suhu"]} />
            <Area
              type="monotone"
              dataKey="temperature"
              stroke="#f97316"
              strokeWidth={2.5}
              fill="url(#tempGrad)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0, fill: "#ea580c" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

/* ── Humidity Panel ── */
export function HumidityPanel({ data, latestHumidity }) {
  const pct = Math.max(0, Math.min(100, Number(latestHumidity)));
  return (
    <article className="panel humidity-chart-panel">
      <div className="panel-head">
        <div>
          <h3>Kelembapan Udara</h3>
          <p>Persentase kelembapan terkini</p>
        </div>
        <div className="topbar-icon-btn" style={{ color: "#2563eb", background: "#eff6ff", borderRadius: 9, width: 34, height: 34, display: "grid", placeItems: "center" }}>
          <Waves size={17} />
        </div>
      </div>
      <div className="hum-big">
        <span className="hum-val">{Number(latestHumidity).toFixed(1)}</span>
        <span className="hum-unit">%</span>
      </div>
      <div className="hum-prog-wrap">
        <div className="hum-track">
          <div className="hum-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="hum-range"><span>0%</span><span>100%</span></div>
      </div>
      <div className="hum-foot">
        <span className="hum-foot-dot" />
        Kelembapan {pct > 70 ? "tinggi" : pct < 40 ? "rendah" : "normal"}
      </div>
      <div className="hum-mini">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="humidity"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#humGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

/* ── Gas Chart ── */
export function GasChart({ data }) {
  return (
    <article className="panel">
      <div className="panel-head">
        <div>
          <h3>Indeks Gas / Asap</h3>
          <p>Nilai ADC sensor MQ-02 dalam periode pemantauan</p>
        </div>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-dot" style={{ background: "#8b5cf6" }} />
            Gas ADC
          </span>
        </div>
      </div>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 6, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gasGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#f2f4f7" />
            <XAxis dataKey="time" tickLine={false} axisLine={false} tick={tickStyle()} minTickGap={24} />
            <YAxis tickLine={false} axisLine={false} tick={tickStyle()} domain={["dataMin - 10", "dataMax + 10"]} />
            <Tooltip contentStyle={tooltipStyle()} formatter={(v) => [`${v} ADC`, "Gas"]} />
            <Area
              type="monotone"
              dataKey="gas_adc"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              fill="url(#gasGrad)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0, fill: "#7c3aed" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

/* ── Combined dual chart (temp + humidity) ── */
export function DualChart({ data }) {
  return (
    <article className="panel" id="analytics">
      <div className="panel-head">
        <div>
          <h3>Tren Suhu &amp; Kelembapan</h3>
          <p>Pemantauan simultan kedua parameter</p>
        </div>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-dot" style={{ background: "#f97316" }} />
            Suhu
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: "#3b82f6" }} />
            Kelembapan
          </span>
        </div>
      </div>
      <div className="chart-body" style={{ height: 230 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 6, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="dualTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="dualHum" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.14} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#f2f4f7" />
            <XAxis dataKey="time" tickLine={false} axisLine={false} tick={tickStyle()} minTickGap={24} />
            <YAxis tickLine={false} axisLine={false} tick={tickStyle()} />
            <Tooltip
              contentStyle={tooltipStyle()}
              formatter={(v, name) => [
                name === "temperature" ? `${Number(v).toFixed(1)} °C` : `${Number(v).toFixed(1)} %`,
                name === "temperature" ? "Suhu" : "Kelembapan",
              ]}
            />
            <Area type="monotone" dataKey="temperature" stroke="#f97316" strokeWidth={2.2} fill="url(#dualTemp)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            <Area type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2.2} fill="url(#dualHum)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
