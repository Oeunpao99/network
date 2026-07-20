import { useState } from "react";

const TABS = [
  { key: "fulfillment", label: "Fulfillment" },
  { key: "assurance", label: "Assurance" },
  { key: "rating", label: "Rating & Billing" },
  { key: "compliance", label: "Compliance" },
  { key: "assets", label: "Assets & Inventory" },
  { key: "partners", label: "Partner Portal" },
  { key: "sales", label: "Sales & CPQ" },
  { key: "automation", label: "Automation" },
];

const INITIAL_ORDERS = [
  { id: "ORD-24051", customer: "Riverside Traders", segment: "TC-Biz", service: "Business Fiber 1G", type: "Retail", phase: "Provisioning", progress: 2, target: "Today, 16:30", owner: "Activation Bot" },
  { id: "ORD-24049", customer: "Ministry of Commerce", segment: "Government", service: "DPLC 500 Mbps", type: "Circuit", phase: "Site survey", progress: 1, target: "Jul 23", owner: "Field Engineering" },
  { id: "ORD-24044", customer: "MekongNet", segment: "Carrier", service: "IP Transit 2 Gbps", type: "Carrier", phase: "Capacity reservation", progress: 1, target: "Jul 21", owner: "Wholesale Desk" },
  { id: "ORD-24037", customer: "Sokha Medical Group", segment: "Enterprise", service: "IPLC 1 Gbps", type: "Circuit", phase: "Build", progress: 3, target: "Aug 04", owner: "Delivery PM" },
];

const INITIAL_TICKETS = [
  { id: "INC-8821", customer: "MekongNet", circuit: "CIR-1047", className: "Wholesale circuit", priority: "P1", status: "Unassigned", clock: "01:12 remaining", impact: "Voice Transit route degraded" },
  { id: "INC-8818", customer: "Riverside Traders", circuit: "SVC-9051", className: "Retail fault", priority: "P3", status: "Correlated", clock: "06:40 remaining", impact: "Fiber ONT offline after power event" },
  { id: "INC-8814", customer: "Sokha Medical Group", circuit: "CIR-1022", className: "Enterprise circuit", priority: "P2", status: "Field dispatch", clock: "03:05 remaining", impact: "Optical signal below threshold" },
];

const INITIAL_VERIFICATIONS = [
  { id: "KYC-428", account: "Dara Sovan", type: "SIM subscriber KYC", document: "National ID + selfie", status: "Review due", due: "Today" },
  { id: "KYB-117", account: "MekongNet Co., Ltd.", type: "Carrier KYB", document: "Registration + signatory", status: "Review due", due: "Today" },
  { id: "KYC-425", account: "Srey Leak", type: "Residential KYC", document: "National ID", status: "Verified", due: "Jul 18" },
];

const INITIAL_NUMBERS = [
  { number: "+855 23 900 100", kind: "Geographic DID", status: "Available", reservedFor: "-", expires: "-" },
  { number: "+855 23 888 888", kind: "Vanity DID", status: "Reserved", reservedFor: "Sokha Medical Group", expires: "Jul 24" },
  { number: "+855 12 777 000", kind: "Mobile vanity", status: "Assigned", reservedFor: "Dara Sovan", expires: "-" },
  { number: "+855 23 900 104", kind: "SIP trunk DDI", status: "Porting", reservedFor: "CambodiaLink port-in", expires: "Jul 22" },
];

const ASSET_OPERATIONS = [
  { code: "RT-MET-07", name: "Phnom Penh metro fiber ring", type: "Fiber route", capacity: "74% used", state: "Capacity available", detail: "1.8 Gbps reservable on diverse path" },
  { code: "DCT-04-12", name: "Russian Blvd duct segment", type: "Duct", capacity: "18 of 24 slots", state: "Maintenance window", detail: "Civil work planned Jul 26, 01:00" },
  { code: "TWR-SR-02", name: "Siem Reap tower positions", type: "Tower", capacity: "4 of 6 positions", state: "Available", detail: "Two antenna positions can be leased" },
  { code: "POP-BKK-R03", name: "BKK1 rack and transport shelf", type: "Equipment", capacity: "29 of 42 ports", state: "Reserved", detail: "Four ports held for DPLC delivery" },
];

const INITIAL_PARTNER_REQUESTS = [
  { id: "PRM-304", partner: "MekongNet", request: "IP Transit 2 Gbps", type: "Capacity quote", status: "Feasibility in progress", updated: "12 min ago" },
  { id: "PRM-298", partner: "CambodiaLink", request: "SMS Transit route", type: "Service order", status: "Awaiting approval", updated: "38 min ago" },
  { id: "PRM-289", partner: "ASEAN Fiber", request: "DPLC Phnom Penh - Poipet", type: "SLA fault", status: "NOC engaged", updated: "1 hr ago" },
];

const INITIAL_OPPORTUNITIES = [
  { id: "OPP-621", account: "Ministry of Commerce", title: "Government WAN RFP", value: "$184k ARR", stage: "Tender response", owner: "Chantha P.", next: "Submit technical response Jul 24" },
  { id: "OPP-616", account: "MekongNet", title: "Cross-border IP Transit", value: "$96k ARR", stage: "Feasibility", owner: "Dara V.", next: "Confirm Poipet capacity" },
  { id: "OPP-608", account: "Sokha Medical Group", title: "VPBX and SIP rollout", value: "$42k ARR", stage: "Proposal", owner: "Serey R.", next: "Commercial review" },
];

function tone(value) {
  const text = value.toLowerCase();
  if (text.includes("p1") || text.includes("due") || text.includes("unassigned") || text.includes("degraded")) return "critical";
  if (text.includes("p2") || text.includes("field") || text.includes("reserved") || text.includes("feasibility")) return "warning";
  if (text.includes("verified") || text.includes("assigned") || text.includes("engaged") || text.includes("activated")) return "positive";
  return "info";
}

function TelcoOperations({ active }) {
  const [tab, setTab] = useState("fulfillment");
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [selectedOrderId, setSelectedOrderId] = useState(INITIAL_ORDERS[0].id);
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [verifications, setVerifications] = useState(INITIAL_VERIFICATIONS);
  const [numbers, setNumbers] = useState(INITIAL_NUMBERS);
  const [partnerRequests, setPartnerRequests] = useState(INITIAL_PARTNER_REQUESTS);
  const [opportunities, setOpportunities] = useState(INITIAL_OPPORTUNITIES);
  const [ratingRun, setRatingRun] = useState(false);
  const [collectionsStarted, setCollectionsStarted] = useState(false);
  const [quoteApproved, setQuoteApproved] = useState(false);
  const [toast, setToast] = useState("");

  const selectedOrder = orders.find((order) => order.id === selectedOrderId) || orders[0];
  const isRetail = selectedOrder.type === "Retail";
  const fulfillmentSteps = isRetail
    ? ["Order validated", "Network reserved", "CPE configured", "OSS activation", "Customer confirmation"]
    : ["Quote accepted", "Site survey", "Route design", "Build / install", "Circuit test", "Activation"];
  const openSlaTickets = tickets.filter((ticket) => ticket.status !== "Resolved").length;
  const verifiedCount = verifications.filter((item) => item.status === "Verified").length;
  const availableNumbers = numbers.filter((item) => item.status === "Available").length;

  function notify(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  function advanceOrder() {
    const nextProgress = Math.min(selectedOrder.progress + 1, fulfillmentSteps.length - 1);
    const nextPhase = fulfillmentSteps[nextProgress];
    setOrders((current) => current.map((order) => (
      order.id === selectedOrder.id
        ? { ...order, progress: nextProgress, phase: nextPhase, owner: nextProgress === fulfillmentSteps.length - 1 ? "Activation confirmed" : order.owner }
        : order
    )));
    notify(nextProgress === fulfillmentSteps.length - 1 ? "Service marked ready for customer confirmation." : `Order advanced to ${nextPhase}.`);
  }

  function takeTicket(ticketId) {
    setTickets((current) => current.map((ticket) => (
      ticket.id === ticketId ? { ...ticket, status: "NOC investigating" } : ticket
    )));
    notify("Ticket assigned to the NOC queue.");
  }

  function dispatchTicket(ticketId) {
    setTickets((current) => current.map((ticket) => (
      ticket.id === ticketId ? { ...ticket, status: "Field crew dispatched" } : ticket
    )));
    notify("Field dispatch created with circuit and site context.");
  }

  function approveNextVerification() {
    const next = verifications.find((item) => item.status === "Review due");
    if (!next) {
      notify("No KYC or KYB reviews are waiting.");
      return;
    }
    setVerifications((current) => current.map((item) => (
      item.id === next.id ? { ...item, status: "Verified", due: "Recorded now" } : item
    )));
    notify(`${next.id} marked verified and ready for regulatory reporting.`);
  }

  function reserveNumber() {
    const next = numbers.find((item) => item.status === "Available");
    if (!next) {
      notify("No numbers are currently available.");
      return;
    }
    setNumbers((current) => current.map((item) => (
      item.number === next.number ? { ...item, status: "Reserved", reservedFor: "New SIP order" } : item
    )));
    notify(`${next.number} reserved for the new SIP order.`);
  }

  function startNumberPorting() {
    const available = numbers.find((item) => item.status === "Available");
    if (!available) {
      notify("No available number is ready for a porting request.");
      return;
    }
    setNumbers((current) => current.map((item) => (
      item.number === available.number ? { ...item, status: "Porting", reservedFor: "New port-in request", expires: "Jul 28" } : item
    )));
    notify(`${available.number} moved into the porting workflow.`);
  }

  function submitPartnerRequest() {
    const request = { id: "PRM-305", partner: "MekongNet", request: "Voice Transit Cambodia - Thailand", type: "Service order", status: "Submitted", updated: "Now" };
    setPartnerRequests((current) => [request, ...current]);
    notify("Partner portal request submitted to the wholesale desk.");
  }

  function advanceOpportunity() {
    const activeOpportunity = opportunities.find((item) => item.stage !== "Contract") || opportunities[0];
    const stages = ["Lead", "Qualification", "Feasibility", "Proposal", "Tender response", "Contract"];
    const stageIndex = stages.indexOf(activeOpportunity.stage);
    const nextStage = stages[Math.min(stageIndex + 1, stages.length - 1)];
    setOpportunities((current) => current.map((item) => (
      item.id === activeOpportunity.id ? { ...item, stage: nextStage, next: nextStage === "Contract" ? "Prepare service agreement" : `Advance through ${nextStage}` } : item
    )));
    notify(`${activeOpportunity.id} advanced to ${nextStage}.`);
  }

  return (
    <section className={`view${active ? " active" : ""} view-operations`}>
      <div className="ops-page-head">
        <div>
          <div className="ops-eyebrow"><span></span> PROTOTYPE WORKSPACE</div>
          <h2>Telco Operations</h2>
          <p>Preview the subscriber, wholesale, and infrastructure workflows before they are connected to OSS, billing, and partner systems.</p>
        </div>
        <div className="ops-prototype-note">LOCAL DEMO DATA<br /><strong>Backend integration next</strong></div>
      </div>

      <div className="ops-tabs" role="tablist" aria-label="Telco operations areas">
        {TABS.map((item) => (
          <button key={item.key} type="button" className={tab === item.key ? "active" : ""} onClick={() => setTab(item.key)} role="tab" aria-selected={tab === item.key}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === "fulfillment" && (
        <div className="ops-content">
          <div className="ops-kpis">
            <div><span>Orders in delivery</span><strong>{orders.length}</strong><small>Retail + wholesale</small></div>
            <div><span>Auto-activation ready</span><strong>{orders.filter((item) => item.type === "Retail").length}</strong><small>OSS handoff queue</small></div>
            <div><span>Field milestones</span><strong>7</strong><small>Survey, build, testing</small></div>
            <div><span>Capacity holds</span><strong>3</strong><small>Pending commitment</small></div>
          </div>
           <div className="ops-two-column">
            <section className="ops-panel">
              <div className="ops-panel-head"><div><h3>Service Delivery Queue</h3><p>Retail orders follow automation. Circuits follow project milestones.</p></div><span>LIVE PROTOTYPE</span></div>
              <div className="ops-order-list">
                {orders.map((order) => (
                  <button className={`ops-order ${selectedOrder.id === order.id ? "selected" : ""}`} type="button" key={order.id} onClick={() => setSelectedOrderId(order.id)}>
                    <div><strong>{order.customer}</strong><span>{order.id} · {order.service}</span></div>
                    <div className="ops-order-meta"><b className={tone(order.phase)}>{order.phase}</b><span>{order.target}</span></div>
                  </button>
                ))}
              </div>
            </section>
            <section className="ops-panel ops-delivery-detail">
              <div className="ops-panel-head"><div><h3>{selectedOrder.id} delivery plan</h3><p>{selectedOrder.type} workflow · owner: {selectedOrder.owner}</p></div><span className={`ops-chip ${tone(selectedOrder.phase)}`}>{selectedOrder.segment}</span></div>
              <div className="ops-stepper">
                {fulfillmentSteps.map((step, index) => (
                  <div className={`ops-step ${index < selectedOrder.progress ? "complete" : ""} ${index === selectedOrder.progress ? "current" : ""}`} key={step}>
                    <span>{index + 1}</span><div><strong>{step}</strong><small>{index < selectedOrder.progress ? "Completed" : index === selectedOrder.progress ? "In progress" : "Waiting"}</small></div>
                  </div>
                ))}
              </div>
              <div className="ops-callout"><strong>{isRetail ? "Retail automation lane" : "Circuit project lane"}</strong><span>{isRetail ? "n8n creates the provisioning task, calls OSS, and sends the confirmation after activation." : "The delivery manager must close survey, build, and test milestones before activation."}</span></div>
              <button className="ops-primary" type="button" onClick={advanceOrder}>{selectedOrder.progress >= fulfillmentSteps.length - 1 ? "Activation confirmation ready" : `Advance to next step: ${fulfillmentSteps[selectedOrder.progress + 1]}`}</button>
            </section>
           </div>
          <section className="ops-feasibility-strip">
            <div><span>Route feasibility</span><strong>Metro ring route is serviceable</strong><small>1.8 Gbps available on an alternate route; civil build not required.</small></div>
            <div><span>Capacity reservation</span><strong>4 POP ports held</strong><small>Reservation expires after 72 hours unless the order is committed.</small></div>
            <div><span>Design evidence</span><strong>GIS and inventory attached</strong><small>Route, splice points, duct occupancy, and last survey are included.</small></div>
            <button type="button" onClick={() => notify("Prototype capacity hold created for the selected service order.")}>Hold capacity</button>
          </section>
        </div>
      )}

      {tab === "assurance" && (
        <div className="ops-content">
          <div className="ops-kpis">
            <div><span>SLA-bound incidents</span><strong>{openSlaTickets}</strong><small>Contracts with active clocks</small></div>
            <div><span>P1 remaining</span><strong>01:12</strong><small>Wholesale circuit response</small></div>
            <div><span>Field crews active</span><strong>4</strong><small>Fiber and civil work</small></div>
            <div><span>Correlated alarms</span><strong>9</strong><small>Awaiting triage</small></div>
          </div>
          <section className="ops-panel">
            <div className="ops-panel-head"><div><h3>Assurance Command Queue</h3><p>Wholesale and enterprise faults carry contract SLA clocks and financial exposure.</p></div><span>SLA PRIORITIZED</span></div>
            <div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>Incident</th><th>Impact / service</th><th>Class</th><th>Priority</th><th>SLA clock</th><th>Owner</th><th>Action</th></tr></thead><tbody>
              {tickets.map((ticket) => <tr key={ticket.id}><td><strong>{ticket.id}</strong><span>{ticket.customer}</span></td><td>{ticket.impact}<span>{ticket.circuit}</span></td><td><span className={`ops-chip ${tone(ticket.className)}`}>{ticket.className}</span></td><td><b className={`ops-priority ${tone(ticket.priority)}`}>{ticket.priority}</b></td><td><strong className={tone(ticket.clock)}>{ticket.clock}</strong></td><td>{ticket.status}</td><td><div className="ops-inline-actions"><button type="button" onClick={() => takeTicket(ticket.id)}>Take</button><button type="button" onClick={() => dispatchTicket(ticket.id)}>Dispatch</button></div></td></tr>)}
            </tbody></table></div>
          </section>
          <div className="ops-assurance-strip"><div><strong>Network correlation</strong><span>Alarm NM-1189 is linked to INC-8821 and the Phnom Penh voice-transit route.</span></div><div><strong>SLA credit preview</strong><span>When a breach is confirmed, calculate credit against the contract limit before billing closes.</span></div><div><strong>Field dispatch</strong><span>Dispatch includes customer site, route section, equipment, safety notes, and arrival target.</span></div></div>
          <section className="ops-contract-watch"><div className="ops-contract-watch-head"><div><h3>Contract Renewal and SLA Exposure</h3><p>Renewal dates, route-diversity commitments, and calculated credits stay with the service agreement.</p></div><span>CONTRACT CONTROL</span></div><div className="ops-contract-watch-grid"><article><span>CON-244</span><strong>MekongNet Voice Transit MSA</strong><p>Renews in 46 days · 99.95% availability · dual-route</p><b className="warning">$1,248 provisional credit exposure</b></article><article><span>CON-238</span><strong>Ministry DPLC Schedule 04</strong><p>Renews in 92 days · 4h MTTR · split connection</p><b className="info">Renewal review scheduled Jul 30</b></article><article><span>CON-227</span><strong>Sokha Medical IPLC</strong><p>Renews in 121 days · 99.9% availability · diverse route</p><b className="positive">No current credit exposure</b></article></div></section>
        </div>
      )}

      {tab === "rating" && (
        <div className="ops-content">
          <div className="ops-kpis">
            <div><span>CDRs staged today</span><strong>2.84m</strong><small>Voice + SMS + transit</small></div>
            <div><span>Unrated events</span><strong>{ratingRun ? "0" : "18,422"}</strong><small>{ratingRun ? "Batch completed" : "Waiting for rating batch"}</small></div>
            <div><span>Wholesale settlement</span><strong>$48.6k</strong><small>Current provisional total</small></div>
            <div><span>Consolidated bills</span><strong>1,426</strong><small>Monthly close preparation</small></div>
          </div>
          <div className="ops-two-column">
            <section className="ops-panel">
              <div className="ops-panel-head"><div><h3>Unified Rating Engine</h3><p>One rating source for subscriber usage, wholesale transit, and postpaid billing.</p></div><span className={ratingRun ? "ops-good" : "ops-pending"}>{ratingRun ? "BATCH COMPLETE" : "READY TO RUN"}</span></div>
              <div className="ops-rating-flow"><div><b>1</b><strong>CDR mediation</strong><span>Normalize source records</span></div><div><b>2</b><strong>Rating</strong><span>Apply route and contract rates</span></div><div><b>3</b><strong>Settlement</strong><span>Reconcile carrier usage</span></div><div><b>4</b><strong>Billing</strong><span>Issue consolidated invoices</span></div></div>
              <button className="ops-primary" type="button" onClick={() => { setRatingRun(true); notify("Usage rating batch completed. Settlement totals are ready for review."); }}>{ratingRun ? "Rating batch completed at 13:14" : "Run sample rating batch"}</button>
            </section>
            <section className="ops-panel">
              <div className="ops-panel-head"><div><h3>Usage and Settlement Preview</h3><p>Carrier reports use the same rated events that feed billing.</p></div><span>JUL 2026</span></div>
              <div className="ops-settlement-list"><div><span>Voice Transit - MekongNet</span><strong>1,244,211 min</strong><b>$31,105.28</b></div><div><span>SMS Transit - CambodiaLink</span><strong>884,420 msg</strong><b>$8,844.20</b></div><div><span>IP Transit - ASEAN Fiber</span><strong>412 TB</strong><b>$8,652.00</b></div></div>
              <div className="ops-callout"><strong>Control point</strong><span>Do not duplicate rating logic in CRM. CRM requests balances and invoice status from the shared rating and billing service.</span></div>
           </section>
          </div>
          <div className="ops-two-column">
            <section className="ops-panel"><div className="ops-panel-head"><div><h3>Postpaid Billing and Collections</h3><p>Consolidate subscription, rated usage, credits, tax, payments, and dunning into one account statement.</p></div><button className="ops-quiet-action" type="button" onClick={() => { setCollectionsStarted(true); notify("Prototype dunning sequence started for overdue accounts."); }}>{collectionsStarted ? "Dunning sequence active" : "Start dunning run"}</button></div><div className="ops-collections"><div><span>Invoices ready to issue</span><strong>1,426</strong><b className="positive">All rating inputs complete</b></div><div><span>Overdue accounts</span><strong>38</strong><b className="warning">$14,860 collection balance</b></div><div><span>Credit adjustments</span><strong>7</strong><b className="info">Awaiting billing approval</b></div></div></section>
            <section className="ops-panel"><div className="ops-panel-head"><div><h3>Billing Control Checklist</h3><p>Prevent a bill from closing until rating, contract, payment, and tax controls agree.</p></div><span>MONTH-END</span></div><ul className="ops-check-list"><li><b>Usage rating</b><span>{ratingRun ? "Rated records reconciled with mediation." : "Run the rating batch before invoice generation."}</span></li><li><b>SLA credits</b><span>Apply approved credits within the maximum contract allowance.</span></li><li><b>Tax and ledger</b><span>Validate invoice totals before posting to the finance system.</span></li></ul></section>
          </div>
        </div>
      )}

      {tab === "compliance" && (
        <div className="ops-content">
          <div className="ops-kpis">
            <div><span>Verification queue</span><strong>{verifications.filter((item) => item.status === "Review due").length}</strong><small>Retail KYC + corporate KYB</small></div>
            <div><span>Verified records</span><strong>{verifiedCount}</strong><small>Sample prototype data</small></div>
            <div><span>Available numbers</span><strong>{availableNumbers}</strong><small>Voice and SIP inventory</small></div>
            <div><span>Reports due</span><strong>2</strong><small>Subscriber + carrier reporting</small></div>
          </div>
          <div className="ops-two-column">
            <section className="ops-panel">
              <div className="ops-panel-head"><div><h3>KYC / KYB Review Queue</h3><p>Separate subscriber identity checks from corporate authority verification.</p></div><button className="ops-quiet-action" type="button" onClick={approveNextVerification}>Approve next</button></div>
              <div className="ops-review-list">{verifications.map((item) => <article key={item.id}><div><strong>{item.account}</strong><span>{item.id} · {item.type}</span></div><div><span>{item.document}</span><b className={tone(item.status)}>{item.status}</b></div><small>{item.due}</small></article>)}</div>
              <div className="ops-report-grid"><div><strong>TRC Subscriber Registration</strong><span>Daily extract · ready for review</span><button type="button" onClick={() => notify("Prototype report marked ready for export.")}>Preview report</button></div><div><strong>Carrier Interconnection Settlement</strong><span>Monthly voice/SMS reconciliation</span><button type="button" onClick={() => notify("Prototype settlement report opened.")}>Preview report</button></div></div>
            </section>
            <section className="ops-panel">
              <div className="ops-panel-head"><div><h3>Special Number Inventory</h3><p>Reserve numbers before service order submission and release them when orders expire.</p></div><button className="ops-quiet-action" type="button" onClick={reserveNumber}>Reserve next</button></div>
              <div className="ops-number-list">{numbers.map((item) => <article key={item.number}><div><strong>{item.number}</strong><span>{item.kind}</span></div><b className={tone(item.status)}>{item.status}</b><span>{item.reservedFor}<small>{item.expires === "-" ? "No expiry" : `Expires ${item.expires}`}</small></span></article>)}</div>
              <div className="ops-callout"><strong>Lifecycle required</strong><span>Available, reserved, assigned, and released states need reservation expiry and porting history for auditability.</span></div>
              <div className="ops-number-actions"><button type="button" onClick={reserveNumber}>Reserve next number</button><button type="button" onClick={startNumberPorting}>Start port-in</button></div>
            </section>
          </div>
          <section className="ops-audit-panel"><div><div className="ops-panel-head"><div><h3>Compliance Evidence and Retention</h3><p>Every review, report export, consent change, and data-access event is written to an audit history.</p></div><span>IMMUTABLE LOG</span></div><div className="ops-audit-events"><span>13:14</span><p><strong>KYC-428 approved</strong> by Compliance Officer 04 with identity document hash recorded.</p><span>12:52</span><p><strong>TRC subscriber extract prepared</strong> by scheduled report job; approval required before export.</p><span>11:08</span><p><strong>Partner data access reviewed</strong> for MekongNet settlement statement request.</p></div></div><aside><strong>Retention policy</strong><span>KYC documents: 7 years</span><span>CDRs and settlement: 5 years</span><span>Audit trail: immutable</span><button type="button" onClick={() => notify("Prototype consent and data-retention register opened.")}>Open consent register</button></aside></section>
        </div>
      )}

      {tab === "assets" && (
        <div className="ops-content">
          <div className="ops-kpis"><div><span>Route capacity held</span><strong>3.8 Gbps</strong><small>Across active commercial quotes</small></div><div><span>Leasable assets</span><strong>14</strong><small>Duct, tower, rack, and fiber</small></div><div><span>Maintenance windows</span><strong>2</strong><small>Impact assessed before release</small></div><div><span>Inventory exceptions</span><strong>1</strong><small>Awaiting field reconciliation</small></div></div>
          <div className="ops-two-column"><section className="ops-panel"><div className="ops-panel-head"><div><h3>Route Feasibility Workbench</h3><p>Custom quotes consume GIS route evidence, capacity, build cost, and diversity constraints.</p></div><button className="ops-quiet-action" type="button" onClick={() => notify("Prototype route survey request opened.")}>Request survey</button></div><div className="ops-route-design"><div><span>Endpoint A</span><strong>Ministry of Commerce</strong><small>11.5688, 104.9234</small></div><i></i><div><span>Diverse fiber path</span><strong>12.4 km</strong><small>Two splice points, 1.8 Gbps free</small></div><i></i><div><span>Endpoint B</span><strong>Chroy Changvar POP</strong><small>11.5975, 104.9420</small></div></div><div className="ops-callout"><strong>Commercial impact</strong><span>Estimated build cost and route distance are fed to the quote before an approver can commit capacity.</span></div></section><section className="ops-panel"><div className="ops-panel-head"><div><h3>Physical Inventory Hierarchy</h3><p>Track asset availability down to route segment, duct, tower position, rack, shelf, and port.</p></div><span>GIS + INVENTORY</span></div><div className="ops-hierarchy"><div><b>Route</b><span>RT-MET-07</span><i>74%</i></div><div><b>Duct</b><span>DCT-04-12</span><i>18 / 24</i></div><div><b>POP rack</b><span>BKK1-R03</span><i>29 / 42</i></div><div><b>Transport port</b><span>OTN-1/0/29</span><i>Reserved</i></div></div></section></div>
          <section className="ops-panel"><div className="ops-panel-head"><div><h3>Asset Lifecycle and Leasing Control</h3><p>Availability, occupancy, maintenance, reservation, and decommissioning are visible before an asset is promised to a customer.</p></div><span>ASSET OPERATIONS</span></div><div className="ops-asset-grid">{ASSET_OPERATIONS.map((asset) => <article key={asset.code}><div><span>{asset.type}</span><b className={tone(asset.state)}>{asset.state}</b></div><h4>{asset.name}</h4><p>{asset.code}</p><strong>{asset.capacity}</strong><small>{asset.detail}</small><button type="button" onClick={() => notify(`${asset.code} opened in the asset lifecycle prototype.`)}>View lifecycle</button></article>)}</div></section>
        </div>
      )}

      {tab === "partners" && (
        <div className="ops-content">
          <div className="ops-portal-preview">
            <div className="ops-portal-nav"><div><span className="ops-portal-mark">F</span><strong>Fiberline Partner Hub</strong></div><span>MekongNet operator view</span></div>
            <div className="ops-portal-body"><div><div className="ops-portal-kicker">PARTNER RELATIONSHIP MANAGEMENT</div><h3>Carrier self-service, without internal CRM access.</h3><p>Partners request route quotes, place transit orders, review rated usage, download settlement statements, and raise SLA-bound circuit faults.</p><button type="button" onClick={submitPartnerRequest}>Submit sample transit order</button></div><div className="ops-portal-metrics"><div><span>Open requests</span><strong>{partnerRequests.length}</strong></div><div><span>Transit usage MTD</span><strong>1.24m min</strong></div><div><span>SLA compliance</span><strong>99.94%</strong></div><div><span>Settlement status</span><strong>Draft</strong></div></div></div>
          </div>
          <section className="ops-panel">
            <div className="ops-panel-head"><div><h3>Partner Request Console</h3><p>Internal wholesale teams validate feasibility, commercial terms, capacity, and SLA treatment before acceptance.</p></div><span>PRM WORKFLOW</span></div>
            <div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>Request</th><th>Partner</th><th>Service</th><th>Request type</th><th>Status</th><th>Updated</th></tr></thead><tbody>{partnerRequests.map((request) => <tr key={request.id}><td><strong>{request.id}</strong></td><td>{request.partner}</td><td>{request.request}</td><td>{request.type}</td><td><span className={`ops-chip ${tone(request.status)}`}>{request.status}</span></td><td>{request.updated}</td></tr>)}</tbody></table></div>
          </section>
        </div>
      )}

      {tab === "sales" && (
        <div className="ops-content">
          <div className="ops-kpis">
            <div><span>Qualified pipeline</span><strong>$322k</strong><small>Enterprise + government</small></div>
            <div><span>RFP / tenders</span><strong>2</strong><small>Response in preparation</small></div>
            <div><span>Feasibility-led deals</span><strong>1</strong><small>Route validation needed</small></div>
            <div><span>Closing this quarter</span><strong>3</strong><small>Forecast candidates</small></div>
          </div>
          <section className="ops-panel">
            <div className="ops-panel-head"><div><h3>Enterprise and Wholesale Pipeline</h3><p>Long-cycle sales connects the opportunity, quote, feasibility, contract, and service delivery records.</p></div><button className="ops-quiet-action" type="button" onClick={advanceOpportunity}>Advance next opportunity</button></div>
            <div className="ops-pipeline">{opportunities.map((opportunity) => <article key={opportunity.id}><div className="ops-pipeline-id">{opportunity.id}</div><div className="ops-pipeline-body"><h4>{opportunity.title}</h4><p>{opportunity.account} · owner {opportunity.owner}</p><span>{opportunity.next}</span></div><div><strong>{opportunity.value}</strong><b className={`ops-chip ${tone(opportunity.stage)}`}>{opportunity.stage}</b></div></article>)}</div>
          </section>
          <div className="ops-sales-path"><span>Lead</span><i></i><span>Opportunity</span><i></i><span>RFP / Proposal</span><i></i><span>Feasibility</span><i></i><span>Contract</span><i></i><span>Delivery</span></div>
          <div className="ops-two-column"><section className="ops-panel"><div className="ops-panel-head"><div><h3>Quote Control Center</h3><p>Custom commercial terms require versioning, tax, approvals, and an explicit conversion into the contracted service.</p></div><button className="ops-quiet-action" type="button" onClick={() => { setQuoteApproved(true); notify("QTE-349 approved and ready to convert to a service contract."); }}>{quoteApproved ? "QTE-349 approved" : "Approve QTE-349"}</button></div><div className="ops-quote-control"><div><span>Quote version</span><strong>QTE-349 v3</strong><b>1 Gbps IPLC · 36 months</b></div><div><span>Commercial terms</span><strong>$4,800 / month</strong><b>12% approved discount · VAT included</b></div><div><span>Approval path</span><strong>{quoteApproved ? "Commercial + finance approved" : "Commercial approved; finance review"}</strong><b className={quoteApproved ? "positive" : "warning"}>{quoteApproved ? "Ready for contract conversion" : "Approval gate open"}</b></div></div></section><section className="ops-panel"><div className="ops-panel-head"><div><h3>Lead and Tender Workbench</h3><p>Retail is short-cycle. Enterprise and government progress through activity, proposal, and tender controls.</p></div><span>SALES COPILOT</span></div><div className="ops-tender-list"><div><strong>LEAD-194</strong><span>TC-Biz SIP trunk inquiry</span><b>Qualify within 4h</b></div><div><strong>RFP-044</strong><span>Government WAN modernization</span><b>Technical response due Jul 24</b></div><div><strong>ACT-729</strong><span>Executive sponsor meeting</span><b>Scheduled Jul 22</b></div></div></section></div>
        </div>
      )}

      {tab === "automation" && (
        <div className="ops-content">
          <section className="ops-architecture">
            <div><div className="ops-eyebrow"><span></span> TARGET PROTOTYPE ARCHITECTURE</div><h3>From service intent to a controlled network action.</h3><p>CRM remains the commercial system of record. Automation is orchestrated through n8n, AI decisions are constrained by approved tools and policy, and Ansible executes only approved network changes.</p><button className="ops-primary" type="button" onClick={() => notify("Prototype workflow started: validation -> approval -> simulated activation.")}>Run simulated activation</button></div>
            <div className="ops-architecture-stages"><article><b>01</b><strong>CRM</strong><span>Order, contract, ticket, and account context</span></article><article><b>02</b><strong>n8n</strong><span>Workflow, approvals, notifications, retries</span></article><article><b>03</b><strong>Bedrock agent</strong><span>Guided triage and tool selection</span></article><article><b>04</b><strong>Ansible</strong><span>Approved device and service configuration</span></article><article><b>05</b><strong>OSS / Billing</strong><span>Activation evidence, inventory, and rated service</span></article></div>
          </section>
          <div className="ops-two-column">
            <section className="ops-panel"><div className="ops-panel-head"><div><h3>Automation Guardrails</h3><p>Automation must make network action traceable and reversible.</p></div><span>REQUIRED</span></div><ul className="ops-check-list"><li><b>Approval gates</b><span>Human approval for non-standard builds and high-impact changes.</span></li><li><b>Least privilege</b><span>Each workflow gets only the tool and network scope it needs.</span></li><li><b>Evidence trail</b><span>Record input, decision, change result, operator, and timestamps.</span></li><li><b>Rollback plan</b><span>Pre-validated reversal task for every configuration change.</span></li></ul></section>
            <section className="ops-panel"><div className="ops-panel-head"><div><h3>Integration Backlog</h3><p>Connect the prototype in this order to avoid duplicating system logic.</p></div><span>PHASED</span></div><ol className="ops-roadmap"><li><span>01</span><div><strong>Identity and RBAC</strong><small>Internal, partner, NOC, field, and sales roles.</small></div></li><li><span>02</span><div><strong>OSS and GIS adapters</strong><small>Availability, alarms, route coverage, and activation evidence.</small></div></li><li><span>03</span><div><strong>Shared rating and billing API</strong><small>CDRs, settlement, balances, and invoice state.</small></div></li><li><span>04</span><div><strong>n8n and Ansible control plane</strong><small>Orchestrate and audit approved delivery actions.</small></div></li></ol></section>
          </div>
          <section className="ops-access-panel"><div><div className="ops-panel-head"><div><h3>Access Control and Audit Surface</h3><p>Internal teams and partner users get different data, tools, approvals, and evidence visibility.</p></div><span>RBAC PROTOTYPE</span></div><div className="ops-role-grid"><article><strong>Sales</strong><span>Accounts, opportunities, quotes</span><b>Cannot execute network changes</b></article><article><strong>NOC</strong><span>Faults, SLA clocks, approved diagnostics</span><b>Can request field dispatch</b></article><article><strong>Field Service</strong><span>Assigned work orders and asset context</span><b>Cannot view settlement data</b></article><article><strong>Partner Operator</strong><span>Own quotes, orders, usage, SLA faults</span><b>Tenant-isolated portal view</b></article></div></div><aside><strong>Latest audit event</strong><p>Partner operator requested a transit statement. Access scope: MekongNet only.</p><button type="button" onClick={() => notify("Prototype audit log filtered to this user action.")}>Inspect audit event</button></aside></section>
        </div>
      )}

      {toast && <div className="ops-toast" role="status">{toast}</div>}
    </section>
  );
}

export default TelcoOperations;
