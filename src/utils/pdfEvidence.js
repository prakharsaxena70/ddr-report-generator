let pdfjsModulePromise;

async function getPdfJs() {
  if (!pdfjsModulePromise) {
    pdfjsModulePromise = Promise.all([
      import("pdfjs-dist/legacy/build/pdf.mjs"),
      import("pdfjs-dist/legacy/build/pdf.worker.mjs?url"),
    ]).then(([pdfjs, worker]) => {
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjs;
    });
  }

  return pdfjsModulePromise;
}

async function fileToUint8Array(file) {
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

function normalizePages(pageNumbers = []) {
  return [...new Set((pageNumbers || []).map(Number).filter((page) => page > 0))].sort(
    (left, right) => left - right,
  );
}

async function renderPages({ file, pageNumbers, scale = 1 }) {
  if (!file || !pageNumbers.length) {
    return {};
  }

  const { getDocument } = await getPdfJs();
  const bytes = await fileToUint8Array(file);
  const pdf = await getDocument({ data: bytes }).promise;
  const rendered = {};

  for (const pageNumber of normalizePages(pageNumbers)) {
    if (pageNumber > pdf.numPages) {
      continue;
    }

    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    await page.render({ canvasContext: context, viewport }).promise;
    rendered[pageNumber] = canvas.toDataURL("image/jpeg", 0.82);
  }

  return rendered;
}

export async function attachEvidenceImages({ report, thermalFile, inspectionFile }) {
  if (!report?.areaWiseObservations?.length) {
    return report;
  }

  const thermalPages = normalizePages(
    report.areaWiseObservations.flatMap(
      (item) => item?.evidenceRefs?.thermalPages?.slice(0, 2) || [],
    ),
  );
  const inspectionPages = normalizePages(
    report.areaWiseObservations.flatMap(
      (item) => item?.evidenceRefs?.inspectionPages?.slice(0, 2) || [],
    ),
  );

  const [thermalImages, inspectionImages] = await Promise.all([
    renderPages({ file: thermalFile, pageNumbers: thermalPages, scale: 0.75 }),
    renderPages({ file: inspectionFile, pageNumbers: inspectionPages, scale: 0.75 }),
  ]);

  return {
    ...report,
    areaWiseObservations: report.areaWiseObservations.map((item) => {
      const thermalRefs = (item?.evidenceRefs?.thermalPages || []).slice(0, 2).map((page) => ({
        kind: "thermal",
        pageNumber: page,
        label: `Thermal Report Page ${page}`,
        src: thermalImages[page] || null,
      }));
      const inspectionRefs = (item?.evidenceRefs?.inspectionPages || []).slice(0, 2).map(
        (page) => ({
          kind: "inspection",
          pageNumber: page,
          label: `Inspection Report Page ${page}`,
          src: inspectionImages[page] || null,
        }),
      );

      const evidenceImages = [...thermalRefs, ...inspectionRefs];

      return {
        ...item,
        evidenceImages,
      };
    }),
  };
}
