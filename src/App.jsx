import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./components/Dashboard";
import Customers from "./components/Customers";
import PopManagement from "./components/PopManagement";
import AssetManagement from "./components/AssetManagement";
import ContractManagement from "./components/ContractManagement";
import QuoteManagement from "./components/QuoteManagement";
import NetworkMap from "./components/NetworkMap";
import Billing from "./components/Billing";
import TelcoOperations from "./components/TelcoOperations";
import TelecomCrmPrototype from "./components/TelecomCrmPrototype";
import Drawer from "./components/Drawer";
import ChatWidget from "./components/ChatWidget";
import { ACTIVITY, CUSTOMERS, INVOICES, SITES } from "./data/mockData";
import { apiRequest } from "./api";
import "./App.css";

function formatDate(value, options) {
  return new Intl.DateTimeFormat("en-US", options).format(new Date(`${value}T00:00:00`));
}

function toUiPop(pop) {
  return {
    id: pop.code,
    apiId: pop.id,
    name: pop.name,
    lat: pop.latitude,
    lng: pop.longitude,
    portsTotal: pop.ports_total,
    portsUsed: pop.ports_used,
    switchId: pop.switch_id,
  };
}

function toUiSite(site) {
  return { id: site.code, apiId: site.id, name: site.name, lat: site.latitude, lng: site.longitude };
}

function toUiCustomer(customer) {
  return {
    id: customer.id,
    name: customer.name,
    site: customer.site.name,
    plan: customer.plan,
    accountType: customer.account_type || "SME",
    verificationStatus: customer.verification_status || "Pending",
    billingModel: customer.billing_model || "Recurring",
    status: customer.status,
    risk: customer.risk,
    mrr: `$${Number(customer.monthly_value).toLocaleString("en-US")}/mo`,
    tenure: customer.tenure,
    exchange: customer.pop.name,
    port: customer.port,
    portUsed: customer.pop.ports_used,
    portTotal: customer.pop.ports_total,
    reasons: customer.reasons,
    tickets: (customer.tickets || []).map((ticket) => ({
      id: ticket.id,
      text: ticket.text,
      date: formatDate(ticket.opened_on, { month: "short", day: "numeric" }),
    })),
  };
}

function toUiInvoice(invoice, customers) {
  return {
    id: invoice.id,
    customerId: invoice.customer_id,
    customerName: customers.find((customer) => customer.id === invoice.customer_id)?.name || "Unknown customer",
    amount: Number(invoice.amount),
    status: invoice.status,
    issued: formatDate(invoice.issued, { month: "short", day: "numeric", year: "numeric" }),
    due: formatDate(invoice.due, { month: "short", day: "numeric", year: "numeric" }),
    paid: invoice.paid ? formatDate(invoice.paid, { month: "short", day: "numeric", year: "numeric" }) : null,
  };
}

function toUiAsset(asset) {
  return {
    id: asset.code,
    apiId: asset.id,
    name: asset.name,
    assetType: asset.asset_type,
    locationName: asset.location_name,
    lat: asset.latitude,
    lng: asset.longitude,
    capacityTotal: asset.capacity_total,
    capacityUsed: asset.capacity_used,
    capacityUnit: asset.capacity_unit,
    status: asset.status,
  };
}

function toUiContract(contract) {
  return {
    id: contract.contract_number,
    apiId: contract.id,
    accountName: contract.account_name,
    accountSegment: contract.account_segment,
    product: contract.product,
    status: contract.status,
    startDate: contract.start_date,
    endDate: contract.end_date,
    monthlyValue: Number(contract.monthly_value),
    slaAvailability: Number(contract.sla_availability),
    slaMttrHours: contract.sla_mttr_hours,
    msaNumber: contract.msa_number,
    serviceScheduleNumber: contract.service_schedule_number,
    routeDiversity: contract.route_diversity,
    serviceCreditRate: Number(contract.service_credit_rate),
  };
}

function toUiProduct(product) {
  return {
    id: product.code,
    apiId: product.id,
    name: product.name,
    segment: product.segment,
    commercialModel: product.commercial_model,
    pricingModel: product.pricing_model,
    baseMonthlyPrice: product.base_monthly_price === null ? null : Number(product.base_monthly_price),
    isOrderable: product.is_orderable,
  };
}

function toUiQuote(quote) {
  return {
    id: quote.quote_number,
    apiId: quote.id,
    accountId: quote.account_id,
    accountName: quote.account.name,
    accountType: quote.account.account_type,
    productId: quote.product_id,
    productName: quote.product.name,
    pricingModel: quote.product.pricing_model,
    commercialModel: quote.product.commercial_model,
    status: quote.status,
    feasibilityStatus: quote.feasibility_status,
    requestedCapacity: quote.requested_capacity,
    routeDistanceKm: quote.route_distance_km === null ? null : Number(quote.route_distance_km),
    termMonths: quote.term_months,
    monthlyValue: Number(quote.monthly_value),
    notes: quote.notes,
  };
}

function toUiCircuit(circuit) {
  return {
    id: circuit.circuit_id,
    apiId: circuit.id,
    contractId: circuit.contract_id,
    contractNumber: circuit.contract.contract_number,
    assetId: circuit.asset_id,
    assetName: circuit.asset?.name,
    popId: circuit.pop_id,
    popName: circuit.pop?.name,
    endpointA: circuit.endpoint_a,
    endpointB: circuit.endpoint_b,
    bandwidth: circuit.bandwidth,
    provisioningStage: circuit.provisioning_stage,
    status: circuit.status,
  };
}

function App() {
  const [activeView, setActiveView] = useState("tc-overview");
  const [customers, setCustomers] = useState(CUSTOMERS);
  const [pops, setPops] = useState(SITES.pop);
  const [customerSites, setCustomerSites] = useState(SITES.customer);
  const [invoices, setInvoices] = useState(INVOICES);
  const [activity, setActivity] = useState(ACTIVITY);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [assets, setAssets] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [circuits, setCircuits] = useState([]);
  const [products, setProducts] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [aiContext, setAiContext] = useState(null);
  const [searchTarget, setSearchTarget] = useState(null);

  const pageTitles = {
    "tc-overview": "Overview",
    "tc-accounts": "Accounts",
    "tc-catalog": "Product Catalog",
    "tc-orders": "Orders & Provisioning",
    "tc-contracts": "Contracts & SLA",
    "tc-billing": "Billing",
    "tc-tickets": "Service Assurance",
    "tc-wholesale": "Wholesale Partner Portal",
    popManagement: "POP Management",
    assets: "Assets & Capacity",
    map: "Network Map",
  };
  const telecomCrmView = activeView.startsWith("tc-") ? activeView.slice(3) : null;

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [popData, siteData, customerData, invoiceData, activityData, summaryData, assetData, contractData, circuitData, productData, quoteData] = await Promise.all([
          apiRequest("/api/pops"),
          apiRequest("/api/customer-sites"),
          apiRequest("/api/customers"),
          apiRequest("/api/invoices"),
          apiRequest("/api/activity"),
          apiRequest("/api/dashboard"),
          apiRequest("/api/assets"),
          apiRequest("/api/contracts"),
          apiRequest("/api/circuits"),
          apiRequest("/api/catalog/products"),
          apiRequest("/api/quotes"),
        ]);
        if (cancelled) return;
        const loadedCustomers = customerData.map(toUiCustomer);
        setPops(popData.map(toUiPop));
        setCustomerSites(siteData.map(toUiSite));
        setCustomers(loadedCustomers);
        setInvoices(invoiceData.map((invoice) => toUiInvoice(invoice, loadedCustomers)));
        setActivity(activityData);
        setDashboardSummary(summaryData);
        setAssets(assetData.map(toUiAsset));
        setContracts(contractData.map(toUiContract));
        setCircuits(circuitData.map(toUiCircuit));
        setProducts(productData.map(toUiProduct));
        setQuotes(quoteData.map(toUiQuote));
      } catch (error) {
        console.error("Unable to load API data. Using bundled fallback data.", error);
      }
    }

    function handleCrmDataChanged(event) {
      if (event.origin !== window.location.origin || event.data?.source !== "telecom-crm" || event.data?.type !== "data-changed") return;
      loadData();
    }

    loadData();
    window.addEventListener("message", handleCrmDataChanged);
    return () => {
      cancelled = true;
      window.removeEventListener("message", handleCrmDataChanged);
    };
  }, []);

  function openDrawer(id) {
    const c = customers.find((x) => x.id === id);
    setSelectedCustomer(c);
  }

  async function addCustomer({ lat, lng, ...customer }) {
    const pop = pops.find((item) => item.name === customer.exchange);
    if (!pop?.apiId) throw new Error("Select a POP that has been saved to the database.");

    const site = await apiRequest("/api/customer-sites", {
      method: "POST",
      body: JSON.stringify({ name: customer.site, latitude: lat, longitude: lng }),
    });
    const record = await apiRequest("/api/customers", {
      method: "POST",
      body: JSON.stringify({
        name: customer.name,
        site_id: site.id,
        pop_id: pop.apiId,
        plan: customer.plan,
        account_type: customer.accountType,
        verification_status: customer.verificationStatus,
        billing_model: customer.billingModel,
        status: customer.status,
        risk: customer.risk,
        monthly_value: Number(customer.mrr.replace(/[^0-9.]/g, "")),
        tenure: customer.tenure,
        port: customer.port,
        reasons: customer.reasons,
      }),
    });
    const mappedSite = toUiSite(site);
    const mappedCustomer = toUiCustomer(record);
    setCustomerSites((currentSites) => [...currentSites, mappedSite]);
    setCustomers((currentCustomers) => [...currentCustomers, mappedCustomer]);
  }

  async function addPop({ lat, lng, portsTotal, ...pop }) {
    const record = await apiRequest("/api/pops", {
      method: "POST",
      body: JSON.stringify({
        name: pop.name,
        latitude: lat,
        longitude: lng,
        ports_total: portsTotal,
        switch_id: pop.switchId,
      }),
    });
    setPops((currentPops) => [...currentPops, toUiPop(record)]);
  }

  async function addAsset({ lat, lng, capacityTotal, capacityUsed, ...asset }) {
    const record = await apiRequest("/api/assets", {
      method: "POST",
      body: JSON.stringify({
        name: asset.name,
        asset_type: asset.assetType,
        location_name: asset.locationName,
        latitude: lat,
        longitude: lng,
        capacity_total: capacityTotal,
        capacity_used: capacityUsed,
        capacity_unit: asset.capacityUnit,
        status: asset.status,
      }),
    });
    setAssets((currentAssets) => [...currentAssets, toUiAsset(record)]);
  }

  async function addContract(contract) {
    const record = await apiRequest("/api/contracts", {
      method: "POST",
      body: JSON.stringify({
        account_name: contract.accountName,
        account_segment: contract.accountSegment,
        product: contract.product,
        status: contract.status,
        start_date: contract.startDate,
        end_date: contract.endDate,
        monthly_value: contract.monthlyValue,
        sla_availability: contract.slaAvailability,
        sla_mttr_hours: contract.slaMttrHours,
        msa_number: contract.msaNumber || null,
        service_schedule_number: contract.serviceScheduleNumber || null,
        route_diversity: contract.routeDiversity,
        service_credit_rate: contract.serviceCreditRate,
      }),
    });
    setContracts((currentContracts) => [...currentContracts, toUiContract(record)]);
  }

  async function addCircuit(circuit) {
    const record = await apiRequest("/api/circuits", {
      method: "POST",
      body: JSON.stringify({
        contract_id: circuit.contractId,
        asset_id: circuit.assetId,
        pop_id: circuit.popId,
        endpoint_a: circuit.endpointA,
        endpoint_b: circuit.endpointB,
        bandwidth: circuit.bandwidth,
        provisioning_stage: circuit.provisioningStage,
        status: circuit.status,
      }),
    });
    setCircuits((currentCircuits) => [...currentCircuits, toUiCircuit(record)]);
  }

  async function addQuote(quote) {
    const record = await apiRequest("/api/quotes", {
      method: "POST",
      body: JSON.stringify({
        account_id: quote.accountId,
        product_id: quote.productId,
        status: quote.status,
        feasibility_status: quote.feasibilityStatus,
        requested_capacity: quote.requestedCapacity || null,
        route_distance_km: quote.routeDistanceKm === "" ? null : Number(quote.routeDistanceKm),
        term_months: Number(quote.termMonths),
        monthly_value: quote.monthlyValue === "" ? null : Number(quote.monthlyValue),
        notes: quote.notes || null,
      }),
    });
    setQuotes((currentQuotes) => [toUiQuote(record), ...currentQuotes]);
  }

  function closeDrawer() {
    setSelectedCustomer(null);
  }

  function navigate(view) {
    setSearchTarget(null);
    setActiveView(view);
  }

  function selectSearchResult(result) {
    if (result.type === "customer") {
      setSearchTarget(result);
      setActiveView("tc-accounts");
    } else if (result.type === "ticket") {
      setSearchTarget(result);
      setActiveView("tc-tickets");
    } else {
      setSearchTarget(null);
      setActiveView("map");
    }
  }

  return (
    <div className="app">
      <Sidebar activeView={activeView} onNavigate={navigate} />
      <main className="main">
        <Topbar title={pageTitles[activeView]} customers={customers} customerSites={customerSites} onSelectResult={selectSearchResult} />
        <Dashboard active={activeView === "dashboard"} customers={customers} activity={activity} summary={dashboardSummary} onOpenDrawer={openDrawer} />
        <PopManagement active={activeView === "popManagement"} pops={pops} onAddPop={addPop} />
        <Customers active={activeView === "customers"} customers={customers} customerSites={customerSites} pops={pops} onOpenDrawer={openDrawer} onAddCustomer={addCustomer} />
        <TelecomCrmPrototype active={Boolean(telecomCrmView)} view={telecomCrmView} selection={searchTarget} />
        <AssetManagement active={activeView === "assets"} assets={assets} onAddAsset={addAsset} />
        <ContractManagement active={activeView === "contracts"} contracts={contracts} circuits={circuits} assets={assets} pops={pops} onAddContract={addContract} onAddCircuit={addCircuit} />
        <QuoteManagement active={activeView === "quotes"} customers={customers} products={products} quotes={quotes} onAddQuote={addQuote} />
        <NetworkMap active={activeView === "map"} pops={pops} customerSites={customerSites} assets={assets} onPortAnalyze={(port) => { setAiContext(`port:${port}`); setChatOpen(true); }} />
        <Billing active={activeView === "billing"} customers={customers} invoices={invoices} onOpenDrawer={openDrawer} />
        <TelcoOperations active={activeView === "telcoOperations"} />
      </main>
      <Drawer customer={selectedCustomer} onClose={closeDrawer} onChatOpen={() => setChatOpen(true)} />
      <ChatWidget isOpen={chatOpen} onToggle={() => setChatOpen((o) => !o)} customer={selectedCustomer} invoices={invoices} aiContext={aiContext} onClearContext={() => setAiContext(null)} />
    </div>
  );
}

export default App;
