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
    <div className="rounded-[28px] border border-white/60 bg-white/85 p-6 shadow-card backdrop-blur">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amberdeep">
            Step 1
          </p>
          <h2 className="mt-2 font-display text-2xl text-charcoal">
            Property Details
          </h2>
        </div>
        <div className="rounded-full bg-canvas px-4 py-2 text-xs font-semibold text-charcoal">
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
            <input
              type={field.type || "text"}
              name={field.name}
              value={values[field.name]}
              onChange={onChange}
              placeholder={field.placeholder}
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-charcoal outline-none transition focus:border-ember focus:bg-white"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
