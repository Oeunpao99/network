function Drawer({ customer, onClose, onChatOpen }) {
  if (!customer) return null;

  const pct = Math.round((customer.portUsed / customer.portTotal) * 100);
  const barColor =
    pct > 85 ? "var(--alert)" : pct > 65 ? "var(--copper)" : "var(--signal)";

  return (
    <>
      <div
        className={`drawer-overlay${customer ? " open" : ""}`}
        onClick={onClose}
      />
      <div className={`drawer${customer ? " open" : ""}`}>
        <div className="drawer-head">
          <button className="drawer-close" onClick={onClose}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
          <div className="drawer-name">{customer.name}</div>
          <div className="drawer-sub">{customer.site}</div>
        </div>
        <div className="drawer-body">
          <div className="dl-section">
            <div className="dl-label">Account</div>
            <div className="dl-grid">
              <div className="dl-item">
                <div className="dl-item-label">Plan</div>
                <div className="dl-item-val">{customer.plan}</div>
              </div>
              <div className="dl-item">
                <div className="dl-item-label">Segment</div>
                <div className="dl-item-val">{customer.accountType}</div>
              </div>
              <div className="dl-item">
                <div className="dl-item-label">KYC / KYB</div>
                <div className="dl-item-val">{customer.verificationStatus}</div>
              </div>
              <div className="dl-item">
                <div className="dl-item-label">Status</div>
                <div className="dl-item-val">{customer.status}</div>
              </div>
              <div className="dl-item">
                <div className="dl-item-label">Monthly value</div>
                <div className="dl-item-val">{customer.mrr}</div>
              </div>
              <div className="dl-item">
                <div className="dl-item-label">Tenure</div>
                <div className="dl-item-val">{customer.tenure}</div>
              </div>
              <div className="dl-item">
                <div className="dl-item-label">Billing</div>
                <div className="dl-item-val">{customer.billingModel}</div>
              </div>
            </div>
          </div>
          <div className="dl-section">
            <div className="dl-label">Network Service</div>
            <div className="dl-item">
              <div className="dl-item-label">Exchange</div>
              <div className="dl-item-val">
                {customer.exchange} · {customer.port}
              </div>
              <div className="dl-item-label" style={{ marginTop: 9 }}>
                Port utilization
              </div>
              <div className="port-bar-track">
                <div
                  className="port-bar-fill"
                  style={{ width: `${pct}%`, background: barColor }}
                ></div>
              </div>
              <div className="dl-item-val" style={{ marginTop: 5 }}>
                {customer.portUsed} / {customer.portTotal} ports used ({pct}%)
              </div>
            </div>
          </div>
          <div className="dl-section">
            <div className="dl-label">AI Insight</div>
            <div id="d-flag-box">
              {customer.reasons.length > 0
                ? customer.reasons.map((r, i) => (
                    <span
                      key={i}
                      className={`flag-chip ${customer.risk === "High" ? "high" : "medium"}`}
                      style={{ marginBottom: 5 }}
                    >
                      {r}
                    </span>
                  ))
                : (
                  <div style={{ fontSize: 12, color: "var(--slate)" }}>
                    No risk signals detected.
                  </div>
                )}
            </div>
            <button className="dl-ai-btn" onClick={onChatOpen}>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2l1.6 4.9L16.5 8l-4.9 1.6L10 14.5 8.4 9.6 3.5 8l4.9-1.1z" />
              </svg>
              Ask AI for a retention plan
            </button>
          </div>
          <div className="dl-section">
            <div className="dl-label">Ticket History</div>
            {customer.tickets.length > 0
              ? customer.tickets.map((t) => (
                  <div key={t.id} className="ticket-row">
                    <div className="t-id">
                      {t.id} · {t.date}
                    </div>
                    {t.text}
                  </div>
                ))
              : <div style={{ fontSize: 12, color: "var(--slate)", padding: "8px 0" }}>No tickets on record.</div>}
          </div>
        </div>
      </div>
    </>
  );
}

export default Drawer;
