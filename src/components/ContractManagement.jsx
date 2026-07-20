import { useState } from "react";

const INITIAL_CONTRACT = {
  accountName: "",
  accountSegment: "Enterprise",
  product: "IPLC",
  status: "Draft",
  startDate: "",
  endDate: "",
  monthlyValue: "",
  slaAvailability: "99.9",
  slaMttrHours: "4",
  msaNumber: "",
  serviceScheduleNumber: "",
  routeDiversity: "Standard",
  serviceCreditRate: "0",
};

const INITIAL_CIRCUIT = {
  contractId: "",
  assetId: "",
  popId: "",
  endpointA: "",
  endpointB: "",
  bandwidth: "",
  provisioningStage: "Feasibility",
  status: "Planned",
};

function ContractManagement({ active, contracts, circuits, assets, pops, onAddContract, onAddCircuit }) {
  const [modal, setModal] = useState(null);
  const [contractForm, setContractForm] = useState(INITIAL_CONTRACT);
  const [circuitForm, setCircuitForm] = useState(INITIAL_CIRCUIT);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function closeModal() {
    setModal(null);
    setContractForm(INITIAL_CONTRACT);
    setCircuitForm(INITIAL_CIRCUIT);
    setError("");
  }

  function updateContract(field, value) {
    setContractForm((current) => ({ ...current, [field]: value }));
  }

  function updateCircuit(field, value) {
    setCircuitForm((current) => ({ ...current, [field]: value }));
  }

  async function submitContract(event) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      await onAddContract({
        ...contractForm,
        accountName: contractForm.accountName.trim(),
        monthlyValue: Number(contractForm.monthlyValue),
        slaAvailability: Number(contractForm.slaAvailability),
        slaMttrHours: Number(contractForm.slaMttrHours),
        msaNumber: contractForm.msaNumber.trim(),
        serviceScheduleNumber: contractForm.serviceScheduleNumber.trim(),
        serviceCreditRate: Number(contractForm.serviceCreditRate),
      });
      closeModal();
    } catch (requestError) {
      setError(requestError.message || "Unable to save this contract.");
    } finally {
      setIsSaving(false);
    }
  }

  async function submitCircuit(event) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      await onAddCircuit({
        ...circuitForm,
        contractId: Number(circuitForm.contractId),
        assetId: circuitForm.assetId ? Number(circuitForm.assetId) : null,
        popId: circuitForm.popId ? Number(circuitForm.popId) : null,
        endpointA: circuitForm.endpointA.trim(),
        endpointB: circuitForm.endpointB.trim(),
        bandwidth: circuitForm.bandwidth.trim(),
      });
      closeModal();
    } catch (requestError) {
      setError(requestError.message || "Unable to save this circuit.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className={`view${active ? " active" : ""} view-contracts`}>
      <div className="contract-page-head">
        <div>
          <h2>Contracts & Circuits</h2>
          <p>Manage enterprise and carrier services from agreement to activation.</p>
        </div>
        <div className="contract-actions">
          <button className="secondary-action-btn" type="button" onClick={() => setModal("circuit")}>Add circuit</button>
          <button className="add-pop-btn" type="button" onClick={() => setModal("contract")}>Add contract</button>
        </div>
      </div>

      <div className="contract-summary">
        <div><span>Contracts</span><strong>{contracts.length}</strong></div>
        <div><span>Circuits</span><strong>{circuits.length}</strong></div>
        <div><span>Feasibility</span><strong>{circuits.filter((circuit) => circuit.provisioningStage === "Feasibility").length}</strong></div>
      </div>

      <section className="contract-panel">
        <div className="contract-panel-head"><h3>Service Contracts</h3><span>ENTERPRISE + CARRIER</span></div>
        <div className="contract-list">
          {contracts.map((contract) => (
            <article key={contract.id} className="contract-item">
              <div>
                <div className="contract-account">{contract.accountName}</div>
                <div className="contract-meta">{contract.id} · {contract.accountSegment} · {contract.product}{contract.msaNumber ? ` · ${contract.msaNumber}` : ""}</div>
              </div>
              <div className="contract-sla">SLA {contract.slaAvailability}%<br />MTTR {contract.slaMttrHours}h · Credit {contract.serviceCreditRate}%</div>
              <div className={`contract-status ${contract.status.toLowerCase()}`}>{contract.status}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="contract-panel">
        <div className="contract-panel-head"><h3>Circuits</h3><span>PROVISIONING STATUS</span></div>
        <div className="circuit-table-wrap">
          <table className="circuit-table">
            <thead>
              <tr><th>Circuit</th><th>Endpoints</th><th>Bandwidth</th><th>Asset / POP</th><th>Stage</th><th>Status</th></tr>
            </thead>
            <tbody>
              {circuits.map((circuit) => (
                <tr key={circuit.id}>
                  <td><strong>{circuit.id}</strong><span>{circuit.contractNumber}</span></td>
                  <td>{circuit.endpointA}<span>{circuit.endpointB}</span></td>
                  <td className="cell-mono">{circuit.bandwidth}</td>
                  <td>{circuit.assetName || "Unassigned"}<span>{circuit.popName || "No POP"}</span></td>
                  <td><span className="circuit-stage">{circuit.provisioningStage}</span></td>
                  <td><span className={`contract-status ${circuit.status.toLowerCase()}`}>{circuit.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modal === "contract" && (
        <div className="customer-modal-overlay" onMouseDown={closeModal}>
          <form className="customer-modal" onSubmit={submitContract} onMouseDown={(event) => event.stopPropagation()}>
            <div className="customer-modal-head"><div><h2>Add service contract</h2><p>Set commercial terms and SLA before provisioning a circuit.</p></div><button className="customer-modal-close" type="button" onClick={closeModal} aria-label="Close contract form">x</button></div>
            <div className="customer-form-grid">
              <label className="customer-field customer-field-wide">Account name<input value={contractForm.accountName} onChange={(event) => updateContract("accountName", event.target.value)} required autoFocus /></label>
              <label className="customer-field">Account segment<select value={contractForm.accountSegment} onChange={(event) => updateContract("accountSegment", event.target.value)}><option>Enterprise</option><option>Carrier</option><option>Government</option></select></label>
              <label className="customer-field">Product<select value={contractForm.product} onChange={(event) => updateContract("product", event.target.value)}><option>IPLC</option><option>DPLC</option><option>E1 Leased Circuit</option><option>IP Transit</option><option>Fiber Lease</option><option>Tower / Duct Rental</option></select></label>
              <label className="customer-field">Start date<input type="date" value={contractForm.startDate} onChange={(event) => updateContract("startDate", event.target.value)} required /></label>
              <label className="customer-field">End date<input type="date" value={contractForm.endDate} onChange={(event) => updateContract("endDate", event.target.value)} required /></label>
              <label className="customer-field">Monthly value (USD)<input type="number" min="0" value={contractForm.monthlyValue} onChange={(event) => updateContract("monthlyValue", event.target.value)} required /></label>
              <label className="customer-field">Status<select value={contractForm.status} onChange={(event) => updateContract("status", event.target.value)}><option>Draft</option><option>Feasibility</option><option>Active</option><option>Expiring</option></select></label>
              <label className="customer-field">SLA availability (%)<input type="number" min="0" max="100" step="0.01" value={contractForm.slaAvailability} onChange={(event) => updateContract("slaAvailability", event.target.value)} required /></label>
              <label className="customer-field">SLA MTTR (hours)<input type="number" min="1" value={contractForm.slaMttrHours} onChange={(event) => updateContract("slaMttrHours", event.target.value)} required /></label>
              <label className="customer-field">MSA number<input value={contractForm.msaNumber} onChange={(event) => updateContract("msaNumber", event.target.value)} placeholder="MSA-CAR-2026-01" /></label>
              <label className="customer-field">Service schedule<input value={contractForm.serviceScheduleNumber} onChange={(event) => updateContract("serviceScheduleNumber", event.target.value)} placeholder="SS-001" /></label>
              <label className="customer-field">Route diversity<select value={contractForm.routeDiversity} onChange={(event) => updateContract("routeDiversity", event.target.value)}><option>Standard</option><option>Dual route</option><option>Pending survey</option></select></label>
              <label className="customer-field">Maximum service credit (%)<input type="number" min="0" max="100" step="0.01" value={contractForm.serviceCreditRate} onChange={(event) => updateContract("serviceCreditRate", event.target.value)} required /></label>
            </div>
            <div className="customer-form-actions"><button className="customer-form-cancel" type="button" onClick={closeModal}>Cancel</button><button className="customer-form-submit" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Add contract"}</button></div>
            {error && <p className="form-submit-error">{error}</p>}
          </form>
        </div>
      )}

      {modal === "circuit" && (
        <div className="customer-modal-overlay" onMouseDown={closeModal}>
          <form className="customer-modal" onSubmit={submitCircuit} onMouseDown={(event) => event.stopPropagation()}>
            <div className="customer-modal-head"><div><h2>Add circuit</h2><p>Link a service contract to endpoints, POP, and infrastructure.</p></div><button className="customer-modal-close" type="button" onClick={closeModal} aria-label="Close circuit form">x</button></div>
            <div className="customer-form-grid">
              <label className="customer-field customer-field-wide">Service contract<select value={circuitForm.contractId} onChange={(event) => updateCircuit("contractId", event.target.value)} required><option value="" disabled>Select contract</option>{contracts.map((contract) => <option key={contract.apiId} value={contract.apiId}>{contract.id} · {contract.accountName}</option>)}</select></label>
              <label className="customer-field customer-field-wide">Endpoint A<input value={circuitForm.endpointA} onChange={(event) => updateCircuit("endpointA", event.target.value)} required /></label>
              <label className="customer-field customer-field-wide">Endpoint B<input value={circuitForm.endpointB} onChange={(event) => updateCircuit("endpointB", event.target.value)} required /></label>
              <label className="customer-field">Bandwidth<input value={circuitForm.bandwidth} onChange={(event) => updateCircuit("bandwidth", event.target.value)} placeholder="100 Mbps" required /></label>
              <label className="customer-field">POP<select value={circuitForm.popId} onChange={(event) => updateCircuit("popId", event.target.value)}><option value="">No POP assigned</option>{pops.map((pop) => <option key={pop.apiId} value={pop.apiId}>{pop.name}</option>)}</select></label>
              <label className="customer-field customer-field-wide">Infrastructure asset<select value={circuitForm.assetId} onChange={(event) => updateCircuit("assetId", event.target.value)}><option value="">No asset assigned</option>{assets.map((asset) => <option key={asset.apiId} value={asset.apiId}>{asset.id} · {asset.name}</option>)}</select></label>
              <label className="customer-field">Provisioning stage<select value={circuitForm.provisioningStage} onChange={(event) => updateCircuit("provisioningStage", event.target.value)}><option>Feasibility</option><option>Survey</option><option>Build</option><option>Testing</option><option>Active</option></select></label>
              <label className="customer-field">Circuit status<select value={circuitForm.status} onChange={(event) => updateCircuit("status", event.target.value)}><option>Planned</option><option>Active</option><option>Suspended</option></select></label>
            </div>
            <div className="customer-form-actions"><button className="customer-form-cancel" type="button" onClick={closeModal}>Cancel</button><button className="customer-form-submit" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Add circuit"}</button></div>
            {error && <p className="form-submit-error">{error}</p>}
          </form>
        </div>
      )}
    </section>
  );
}

export default ContractManagement;
