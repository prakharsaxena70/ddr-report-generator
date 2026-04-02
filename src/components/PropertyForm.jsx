const fields = [
  { name: "clientName", label: "Client Name", placeholder: "UrbanRoof Demo Client" },
  {
    name: "propertyAddress",
    label: "Property Address",
    placeholder: "Enter full site address",
    wide: true,
  },
  { name: "inspectorName", label: "Inspector Name", placeholder: "Krushna & Mahesh" },
  { name: "inspectionDate", label: "Inspection Date", type: "date" },
  { name: "propertyType", label: "Property Type", placeholder: "Flat" },
  { name: "propertyAge", label: "Property Age (Years)", placeholder: "8" },
  { name: "floors", label: "No. of Floors", placeholder: "11" },
];

export default function PropertyForm({ values, onChange }) {
  return (
    <div className="rounded-[30px] border border-white/60 bg-white/90 p-6 shadow-card backdrop-blur">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amberdeep">
            Step 1
          </p>
          <h2 className="mt-2 font-display text-2xl text-charcoal">Property Details</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-stone-600">
            This information anchors the cover page, general information table, and final
            diagnosis report metadata.
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-canvas px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal">
          DDR metadata
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <label
            key={field.name}
            className={`flex flex-col gap-2 ${field.wide ? "md:col-span-2" : ""}`}
          >
            <span className="text-sm font-semibold text-charcoal">{field.label}</span>
            {field.name === "propertyAddress" ? (
              <textarea
                name={field.name}
                value={values[field.name]}
                onChange={onChange}
                placeholder={field.placeholder}
                rows={3}
                className="min-h-[96px] rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-charcoal outline-none transition focus:border-ember focus:bg-white"
              />
            ) : (
              <input
                type={field.type || "text"}
                name={field.name}
                value={values[field.name]}
                onChange={onChange}
                placeholder={field.placeholder}
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-charcoal outline-none transition focus:border-ember focus:bg-white"
              />
            )}
          </label>
        ))}
      </div>

      <div className="mt-5 rounded-[24px] border border-stone-200 bg-stone-50 px-5 py-4 text-sm leading-6 text-stone-600">
        Tip: use the exact client, address, and inspector wording you want to appear in the
        final report cover and site tables.
      </div>
    </div>
  );
}
