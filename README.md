# UrbanRoof AI DDR Generator

A React + Vite application for UrbanRoof that reads an inspection report PDF and a thermal report PDF, merges the findings with AI, and produces a client-friendly Main DDR (Detailed Diagnostic Report).

## Assignment Fit

This project is aligned to the UrbanRoof AI Generalist assignment requirements:

- reads both source documents
- extracts relevant observations
- merges thermal + inspection findings logically
- avoids duplicate-style repetition through normalized report assembly
- handles missing details with `Not Available`
- surfaces conflicting details explicitly
- places relevant source-document evidence images under area-wise observations
- exports the final DDR as a downloadable PDF

## Current DDR Output Structure

The generated report now contains:

1. `Property Issue Summary`
2. `Area-wise Observations`
3. `Probable Root Cause`
4. `Severity Assessment (with reasoning)`
5. `Recommended Actions`
6. `Additional Notes`
7. `Missing or Unclear Information`
8. `Conflicting Details`

## What The App Does

- accepts property details
- requires upload of:
  - thermal report PDF
  - inspection/checklist report PDF
- analyzes both PDFs with Gemini 2.5 Flash
- normalizes extracted data into a structured report schema
- cross-links observations with evidence references
- renders a reviewable DDR preview
- exports the same DDR to PDF with branded formatting

## Tech Stack

- React + Vite
- Tailwind CSS
- Google Gemini 2.5 Flash
- jsPDF for export
- `pdfjs-dist` for client-side source PDF evidence rendering

## Important Implementation Notes

### AI logic

The AI prompt layer lives in:

- [src/services/geminiApi.js](/C:/Users/ASUS/OneDrive/Desktop/DDR%20GENERATOR/src/services/geminiApi.js)

The report assembly and safety logic lives in:

- [src/services/reportGenerator.js](/C:/Users/ASUS/OneDrive/Desktop/DDR%20GENERATOR/src/services/reportGenerator.js)

The thermal normalization logic lives in:

- [src/services/thermalAnalyzer.js](/C:/Users/ASUS/OneDrive/Desktop/DDR%20GENERATOR/src/services/thermalAnalyzer.js)

### Evidence images

Relevant source-document evidence is attached per area in:

- [src/utils/pdfEvidence.js](/C:/Users/ASUS/OneDrive/Desktop/DDR%20GENERATOR/src/utils/pdfEvidence.js)

Current behavior:

- the app first attempts direct image extraction from the source PDF pages tied to each observation
- if an embedded image cannot be extracted cleanly, it falls back to a page snapshot from the same source page
- if evidence cannot be produced, it shows `Image Not Available`

Note:

- this is designed to support similar inspection reports, not only the provided sample files
- evidence selection is heuristic and based on matched source page references from extracted observations

## Repo Structure

```text
/urbanroof-ai-diagnosis
├── README.md
├── api/
│   ├── gemini.js
│   ├── gemini-file.js
│   └── gemini-upload.js
├── sample-output/
│   ├── sample-generated-report.pdf
│   └── sample-generated-report.json
├── scripts/
│   └── generateSampleReport.mjs
├── server/
│   ├── geminiService.js
│   └── viteGeminiPlugin.js
├── single-artifact/
│   └── UrbanRoofDiagnosisArtifact.jsx
├── src/
│   ├── App.jsx
│   ├── components/
│   │   ├── Dashboard.jsx
│   │   ├── FileUpload.jsx
│   │   ├── PDFGenerator.jsx
│   │   ├── PropertyForm.jsx
│   │   └── ReportPreview.jsx
│   ├── data/
│   │   └── sampleData.js
│   ├── services/
│   │   ├── geminiApi.js
│   │   ├── reportGenerator.js
│   │   └── thermalAnalyzer.js
│   └── utils/
│       ├── json.js
│       ├── pdfEvidence.js
│       ├── pdfExport.js
│       └── reportHelpers.js
├── index.html
├── package.json
└── vite.config.js
```

## Local Setup

```bash
npm install
npm run dev
```

Optional environment variables:

```bash
VITE_GEMINI_MODEL=gemini-2.5-flash
VITE_GEMINI_API_KEY=your_browser_key
GEMINI_API_KEY=your_server_key
```

## Build

```bash
npm run build
```

## Generate Sample Output

```bash
npm run generate:sample
```

This writes:

- `sample-output/sample-generated-report.pdf`
- `sample-output/sample-generated-report.json`

## Honest Limitations

- evidence relevance is still guided by page-level matching and extracted references, so image placement is helpful but not perfect in every possible report layout
- final factual quality still depends on source PDF quality and Gemini extraction quality
- a human reviewer should still validate the final report before client delivery
- the sample-output generator is a lightweight artifact generator, not the same path as the live in-app export

## Deployment

The project is deployable on Vercel. The live app uses the same frontend workflow and PDF export flow present in the repo.
