export default function MetricCard({ icon: Icon, title, value, unit, desc, tone = "blue", badge }) {
  const isAlarm = tone === "red" && badge?.kind === "danger";

  return (
    <article className={`metric-card${isAlarm ? " alarm-on" : ""}`}>
      <div className="metric-card-top">
        <div className={`metric-icon-wrap ${tone}`}>
          <Icon size={20} />
        </div>
        {badge && (
          <span className={`metric-badge ${badge.kind}`}>
            <span className="badge-dot" />
            {badge.label}
          </span>
        )}
      </div>

      <p className="metric-label">{title}</p>

      <div className="metric-value-row">
        <span className="metric-val">{value}</span>
        {unit && <span className="metric-unit">{unit}</span>}
      </div>

      <p className="metric-desc">{desc}</p>
    </article>
  );
}
