# UrbanRoof AI-Powered Property Diagnosis Report Generator

A production-ready React application for UrbanRoof that turns thermal-inspection PDFs and building checklist inputs into a branded Detailed Diagnosis Report (DDR).

## What it does

- Accepts property metadata, a thermal-images PDF, and an inspection/checklist PDF
- Sends PDFs to Google Gemini 2.5 Flash through a server-side proxy endpoint
- Uses UrbanRoof-specific prompts for:
  - thermal analysis
  - inspection form extraction
  - full DDR generation
- Cross-correlates thermal anomalies with inspection findings
- Renders a structured DDR preview in UrbanRoof styling
- Exports the preview to PDF using `jsPDF`
- Includes bundled sample-output assets as reference files, while live report generation requires both uploaded PDFs

## Tech stack

- React + Vite
- Tailwind CSS
- Google Gemini 2.5 Flash via Vercel serverless proxy
- jsPDF for PDF export

## Repo structure

```text
/urbanroof-ai-diagnosis
├── README.md
├── api/
│   └── gemini.js
├── single-artifact/
│   └── UrbanRoofDiagnosisArtifact.jsx
├── sample-output/
│   ├── sample-generated-report.pdf
│   └── sample-generated-report.json
├── scripts/
│   └── generateSampleReport.mjs
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
│       ├── pdfExport.js
│       └── reportHelpers.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env.local` if you want local live Gemini analysis:

```bash
VITE_GEMINI_PROXY_URL=http://localhost:3000/api/gemini
VITE_GEMINI_MODEL=gemini-2.5-flash
VITE_GEMINI_API_KEY=your_public_browser_key_here
GEMINI_API_KEY=your_server_side_key_here
```

For Vercel production, set `VITE_GEMINI_API_KEY` so the browser can call Gemini directly for PDF analysis. This avoids Vercel request-size limits and Gemini resumable-upload CORS restrictions. Keep `GEMINI_API_KEY` as the server-side fallback secret for non-browser paths. `VITE_GEMINI_PROXY_URL` is optional in production.

3. Start the app:

```bash
npm run dev
```

4. Build for deployment:

```bash
npm run build
```

## Gemini request shape

The app sends uploaded PDFs to Gemini using inline PDF data and targets `gemini-2.5-flash`. This follows Google's official Gemini documentation for document understanding and text generation:

- [Gemini API overview](https://ai.google.dev/gemini-api/docs)
- [Gemini document processing](https://ai.google.dev/gemini-api/docs/document-processing)
- [Gemini text generation](https://ai.google.dev/gemini-api/docs/text-generation)
- [Gemini files API reference](https://ai.google.dev/api/files)

## UrbanRoof prompt logic

The exact assignment prompts are implemented in [src/services/geminiApi.js](/C:/Users/ASUS/OneDrive/Desktop/DDR%20GENERATOR/src/services/geminiApi.js):

- `THERMAL_ANALYSIS_PROMPT`
- `INSPECTION_ANALYSIS_PROMPT`
- `REPORT_GENERATION_PROMPT`

## Sample case behavior

The repository includes bundled sample data and reference outputs based on the assignment:

- 30 thermal image IDs from `RB02377X` to `RB02406X`
- date `27/09/2022`
- emissivity `0.94`
- reflected temperature `23°C`
- inspection score `85.71%`
- 7 impacted areas
- bathroom tile joint hollowness in Flat 203 as the primary source
- external wall cracking, algae/fungus, and plumbing issues as secondary contributors

The live app now requires both uploaded PDFs before the AI diagnosis report can be generated.

## PDF output

The browser-exported PDF includes:

- branded cover page
- disclaimer
- table of contents
- introduction
- general information tables
- leakage summary
- negative-side and positive-side tables
- therapies and delayed-action risks
- thermal reference tables
- limitations and legal disclaimer

## Generate sample output files

To regenerate the included sample-output assets:

```bash
npm run generate:sample
```

This creates:

- `sample-output/sample-generated-report.pdf`
- `sample-output/sample-generated-report.json`

## Deployment notes

- Vercel is the cleanest target because the repo already includes `api/gemini.js`
- Keep `GEMINI_API_KEY` only in Vercel environment variables, not in frontend code
- Set `GEMINI_MODEL=gemini-2.5-flash` on Vercel if you want to override the default
- If you want richer PDF fidelity later, you can swap the browser export path for a Puppeteer-based server render without changing the report schema
