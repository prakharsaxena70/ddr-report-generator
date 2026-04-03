export default function PDFGenerator({ onDownload, disabled, loading, label }) {
  return (
    <button
      type="button"
      onClick={onDownload}
      disabled={disabled}
      className="inline-flex items-center justify-center rounded-full bg-charcoal px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? label || "Preparing PDF..." : label || "Download PDF"}
    </button>
  );
}
