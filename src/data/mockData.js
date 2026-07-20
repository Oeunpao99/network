export const SITES = {
  pop: [
    { id: "POP-WPH", name: "Wat Phnom Exchange", lat: 11.5925, lng: 104.9282, portsTotal: 96, portsUsed: 71, switchId: "SW-CORE-01" },
    { id: "POP-CCV", name: "Chroy Changvar POP", lat: 11.5975, lng: 104.9420, portsTotal: 48, portsUsed: 22, switchId: "SW-EDGE-04" },
    { id: "POP-TLK", name: "Toul Kork Exchange", lat: 11.5794, lng: 104.8925, portsTotal: 96, portsUsed: 88, switchId: "SW-CORE-02" },
    { id: "POP-BKK", name: "BKK1 POP", lat: 11.5537, lng: 104.9282, portsTotal: 64, portsUsed: 40, switchId: "SW-EDGE-07" },
  ],
  customer: [
    { id: "SITE-01", name: "Aeon Mall Sen Sok", lat: 11.5730, lng: 104.8890 },
    { id: "SITE-02", name: "Attwood Business Center", lat: 11.5580, lng: 104.9270 },
    { id: "SITE-03", name: "Diamond Island Convention Ctr", lat: 11.5560, lng: 104.9330 },
    { id: "SITE-04", name: "Olympia City Complex", lat: 11.5670, lng: 104.9130 },
    { id: "SITE-05", name: "Chip Mong Tower 88", lat: 11.5620, lng: 104.9200 },
    { id: "SITE-06", name: "Chroy Changvar Riverside Hotel", lat: 11.6000, lng: 104.9450 },
    { id: "SITE-07", name: "Central Market Business Hub", lat: 11.5680, lng: 104.9210 },
    { id: "SITE-08", name: "Koh Pich Tower", lat: 11.5540, lng: 104.9300 },
  ],
};

export const CUSTOMERS = [
  { id: 1, name: "Aeon Mall Sen Sok Co., Ltd", site: "Aeon Mall Sen Sok", plan: "Enterprise Dedicated 10G", status: "Active", risk: "Low", mrr: "$2,400/mo", tenure: "3.2 yrs", exchange: "Toul Kork Exchange", port: "GE0/1/14", portUsed: 88, portTotal: 96, reasons: [], tickets: [{ id: "TCK-2291", text: "Scheduled maintenance window confirmed", date: "Jul 12" }] },
  { id: 2, name: "Attwood Business Center", site: "Attwood Business Center", plan: "Fiber Pro 1G", status: "At Risk", risk: "High", mrr: "$680/mo", tenure: "1.1 yrs", exchange: "BKK1 POP", port: "GE0/2/03", portUsed: 40, portTotal: 64, reasons: ["3 failed payments", "2 open tickets", "Avg latency +40%"], tickets: [{ id: "TCK-2287", text: "Repeated packet loss reported", date: "Jul 10" }, { id: "TCK-2270", text: "Billing dispute — overcharge claim", date: "Jul 3" }] },
  { id: 3, name: "Diamond Island Convention Ctr", site: "Diamond Island Convention Ctr", plan: "Enterprise Dedicated 10G", status: "Active", risk: "Low", mrr: "$3,100/mo", tenure: "4.0 yrs", exchange: "BKK1 POP", port: "GE0/2/11", portUsed: 40, portTotal: 64, reasons: [], tickets: [] },
  { id: 4, name: "Olympia City Complex", site: "Olympia City Complex", plan: "Fiber Business 500", status: "Onboarding", risk: "Medium", mrr: "$420/mo", tenure: "0.2 yrs", exchange: "Toul Kork Exchange", port: "GE0/1/29", portUsed: 88, portTotal: 96, reasons: ["Install delayed 6 days", "Port capacity at 92% on exchange"], tickets: [{ id: "TCK-2299", text: "Install crew rescheduled", date: "Jul 14" }] },
  { id: 5, name: "Chip Mong Tower 88", site: "Chip Mong Tower 88", plan: "Fiber Pro 1G", status: "Active", risk: "Low", mrr: "$680/mo", tenure: "2.4 yrs", exchange: "BKK1 POP", port: "GE0/2/18", portUsed: 40, portTotal: 64, reasons: [], tickets: [] },
  { id: 6, name: "Chroy Changvar Riverside Hotel", site: "Chroy Changvar Riverside Hotel", plan: "Fiber Business 500", status: "At Risk", risk: "High", mrr: "$420/mo", tenure: "0.9 yrs", exchange: "Chroy Changvar POP", port: "GE0/4/02", portUsed: 22, portTotal: 48, reasons: ["4 outage tickets in 30 days", "NPS score dropped to 3"], tickets: [{ id: "TCK-2280", text: "Fiber cut — riverside construction", date: "Jul 8" }, { id: "TCK-2265", text: "Second outage this month", date: "Jul 1" }] },
  { id: 7, name: "Central Market Business Hub", site: "Central Market Business Hub", plan: "Fiber Essential 100", status: "Active", risk: "Medium", mrr: "$180/mo", tenure: "1.6 yrs", exchange: "Wat Phnom Exchange", port: "GE0/0/33", portUsed: 71, portTotal: 96, reasons: ["Usage near plan cap"], tickets: [] },
  { id: 8, name: "Koh Pich Tower", site: "Koh Pich Tower", plan: "Enterprise Dedicated 10G", status: "Active", risk: "Low", mrr: "$2,950/mo", tenure: "3.7 yrs", exchange: "BKK1 POP", port: "GE0/2/25", portUsed: 40, portTotal: 64, reasons: [], tickets: [] },
  { id: 9, name: "Fiberline SME — Riverside Traders", site: "Central Market Business Hub", plan: "Fiber Essential 100", status: "Suspended", risk: "High", mrr: "$0/mo", tenure: "0.8 yrs", exchange: "Wat Phnom Exchange", port: "GE0/0/41", portUsed: 71, portTotal: 96, reasons: ["Suspended — non-payment 45 days"], tickets: [{ id: "TCK-2201", text: "Service suspended per policy", date: "Jun 29" }] },
  { id: 10, name: "Sen Sok Medical Plaza", site: "Aeon Mall Sen Sok", plan: "Fiber Business 500", status: "Active", risk: "Medium", mrr: "$420/mo", tenure: "1.3 yrs", exchange: "Toul Kork Exchange", port: "GE0/1/07", portUsed: 88, portTotal: 96, reasons: ["Exchange nearing port capacity"], tickets: [] },
];

export const INVOICES = [
  { id: "INV-2024-001", customerId: 1, customerName: "Aeon Mall Sen Sok Co., Ltd", amount: 2400, status: "paid", issued: "Jul 1, 2024", due: "Jul 15, 2024", paid: "Jul 12, 2024" },
  { id: "INV-2024-002", customerId: 2, customerName: "Attwood Business Center", amount: 680, status: "overdue", issued: "Jun 1, 2024", due: "Jun 15, 2024", paid: null },
  { id: "INV-2024-003", customerId: 3, customerName: "Diamond Island Convention Ctr", amount: 3100, status: "paid", issued: "Jul 1, 2024", due: "Jul 15, 2024", paid: "Jul 10, 2024" },
  { id: "INV-2024-004", customerId: 4, customerName: "Olympia City Complex", amount: 420, status: "pending", issued: "Jul 1, 2024", due: "Jul 22, 2024", paid: null },
  { id: "INV-2024-005", customerId: 5, customerName: "Chip Mong Tower 88", amount: 680, status: "paid", issued: "Jun 1, 2024", due: "Jun 15, 2024", paid: "Jun 14, 2024" },
  { id: "INV-2024-006", customerId: 6, customerName: "Chroy Changvar Riverside Hotel", amount: 420, status: "overdue", issued: "May 1, 2024", due: "May 15, 2024", paid: null },
  { id: "INV-2024-007", customerId: 7, customerName: "Central Market Business Hub", amount: 180, status: "paid", issued: "Jul 1, 2024", due: "Jul 15, 2024", paid: "Jul 14, 2024" },
  { id: "INV-2024-008", customerId: 8, customerName: "Koh Pich Tower", amount: 2950, status: "pending", issued: "Jul 1, 2024", due: "Jul 20, 2024", paid: null },
  { id: "INV-2024-009", customerId: 9, customerName: "Fiberline SME — Riverside Traders", amount: 180, status: "overdue", issued: "Apr 1, 2024", due: "Apr 15, 2024", paid: null },
  { id: "INV-2024-010", customerId: 10, customerName: "Sen Sok Medical Plaza", amount: 420, status: "paid", issued: "Jun 1, 2024", due: "Jun 15, 2024", paid: "Jun 13, 2024" },
  { id: "INV-2024-011", customerId: 2, customerName: "Attwood Business Center", amount: 680, status: "pending", issued: "Jul 1, 2024", due: "Jul 15, 2024", paid: null },
  { id: "INV-2024-012", customerId: 6, customerName: "Chroy Changvar Riverside Hotel", amount: 420, status: "pending", issued: "Jun 1, 2024", due: "Jun 15, 2024", paid: null },
];

export const ACTIVITY = [
  { time: "09:41", html: "<b>AI model</b> flagged Attwood Business Center as high churn risk" },
  { time: "09:20", html: "<b>Sereyvath R.</b> closed ticket TCK-2260 for Koh Pich Tower" },
  { time: "08:55", html: "Install crew dispatched for <b>Olympia City Complex</b>" },
  { time: "08:12", html: "<b>Chroy Changvar POP</b> port utilization crossed 45%" },
  { time: "Yesterday", html: "<b>Diamond Island Convention Ctr</b> upgraded to Enterprise Dedicated 10G" },
];
