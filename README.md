# UrbanRoof AI-Powered Property Diagnosis Report Generator

A production-ready React application for UrbanRoof that turns thermal-inspection PDFs and building checklist inputs into a branded Detailed Diagnosis Report (DDR).

## What it does

- Accepts property metadata, a thermal-images PDF, and an inspection/checklist PDF
- Sends PDFs to Anthropic Claude using `document` content blocks through a proxy endpoint
- Uses UrbanRoof-specific prompts for:
  - thermal analysis
  - inspection form extraction
  - full DDR generation
- Cross-correlates thermal anomalies with inspection findings
- Renders a structured DDR preview in UrbanRoof styling
- Exports the preview to PDF using `html2canvas` + `jsPDF`
- Includes a bundled sample case based on the supplied UrbanRoof brief so the app still runs without live PDFs or API credentials

## Tech stack

- React + Vite
- Tailwind CSS
- Anthropic Claude API via proxy
- jsPDF + html2canvas for PDF export

## Repo structure

```text
/urbanroof-ai-diagnosis
├── README.md
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
│   │   ├── claudeApi.js
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

2. Configure environment variables in `.env.local`:

```bash
VITE_ANTHROPIC_PROXY_URL=https://your-proxy.example.com/v1/messages
VITE_ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

`VITE_ANTHROPIC_PROXY_URL` should point to your proxy or serverless function that securely injects the Anthropic API key before forwarding the request to the Anthropic Messages API.

3. Start the app:

```bash
npm run dev
```

4. Build for deployment:

```bash
npm run build
```

## Anthropic request shape

The app sends uploaded PDFs to Claude using the supported `document` content block pattern and targets `claude-sonnet-4-20250514`. This matches Anthropic’s official model list and PDF-support documentation:

- [Anthropic models overview](https://docs.anthropic.com/en/docs/about-claude/models/all-models)
- [Anthropic PDF support](https://platform.claude.com/docs/en/build-with-claude/pdf-support)

## UrbanRoof prompt logic

The exact assignment prompts are implemented in [src/services/claudeApi.js](/C:/Users/ASUS/OneDrive/Desktop/DDR%20GENERATOR/src/services/claudeApi.js):

- `THERMAL_ANALYSIS_PROMPT`
- `INSPECTION_ANALYSIS_PROMPT`
- `REPORT_GENERATION_PROMPT`

## Sample case behavior

If no PDF is uploaded, or if the Anthropic proxy is not configured, the app automatically uses bundled sample data based on the assignment:

- 30 thermal image IDs from `RB02377X` to `RB02406X`
- date `27/09/2022`
- emissivity `0.94`
- reflected temperature `23°C`
- inspection score `85.71%`
- 7 impacted areas
- bathroom tile joint hollowness in Flat 203 as the primary source
- external wall cracking, algae/fungus, and plumbing issues as secondary contributors

This lets you demo the entire workflow immediately.

## PDF output

The browser-exported PDF is created from the styled report preview and includes:

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

- Vercel and Netlify are both suitable for hosting the frontend
- the Anthropic API key must stay behind a proxy/serverless function
- if you want richer PDF fidelity later, you can swap the browser export path for a Puppeteer-based server render without changing the report schema
