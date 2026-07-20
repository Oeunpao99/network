const PROTOTYPE_URL = "/tc-crm-prototype_1%20(1).html";
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

function TelecomCrmPrototype({ active, view }) {
  const source = `${PROTOTYPE_URL}?embedded=1&view=${encodeURIComponent(view || "overview")}&apiBase=${encodeURIComponent(API_URL)}`;

  return (
    <section className={`view view-telecom-crm${active ? " active" : ""}`} aria-label="Telecom Cambodia CRM workspace">
      <iframe
        className="telecom-crm-frame"
        key={source}
        src={source}
        title="Telecom Cambodia CRM prototype"
      />
    </section>
  );
}

export default TelecomCrmPrototype;
