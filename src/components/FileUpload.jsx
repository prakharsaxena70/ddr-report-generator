export default function FileUpload({
  title,
  step,
  description,
  file,
  onFileSelect,
}) {
  return (
    <div className="rounded-[28px] border border-white/60 bg-white/85 p-6 shadow-card backdrop-blur">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amberdeep">
          Step {step}
        </p>
        <h2 className="mt-2 font-display text-2xl text-charcoal">{title}</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">{description}</p>
      </div>

      <label className="block cursor-pointer rounded-[24px] border border-dashed border-stone-300 bg-canvas px-5 py-8 text-center transition hover:border-ember hover:bg-white">
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(event) => onFileSelect(event.target.files?.[0] || null)}
        />
        <div className="mx-auto max-w-sm">
          <p className="text-base font-semibold text-charcoal">
            {file ? file.name : "Choose a PDF or continue with the bundled sample case"}
          </p>
          <p className="mt-2 text-sm text-stone-600">
            PDF document input will be sent to Claude through your configured proxy. If no
            file is uploaded, the app uses UrbanRoof sample findings from the supplied brief.
          </p>
        </div>
      </label>
    </div>
  );
}
