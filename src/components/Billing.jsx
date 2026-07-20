import { useState, useMemo } from "react";

const STATUS_CLASS = {
  paid: "inv-paid",
  pending: "inv-pending",
  overdue: "inv-overdue",
};

function formatCurrency(amount) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function Billing({ active, customers, invoices, onOpenDrawer }) {
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(
    () =>
      invoices.filter(
        (inv) => !statusFilter || inv.status === statusFilter
      ),
    [invoices, statusFilter]
  );

  const totalOutstanding = useMemo(
    () =>
      invoices.filter((inv) => inv.status !== "paid").reduce(
        (sum, inv) => sum + inv.amount,
        0
      ),
    [invoices]
  );

  const overdueCount = useMemo(
    () => invoices.filter((inv) => inv.status === "overdue").length,
    [invoices]
  );

  const totalMRR = useMemo(
    () =>
      customers.filter((c) => c.status === "Active").reduce((sum, c) => {
        const num = parseInt(c.mrr.replace(/[^0-9]/g, ""));
        return sum + (isNaN(num) ? 0 : num);
      }, 0),
    [customers]
  );

  const collectionRate = useMemo(() => {
    const total = invoices.reduce((s, i) => s + i.amount, 0);
    const paid = invoices.filter((i) => i.status === "paid").reduce(
      (s, i) => s + i.amount,
      0
    );
    return total > 0 ? Math.round((paid / total) * 100) : 0;
  }, [invoices]);

  return (
    <section className={`view${active ? " active" : ""} view-billing`}>
      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-label">Total MRR (Active)</div>
          <div className="kpi-value">{formatCurrency(totalMRR)}</div>
            <div className="kpi-delta up">Across {customers.filter((c) => c.status === "Active").length} active accounts</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Outstanding</div>
          <div className="kpi-value">{formatCurrency(totalOutstanding)}</div>
          <div className="kpi-delta warn">{overdueCount} overdue invoice{overdueCount !== 1 ? "s" : ""}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Collection Rate</div>
          <div className="kpi-value">{collectionRate}%</div>
          <div className="kpi-delta up">Last 30 days</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Invoices (MTD)</div>
            <div className="kpi-value">{invoices.length}</div>
            <div className="kpi-delta up">
              {invoices.filter((i) => i.status === "paid").length} paid,{" "}
              {invoices.filter((i) => i.status === "pending").length} pending
          </div>
        </div>
      </div>

      <div className="cust-toolbar" style={{ marginTop: 22 }}>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All invoices</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Issued</th>
            <th>Due</th>
            <th>Paid</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((inv) => {
            const cust = customers.find((c) => c.id === inv.customerId);
            return (
              <tr
                key={inv.id}
                onClick={() => cust && onOpenDrawer(cust.id)}
              >
                <td className="cell-mono">{inv.id}</td>
                <td>{inv.customerName}</td>
                <td className="cell-mono">{formatCurrency(inv.amount)}</td>
                <td className="cell-mono">{inv.issued}</td>
                <td className="cell-mono">{inv.due}</td>
                <td className="cell-mono">{inv.paid || "—"}</td>
                <td>
                  <span className={`badge ${STATUS_CLASS[inv.status]}`}>
                    {inv.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export default Billing;
