import { toTitleCase } from "../utils/reportHelpers";

export default function Dashboard({ metrics }) {
  const cards = [
    {
      label: "Impacted Areas",
      value: metrics.impactedAreas,
      tone: "bg-white",
    },
    {
      label: "Thermal Anomalies",
      value: metrics.anomaliesDetected,
      tone: "bg-canvas",
    },
    {
      label: "Health Score",
      value: `${metrics.healthScore}%`,
      tone: "bg-white",
    },
  ];

  return (
    <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-card">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amberdeep">
            Step 7
          </p>
          <h3 className="mt-2 font-display text-2xl text-charcoal">Diagnosis Dashboard</h3>
        </div>
        <div className="rounded-full bg-charcoal px-4 py-2 text-xs font-semibold text-white">
          Severity snapshot
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-[24px] border border-stone-200 p-5 ${card.tone}`}>
            <p className="text-sm text-stone-600">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-charcoal">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {Object.entries(metrics.severityBreakdown).map(([key, value]) => (
          <div
            key={key}
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
              {toTitleCase(key)}
            </p>
            <p className="mt-2 text-2xl font-bold text-charcoal">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
