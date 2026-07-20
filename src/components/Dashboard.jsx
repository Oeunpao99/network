function Dashboard({ active, customers, activity, summary, onOpenDrawer }) {
  const flagged = customers.filter((c) => c.risk !== "Low")
    .sort((a, b) => (a.risk === "High" ? 0 : 1) - (b.risk === "High" ? 0 : 1))
    .slice(0, 4);

  return (
    <section className={`view${active ? " active" : ""} view-dashboard`}>
      <div className="kpi-row">
          <div className="kpi-card">
            <div className="kpi-label">Active Subscribers</div>
          <div className="kpi-value">{summary?.active_subscribers ?? "--"}</div>
          <div className="kpi-delta up">Current database count</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Tickets on Record</div>
          <div className="kpi-value">{summary?.tickets_recorded ?? "--"}</div>
          <div className="kpi-delta warn">Loaded from the database</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">AI Churn Alerts</div>
          <div className="kpi-value">{summary?.churn_alerts ?? "--"}</div>
          <div className="kpi-delta warn">Medium and high risk accounts</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Network Uptime</div>
          <div className="kpi-value">{summary?.network_uptime ? `${summary.network_uptime}%` : "--"}</div>
          <div className="kpi-delta warn">Monitoring data not connected</div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="panel">
          <div className="panel-head">
            <h3>AI-Flagged Accounts</h3>
            <span>MODEL: RETENTION-v3</span>
          </div>
          <div className="panel-body">
            {flagged.map((c) => (
              <div key={c.id} className="flag-card">
                <div className={`flag-risk ${c.risk === "High" ? "high" : "medium"}`}></div>
                <div className="flag-body">
                  <div className="flag-name">{c.name}</div>
                  <div className="flag-reason">{c.reasons[0] || "Elevated risk signal"}</div>
                  <div>
                    {c.reasons.map((r, i) => (
                      <span key={i} className={`flag-chip ${c.risk === "High" ? "high" : "medium"}`}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <button className="flag-ask" onClick={() => onOpenDrawer(c.id)}>
                  Ask AI
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <h3>Recent Activity</h3>
            <span>LIVE</span>
          </div>
          <div className="panel-body">
            {activity.map((a, i) => (
              <div key={i} className="activity-row">
                <div className="activity-time">{a.time}</div>
                <div className="activity-text" dangerouslySetInnerHTML={{ __html: a.html }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
