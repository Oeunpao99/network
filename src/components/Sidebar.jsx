const NAV_ITEMS = [
  {
    key: "tc-overview",
    label: "Overview",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.2" />
        <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.2" />
        <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.2" />
        <rect x="11" y="11" width="6.5" height="6.5" rx="1.2" />
      </svg>
    ),
  },
  {
    key: "tc-accounts",
    label: "Accounts",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 16.5h14M5 16.5V9.5h10v7M7 9.5V5.5h6v4M8 13h1M11 13h1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "tc-catalog",
    label: "Product Catalog",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="10" cy="6.5" r="3" />
        <path d="M3.5 17c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      </svg>
    ),
  },
  {
    key: "tc-orders",
    label: "Orders & Provisioning",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 16.5h14M5 16.5V8.5h10v8M7 8.5V4.5h6v4M8 12h1M11 12h1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "tc-contracts",
    label: "Contracts & SLA",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 17h14M4.5 17V8.5h11V17M7 8.5V5h6v3.5M7 12h1M12 12h1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "tc-billing",
    label: "Billing",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="2.5" width="14" height="15" rx="1.5" />
        <path d="M6.5 7h7M6.5 10.5h7M6.5 14h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "tc-tickets",
    label: "Service Assurance",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 5.5A2.5 2.5 0 015.5 3h8.1L17 6.4v8.1a2.5 2.5 0 01-2.5 2.5h-9A2.5 2.5 0 013 14.5v-9z" strokeLinejoin="round" />
        <path d="M13 3v4h4M6.5 11h7M6.5 14h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "tc-wholesale",
    label: "Wholesale Partner Portal",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M10 18s6-5.7 6-10.4A6 6 0 004 7.6C4 12.3 10 18 10 18z" />
        <circle cx="10" cy="7.5" r="2.1" />
      </svg>
    ),
  },
  {
    key: "popManagement",
    label: "POP Management",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="2.5" width="14" height="15" rx="1.5" />
        <path d="M6.5 6.5h7M6.5 10h7M6.5 13.5h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "assets",
    label: "Assets & Capacity",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M10 3v3M10 14v3M3 10h3M14 10h3M5.1 5.1l2.1 2.1M12.8 12.8l2.1 2.1M14.9 5.1l-2.1 2.1M7.2 12.8l-2.1 2.1" strokeLinecap="round" />
        <circle cx="10" cy="10" r="3.1" />
      </svg>
    ),
  },
  {
    key: "map",
    label: "Network Map",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M10 18s6-5.7 6-10.4A6 6 0 004 7.6C4 12.3 10 18 10 18z" />
        <circle cx="10" cy="7.5" r="2.1" />
      </svg>
    ),
  },
];

function Sidebar({ activeView, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <svg className="brand-mark" viewBox="0 0 30 30" fill="none">
          <path d="M4 22C4 12 11 5 21 5" stroke="#00B39B" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M9 22C9 15.9 13.9 11 20 11" stroke="#00B39B" strokeWidth="2.4" strokeLinecap="round" opacity=".65" />
          <path d="M14 22C14 18.7 16.7 16 20 16" stroke="#00B39B" strokeWidth="2.4" strokeLinecap="round" opacity=".4" />
          <circle cx="21" cy="22" r="2.6" fill="#00B39B" />
        </svg>
        <div className="brand-text">
          <span className="brand-name">Fiberline</span>
          <span className="brand-sub">NETWORK CRM</span>
        </div>
      </div>
      <nav className="nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`nav-item${activeView === item.key ? " active" : ""}`}
            onClick={() => onNavigate(item.key)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div className="net-status">
          <span className="dot"></span> ALL SYSTEMS NOMINAL
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
