import { useState } from "react";
import LocationPicker from "./LocationPicker";

const INITIAL_FORM = {
  name: "",
  lat: "",
  lng: "",
  portsTotal: "",
  switchId: "",
};

function PopManagement({ active, pops, onAddPop }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [isAddingPop, setIsAddingPop] = useState(false);
  const [locationMode, setLocationMode] = useState("manual");
  const [locationError, setLocationError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function updateForm(field, value) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    if (field === "lat" || field === "lng") setLocationError("");
  }

  function selectLocation({ lat, lng }) {
    setForm((currentForm) => ({ ...currentForm, lat, lng }));
    setLocationError("");
  }

  async function submitPop(event) {
    event.preventDefault();
    if (form.lat === "" || form.lng === "") {
      setLocationError("Enter coordinates or select a location on the map.");
      return;
    }
    setSubmitError("");
    setIsSaving(true);
    try {
      await onAddPop({
        name: form.name.trim(),
        lat: Number(form.lat),
        lng: Number(form.lng),
        portsTotal: Number(form.portsTotal),
        switchId: form.switchId.trim(),
      });
      closeForm();
    } catch (error) {
      setSubmitError(error.message || "Unable to save this POP.");
    } finally {
      setIsSaving(false);
    }
  }

  function closeForm() {
    setIsAddingPop(false);
    setForm(INITIAL_FORM);
    setLocationMode("manual");
    setLocationError("");
    setSubmitError("");
  }

  return (
    <section className={`view${active ? " active" : ""} view-pop-management`}>
      <div className="management-card">
        <div className="management-card-head">
          <div>
            <h2>Existing POPs / Exchanges</h2>
            <p>Manage network points of presence and their available capacity.</p>
          </div>
          <div className="management-card-actions">
            <span>{pops.length} total</span>
            <button className="add-pop-btn" type="button" onClick={() => setIsAddingPop(true)}>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M10 4v12M4 10h12" strokeLinecap="round" />
              </svg>
              Add POP
            </button>
          </div>
        </div>
        <div className="management-list">
          {pops.map((pop) => (
            <div key={pop.id} className="management-item">
              <div>
                <div className="management-item-name">{pop.name}</div>
                <div className="management-item-id">{pop.id}</div>
              </div>
              <div className="management-item-detail">
                {pop.portsUsed}/{pop.portsTotal} ports &middot; {pop.switchId}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isAddingPop && (
        <div className="customer-modal-overlay" onMouseDown={closeForm}>
          <form className="customer-modal pop-modal" onSubmit={submitPop} onMouseDown={(event) => event.stopPropagation()}>
        <div className="customer-modal-head">
          <div>
            <h2>Add POP</h2>
            <p>New POPs appear immediately on the Network Map.</p>
          </div>
          <button className="customer-modal-close" type="button" onClick={closeForm} aria-label="Close add POP form">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="management-form-grid">
          <label className="management-field management-field-wide">
            Name
            <input value={form.name} onChange={(event) => updateForm("name", event.target.value)} required autoFocus />
          </label>
          <div className="coordinate-section management-field-wide">
            <div className="coordinate-section-head">
              <span>Location coordinates</span>
              <div className="coordinate-mode" role="group" aria-label="POP location entry method">
                <button className={locationMode === "manual" ? "active" : ""} type="button" onClick={() => setLocationMode("manual")}>Enter coordinates</button>
                <button className={locationMode === "map" ? "active" : ""} type="button" onClick={() => setLocationMode("map")}>Choose on map</button>
              </div>
            </div>
            {locationMode === "manual" ? (
              <div className="coordinate-inputs">
                <label className="management-field">
                  Lat
                  <input type="number" min="-90" max="90" step="any" value={form.lat} onChange={(event) => updateForm("lat", event.target.value)} placeholder="11.575" required />
                </label>
                <label className="management-field">
                  Lng
                  <input type="number" min="-180" max="180" step="any" value={form.lng} onChange={(event) => updateForm("lng", event.target.value)} placeholder="104.918" required />
                </label>
              </div>
            ) : (
              <LocationPicker latitude={form.lat} longitude={form.lng} onSelect={selectLocation} />
            )}
            {locationError && <p className="coordinate-error">{locationError}</p>}
          </div>
          <label className="management-field">
            Ports total
            <input type="number" min="1" step="1" value={form.portsTotal} onChange={(event) => updateForm("portsTotal", event.target.value)} required />
          </label>
          <label className="management-field">
            Switch ID
            <input value={form.switchId} onChange={(event) => updateForm("switchId", event.target.value)} placeholder="SW-EDGE-08" required />
          </label>
        </div>
            <div className="customer-form-actions">
              <button className="customer-form-cancel" type="button" onClick={closeForm}>Cancel</button>
              <button className="customer-form-submit" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Add POP"}</button>
            </div>
            {submitError && <p className="form-submit-error">{submitError}</p>}
          </form>
        </div>
      )}
    </section>
  );
}

export default PopManagement;
