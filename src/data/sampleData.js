const imageIds = Array.from({ length: 30 }, (_, index) => {
  const numericId = 2377 + index;
  return `RB0${numericId}X`;
});

const hotspotSeries = [
  25.1, 25.6, 28.8, 26.4, 26.8, 27.1, 27.5, 26.9, 27.8, 27.9,
  26.7, 27.2, 27.4, 26.6, 27.1, 27.3, 27.7, 26.5, 26.9, 27.2,
  28.1, 27.6, 26.4, 27.8, 26.2, 26.8, 27.4, 27.1, 26.7, 26.3,
];

const coldspotSeries = [
  22.7, 22.4, 21.8, 22.2, 22.6, 22.5, 22.1, 22.3, 20.8, 20.6,
  21.4, 21.9, 22.1, 22.3, 21.7, 20.1, 21.1, 22.0, 22.2, 21.8,
  21.0, 21.6, 22.8, 20.9, 22.4, 22.7, 21.9, 22.3, 23.4, 23.1,
];

const thermalPatterns = [
  "Minor thermal drift near skirting with no strong moisture signature.",
  "Cold edge variation suggests residual dampness migrating from adjacent wall corner.",
  "Strong hotspot over mold-affected plaster with visible dampness, indicating active leakage path.",
  "Patchy cool zone along ceiling line suggests early seepage through slab joint.",
  "Uneven wall cooling with evaporation trace indicates trapped moisture behind plaster.",
  "Mild thermal bridge near plumbing chase; monitor for concealed line loss.",
  "Warm-to-cool gradient around balcony wall suggests water tracking across grout lines.",
  "Stable wall surface with isolated cooler point near window jamb.",
  "Distinct blue patch consistent with active moisture accumulation behind finish.",
  "Distinct blue patch with cold center confirming active moisture spread.",
  "Broad cool arc at wall corner suggests capillary rise from floor-wall junction.",
  "Localized heat rise over damp substrate indicates evaporation around a leak source.",
  "Thermal spread across plaster band suggests seepage from upper wet area.",
  "Small damp pocket at beam-wall interface, likely intermittent ingress.",
  "Ceiling margin cooling indicates wetness moving from bathroom service zone.",
  "Blue band at ceiling level suggests water ingress along slab edge.",
  "Uneven gradient over RCC strip indicates repeated saturation and drying cycles.",
  "Low-contrast variation, possible historic dampness rather than active ingress.",
  "Warm node near plumbing bend with surrounding cool halo indicates concealed leak suspicion.",
  "Moisture signature near kitchen shaft likely tied to vertical plumbing run.",
  "Wide anomaly across bathroom wall suggests open tile joints admitting water.",
  "Cooling near balcony threshold indicates ponding and migration under tile bed.",
  "Mostly stable profile with slight temperature depression near skirting.",
  "Cold patch across external wall indicates rainwater penetration through cracked facade.",
  "Surface largely normal; continue monitoring after remedial work.",
  "Cool trace behind bedroom wardrobe wall suggests trapped moisture and poor ventilation.",
  "Thermal bloom around ceiling crack suggests seepage from terrace or upper bath zone.",
  "Mild cold band below sill indicates moisture retention at plaster interface.",
  "Surface dry with limited anomaly; likely historic staining only.",
  "Surface dry with no significant active leakage indication.",
];

const diagnoses = [
  "Monitor wall base for progression.",
  "Moderate dampness tied to adjacent wet-area loading.",
  "Immediate intervention required at wet wall and mold-affected zone.",
  "Moderate seepage from slab joint or wet room above.",
  "Damp substrate behind plaster; investigate bathroom adjacency.",
  "Possible concealed plumbing issue; correlate with inspection inputs.",
  "Balcony grout failure allowing lateral moisture movement.",
  "Low severity anomaly with no confirmed active source.",
  "Active seepage at negative side wall finish.",
  "Active moisture ingress with elevated deterioration risk.",
  "Capillary moisture rise from floor junction.",
  "Leak source likely nearby concealed service line.",
  "Seepage migration from upper wet area.",
  "Intermittent ingress; repair before monsoon escalation.",
  "Bathroom service zone leakage influence.",
  "Water ingress at ceiling level.",
  "Repeated wetting impacting RCC/plaster bond.",
  "Historic moisture residue to monitor.",
  "Concealed plumbing leak suspicion.",
  "Service shaft seepage influencing kitchen wall.",
  "Open tile joints causing bathroom leakage.",
  "Balcony ponding and failed waterproofing detail.",
  "Low-risk anomaly.",
  "External wall crack-related ingress.",
  "Dry at present; monitor.",
  "Ventilation-related trapped moisture.",
  "Upper slab or terrace seepage path.",
  "Moisture retention below sill.",
  "Historic staining without active ingress.",
  "No material anomaly detected.",
];

const severities = [
  "monitor", "moderate", "immediate", "moderate", "moderate", "moderate",
  "moderate", "monitor", "immediate", "immediate", "moderate", "moderate",
  "moderate", "moderate", "moderate", "immediate", "moderate", "monitor",
  "moderate", "moderate", "immediate", "moderate", "monitor", "immediate",
  "monitor", "moderate", "moderate", "monitor", "monitor", "monitor",
];

const locations = [
  "Hall skirting wall",
  "Hall wall corner",
  "Bedroom damp wall",
  "Common bathroom ceiling",
  "Master bedroom wall",
  "Bathroom plumbing chase",
  "Balcony inside face",
  "Window jamb",
  "Parking area column face",
  "Parking area beam junction",
  "Kitchen lower wall",
  "Master bathroom wall",
  "Bedroom ceiling band",
  "External wall return",
  "Kitchen shaft wall",
  "Common bathroom ceiling band",
  "RCC lintel strip",
  "Hall decorative wall",
  "Bathroom pipe bend zone",
  "Kitchen service shaft",
  "Flat 203 bathroom wall",
  "Balcony threshold",
  "Bedroom skirting",
  "External wall facade",
  "Master bedroom niche",
  "Wardrobe backing wall",
  "Ceiling crack band",
  "Window sill band",
  "Hall repaint patch",
  "Kitchen side wall",
];

function suggestedAreaFromLocation(location) {
  const value = location.toLowerCase();

  if (value.includes("bathroom")) {
    return "Bathroom";
  }
  if (value.includes("hall")) {
    return "Hall";
  }
  if (value.includes("bedroom")) {
    return "Bedroom";
  }
  if (value.includes("kitchen")) {
    return "Kitchen";
  }
  if (value.includes("parking")) {
    return "Parking Area";
  }
  if (value.includes("balcony")) {
    return "Balcony";
  }
  if (value.includes("external")) {
    return "External Wall";
  }

  return "General Area";
}

export const sampleThermalAnalysis = imageIds.map((imageId, index) => ({
  imageId,
  date: "27/09/2022",
  hotspot: hotspotSeries[index],
  coldspot: coldspotSeries[index],
  emissivity: 0.94,
  reflectedTemperature: 23,
  thermalPattern: thermalPatterns[index],
  diagnosis: diagnoses[index],
  severity: severities[index],
  location: locations[index],
  sourcePage: index + 1,
  suggestedArea: suggestedAreaFromLocation(locations[index]),
  visualDescription: `Thermal image ${imageId} highlights ${thermalPatterns[index].toLowerCase()}`,
}));

export const sampleInspectionAnalysis = {
  propertyHealthScore: 85.71,
  propertyType: "Flat",
  floors: 11,
  previousAuditOrRepairs: "No previous audit or repair history reported",
  inspectionDate: "27.09.2022",
  inspectors: ["Krushna", "Mahesh"],
  impactedAreas: [
    {
      area: "Hall",
      description:
        "Dampness visible at lower wall and skirting with paint blistering and mild fungal spotting.",
      severity: "moderate",
      observedAt: "Negative side",
      sourcePages: [2],
    },
    {
      area: "Bedroom",
      description:
        "Mold growth and moisture staining along wall finish adjacent to bathroom zone.",
      severity: "immediate",
      observedAt: "Negative side",
      sourcePages: [2, 3],
    },
    {
      area: "Master Bedroom",
      description:
        "Cold-wall dampness with surface discoloration and recurring seepage marks.",
      severity: "moderate",
      observedAt: "Negative side",
      sourcePages: [3],
    },
    {
      area: "Kitchen",
      description: "Moisture traces near shaft wall and lower plaster softening.",
      severity: "moderate",
      observedAt: "Negative side",
      sourcePages: [3, 4],
    },
    {
      area: "Master Bedroom Wall",
      description:
        "Localized damp patch near corner and ceiling junction suggesting migration from upper wet area.",
      severity: "moderate",
      observedAt: "Negative side",
      sourcePages: [4],
    },
    {
      area: "Parking Area",
      description:
        "Thermal cold patches and dampness at beam-column interface below wet area stack.",
      severity: "immediate",
      observedAt: "Negative side",
      sourcePages: [4],
    },
    {
      area: "Common Bathroom Ceiling",
      description:
        "Water ingress band and flaking finish at ceiling level, likely from tile joints above.",
      severity: "immediate",
      observedAt: "Negative side",
      sourcePages: [5],
    },
  ],
  positiveSideInputs: [
    {
      area: "Flat 203 Bathroom",
      description:
        "Open tile joints, hollow-sounding tiles and likely seepage through floor and wall interfaces.",
      risk: "high",
      sourcePages: [1, 5],
    },
    {
      area: "Balcony",
      description:
        "Grout deterioration and threshold ponding path allowing migration under tile bed.",
      risk: "medium",
      sourcePages: [5],
    },
    {
      area: "Terrace/Upper Wet Area",
      description:
        "Potential slab and waterproofing defects contributing to ceiling level ingress.",
      risk: "medium",
      sourcePages: [5],
    },
    {
      area: "External Wall",
      description:
        "Moderate facade cracks, algae or fungus staining and plumbing-related wetting on outer face.",
      risk: "high",
      sourcePages: [6],
    },
  ],
  checklistResponses: {
    bathroom: {
      selected: true,
      notes: "Bathroom tile joint hollowness and open joints identified in Flat 203.",
    },
    balcony: {
      selected: true,
      notes: "Threshold wetness and grout deterioration observed.",
    },
    terrace: {
      selected: true,
      notes: "Possible delayed waterproofing distress affecting ceiling band.",
    },
    externalWall: {
      selected: true,
      notes: "Moderate cracks, algae or fungus and external plumbing issues noted.",
    },
  },
  summaryTable: [
    {
      impactedArea: "Bedroom / Hall wall",
      exposedArea: "Flat 203 bathroom",
      link: "Open tile joints and hollow tiles transferring moisture through masonry.",
    },
    {
      impactedArea: "Common bathroom ceiling",
      exposedArea: "Upper wet area / slab interface",
      link: "Ingress at ceiling level due to failed tile or slab waterproofing detail.",
    },
    {
      impactedArea: "Parking area beam-column zone",
      exposedArea: "Vertical wet stack",
      link: "Repeated saturation moving down service alignment.",
    },
    {
      impactedArea: "External wall affected rooms",
      exposedArea: "Facade cracks and plumbing line",
      link: "Rainwater penetration and outer wall wetting contributing to dampness.",
    },
  ],
  conflicts: [],
  missingInformation: [
    "Exact repair history before the inspection is not available in the uploaded inspection form.",
  ],
};

export const samplePropertyDetails = {
  propertyAddress:
    "Flat 202, UrbanRoof Sample Site, Baner Road, Pune, Maharashtra 411045",
  inspectorName: "Krushna & Mahesh",
  inspectionDate: "2022-09-27",
  propertyType: "Flat",
  floors: "11",
  propertyAge: "8",
  clientName: "UrbanRoof Demo Client",
};

export const progressMessages = [
  "Analyzing thermal images...",
  "Cross-referencing inspection data...",
  "Generating diagnosis...",
  "Compiling report evidence...",
];
