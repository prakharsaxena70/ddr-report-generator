import { buildTocEntries, formatLongDate, toTitleCase } from "../utils/reportHelpers";

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
                  Detailed Diagnosis Report
                </p>
                <h2 className="mt-3 font-display text-3xl text-white">UrbanRoof</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm">
                AI-Powered Property Diagnosis
              </div>
            </div>
          </header>
          <div className="brand-rule" />
        </>
      ) : null}

      <div className={`${showHeader ? "px-10 py-8" : "p-0"}`}>{children}</div>

      <footer className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-stone-200 bg-white px-10 py-4 text-xs text-stone-500">
        <span>www.urbanroof.in | UrbanRoof Private Limited</span>
        <span>Page {pageNumber} of {totalPages}</span>
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

function DataTable({ rows, headers }) {
  return (
    <table className="w-full border-collapse text-left text-sm">
      {headers ? (
        <thead>
          <tr className="bg-charcoal text-white">
            {headers.map((header) => (
              <th key={header} className="table-cell font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
      ) : null}
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={`${rowIndex}-${row[0]}`} className={rowIndex % 2 === 0 ? "bg-stone-50" : "bg-white"}>
            {row.map((cell, cellIndex) => (
              <td key={`${cellIndex}-${cell}`} className="table-cell">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CheckboxGrid({ checklistResponses }) {
  const entries = [
    { label: "WC / Bathroom", value: checklistResponses?.bathroom || {} },
    { label: "Balcony", value: checklistResponses?.balcony || {} },
    { label: "Terrace", value: checklistResponses?.terrace || {} },
    { label: "External Wall", value: checklistResponses?.externalWall || {} },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {entries.map((entry) => (
        <div key={entry.label} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <p className="font-semibold text-charcoal">
            {entry.value.selected ? "☒" : "☐"} {entry.label}
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-600">{entry.value.notes}</p>
        </div>
      ))}
    </div>
  );
}

export default function ReportPreview({ report, propertyDetails }) {
  const tocEntries = buildTocEntries();
  const thermalChunks = chunkArray(report.thermalReferences, 10);
  const totalPages = 7 + thermalChunks.length;

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
            <h1 className="mt-10 max-w-xl font-display text-6xl leading-none text-white">
              AI-Powered Property Diagnosis Report Generator
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-300">
              Detailed Diagnosis Report prepared using thermography, inspection checklist
              correlation, and structured building-health analysis.
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
                    Floors
                  </p>
                  <p className="mt-2 font-semibold">{propertyDetails.floors}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageFrame>

      <PageFrame pageNumber={2} totalPages={totalPages}>
        <SectionHeading index="Data & Information Disclaimer" title="Data Integrity and Use" />
        <div className="space-y-4 text-sm leading-7 text-stone-700">
          <p>
            This report is generated from the property details provided, uploaded PDF
            documents, and UrbanRoof&apos;s AI-assisted diagnosis workflow. Findings must be
            read in conjunction with the limitations stated in this report.
          </p>
          <p>
            Thermal signatures are interpreted as non-destructive indicators of moisture,
            dampness, seepage, or thermal bridging. They guide probable diagnosis but do not
            replace invasive verification where required.
          </p>
        </div>

        <div className="mt-10">
          <SectionHeading index="Executive Summary" title="Key Diagnosis Summary" />
          <div className="space-y-4 rounded-[28px] border border-stone-200 bg-stone-50 p-6">
            {report.executiveSummary.map((item) => (
              <p key={item} className="text-sm leading-7 text-stone-700">
                {item}
              </p>
            ))}
          </div>
        </div>
      </PageFrame>

      <PageFrame pageNumber={3} totalPages={totalPages}>
        <SectionHeading index="Table of Contents" title="Report Sections" />
        <ol className="toc-list ml-5 space-y-2 text-sm leading-7 text-stone-700">
          {tocEntries.map((entry) => (
            <li key={entry}>{entry}</li>
          ))}
        </ol>

        <div className="mt-8">
          <SectionHeading index="1" title="Introduction" />
          <div className="grid gap-5">
            <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5">
              <p className="font-semibold text-charcoal">Background</p>
              <p className="mt-2 text-sm leading-6 text-stone-700">
                {report.introduction.background}
              </p>
            </div>
            <div className="rounded-[24px] border border-stone-200 bg-white p-5">
              <p className="font-semibold text-charcoal">Objective</p>
              <p className="mt-2 text-sm leading-6 text-stone-700">
                {report.introduction.objective}
              </p>
            </div>
            <div className="rounded-[24px] border border-stone-200 bg-canvas p-5">
              <p className="font-semibold text-charcoal">Scope & Tools Used</p>
              <p className="mt-2 text-sm leading-6 text-stone-700">{report.introduction.scope}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {report.introduction.toolsUsed.map((tool) => (
                  <span key={tool} className="check-chip">
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageFrame>

      <PageFrame pageNumber={4} totalPages={totalPages}>
        <SectionHeading index="2" title="General Information" />
        <DataTable rows={report.generalInformation.clientTable} />
        <div className="mt-6">
          <DataTable rows={report.generalInformation.siteTable} />
        </div>

        <div className="mt-8">
          <SectionHeading index="3.1" title="Sources of Leakage Summary" />
          <DataTable
            headers={["Area", "Observed Finding", "Likely Cause", "Urgency"]}
            rows={report.leakageSummary.map((item) => [
              item.area,
              item.finding,
              item.likelyCause,
              item.urgency,
            ])}
          />
        </div>
      </PageFrame>

      <PageFrame pageNumber={5} totalPages={totalPages}>
        <SectionHeading index="3.2 - 3.9" title="Visual Observations and Checklist Inputs" />
        <CheckboxGrid checklistResponses={report.checklistResponses} />

        <div className="mt-8 grid gap-6">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-amberdeep">
              Negative Side Inputs
            </p>
            <DataTable
              headers={["Impacted Area", "Description", "Severity"]}
              rows={report.negativeSideInputs.map((item) => [
                item.area,
                item.description,
                toTitleCase(item.severity),
              ])}
            />
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-amberdeep">
              Positive Side Inputs
            </p>
            <DataTable
              headers={["Source Area", "Description", "Risk"]}
              rows={report.positiveSideInputs.map((item) => [
                item.area,
                item.description,
                toTitleCase(item.risk),
              ])}
            />
          </div>
        </div>
      </PageFrame>

      <PageFrame pageNumber={6} totalPages={totalPages}>
        <SectionHeading index="4.1 - 4.5" title="Analysis & Suggestions" />
        <div className="space-y-6">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-amberdeep">
              Actions Required & Suggested Therapies
            </p>
            <DataTable
              headers={["Action", "Suggested Therapy", "Priority", "Linked Areas"]}
              rows={report.therapies.map((item) => [
                item.action,
                item.therapy,
                item.priority,
                item.linkedAreas.join(", "),
              ])}
            />
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-amberdeep">
              Further Possibilities due to Delayed Action
            </p>
            <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5">
              <ul className="ml-5 space-y-2 text-sm leading-7 text-stone-700">
                {report.delayedActionRisks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-amberdeep">
              Summary Table
            </p>
            <DataTable
              headers={["Impacted Area", "Exposed Area", "Correlation"]}
              rows={report.summaryTable.map((item) => [
                item.impactedArea,
                item.exposedArea,
                item.link,
              ])}
            />
          </div>
        </div>
      </PageFrame>

      {thermalChunks.map((chunk, index) => (
        <PageFrame key={chunk[0].imageId} pageNumber={7 + index} totalPages={totalPages}>
          <SectionHeading
            index="4.4"
            title={`Thermal References for Negative Side Inputs${thermalChunks.length > 1 ? ` (${index + 1}/${thermalChunks.length})` : ""}`}
          />
          <DataTable
            headers={[
              "Image ID",
              "Location",
              "Hotspot",
              "Coldspot",
              "Emissivity",
              "Diagnosis / Pattern",
              "Severity",
            ]}
            rows={chunk.map((item) => [
              item.imageId,
              item.location,
              `${item.hotspot}°C`,
              `${item.coldspot}°C`,
              `${item.emissivity}`,
              `${item.diagnosis} ${item.thermalPattern}`,
              toTitleCase(item.severity),
            ])}
          />
        </PageFrame>
      ))}

      <PageFrame pageNumber={totalPages} totalPages={totalPages}>
        <SectionHeading index="4.5" title="Visual References for Positive Side Inputs" />
        <DataTable
          headers={["Source Area", "Description", "Risk"]}
          rows={report.visualReferences.map((item) => [
            item.area,
            item.description,
            toTitleCase(item.risk),
          ])}
        />

        <div className="mt-8">
          <SectionHeading index="5" title="Limitation and Precaution Note" />
          <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5">
            <ul className="ml-5 space-y-2 text-sm leading-7 text-stone-700">
              {report.limitations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 rounded-[24px] border border-charcoal bg-charcoal px-6 py-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amberdeep">
            Legal Disclaimer
          </p>
          <p className="mt-3 text-sm leading-7 text-stone-200">{report.legalDisclaimer}</p>
        </div>
      </PageFrame>
    </div>
  );
}
