import { startTransition, useState } from "react";
import Dashboard from "./components/Dashboard";
import FileUpload from "./components/FileUpload";
import PDFGenerator from "./components/PDFGenerator";
import PropertyForm from "./components/PropertyForm";
import ReportPreview from "./components/ReportPreview";
import {
  progressMessages,
  sampleInspectionAnalysis,
  samplePropertyDetails,
  sampleThermalAnalysis,
} from "./data/sampleData";
import { hasGeminiProxy } from "./services/geminiApi";
import { analyzeInspectionDocument, generateDiagnosisReport } from "./services/reportGenerator";
import { analyzeThermalDocument } from "./services/thermalAnalyzer";
import { attachEvidenceImages } from "./utils/pdfEvidence";
import { exportReportPdf } from "./utils/pdfExport";
import { deriveDashboardMetrics } from "./utils/reportHelpers";

function WorkflowRail({ propertyDetails, thermalFile, inspectionFile, report }) {
  const steps = [
    {
      number: "01",
      title: "Property Details",
      state: propertyDetails.propertyAddress && propertyDetails.inspectorName ? "Done" : "In progress",
    },
    {
      number: "02",
      title: "Thermal Upload",
      state: thermalFile ? "Uploaded" : "Required",
    },
    {
      number: "03",
      title: "Checklist Upload",
      state: inspectionFile ? "Uploaded" : "Required",
    },
    {
      number: "04",
      title: "Generate DDR",
      state: report ? "Completed" : "Waiting",
    },
  ];

  return (
    <div className="rounded-[30px] border border-white/60 bg-charcoal p-5 text-white shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-300">
        Workflow
      </p>
      <div className="mt-4 space-y-3">
        {steps.map((step) => (
          <div
            key={step.number}
            className="workflow-step rounded-[22px] border border-white/10 bg-white/5 px-4 py-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
                  Step {step.number}
                </p>
                <p className="mt-2 text-base font-semibold text-white">{step.title}</p>
              </div>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-200">
                {step.state}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusCard({ hasLiveGemini }) {
  return (
    <div className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amberdeep">
        AI Status
      </p>
      <h3 className="mt-2 font-display text-2xl text-charcoal">Analysis Mode</h3>
        <div className="mt-4 rounded-[24px] border border-stone-200 bg-stone-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-charcoal">Gemini 2.5 Flash</p>
          <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-600">
            {hasLiveGemini ? "Live route" : "Configuration needed"}
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          {hasLiveGemini
            ? "Uploaded PDFs will be analyzed and merged into one structured DDR with evidence-backed observations."
            : "Configure Gemini before using live AI analysis. Both uploaded PDFs are required for report generation."}
        </p>
      </div>
    </div>
  );
}

function GenerationPanel({
  isGenerating,
  currentProgress,
  onGenerate,
  progressIndex,
  canGenerate,
}) {
  return (
    <div className="rounded-[30px] border border-stone-200 bg-white p-6 shadow-card">
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amberdeep">
            Step 4
          </p>
          <h2 className="mt-2 font-display text-2xl text-charcoal">
            Generate AI Diagnosis Report
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
            The system reads both PDFs, merges the evidence, removes duplicate points,
            handles missing or conflicting details, and prepares a clear DDR automatically.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {progressMessages.map((message, index) => {
            const state = isGenerating
              ? index < progressIndex
                ? "done"
                : index === progressIndex
                  ? "active"
                  : "waiting"
              : "waiting";

            return (
              <div
                key={message}
                className={`rounded-[22px] border px-4 py-4 transition ${
                  state === "active"
                    ? "border-ember bg-amber-50"
                    : state === "done"
                      ? "border-moss bg-lime-50"
                      : "border-stone-200 bg-stone-50"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  {state === "done" ? "Done" : state === "active" ? "Running" : "Queued"}
                </p>
                <p className="mt-2 text-sm font-semibold text-charcoal">{message}</p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-4 rounded-[26px] border border-stone-200 bg-gradient-to-r from-charcoal to-stone-900 p-5 text-white lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-300">
              Generate Output
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-300">
              {isGenerating
                ? currentProgress || "Preparing diagnosis..."
                : "Run the end-to-end workflow when your input details and PDFs are ready."}
            </p>
          </div>
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating || !canGenerate}
            className="inline-flex min-w-[260px] items-center justify-center rounded-full bg-gradient-to-r from-amberdeep to-ember px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? currentProgress || "Generating..." : "Generate AI Diagnosis Report"}
          </button>
        </div>

        {!canGenerate && !isGenerating ? (
          <div className="rounded-[22px] border border-stone-200 bg-stone-50 px-4 py-4 text-sm leading-6 text-stone-600">
            Upload both PDFs first. The generator is locked until the Thermal Images PDF and
            Inspection Checklist PDF are attached.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function HeroMetric({ label, value }) {
  return (
    <div className="rounded-[24px] border border-white/12 bg-white/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">{label}</p>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

export default function App() {
  const [propertyDetails, setPropertyDetails] = useState(samplePropertyDetails);
  const [thermalFile, setThermalFile] = useState(null);
  const [inspectionFile, setInspectionFile] = useState(null);
  const [thermalData, setThermalData] = useState(sampleThermalAnalysis);
  const [inspectionData, setInspectionData] = useState(sampleInspectionAnalysis);
  const [report, setReport] = useState(null);
  const [currentProgress, setCurrentProgress] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const dashboardMetrics = deriveDashboardMetrics({ report, thermalData, inspectionData });
  const hasLiveGemini = hasGeminiProxy();
  const progressIndex = progressMessages.indexOf(currentProgress);
  const canGenerate = Boolean(thermalFile && inspectionFile);

  function handlePropertyChange(event) {
    const { name, value } = event.target;
    setPropertyDetails((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function runProgressStep(message, task) {
    setCurrentProgress(message);
    await new Promise((resolve) => window.setTimeout(resolve, 280));
    return task();
  }

  async function handleGenerateReport() {
    if (!canGenerate) {
      setError("Upload both required PDFs before generating the AI diagnosis report.");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const analyzedThermal = await runProgressStep(progressMessages[0], () =>
        analyzeThermalDocument({ file: thermalFile, propertyDetails }),
      );

      const analyzedInspection = await runProgressStep(progressMessages[1], () =>
        analyzeInspectionDocument({ file: inspectionFile, propertyDetails }),
      );

      const generatedReport = await runProgressStep(progressMessages[2], () =>
        generateDiagnosisReport({
          propertyDetails,
          thermalData: analyzedThermal,
          inspectionData: analyzedInspection,
        }),
      );

      const reportWithEvidence = await runProgressStep(progressMessages[3], () =>
        attachEvidenceImages({
          report: generatedReport,
          thermalFile,
          inspectionFile,
        }),
      );

      startTransition(() => {
        setThermalData(analyzedThermal);
        setInspectionData(analyzedInspection);
        setReport(reportWithEvidence);
      });
    } catch (generationError) {
      console.error(generationError);
      setError(generationError.message || "Unable to generate the DDR.");
    } finally {
      setCurrentProgress("");
      setIsGenerating(false);
    }
  }

  async function handleDownloadPdf() {
    if (!report) {
      return;
    }

    setIsDownloading(true);
    setError("");

    try {
      await exportReportPdf({
        report,
        propertyDetails,
        fileName: "urbanroof-detailed-diagnosis-report.pdf",
      });
    } catch (downloadError) {
      console.error(downloadError);
      setError(downloadError.message || "Unable to export PDF.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <main className="min-h-screen bg-transparent px-4 py-6 text-charcoal md:px-8">
      <div className="mx-auto max-w-[1500px]">
        <section className="overflow-hidden rounded-[38px] border border-white/60 bg-charcoal px-6 py-8 text-white shadow-card md:px-10 md:py-10">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_360px] xl:items-end">
            <div className="relative">
              <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-amberdeep/15 blur-3xl" />
              <div className="absolute bottom-0 right-20 h-48 w-48 rounded-full bg-moss/10 blur-3xl" />
              <div className="relative max-w-3xl">
                <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-stone-300">
                  UrbanRoof | Mumbai & Pune
                </div>
                <h1 className="mt-6 font-display text-4xl leading-tight md:text-6xl">
                  AI-powered DDR generation built around evidence, logic, and client clarity.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-stone-300">
                  Upload the thermal report and inspection report, let the system connect
                  both documents, and export a structured diagnosis that is easier for a
                  client to understand and easier for a reviewer to trust.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
              <HeroMetric label="Delivery" value="DDR + image evidence" />
              <HeroMetric label="Inputs" value="2 PDFs + site details" />
              <HeroMetric label="Focus" value="Accuracy over fluff" />
            </div>
          </div>
        </section>

        <section className="app-grid mt-6 grid gap-6 xl:grid-cols-[520px_minmax(0,1fr)]">
          <div className="sticky-rail space-y-6">
            <WorkflowRail
              propertyDetails={propertyDetails}
              thermalFile={thermalFile}
              inspectionFile={inspectionFile}
              report={report}
            />

            <StatusCard hasLiveGemini={hasLiveGemini} />

            <PropertyForm values={propertyDetails} onChange={handlePropertyChange} />

            <FileUpload
              title="Thermal Images PDF"
              step="2"
              description="Upload the thermal inspection PDF that contains the thermography captures and temperature references."
              file={thermalFile}
              onFileSelect={setThermalFile}
              accent="amber"
              required
            />

            <FileUpload
              title="Inspection Checklist PDF"
              step="3"
              description="Upload the inspection checklist or summary PDF that contains the impacted areas, exposed zones, and checklist responses."
              file={inspectionFile}
              onFileSelect={setInspectionFile}
              accent="moss"
              required
            />

            <GenerationPanel
              isGenerating={isGenerating}
              currentProgress={currentProgress}
              onGenerate={handleGenerateReport}
              progressIndex={progressIndex}
              canGenerate={canGenerate}
            />

            {error ? (
              <div className="rounded-[28px] border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-700 shadow-card">
                {error}
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <div className="rounded-[30px] border border-white/60 bg-white/90 p-6 shadow-card backdrop-blur">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amberdeep">
                    Report Workspace
                  </p>
                  <h2 className="mt-2 font-display text-3xl text-charcoal">
                    Preview the generated diagnosis
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
                    This area becomes the client-facing DDR. Review the merged findings,
                    missing details, conflicts, and supporting images before exporting.
                  </p>
                </div>

                {report ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
                      Step 6
                    </span>
                    <PDFGenerator
                      onDownload={handleDownloadPdf}
                      disabled={isDownloading}
                      loading={isDownloading}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            {report ? (
              <>
                <Dashboard metrics={dashboardMetrics} />
                <div>
                  <ReportPreview report={report} propertyDetails={propertyDetails} />
                </div>
              </>
            ) : (
              <div className="rounded-[36px] border border-white/60 bg-white/90 p-8 shadow-card">
                <div className="grid gap-6 xl:grid-cols-[1fr_300px] xl:items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amberdeep">
                      Waiting for report
                    </p>
                    <h3 className="mt-3 font-display text-4xl text-charcoal">
                      Your DDR preview will appear here after generation.
                    </h3>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
                      The generated report will include a property issue summary, area-wise
                      observations, probable root causes, severity reasoning, recommended
                      actions, additional notes, missing information, conflicts, and image
                      evidence in an export-ready format.
                    </p>
                  </div>

                  <div className="rounded-[28px] border border-stone-200 bg-canvas p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-charcoal">
                      What you will get
                    </p>
                    <div className="mt-4 space-y-3">
                      {[
                        "Property issue summary and area-wise observations",
                        "Root cause analysis with severity reasoning",
                        "Recommended actions with supporting images",
                        "Explicit missing information and conflict notes",
                      ].map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm leading-6 text-stone-700"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
