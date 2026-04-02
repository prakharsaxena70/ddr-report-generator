import { toTitleCase } from "../utils/reportHelpers";

export default function Dashboard({ metrics }) {
  const cards = [
    {
      label: "Impacted Areas",
      value: metrics.impactedAreas,
      tone: "from-white to-stone-50",
    },
    {
      label: "Thermal Anomalies",
      value: metrics.anomaliesDetected,
      tone: "from-amber-50 to-orange-50",
    },
    {
      label: "Health Score",
      value: `${metrics.healthScore}%`,
      tone: "from-lime-50 to-white",
    },
  ];

  return (
    <div className="rounded-[30px] border border-stone-200 bg-white p-6 shadow-card">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amberdeep">
            Step 7
          </p>
          <h3 className="mt-2 font-display text-2xl text-charcoal">Diagnosis Dashboard</h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
            Review severity, scope, and property health before you export the finished DDR.
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-canvas px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal">
          Severity snapshot
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-[24px] border border-stone-200 bg-gradient-to-br p-5 ${card.tone}`}
          >
            <p className="text-sm text-stone-600">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-charcoal">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[24px] border border-stone-200 bg-stone-50 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-charcoal">Property Health Score</p>
          <p className="text-sm font-semibold text-charcoal">{metrics.healthScore}%</p>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-gradient-to-r from-moss to-ember"
            style={{ width: `${Math.max(0, Math.min(metrics.healthScore, 100))}%` }}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {Object.entries(metrics.severityBreakdown).map(([key, value]) => (
          <div
            key={key}
            className="rounded-[22px] border border-stone-200 bg-stone-50 px-4 py-4"
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
