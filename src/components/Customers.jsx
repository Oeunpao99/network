import { useState } from "react";
import LocationPicker from "./LocationPicker";

const STATUS_CLASS = {
  Active: "status-active",
  "At Risk": "status-risk",
  Onboarding: "status-onboarding",
  Suspended: "status-suspended",
};

const RISK_CLASS = {
  Low: "risk-low",
  Medium: "risk-medium",
  High: "risk-high",
};

const INITIAL_FORM = {
  name: "",
  site: "",
  plan: "Fiber Business 500",
  accountType: "SME",
  verificationStatus: "Pending",
  billingModel: "Recurring",
  status: "Onboarding",
  exchange: "",
  port: "",
  mrr: "",
  lat: "",
  lng: "",
};

function Customers({ active, customers, customerSites, pops, onOpenDrawer, onAddCustomer }) {
  const [statusFilter, setStatusFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [locationMode, setLocationMode] = useState("manual");
  const [locationError, setLocationError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filtered = customers.filter(
    (c) =>
      (!statusFilter || c.status === statusFilter) &&
      (!riskFilter || c.risk === riskFilter)
  );

  function updateForm(field, value) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    if (field === "lat" || field === "lng") setLocationError("");
  }

  function selectLocation({ lat, lng }) {
    setForm((currentForm) => ({ ...currentForm, lat, lng }));
    setLocationError("");
  }

  function closeForm() {
    setIsAddingCustomer(false);
    setForm(INITIAL_FORM);
    setLocationMode("manual");
    setLocationError("");
  }

  function openForm() {
    setForm({ ...INITIAL_FORM, exchange: pops[0]?.name || "" });
    setIsAddingCustomer(true);
  }

  async function submitCustomer(event) {
    event.preventDefault();
    if (form.lat === "" || form.lng === "") {
      setLocationError("Enter coordinates or select a location on the map.");
      return;
    }
    const pop = pops.find((site) => site.name === form.exchange);

    setSubmitError("");
    setIsSaving(true);
    try {
      await onAddCustomer({
        name: form.name.trim(),
        site: form.site.trim(),
            plan: form.plan,
            accountType: form.accountType,
            verificationStatus: form.verificationStatus,
            billingModel: form.billingModel,
        status: form.status,
        risk: "Low",
        mrr: `$${Number(form.mrr).toLocaleString("en-US")}/mo`,
        tenure: "New",
        exchange: form.exchange,
        port: form.port.trim(),
        lat: Number(form.lat),
        lng: Number(form.lng),
        portUsed: pop.portsUsed,
        portTotal: pop.portsTotal,
        reasons: [],
        tickets: [],
      });
      closeForm();
    } catch (error) {
      setSubmitError(error.message || "Unable to save this customer.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className={`view${active ? " active" : ""} view-customers`}>
      <div className="cust-toolbar">
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option>Active</option>
          <option>At Risk</option>
          <option>Onboarding</option>
          <option>Suspended</option>
        </select>
        <select
          className="filter-select"
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
        >
          <option value="">All churn risk</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <button className="add-customer-btn" onClick={openForm}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M10 4v12M4 10h12" strokeLinecap="round" />
          </svg>
          Add customer
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Account</th>
            <th>Segment</th>
            <th>Site</th>
            <th>Plan</th>
            <th>Status</th>
            <th>Churn Risk</th>
            <th>Exchange / Port</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((c) => (
            <tr key={c.id} onClick={() => onOpenDrawer(c.id)}>
              <td>{c.name}</td>
              <td><span className="account-type">{c.accountType}</span><span className="account-verification">{c.verificationStatus}</span></td>
              <td className="cell-mono">{c.site}</td>
              <td>{c.plan}</td>
              <td>
                <span className={`badge ${STATUS_CLASS[c.status]}`}>{c.status}</span>
              </td>
              <td>
                <span className={`badge ${RISK_CLASS[c.risk]}`}>{c.risk}</span>
              </td>
              <td className="cell-mono">
                {c.exchange} · {c.port}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <section className="customer-sites-panel">
        <div className="customer-sites-head">
          <div>
            <h2>Existing Customer Sites</h2>
            <p>Each location is visible on the Network Map.</p>
          </div>
          <span>{customerSites.length} mapped</span>
        </div>
        <div className="customer-sites-list">
          {customerSites.map((site) => (
            <div key={site.id} className="customer-site-item">
              <span>{site.name}</span>
              <span>{site.id}</span>
            </div>
          ))}
        </div>
      </section>
      {isAddingCustomer && (
        <div className="customer-modal-overlay" onMouseDown={closeForm}>
          <form className="customer-modal" onSubmit={submitCustomer} onMouseDown={(event) => event.stopPropagation()}>
            <div className="customer-modal-head">
              <div>
                <h2>Add customer</h2>
                <p>Create a customer account and assign its network service.</p>
              </div>
              <button className="customer-modal-close" type="button" onClick={closeForm} aria-label="Close add customer form">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="customer-form-grid">
              <label className="customer-field customer-field-wide">
                Account name
                <input value={form.name} onChange={(event) => updateForm("name", event.target.value)} required autoFocus />
              </label>
              <label className="customer-field customer-field-wide">
                Site name
                <input value={form.site} onChange={(event) => updateForm("site", event.target.value)} required />
              </label>
              <label className="customer-field">
                Account segment
                <select value={form.accountType} onChange={(event) => updateForm("accountType", event.target.value)}>
                  <option>Residential</option>
                  <option>SME</option>
                  <option>Enterprise</option>
                  <option>Government</option>
                  <option>Carrier</option>
                </select>
              </label>
              <label className="customer-field">
                KYC / KYB status
                <select value={form.verificationStatus} onChange={(event) => updateForm("verificationStatus", event.target.value)}>
                  <option>Pending</option>
                  <option>KYC Verified</option>
                  <option>KYB Verified</option>
                  <option>Rejected</option>
                  <option>Exempt</option>
                </select>
              </label>
              <label className="customer-field">
                Service plan
                <select value={form.plan} onChange={(event) => updateForm("plan", event.target.value)}>
                  <option>TC-Home Fiber 100</option>
                  <option>Fiber Essential 100</option>
                  <option>Fiber Business 500</option>
                  <option>Fiber Pro 1G</option>
                  <option>Enterprise Dedicated 10G</option>
                  <option>IP Phone</option>
                  <option>SIP Trunk</option>
                  <option>VPBX</option>
                </select>
              </label>
              <label className="customer-field">
                Billing model
                <select value={form.billingModel} onChange={(event) => updateForm("billingModel", event.target.value)}>
                  <option>Recurring</option>
                  <option>Usage</option>
                  <option>Consolidated Postpaid</option>
                </select>
              </label>
              <label className="customer-field">
                Status
                <select value={form.status} onChange={(event) => updateForm("status", event.target.value)}>
                  <option>Onboarding</option>
                  <option>Active</option>
                  <option>At Risk</option>
                  <option>Suspended</option>
                </select>
              </label>
              <label className="customer-field">
                POP / exchange
                <select value={form.exchange} onChange={(event) => updateForm("exchange", event.target.value)}>
                  {pops.map((site) => <option key={site.id}>{site.name}</option>)}
                </select>
              </label>
              <label className="customer-field">
                Port
                <input value={form.port} onChange={(event) => updateForm("port", event.target.value)} placeholder="GE0/0/01" required />
              </label>
              <label className="customer-field">
                Monthly value (USD)
                <input type="number" min="0" step="1" value={form.mrr} onChange={(event) => updateForm("mrr", event.target.value)} required />
              </label>
              <div className="coordinate-section customer-field-wide">
                <div className="coordinate-section-head">
                  <span>Location coordinates</span>
                  <div className="coordinate-mode" role="group" aria-label="Customer location entry method">
                    <button className={locationMode === "manual" ? "active" : ""} type="button" onClick={() => setLocationMode("manual")}>Enter coordinates</button>
                    <button className={locationMode === "map" ? "active" : ""} type="button" onClick={() => setLocationMode("map")}>Choose on map</button>
                  </div>
                </div>
                {locationMode === "manual" ? (
                  <div className="coordinate-inputs">
                    <label className="customer-field">
                      Lat
                      <input type="number" min="-90" max="90" step="any" value={form.lat} onChange={(event) => updateForm("lat", event.target.value)} placeholder="11.575" required />
                    </label>
                    <label className="customer-field">
                      Lng
                      <input type="number" min="-180" max="180" step="any" value={form.lng} onChange={(event) => updateForm("lng", event.target.value)} placeholder="104.918" required />
                    </label>
                  </div>
                ) : (
                  <LocationPicker latitude={form.lat} longitude={form.lng} onSelect={selectLocation} />
                )}
                {locationError && <p className="coordinate-error">{locationError}</p>}
              </div>
            </div>
            <div className="customer-form-actions">
              <button className="customer-form-cancel" type="button" onClick={closeForm}>Cancel</button>
              <button className="customer-form-submit" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Add customer"}</button>
            </div>
            {submitError && <p className="form-submit-error">{submitError}</p>}
          </form>
        </div>
      )}
    </section>
  );
}

export default Customers;
