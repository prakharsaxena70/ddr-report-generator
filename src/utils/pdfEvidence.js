let pdfjsModulePromise;
const PDF_OBJECT_TIMEOUT_MS = 600;
const OPERATOR_LIST_TIMEOUT_MS = 1200;
const EMBEDDED_EXTRACTION_TIMEOUT_MS = 1800;
const PAGE_RENDER_TIMEOUT_MS = 2500;
const PAGE_LOAD_TIMEOUT_MS = 1200;
const TOTAL_EVIDENCE_TIMEOUT_MS = 12000;

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

function withTimeout(promise, timeoutMs, fallbackValue = null) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      window.setTimeout(() => resolve(fallbackValue), timeoutMs);
    }),
  ]);
}

function ensureText(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizePages(pageNumbers = []) {
  return [...new Set((pageNumbers || []).map(Number).filter((page) => page > 0))].sort(
    (left, right) => left - right,
  );
}

function normalizeWords(value) {
  return ensureText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function keywordScore(source, target) {
  const sourceWords = normalizeWords(source);
  const targetWords = new Set(normalizeWords(target));
  return sourceWords.reduce(
    (score, word) => (targetWords.has(word) ? score + 1 : score),
    0,
  );
}

function collectObservationContext(observation = {}) {
  return [
    observation.area,
    observation.observation,
    observation.probableRootCause,
    ...(Array.isArray(observation.additionalNotes) ? observation.additionalNotes : []),
  ]
    .filter(Boolean)
    .join(" ");
}

function inferThermalPages(observation, thermalData = []) {
  const explicitPages = normalizePages(observation?.evidenceRefs?.thermalPages || []);
  if (explicitPages.length) {
    return explicitPages.slice(0, 2);
  }

  const thermalImageIds = Array.isArray(observation?.evidenceRefs?.thermalImageIds)
    ? observation.evidenceRefs.thermalImageIds
    : [];

  const pagesFromImageIds = normalizePages(
    thermalData
      .filter((entry) => thermalImageIds.includes(entry.imageId))
      .map((entry) => entry.sourcePage),
  );
  if (pagesFromImageIds.length) {
    return pagesFromImageIds.slice(0, 2);
  }

  const context = collectObservationContext(observation);
  const rankedMatches = thermalData
    .map((entry) => ({
      page: Number(entry.sourcePage) || 0,
      score: Math.max(
        keywordScore(observation?.area, `${entry.location} ${entry.suggestedArea}`),
        keywordScore(context, `${entry.location} ${entry.suggestedArea} ${entry.diagnosis} ${entry.thermalPattern}`),
      ),
      severity:
        { immediate: 3, moderate: 2, monitor: 1 }[
          ensureText(entry.severity, "monitor").toLowerCase()
        ] || 0,
    }))
    .filter((entry) => entry.page > 0 && entry.score > 0)
    .sort((left, right) => right.score - left.score || right.severity - left.severity);

  const inferredPages = normalizePages(rankedMatches.map((entry) => entry.page));
  return inferredPages.slice(0, 2);
}

function inferInspectionPages(observation, inspectionData = {}) {
  const explicitPages = normalizePages(observation?.evidenceRefs?.inspectionPages || []);
  if (explicitPages.length) {
    return explicitPages.slice(0, 2);
  }

  const context = collectObservationContext(observation);
  const impactedMatches = (inspectionData.impactedAreas || [])
    .map((entry) => ({
      pages: entry.sourcePages || [],
      score: Math.max(
        keywordScore(observation?.area, entry.area),
        keywordScore(context, `${entry.area} ${entry.description}`),
      ),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  const positiveMatches = (inspectionData.positiveSideInputs || [])
    .map((entry) => ({
      pages: entry.sourcePages || [],
      score: Math.max(
        keywordScore(observation?.probableRootCause, `${entry.area} ${entry.description}`),
        keywordScore(context, `${entry.area} ${entry.description}`),
      ),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  const summaryMatches = (inspectionData.summaryTable || [])
    .map((entry) => ({
      exposedArea: entry.exposedArea,
      impactedArea: entry.impactedArea,
      score: Math.max(
        keywordScore(observation?.area, entry.impactedArea),
        keywordScore(context, `${entry.impactedArea} ${entry.exposedArea} ${entry.link}`),
      ),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  const summaryPages = summaryMatches.flatMap((entry) => {
    const positiveMatch = (inspectionData.positiveSideInputs || []).find(
      (item) =>
        keywordScore(entry.exposedArea, item.area) > 0 ||
        keywordScore(entry.exposedArea, item.description) > 0,
    );
    return positiveMatch?.sourcePages || [];
  });

  return normalizePages([
    ...impactedMatches.flatMap((entry) => entry.pages),
    ...positiveMatches.flatMap((entry) => entry.pages),
    ...summaryPages,
  ]).slice(0, 2);
}

function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function rgbaFromRgb(data) {
  const rgba = new Uint8ClampedArray((data.length / 3) * 4);
  for (let sourceIndex = 0, targetIndex = 0; sourceIndex < data.length; sourceIndex += 3) {
    rgba[targetIndex] = data[sourceIndex];
    rgba[targetIndex + 1] = data[sourceIndex + 1];
    rgba[targetIndex + 2] = data[sourceIndex + 2];
    rgba[targetIndex + 3] = 255;
    targetIndex += 4;
  }
  return rgba;
}

function rgbaFromGrayscale1Bpp(data, width, height) {
  const rgba = new Uint8ClampedArray(width * height * 4);
  let pixelIndex = 0;

  for (let byteIndex = 0; byteIndex < data.length && pixelIndex < width * height; byteIndex += 1) {
    const byte = data[byteIndex];
    for (let bit = 7; bit >= 0 && pixelIndex < width * height; bit -= 1) {
      const value = ((byte >> bit) & 1) === 1 ? 0 : 255;
      const offset = pixelIndex * 4;
      rgba[offset] = value;
      rgba[offset + 1] = value;
      rgba[offset + 2] = value;
      rgba[offset + 3] = 255;
      pixelIndex += 1;
    }
  }

  return rgba;
}

function buildImageDataFromPdfObject(imgData, pdfjs) {
  if (!imgData?.width || !imgData?.height) {
    return null;
  }

  if (imgData.bitmap instanceof ImageBitmap) {
    return { kind: "bitmap", value: imgData.bitmap, width: imgData.width, height: imgData.height };
  }

  if (imgData instanceof ImageData) {
    return { kind: "imageData", value: imgData, width: imgData.width, height: imgData.height };
  }

  if (imgData?.data) {
    if (imgData.kind === pdfjs.ImageKind.RGBA_32BPP) {
      return {
        kind: "imageData",
        value: new ImageData(new Uint8ClampedArray(imgData.data), imgData.width, imgData.height),
        width: imgData.width,
        height: imgData.height,
      };
    }

    if (imgData.kind === pdfjs.ImageKind.RGB_24BPP) {
      return {
        kind: "imageData",
        value: new ImageData(rgbaFromRgb(imgData.data), imgData.width, imgData.height),
        width: imgData.width,
        height: imgData.height,
      };
    }

    if (imgData.kind === pdfjs.ImageKind.GRAYSCALE_1BPP) {
      return {
        kind: "imageData",
        value: new ImageData(
          rgbaFromGrayscale1Bpp(imgData.data, imgData.width, imgData.height),
          imgData.width,
          imgData.height,
        ),
        width: imgData.width,
        height: imgData.height,
      };
    }
  }

  return null;
}

function renderImageObjectToDataUrl(imageObject) {
  const canvas = createCanvas(imageObject.width, imageObject.height);
  const context = canvas.getContext("2d");

  if (imageObject.kind === "bitmap") {
    context.drawImage(imageObject.value, 0, 0, imageObject.width, imageObject.height);
  } else if (imageObject.kind === "imageData") {
    context.putImageData(imageObject.value, 0, 0);
  } else {
    return null;
  }

  return canvas.toDataURL("image/jpeg", 0.86);
}

function isUsefulEvidenceImage(imageObject) {
  const width = imageObject?.width || 0;
  const height = imageObject?.height || 0;
  const area = width * height;
  return width >= 120 && height >= 120 && area >= 25000;
}

function awaitPdfObject(objects, objectId) {
  return withTimeout(
    new Promise((resolve) => {
      try {
        if (objects.has(objectId)) {
          resolve(objects.get(objectId));
          return;
        }
        objects.get(objectId, (data) => resolve(data));
      } catch (error) {
        resolve(null);
      }
    }),
    PDF_OBJECT_TIMEOUT_MS,
    null,
  );
}

async function extractEmbeddedImagesFromPage(page, pdfjs) {
  const operatorList = await withTimeout(
    page.getOperatorList(),
    OPERATOR_LIST_TIMEOUT_MS,
    null,
  );
  if (!operatorList) {
    return [];
  }
  const refs = [];

  for (let index = 0; index < operatorList.fnArray.length; index += 1) {
    const fn = operatorList.fnArray[index];
    const args = operatorList.argsArray[index];

    if (fn === pdfjs.OPS.paintImageXObject || fn === pdfjs.OPS.paintJpegXObject) {
      refs.push({ type: "object", value: args[0] });
    } else if (fn === pdfjs.OPS.paintInlineImageXObject && args[0]) {
      refs.push({ type: "inline", value: args[0] });
    }
  }

  const extracted = [];

  for (const ref of refs.slice(0, 6)) {
    const rawObject =
      ref.type === "object" ? await awaitPdfObject(page.objs, ref.value) : ref.value;

    if (!rawObject) {
      continue;
    }

    const normalized = buildImageDataFromPdfObject(rawObject, pdfjs);
    if (!normalized || !isUsefulEvidenceImage(normalized)) {
      continue;
    }

    const src = renderImageObjectToDataUrl(normalized);
    if (!src) {
      continue;
    }

    extracted.push({
      src,
      width: normalized.width,
      height: normalized.height,
      area: normalized.width * normalized.height,
    });
  }

  return extracted
    .sort((left, right) => right.area - left.area)
    .slice(0, 2);
}

async function renderPageFallback(page, scale = 0.85) {
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const context = canvas.getContext("2d");

  await withTimeout(
    page.render({ canvasContext: context, viewport }).promise,
    PAGE_RENDER_TIMEOUT_MS,
    null,
  );
  return canvas.toDataURL("image/jpeg", 0.82);
}

async function extractEvidenceByPage({ file, pageNumbers, reportLabel }) {
  if (!file || !pageNumbers.length) {
    return {};
  }

  const pdfjs = await getPdfJs();
  const bytes = await fileToUint8Array(file);
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  const pageEntries = await Promise.all(
    normalizePages(pageNumbers).map(async (pageNumber) => {
      if (pageNumber > pdf.numPages) {
        return null;
      }

      try {
        const page = await withTimeout(pdf.getPage(pageNumber), PAGE_LOAD_TIMEOUT_MS, null);
        if (!page) {
          return null;
        }

        let embedded = [];

        try {
          embedded =
            (await withTimeout(
              extractEmbeddedImagesFromPage(page, pdfjs),
              EMBEDDED_EXTRACTION_TIMEOUT_MS,
              [],
            )) || [];
        } catch (embeddedError) {
          console.warn(
            `Embedded image extraction failed for ${reportLabel} page ${pageNumber}.`,
            embeddedError,
          );
        }

        if (embedded.length) {
          page.cleanup();
          return [
            pageNumber,
            embedded.map((item, index) => ({
              src: item.src,
              label: `${reportLabel} Extracted Image ${index + 1} (Page ${pageNumber})`,
            })),
          ];
        }

        const snapshot = await renderPageFallback(page, 0.6);
        page.cleanup();
        return [
          pageNumber,
          [
            {
              src: snapshot,
              label: `${reportLabel} Page Snapshot (${pageNumber})`,
            },
          ],
        ];
      } catch (pageError) {
        console.warn(`Evidence extraction failed for ${reportLabel} page ${pageNumber}.`, pageError);
        return null;
      }
    }),
  );

  await pdf.destroy();
  return Object.fromEntries(pageEntries.filter(Boolean));
}

export async function attachEvidenceImages({
  report,
  thermalFile,
  inspectionFile,
  thermalData = [],
  inspectionData = {},
}) {
  if (!report?.areaWiseObservations?.length) {
    return report;
  }

  const thermalPages = normalizePages(
    report.areaWiseObservations.flatMap((item) => inferThermalPages(item, thermalData)),
  );
  const inspectionPages = normalizePages(
    report.areaWiseObservations.flatMap((item) => inferInspectionPages(item, inspectionData)),
  );

  const [thermalEvidence, inspectionEvidence] =
    (await withTimeout(
      Promise.all([
        extractEvidenceByPage({
          file: thermalFile,
          pageNumbers: thermalPages,
          reportLabel: "Thermal Report",
        }),
        extractEvidenceByPage({
          file: inspectionFile,
          pageNumbers: inspectionPages,
          reportLabel: "Inspection Report",
        }),
      ]),
      TOTAL_EVIDENCE_TIMEOUT_MS,
      [{}, {}],
    )) || [{}, {}];

  return {
    ...report,
    areaWiseObservations: report.areaWiseObservations.map((item) => {
      const thermalRefs = inferThermalPages(item, thermalData)
        .slice(0, 2)
        .flatMap((page) =>
          (thermalEvidence[page] || []).map((image, index) => ({
            kind: "thermal",
            pageNumber: page,
            label: image.label || `Thermal Report Evidence ${index + 1} (Page ${page})`,
            src: image.src || null,
          })),
        );

      const inspectionRefs = inferInspectionPages(item, inspectionData)
        .slice(0, 2)
        .flatMap((page) =>
          (inspectionEvidence[page] || []).map((image, index) => ({
            kind: "inspection",
            pageNumber: page,
            label: image.label || `Inspection Report Evidence ${index + 1} (Page ${page})`,
            src: image.src || null,
          })),
        );

      return {
        ...item,
        evidenceImages: [...thermalRefs, ...inspectionRefs].slice(0, 4),
      };
    }),
  };
}
