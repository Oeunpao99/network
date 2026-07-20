function Topbar({ title }) {
  return (
    <header className="topbar">
      <h1>{title}</h1>
      <div className="topbar-right">
        <div className="search-box">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path d="M17 17l-4-4" strokeLinecap="round" />
          </svg>
          <input aria-label="Search" placeholder="Search customers, sites, tickets…" />
        </div>
        <div className="avatar">SR</div>
      </div>
    </header>
  );
}

export default Topbar;
