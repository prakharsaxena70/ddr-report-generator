import { formatLongDate, toTitleCase } from "../utils/reportHelpers";

function chunkArray(items, chunkSize) {
  const chunks = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

function PageFrame({ children, pageNumber, totalPages, showHeader = true }) {
  return (
    <article className="report-page" data-report-page="true">
      {showHeader ? (
        <>
          <header className="bg-charcoal px-10 pb-6 pt-8 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-stone-300">
                  Detailed Diagnostic Report
                </p>
                <h2 className="mt-3 font-display text-3xl text-white">UrbanRoof</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm">
                AI-Generated DDR
              </div>
            </div>
          </header>
          <div className="brand-rule" />
        </>
      ) : null}

      <div className={`${showHeader ? "px-10 py-8" : "p-0"}`}>{children}</div>

      <footer className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-stone-200 bg-white px-10 py-4 text-xs text-stone-500">
        <span>www.urbanroof.in | UrbanRoof Private Limited</span>
        <span>
          Page {pageNumber} of {totalPages}
        </span>
      </footer>
    </article>
  );
}

function SectionHeading({ index, title }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amberdeep">
        {index}
      </p>
      <h3 className="mt-1 text-2xl font-bold text-charcoal">{title}</h3>
      <div className="mt-3 h-1.5 w-28 rounded-full bg-moss" />
    </div>
  );
}

function InfoTable({ rows }) {
  return (
    <table className="w-full border-collapse text-left text-sm">
      <tbody>
        {rows.map((row, index) => (
          <tr key={`${row[0]}-${index}`} className={index % 2 === 0 ? "bg-stone-50" : "bg-white"}>
            <td className="table-cell w-[34%] font-semibold text-charcoal">{row[0]}</td>
            <td className="table-cell text-stone-700">{row[1]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ObservationCard({ item, isPreparingEvidence = false }) {
  const evidenceImages = Array.isArray(item.evidenceImages) ? item.evidenceImages : [];
  const hasPendingEvidence = isPreparingEvidence && (
    (Array.isArray(item?.evidenceRefs?.thermalPages) && item.evidenceRefs.thermalPages.length) ||
    (Array.isArray(item?.evidenceRefs?.inspectionPages) && item.evidenceRefs.inspectionPages.length) ||
    (Array.isArray(item?.evidenceRefs?.thermalImageIds) && item.evidenceRefs.thermalImageIds.length)
  );

  return (
    <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amberdeep">
            Area
          </p>
          <h4 className="mt-2 text-2xl font-bold text-charcoal">{item.area}</h4>
        </div>
        <div className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal">
          {toTitleCase(item.severityAssessment.level)}
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="rounded-[22px] border border-stone-200 bg-stone-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Observation
          </p>
          <p className="mt-2 text-sm leading-7 text-stone-700">{item.observation}</p>
        </div>
        <div className="rounded-[22px] border border-stone-200 bg-stone-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Probable Root Cause
          </p>
          <p className="mt-2 text-sm leading-7 text-stone-700">{item.probableRootCause}</p>
        </div>
      </div>

      <div className="mt-5 rounded-[22px] border border-stone-200 bg-canvas p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          Severity Assessment With Reasoning
        </p>
        <p className="mt-2 text-sm leading-7 text-stone-700">{item.severityAssessment.reasoning}</p>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="rounded-[22px] border border-stone-200 bg-stone-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Recommended Actions
          </p>
          <ul className="mt-2 ml-5 space-y-2 text-sm leading-7 text-stone-700">
            {item.recommendedActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-[22px] border border-stone-200 bg-stone-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Additional Notes
          </p>
          <ul className="mt-2 ml-5 space-y-2 text-sm leading-7 text-stone-700">
            {item.additionalNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="rounded-[22px] border border-stone-200 bg-rose-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Missing Or Unclear Information
          </p>
          <ul className="mt-2 ml-5 space-y-2 text-sm leading-7 text-stone-700">
            {item.missingOrUnclearInformation.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-[22px] border border-stone-200 bg-sky-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Conflicts
          </p>
          <ul className="mt-2 ml-5 space-y-2 text-sm leading-7 text-stone-700">
            {item.conflicts.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          Supporting Images
        </p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {evidenceImages.length ? (
            evidenceImages.map((image) => (
              <div
                key={`${item.area}-${image.kind}-${image.pageNumber}`}
                className="overflow-hidden rounded-[22px] border border-stone-200 bg-stone-50"
              >
                {image.src ? (
                  <img
                    src={image.src}
                    alt={image.label}
                    className="h-48 w-full object-cover object-top"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-stone-100 px-4 text-sm text-stone-500">
                    Image Not Available
                  </div>
                )}
                <div className="border-t border-stone-200 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
                  {image.label}
                </div>
              </div>
            ))
          ) : hasPendingEvidence ? (
            <div className="rounded-[22px] border border-dashed border-amber-300 bg-amber-50 px-4 py-8 text-sm text-amber-700">
              Preparing supporting images...
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-sm text-stone-500">
              Image Not Available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryTable({ title, headers, rows }) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-amberdeep">
        {title}
      </p>
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="bg-charcoal text-white">
            {headers.map((header) => (
              <th key={header} className="table-cell font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${title}-${index}`} className={index % 2 === 0 ? "bg-stone-50" : "bg-white"}>
              {row.map((cell, cellIndex) => (
                <td key={`${title}-${index}-${cellIndex}`} className="table-cell text-stone-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ReportPreview({ report, propertyDetails, isPreparingEvidence = false }) {
  const observationChunks = chunkArray(report.areaWiseObservations || [], 2);
  const totalPages = 3 + observationChunks.length;

  return (
    <div id="report-preview" className="report-shell rounded-[36px] border border-white/60 p-4 md:p-6">
      <PageFrame pageNumber={1} totalPages={totalPages} showHeader={false}>
        <div className="relative flex min-h-[1123px] flex-col overflow-hidden bg-charcoal text-white">
          <div className="absolute inset-0 bg-brand-grid bg-[size:48px_48px] opacity-20" />
          <div className="absolute -right-20 top-14 h-72 w-72 rounded-full bg-amberdeep/20 blur-3xl" />
          <div className="absolute -left-20 bottom-14 h-80 w-80 rounded-full bg-moss/20 blur-3xl" />

          <div className="relative px-12 pb-16 pt-14">
            <div className="inline-flex rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-stone-300">
              UrbanRoof Private Limited
            </div>
            <h1 className="mt-10 max-w-3xl font-display text-6xl leading-none text-white">
              Detailed Diagnostic Report
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-300">
              AI-assisted building diagnosis that merges inspection findings and thermal
              evidence into a clear, client-friendly DDR.
            </p>
          </div>

          <div className="relative mt-auto rounded-t-[40px] bg-canvas/95 px-12 py-10 text-charcoal">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amberdeep">
                  Property Address
                </p>
                <p className="mt-2 text-lg font-semibold leading-7">
                  {propertyDetails.propertyAddress}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amberdeep">
                    Inspector
                  </p>
                  <p className="mt-2 font-semibold">{propertyDetails.inspectorName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amberdeep">
                    Inspection Date
                  </p>
                  <p className="mt-2 font-semibold">
                    {formatLongDate(propertyDetails.inspectionDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amberdeep">
                    Property Type
                  </p>
                  <p className="mt-2 font-semibold">{propertyDetails.propertyType}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amberdeep">
                    Floors / Property Age
                  </p>
                  <p className="mt-2 font-semibold">{propertyDetails.floors} floors · {propertyDetails.propertyAge} yrs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageFrame>

      <PageFrame pageNumber={2} totalPages={totalPages}>
        <SectionHeading index="Section 1" title="Property Issue Summary" />
        <div className="rounded-[28px] border border-stone-200 bg-stone-50 p-6">
          <p className="text-lg font-semibold text-charcoal">{report.propertyIssueSummary.headline}</p>
          <p className="mt-4 text-sm leading-7 text-stone-700">{report.propertyIssueSummary.overview}</p>
          <ul className="mt-5 ml-5 space-y-2 text-sm leading-7 text-stone-700">
            {report.propertyIssueSummary.keyFindings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Property Details</p>
          <InfoTable
            rows={[
              ["Property Address", propertyDetails.propertyAddress],
              ["Inspector", propertyDetails.inspectorName],
              ["Inspection Date", formatLongDate(propertyDetails.inspectionDate)],
              ["Property Type", propertyDetails.propertyType],
              ["Floors", propertyDetails.floors],
              ["Property Age", `${propertyDetails.propertyAge} years`],
            ]}
          />
        </div>
      </PageFrame>

      {observationChunks.map((chunk, index) => (
        <PageFrame key={`observation-page-${index + 1}`} pageNumber={3 + index} totalPages={totalPages}>
          <SectionHeading
            index="Section 2"
            title={`Area-wise Observations${observationChunks.length > 1 ? ` (${index + 1}/${observationChunks.length})` : ""}`}
          />
          <div className="space-y-6">
            {chunk.map((item) => (
              <ObservationCard
                key={item.area}
                item={item}
                isPreparingEvidence={isPreparingEvidence}
              />
            ))}
          </div>
        </PageFrame>
      ))}

      <PageFrame pageNumber={totalPages - 1} totalPages={totalPages}>
        <SectionHeading index="Section 3" title="Probable Root Cause" />
        <SummaryTable
          title="Root Cause Summary"
          headers={["Area", "Probable Root Cause", "Supporting Evidence"]}
          rows={report.probableRootCause.map((item) => [item.area, item.cause, item.supportingEvidence])}
        />

        <div className="mt-8">
          <SectionHeading index="Section 4" title="Severity Assessment" />
          <SummaryTable
            title=""
            headers={["Area", "Severity", "Reasoning"]}
            rows={report.severityAssessment.map((item) => [
              item.area,
              toTitleCase(item.severity),
              item.reasoning,
            ])}
          />
        </div>

        <div className="mt-8">
          <SectionHeading index="Section 5" title="Recommended Actions" />
          <SummaryTable
            title=""
            headers={["Area", "Action", "Priority", "Reasoning"]}
            rows={report.recommendedActions.map((item) => [
              item.area,
              item.action,
              item.priority,
              item.reasoning,
            ])}
          />
        </div>
      </PageFrame>

      <PageFrame pageNumber={totalPages} totalPages={totalPages}>
        <SectionHeading index="Section 6" title="Additional Notes" />
        <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5">
          <ul className="ml-5 space-y-2 text-sm leading-7 text-stone-700">
            {report.additionalNotes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          <SectionHeading index="Section 7" title="Missing or Unclear Information" />
          <div className="rounded-[24px] border border-stone-200 bg-rose-50/60 p-5">
            <ul className="ml-5 space-y-2 text-sm leading-7 text-stone-700">
              {report.missingOrUnclearInformation.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Conflicting Details</p>
          <div className="rounded-[24px] border border-stone-200 bg-sky-50/60 p-5">
            <ul className="ml-5 space-y-2 text-sm leading-7 text-stone-700">
              {report.conflicts.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </PageFrame>
    </div>
  );
}
