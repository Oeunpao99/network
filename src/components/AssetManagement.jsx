import { useState } from "react";
import LocationPicker from "./LocationPicker";

const INITIAL_FORM = {
  name: "",
  assetType: "Fiber Route",
  locationName: "",
  lat: "",
  lng: "",
  capacityTotal: "",
  capacityUsed: "0",
  capacityUnit: "fiber cores",
  status: "Active",
};

function capacityClass(percent) {
  if (percent >= 85) return "critical";
  if (percent >= 70) return "warning";
  return "healthy";
}

function AssetManagement({ active, assets, onAddAsset }) {
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [locationMode, setLocationMode] = useState("manual");
  const [locationError, setLocationError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const nearCapacity = assets.filter((asset) => (asset.capacityUsed / asset.capacityTotal) * 100 >= 70).length;

  function updateForm(field, value) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    if (field === "lat" || field === "lng") setLocationError("");
  }

  function selectLocation({ lat, lng }) {
    setForm((currentForm) => ({ ...currentForm, lat, lng }));
    setLocationError("");
  }

  function closeForm() {
    setIsAddingAsset(false);
    setForm(INITIAL_FORM);
    setLocationMode("manual");
    setLocationError("");
    setSubmitError("");
  }

  async function submitAsset(event) {
    event.preventDefault();
    if (form.lat === "" || form.lng === "") {
      setLocationError("Enter coordinates or select a location on the map.");
      return;
    }
    if (Number(form.capacityUsed) > Number(form.capacityTotal)) {
      setSubmitError("Used capacity cannot exceed total capacity.");
      return;
    }

    setSubmitError("");
    setIsSaving(true);
    try {
      await onAddAsset({
        name: form.name.trim(),
        assetType: form.assetType,
        locationName: form.locationName.trim(),
        lat: Number(form.lat),
        lng: Number(form.lng),
        capacityTotal: Number(form.capacityTotal),
        capacityUsed: Number(form.capacityUsed),
        capacityUnit: form.capacityUnit.trim(),
        status: form.status,
      });
      closeForm();
    } catch (error) {
      setSubmitError(error.message || "Unable to save this asset.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className={`view${active ? " active" : ""} view-assets`}>
      <div className="asset-page-head">
        <div>
          <h2>Assets & Capacity</h2>
          <p>Track leasable network infrastructure and available capacity.</p>
        </div>
        <button className="add-pop-btn" type="button" onClick={() => setIsAddingAsset(true)}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M10 4v12M4 10h12" strokeLinecap="round" />
          </svg>
          Add asset
        </button>
      </div>

      <div className="asset-summary">
        <div><span>Total assets</span><strong>{assets.length}</strong></div>
        <div><span>Near capacity</span><strong>{nearCapacity}</strong></div>
      </div>

      <div className="asset-grid">
        {assets.map((asset) => {
          const percent = Math.round((asset.capacityUsed / asset.capacityTotal) * 100);
          return (
            <article key={asset.id} className="asset-card">
              <div className="asset-card-head">
                <span className={`asset-type ${asset.assetType.toLowerCase().replaceAll(" ", "-")}`}>{asset.assetType}</span>
                <span className={`asset-status ${asset.status.toLowerCase()}`}>{asset.status}</span>
              </div>
              <h3>{asset.name}</h3>
              <p className="asset-location">{asset.locationName} · {asset.id}</p>
              <div className="asset-capacity-label">
                <span>Capacity</span>
                <strong>{asset.capacityUsed}/{asset.capacityTotal} {asset.capacityUnit}</strong>
              </div>
              <div className="asset-capacity-track">
                <div className={`asset-capacity-fill ${capacityClass(percent)}`} style={{ width: `${percent}%` }} />
              </div>
              <div className={`asset-capacity-note ${capacityClass(percent)}`}>{percent}% utilized · {asset.capacityTotal - asset.capacityUsed} available</div>
            </article>
          );
        })}
      </div>

      {isAddingAsset && (
        <div className="customer-modal-overlay" onMouseDown={closeForm}>
          <form className="customer-modal asset-modal" onSubmit={submitAsset} onMouseDown={(event) => event.stopPropagation()}>
            <div className="customer-modal-head">
              <div>
                <h2>Add infrastructure asset</h2>
                <p>Assets appear on the Network Map and support capacity planning.</p>
              </div>
              <button className="customer-modal-close" type="button" onClick={closeForm} aria-label="Close add asset form">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="customer-form-grid">
              <label className="customer-field customer-field-wide">
                Asset name
                <input value={form.name} onChange={(event) => updateForm("name", event.target.value)} required autoFocus />
              </label>
              <label className="customer-field">
                Asset type
                <select value={form.assetType} onChange={(event) => updateForm("assetType", event.target.value)}>
                  <option>Fiber Route</option>
                  <option>Cable Duct</option>
                  <option>Tower Space</option>
                  <option>Equipment Site</option>
                </select>
              </label>
              <label className="customer-field">
                Location name
                <input value={form.locationName} onChange={(event) => updateForm("locationName", event.target.value)} placeholder="Central Phnom Penh" required />
              </label>
              <label className="customer-field">
                Total capacity
                <input type="number" min="1" step="1" value={form.capacityTotal} onChange={(event) => updateForm("capacityTotal", event.target.value)} required />
              </label>
              <label className="customer-field">
                Used capacity
                <input type="number" min="0" step="1" value={form.capacityUsed} onChange={(event) => updateForm("capacityUsed", event.target.value)} required />
              </label>
              <label className="customer-field">
                Capacity unit
                <input value={form.capacityUnit} onChange={(event) => updateForm("capacityUnit", event.target.value)} placeholder="fiber cores" required />
              </label>
              <label className="customer-field">
                Status
                <select value={form.status} onChange={(event) => updateForm("status", event.target.value)}>
                  <option>Active</option>
                  <option>Reserved</option>
                  <option>Maintenance</option>
                </select>
              </label>
              <div className="coordinate-section customer-field-wide">
                <div className="coordinate-section-head">
                  <span>Asset location</span>
                  <div className="coordinate-mode" role="group" aria-label="Asset location entry method">
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
              <button className="customer-form-submit" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Add asset"}</button>
            </div>
            {submitError && <p className="form-submit-error">{submitError}</p>}
          </form>
        </div>
      )}
    </section>
  );
}

export default AssetManagement;
