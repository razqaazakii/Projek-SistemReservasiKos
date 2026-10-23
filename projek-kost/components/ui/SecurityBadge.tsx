// Props yang diterima komponen ini
export interface SecurityBadgeProps {
  text: string;           // Teks yang ditampilkan di dalam badge
  isSecurity?: boolean;   // Jika true, gunakan warna biru (fitur keamanan). Jika false, warna abu-abu (fasilitas umum)
}

export default function SecurityBadge({ text, isSecurity = false }: SecurityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center text-sm font-semibold px-3 py-1.5 rounded-full border transition-colors ${
        isSecurity
          ? "bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100"   // Gaya badge keamanan (biru)
          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200" // Gaya badge fasilitas biasa (abu-abu)
      }`}
    >
      {text}
    </span>
  );
}
