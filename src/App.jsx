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
import { generateDiagnosisReport, analyzeInspectionDocument } from "./services/reportGenerator";
import { analyzeThermalDocument } from "./services/thermalAnalyzer";
import { exportReportPdf } from "./utils/pdfExport";
import { deriveDashboardMetrics } from "./utils/reportHelpers";

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
  const dashboardMetrics = deriveDashboardMetrics({ thermalData, inspectionData });

  function handlePropertyChange(event) {
    const { name, value } = event.target;
    setPropertyDetails((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function runProgressStep(message, task) {
    setCurrentProgress(message);
    await new Promise((resolve) => window.setTimeout(resolve, 300));
    return task();
  }

  async function handleGenerateReport() {
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

      await runProgressStep(progressMessages[3], async () => {
        startTransition(() => {
          setThermalData(analyzedThermal);
          setInspectionData(analyzedInspection);
          setReport(generatedReport);
        });
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
      <div className="mx-auto max-w-[1480px]">
        <section className="overflow-hidden rounded-[36px] border border-white/60 bg-charcoal px-6 py-8 text-white shadow-card md:px-10 md:py-10">
          <div className="flex flex-col gap-8">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-stone-300">
                UrbanRoof | Mumbai & Pune
              </div>
              <h1 className="mt-6 font-display text-4xl leading-tight md:text-6xl">
                Detailed diagnosis reports that turn thermal PDFs into action plans.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-stone-300">
                Upload inspection documents, run Gemini-powered thermal interpretation,
                cross-reference building observations, preview the final DDR, and export
                an UrbanRoof-branded PDF in one flow.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[520px_minmax(0,1fr)]">
          <div className="space-y-6">
            <PropertyForm values={propertyDetails} onChange={handlePropertyChange} />

            <FileUpload
              title="Thermal Images PDF"
              step="2"
              description="Upload Thermal_Images.pdf or use the bundled 30-image UrbanRoof case with Bosch GTC 400C sample readings."
              file={thermalFile}
              onFileSelect={setThermalFile}
            />

            <FileUpload
              title="Inspection Checklist PDF"
              step="3"
              description="Upload Sample_Report.pdf or use the bundled checklist findings for impacted and exposed areas."
              file={inspectionFile}
              onFileSelect={setInspectionFile}
            />

            <div className="rounded-[28px] border border-white/60 bg-white/85 p-6 shadow-card backdrop-blur">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amberdeep">
                    Step 4
                  </p>
                  <h2 className="mt-2 font-display text-2xl text-charcoal">
                    Generate AI Diagnosis Report
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
                    The app runs thermal analysis, extracts inspection findings, generates
                    the DDR narrative, and prepares a styled preview ready for PDF export.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="inline-flex min-w-[240px] items-center justify-center rounded-full bg-gradient-to-r from-amberdeep to-ember px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGenerating ? currentProgress || "Generating..." : "Generate AI Diagnosis Report"}
                </button>
              </div>

              <div className="mt-5 rounded-[24px] border border-stone-200 bg-stone-50 px-5 py-4 text-sm leading-6 text-stone-700">
                <p>
                  {hasGeminiProxy()
                    ? "Gemini analysis route configured. Uploaded PDFs will be analyzed through the server-side Gemini proxy."
                    : "No Gemini proxy detected. The app will still run end-to-end using the bundled UrbanRoof sample case and prompt structure."}
                </p>
              </div>

              {error ? (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
            </div>

            {report ? <Dashboard metrics={dashboardMetrics} /> : null}
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/60 bg-white/85 p-6 shadow-card backdrop-blur">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amberdeep">
                    Step 5
                  </p>
                  <h2 className="mt-2 font-display text-2xl text-charcoal">Preview Generated Report</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    The preview mirrors the DDR layout so the same structure is exported into PDF.
                  </p>
                </div>

                {report ? (
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-stone-500">
                      Step 6: export the finished DDR
                    </p>
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
              <div>
                <ReportPreview report={report} propertyDetails={propertyDetails} />
              </div>
            ) : (
              <div className="rounded-[36px] border border-dashed border-stone-300 bg-white/70 p-10 text-center shadow-card">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amberdeep">
                  Waiting for report
                </p>
                <h3 className="mt-3 font-display text-3xl text-charcoal">
                  Generate the diagnosis to see the UrbanRoof DDR preview
                </h3>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-stone-600">
                  The generated report will include the executive summary, leakage source
                  analysis, negative and positive side tables, therapies, thermal references,
                  limitations, and legal disclaimer in an exportable format.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
