export default function FileUpload({
  title,
  step,
  description,
  file,
  onFileSelect,
  accent = "amber",
  required = false,
}) {
  const isUploaded = Boolean(file);
  const accentClasses =
    accent === "moss"
      ? "border-moss/40 from-lime-50 to-emerald-50 hover:border-moss"
      : "border-ember/40 from-amber-50 to-orange-50 hover:border-ember";

  return (
    <div className="rounded-[30px] border border-white/60 bg-white/90 p-6 shadow-card backdrop-blur">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amberdeep">
          Step {step}
        </p>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-charcoal">{title}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">{description}</p>
          </div>
          <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-600">
            {isUploaded ? "Ready" : required ? "Required" : "Optional"}
          </span>
        </div>
      </div>

      <label
        className={`block cursor-pointer rounded-[28px] border border-dashed bg-gradient-to-br px-5 py-8 transition ${accentClasses}`}
      >
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(event) => onFileSelect(event.target.files?.[0] || null)}
        />

        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl border border-white/70 bg-white/85 text-sm font-bold tracking-[0.2em] shadow-sm ${
              isUploaded ? "text-moss" : "text-amberdeep"
            }`}
          >
            PDF
          </div>

          <p className="mt-4 text-base font-semibold text-charcoal">
            {file ? file.name : "Choose a PDF to continue"}
          </p>
          <p className="mt-2 max-w-md text-sm leading-6 text-stone-600">
            PDF input is analyzed for structured observations and linked evidence so the
            final DDR can combine text findings with relevant document images.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-stone-300 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
              PDF only
            </span>
            {required ? (
              <span className="rounded-full border border-stone-300 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
                Required for generation
              </span>
            ) : null}
            {isUploaded ? (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  onFileSelect(null);
                }}
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700 transition hover:border-ember hover:text-charcoal"
              >
                Remove file
              </button>
            ) : null}
          </div>
        </div>
      </label>
    </div>
  );
}
