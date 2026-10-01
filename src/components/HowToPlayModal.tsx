import React from 'react';
import { X, BookOpen, QrCode, CheckCircle, Trophy, Sparkles, Feather } from 'lucide-react';
import { sounds } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      step: '1',
      title: 'Bentuk Regu & Siapkan Buku Catatan Manual',
      desc: 'Masukkan nama kelompokmu serta siapkan buku tulis dan pulpen masing-masing untuk mencatat materi di setiap pos.',
      icon: '🎒',
    },
    {
      step: '2',
      title: 'Pecahkan Deskripsi Petunjuk Lokasi (Pos 1 – Pos 5)',
      desc: 'Setiap pos memberikan deskripsi ciri-ciri tempat di lingkungan sekolah. Tebak lokasinya berdasarkan deskripsi tersebut secara berurutan dari Pos 1 hingga Pos 5!',
      icon: '🧭',
    },
    {
      step: '3',
      title: 'Cari & Scan QR Code di Setiap Pos',
      desc: 'Temukan kartu QR Code di lokasi yang sesuai dengan deskripsi, lalu pindai menggunakan kamera smartphone untuk membuka artikel materi Perkembangbiakan Tumbuhan.',
      icon: '📷',
    },
    {
      step: '4',
      title: 'Baca Artikel & Catat di Buku Tulis Manual',
      desc: 'PERHATIAN: Artikel materi di setiap pos HANYA BISA DILIHAT 1 KALI! Catatlah hal-hal penting di buku tulis manualmu sendiri sebelum lanjut menjawab soal.',
      icon: '📓',
    },
    {
      step: '5',
      title: 'Klik "Siap Menjawab Soal" (Artikel Dikunci)',
      desc: 'Setelah selesai mencatat di buku tulismu, klik tombol siap menjawab soal. Artikel akan dikunci dan tidak bisa dibuka lagi. Jawablah soal menggunakan buku catatanmu!',
      icon: '🔒',
    },
    {
      step: '6',
      title: 'Pos 5 (Final): Tunjukkan Buku Catatan ke Guru!',
      desc: 'Selesaikan soal terakhir di Pos 5 untuk membuka Peti Harta Karun Ilmu & Piagam Penghargaan, lalu kumpulkan buku catatanmu kepada Bapak/Ibu Guru!',
      icon: '🏆',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border-4 border-amber-400 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-400/30 rounded-xl text-xl">📜</span>
            <div>
              <h3 className="font-bold text-lg font-display tracking-wide">
                PANDUAN DETEKTIF LITERASI
              </h3>
              <p className="text-xs text-amber-100 font-medium">
                Petualangan Cerita Bersambung & Tugas Akhir
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="space-y-3">
            {steps.map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-3 p-3 bg-amber-50/70 border border-amber-200 rounded-2xl"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                  {item.step}
                </div>
                <div className="flex-1">
                  <div className="font-extrabold text-sm text-amber-950 flex items-center gap-1.5">
                    <span>{item.title}</span>
                    <span>{item.icon}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-rose-50 border border-rose-300 rounded-2xl text-xs text-rose-950 font-bold flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>
              Aturan Penting: Jika kelompok gagal menjawab soal di suatu Pos (kehabisan kesempatan), aplikasi akan terkunci. Reset aplikasi hanya bisa dilakukan oleh Bapak/Ibu Guru melalui Panel Guru!
            </span>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-2xl transition-all shadow-md cursor-pointer"
          >
            Mengerti & Siap Bertualang!
          </button>
        </div>
      </div>
    </div>
  );
};
