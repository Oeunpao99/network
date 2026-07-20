import { useState } from "react";

const INITIAL_QUOTE = {
  accountId: "",
  productId: "",
  status: "Draft",
  feasibilityStatus: "Pending",
  requestedCapacity: "",
  routeDistanceKm: "",
  termMonths: "12",
  monthlyValue: "",
  notes: "",
};

function formatCurrency(value) {
  return Number(value).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function QuoteManagement({ active, customers, products, quotes, onAddQuote }) {
  const [isAddingQuote, setIsAddingQuote] = useState(false);
  const [form, setForm] = useState(INITIAL_QUOTE);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const selectedProduct = products.find((product) => product.apiId === Number(form.productId));
  const standardProducts = products.filter((product) => product.pricingModel === "Fixed").length;
  const pendingFeasibility = quotes.filter((quote) => quote.pricingModel === "Custom" && quote.feasibilityStatus === "Pending").length;
  const readyForContract = quotes.filter((quote) => quote.pricingModel === "Custom" && quote.feasibilityStatus === "Approved" && quote.status === "Approved").length;

  function closeForm() {
    setIsAddingQuote(false);
    setForm(INITIAL_QUOTE);
    setError("");
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function selectProduct(value) {
    const product = products.find((item) => item.apiId === Number(value));
    setForm((current) => ({
      ...current,
      productId: value,
      feasibilityStatus: product?.pricingModel === "Fixed" ? "Not required" : "Pending",
      monthlyValue: product?.pricingModel === "Fixed" ? String(product.baseMonthlyPrice) : "",
      routeDistanceKm: product?.pricingModel === "Fixed" ? "" : current.routeDistanceKm,
    }));
  }

  async function submitQuote(event) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      await onAddQuote({ ...form });
      closeForm();
    } catch (requestError) {
      setError(requestError.message || "Unable to save this quote.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className={`view${active ? " active" : ""} view-quotes`}>
      <div className="contract-page-head">
        <div>
          <h2>Catalog & Quotes</h2>
          <p>Use fixed pricing for subscription services and feasibility-led pricing for routes, circuits, and leased assets.</p>
        </div>
        <button className="add-pop-btn" type="button" onClick={() => setIsAddingQuote(true)}>New quote</button>
      </div>

      <div className="contract-summary">
        <div><span>Orderable offerings</span><strong>{standardProducts}</strong></div>
        <div><span>Quotes</span><strong>{quotes.length}</strong></div>
        <div><span>Feasibility pending</span><strong>{pendingFeasibility}</strong></div>
        <div><span>Ready for contract</span><strong>{readyForContract}</strong></div>
      </div>

      <section className="contract-panel">
        <div className="contract-panel-head"><h3>Product Catalog</h3><span>FIXED + CUSTOM PRICING</span></div>
        <div className="catalog-grid">
          {products.map((product) => (
            <article key={product.id} className="catalog-item">
              <div><strong>{product.name}</strong><span>{product.id} · {product.segment}</span></div>
              <div className="catalog-price">{product.pricingModel === "Fixed" ? `${formatCurrency(product.baseMonthlyPrice)}/mo` : "Custom quote"}</div>
              <span className={`catalog-model ${product.pricingModel.toLowerCase()}`}>{product.pricingModel}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="contract-panel">
        <div className="contract-panel-head"><h3>Quote Pipeline</h3><span>FEASIBILITY GATES CUSTOM SERVICES</span></div>
        <div className="circuit-table-wrap">
          <table className="circuit-table quote-table">
            <thead>
              <tr><th>Quote</th><th>Account</th><th>Offering</th><th>Feasibility</th><th>Commercial terms</th><th>Status</th></tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.id}>
                  <td><strong>{quote.id}</strong><span>{quote.pricingModel} pricing</span></td>
                  <td>{quote.accountName}<span>{quote.accountType}</span></td>
                  <td>{quote.productName}<span>{quote.requestedCapacity || "Standard service"}</span></td>
                  <td><span className={`quote-feasibility ${quote.feasibilityStatus.toLowerCase().replaceAll(" ", "-")}`}>{quote.feasibilityStatus}</span>{quote.routeDistanceKm !== null && <span>{quote.routeDistanceKm} km route</span>}</td>
                  <td>{formatCurrency(quote.monthlyValue)}/mo<span>{quote.termMonths}-month term</span></td>
                  <td><span className={`contract-status ${quote.status.toLowerCase()}`}>{quote.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isAddingQuote && (
        <div className="customer-modal-overlay" onMouseDown={closeForm}>
          <form className="customer-modal quote-modal" onSubmit={submitQuote} onMouseDown={(event) => event.stopPropagation()}>
            <div className="customer-modal-head"><div><h2>Create quote</h2><p>Custom services must carry a feasibility status and negotiated price.</p></div><button className="customer-modal-close" type="button" onClick={closeForm} aria-label="Close quote form">x</button></div>
            <div className="customer-form-grid">
              <label className="customer-field customer-field-wide">Account<select value={form.accountId} onChange={(event) => updateForm("accountId", event.target.value)} required><option value="" disabled>Select account</option>{customers.map((customer) => <option key={customer.apiId || customer.id} value={customer.apiId || customer.id}>{customer.name} · {customer.accountType}</option>)}</select></label>
              <label className="customer-field customer-field-wide">Product offering<select value={form.productId} onChange={(event) => selectProduct(event.target.value)} required><option value="" disabled>Select product</option>{products.filter((product) => product.isOrderable).map((product) => <option key={product.apiId} value={product.apiId}>{product.name} · {product.pricingModel}</option>)}</select></label>
              <label className="customer-field">Requested capacity<input value={form.requestedCapacity} onChange={(event) => updateForm("requestedCapacity", event.target.value)} placeholder={selectedProduct?.pricingModel === "Custom" ? "1 Gbps" : "100 seats"} /></label>
              <label className="customer-field">Term (months)<input type="number" min="1" value={form.termMonths} onChange={(event) => updateForm("termMonths", event.target.value)} required /></label>
              {selectedProduct?.pricingModel === "Custom" && <><label className="customer-field">Feasibility<select value={form.feasibilityStatus} onChange={(event) => updateForm("feasibilityStatus", event.target.value)}><option>Pending</option><option>Approved</option><option>Rejected</option></select></label><label className="customer-field">Route distance (km)<input type="number" min="0" step="0.01" value={form.routeDistanceKm} onChange={(event) => updateForm("routeDistanceKm", event.target.value)} required /></label></>}
              <label className="customer-field">Monthly value (USD)<input type="number" min="0" step="0.01" value={form.monthlyValue} onChange={(event) => updateForm("monthlyValue", event.target.value)} disabled={selectedProduct?.pricingModel === "Fixed"} required={selectedProduct?.pricingModel === "Custom"} /></label>
              <label className="customer-field">Quote status<select value={form.status} onChange={(event) => updateForm("status", event.target.value)}><option>Draft</option><option>Submitted</option><option>Approved</option><option>Rejected</option></select></label>
              <label className="customer-field customer-field-wide">Notes<textarea value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} maxLength="500" placeholder="Route, capacity, build, or commercial assumptions" /></label>
            </div>
            <div className="customer-form-actions"><button className="customer-form-cancel" type="button" onClick={closeForm}>Cancel</button><button className="customer-form-submit" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Create quote"}</button></div>
            {error && <p className="form-submit-error">{error}</p>}
          </form>
        </div>
      )}
    </section>
  );
}

export default QuoteManagement;
