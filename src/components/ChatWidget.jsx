import { useState, useRef, useEffect } from "react";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

const SUGGESTIONS = [
  "Give me a detailed summary of this customer account.",
  "Review this customer's open tickets and next actions.",
  "Check this customer's payment status and subscription plan.",
  "Draft a short retention offer email for this customer.",
];

function buildCustomerContext(customer, invoices) {
  const customerInvoices = invoices.filter((invoice) => invoice.customerId === customer.id).map((invoice) => ({
    invoice: invoice.id,
    amount: `$${invoice.amount.toLocaleString()}`,
    status: invoice.status,
    due: invoice.due,
    paid: invoice.paid || "Not paid",
  }));
  const overdue = customerInvoices.filter((invoice) => invoice.status === "overdue").length;

  return {
    name: customer.name,
    site: customer.site,
    subscription_plan: customer.plan,
    account_status: customer.status,
    monthly_value: customer.mrr,
    tenure: customer.tenure,
    churn_risk: customer.risk,
    risk_signals: customer.reasons,
    exchange_port: `${customer.exchange} ${customer.port}`,
    open_tickets: customer.tickets.map((ticket) => ({
      ticket: ticket.id,
      issue: ticket.text,
      date: ticket.date,
    })),
    invoices: customerInvoices,
    payment_summary: customerInvoices.length
      ? `${overdue} overdue invoice${overdue === 1 ? "" : "s"} across ${customerInvoices.length} invoices.`
      : "No invoices are on record.",
  };
}

function renderInlineMarkdown(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function renderMessage(text) {
  return text.split("\n").map((line, index) => {
    if (!line.trim()) return <div key={index} className="msg-spacer" />;

    const isBullet = line.startsWith("- ");
    const isHeading = /^\*\*[^*]+\*\*$/.test(line);
    return (
      <div key={index} className={`msg-line${isBullet ? " msg-bullet" : ""}${isHeading ? " msg-heading" : ""}`}>
        {isBullet && <span className="msg-bullet-marker" />}
        <span>{renderInlineMarkdown(isBullet ? line.slice(2) : line)}</span>
      </div>
    );
  });
}

function ChatWidget({ isOpen, onToggle, customer, invoices, aiContext, onClearContext }) {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hi, I'm the Fiberline AI Assistant. I can summarize accounts, draft retention offers, or explain service issues in plain language. Open a customer first for account-aware answers, or just ask me anything.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const sendChatRef = useRef(null);

  useEffect(() => {
    if (!aiContext || !sendChatRef.current) return;
    if (aiContext.startsWith("port:")) {
      const port = aiContext.slice(5);
      sendChatRef.current(`Analyze this switch port assignment: ${port}. Is there any capacity concern, risk of oversubscription, or known issues with this port? Should I consider an alternative?`);
    }
    onClearContext?.();
  }, [aiContext, onClearContext]);

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  async function sendChat(text) {
    const userMsg = { role: "user", text };
    setMessages((currentMessages) => [...currentMessages, userMsg]);
    setLoading(true);
    setInput("");
    scrollToBottom();

    try {
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-8).map((message) => ({
            role: message.role === "ai" ? "assistant" : "user",
            content: message.text,
          })),
          customer_context: customer
            ? buildCustomerContext(customer, invoices)
            : null,
        }),
      });
      if (!response.ok) throw new Error("AI request failed");
      const data = await response.json();
      const reply = data.reply?.trim() || "I couldn't generate a response — please try again.";
      setMessages((prev) => [...prev, { role: "ai", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "I'm having trouble reaching the AI service right now. Please try again in a moment.",
        },
      ]);
    }
    setLoading(false);
    scrollToBottom();
  }
  sendChatRef.current = sendChat;

  function handleSend() {
    if (input.trim()) sendChat(input.trim());
  }

  return (
    <>
      <button id="chat-toggle" onClick={onToggle}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path
            d="M4 12a8 8 0 1113.9 5.4L20 21l-4-1.2A8 8 0 014 12z"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div className={`chat-panel${isOpen ? " open" : ""}`}>
        <div className="chat-head">
          <span className="dot"></span>
          <div className="chat-head-text">
            <div className="ct-name">Fiberline AI Assistant</div>
            <div className="ct-sub">
              {customer
                ? `ACCOUNT — ${customer.name.toUpperCase()}`
                : "GENERAL — NO ACCOUNT SELECTED"}
            </div>
          </div>
          <button
            onClick={onToggle}
            style={{ background: "none", border: "none", color: "#93A2B8" }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              {renderMessage(m.text)}
            </div>
          ))}
          {loading && <div className="msg typing">Fiberline AI is typing…</div>}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-suggest">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="sugg-chip" onClick={() => sendChat(s)}>
              {s}
            </button>
          ))}
        </div>
        <div className="chat-input-row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about an account, ticket, or install…"
          />
          <button className="chat-send" onClick={handleSend}>
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 10l16-7-6 16-2.5-6.5L2 10z" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

export default ChatWidget;
