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
  return new Promise((resolve) => {
    try {
      if (objects.has(objectId)) {
        resolve(objects.get(objectId));
        return;
      }
      objects.get(objectId, (data) => resolve(data));
    } catch (error) {
      resolve(null);
    }
  });
}

async function extractEmbeddedImagesFromPage(page, pdfjs) {
  const operatorList = await page.getOperatorList();
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

  for (const ref of refs) {
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

  await page.render({ canvasContext: context, viewport }).promise;
  return canvas.toDataURL("image/jpeg", 0.82);
}

async function extractEvidenceByPage({ file, pageNumbers, reportLabel }) {
  if (!file || !pageNumbers.length) {
    return {};
  }

  const pdfjs = await getPdfJs();
  const bytes = await fileToUint8Array(file);
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  const extractedByPage = {};

  for (const pageNumber of normalizePages(pageNumbers)) {
    if (pageNumber > pdf.numPages) {
      continue;
    }

    const page = await pdf.getPage(pageNumber);
    const embedded = await extractEmbeddedImagesFromPage(page, pdfjs);

    if (embedded.length) {
      extractedByPage[pageNumber] = embedded.map((item, index) => ({
        src: item.src,
        label: `${reportLabel} Extracted Image ${index + 1} (Page ${pageNumber})`,
      }));
      continue;
    }

    extractedByPage[pageNumber] = [
      {
        src: await renderPageFallback(page),
        label: `${reportLabel} Page Snapshot (${pageNumber})`,
      },
    ];
  }

  return extractedByPage;
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

  const [thermalEvidence, inspectionEvidence] = await Promise.all([
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
  ]);

  return {
    ...report,
    areaWiseObservations: report.areaWiseObservations.map((item) => {
      const thermalRefs = (item?.evidenceRefs?.thermalPages || [])
        .slice(0, 2)
        .flatMap((page) =>
          (thermalEvidence[page] || []).map((image, index) => ({
            kind: "thermal",
            pageNumber: page,
            label: image.label || `Thermal Report Evidence ${index + 1} (Page ${page})`,
            src: image.src || null,
          })),
        );

      const inspectionRefs = (item?.evidenceRefs?.inspectionPages || [])
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
