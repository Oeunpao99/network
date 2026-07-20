import { useState } from "react";

function Topbar({ title, customers, customerSites, onSelectResult }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const customerResults = normalizedQuery ? customers.filter((customer) => [customer.name, customer.site, customer.plan, customer.id].some((value) => String(value).toLowerCase().includes(normalizedQuery))).slice(0, 4).map((customer) => ({ type: "customer", id: customer.id, label: customer.name, detail: `${customer.plan} · ${customer.site}` })) : [];
  const siteResults = normalizedQuery ? customerSites.filter((site) => site.name.toLowerCase().includes(normalizedQuery)).slice(0, 3).map((site) => ({ type: "site", id: site.id, label: site.name, detail: "Customer site" })) : [];
  const ticketResults = normalizedQuery ? customers.flatMap((customer) => (customer.tickets || []).map((ticket) => ({ customer, ticket }))).filter(({ ticket }) => [ticket.id, ticket.text].some((value) => String(value).toLowerCase().includes(normalizedQuery))).slice(0, 4).map(({ customer, ticket }) => ({ type: "ticket", id: ticket.id, label: ticket.id, detail: `${customer.name} · ${ticket.text}` })) : [];
  const results = [...customerResults, ...siteResults, ...ticketResults];

  function selectResult(result) {
    onSelectResult(result);
    setQuery("");
    setIsOpen(false);
  }

  return (
    <header className="topbar">
      <h1>{title}</h1>
      <div className="topbar-right">
        <div className="global-search">
          <div className="search-box">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="8.5" cy="8.5" r="5.5" />
              <path d="M17 17l-4-4" strokeLinecap="round" />
            </svg>
            <input aria-label="Search customers, sites, and tickets" value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => setIsOpen(true)} placeholder="Search customers, sites, tickets…" />
          </div>
          {isOpen && normalizedQuery && (
            <div className="search-results" role="listbox" aria-label="Search results">
              {results.length ? results.map((result) => (
                <button key={`${result.type}-${result.id}`} type="button" className="search-result" onMouseDown={(event) => event.preventDefault()} onClick={() => selectResult(result)} role="option">
                  <span className="search-result-type">{result.type}</span>
                  <span><strong>{result.label}</strong><small>{result.detail}</small></span>
                </button>
              )) : <p className="search-empty">No customers, sites, or tickets match.</p>}
            </div>
          )}
        </div>
        <div className="avatar">SR</div>
      </div>
    </header>
  );
}

export default Topbar;
