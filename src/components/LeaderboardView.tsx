import React, { useEffect, useState } from 'react';
import { Trophy, ArrowLeft, Medal, Users, User, Clock, Target, Search, BookOpen, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { LeaderboardEntry } from '../types/game';
import { gameService } from '../services/gameService';
import { sounds } from '../utils/audio';

interface Props {
  onBack: () => void;
}

export const LeaderboardView: React.FC<Props> = ({ onBack }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'group' | 'individual'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await gameService.getLeaderboard();
        setEntries(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const filtered = entries
    .filter((e) => {
      if (filterMode === 'all') return true;
      return e.mode === filterMode;
    })
    .filter((e) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        e.playerName.toLowerCase().includes(q) ||
        e.className.toLowerCase().includes(q) ||
        (e.members && e.members.some((m) => m.toLowerCase().includes(q)))
      );
    });

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            sounds.playClick();
            onBack();
          }}
          className="text-xs font-bold text-slate-600 hover:text-amber-800 flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-amber-200 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>

        <span className="text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300 flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5 text-amber-600" /> Papan Peringkat Literasi
        </span>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border-3 border-amber-300 space-y-4">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-black font-display text-amber-950">
            🏆 Peringkat Detektif Literasi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Penjelajah cerita terbaik dengan skor tertinggi, ketelitian membaca, dan ringkasan alur terpadu!
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          {/* Mode Tabs */}
          <div className="flex bg-amber-50 p-1 rounded-xl border border-amber-200">
            <button
              onClick={() => {
                sounds.playClick();
                setFilterMode('all');
              }}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-amber-100'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setFilterMode('group');
              }}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'group'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-amber-100'
              }`}
            >
              Kelompok
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setFilterMode('individual');
              }}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'individual'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-amber-100'
              }`}
            >
              Individu
            </button>
          </div>

          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama detektif atau kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-amber-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {/* Entries List */}
        {isLoading ? (
          <div className="py-12 text-center text-slate-400">
            <div className="animate-spin text-3xl mb-2">⏳</div>
            <p className="text-xs">Memuat peringkat detektif literasi...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm font-semibold">Belum ada data petualangan yang cocok.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item, idx) => {
              const rank = idx + 1;
              const isTop3 = rank <= 3;
              const isExpanded = expandedId === item.id;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    rank === 1
                      ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-300 shadow-sm'
                      : rank === 2
                      ? 'bg-slate-50/70 border-slate-300 shadow-2xs'
                      : rank === 3
                      ? 'bg-orange-50/70 border-orange-200 shadow-2xs'
                      : 'bg-white border-amber-100'
                  }`}
                >
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Rank Medal */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          rank === 1
                            ? 'bg-yellow-400 text-amber-950 shadow-xs'
                            : rank === 2
                            ? 'bg-slate-200 text-slate-800'
                            : rank === 3
                            ? 'bg-amber-600 text-white'
                            : 'bg-amber-100 text-amber-900 font-bold'
                        }`}
                      >
                        {isTop3 ? (
                          <Medal className="w-5 h-5" />
                        ) : (
                          `#${rank}`
                        )}
                      </div>

                      {/* Player Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-amber-950 text-sm">
                            {item.playerName}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900">
                            {item.className}
                          </span>
                        </div>

                        {item.members && item.members.length > 0 && (
                          <div className="text-[11px] text-slate-500 font-medium">
                            Anggota: {item.members.join(', ')}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            {formatDuration(item.durationSeconds)}
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3 text-emerald-600" />
                            {item.accuracy}% akurat
                          </span>
                          {item.storyRetelling?.teacherRating && (
                            <>
                              <span>&bull;</span>
                              <span className="flex items-center text-amber-600 font-bold">
                                {'⭐'.repeat(item.storyRetelling.teacherRating)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Score and Retelling Button */}
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="text-lg font-black font-display text-amber-950 leading-none">
                        {item.score}
                      </div>
                      <div className="text-[10px] font-bold text-amber-800">POIN</div>

                      {item.storyRetelling && (
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="text-[10px] font-bold text-amber-700 hover:text-amber-900 underline flex items-center gap-0.5 cursor-pointer pt-0.5"
                        >
                          <BookOpen className="w-3 h-3" />
                          {isExpanded ? 'Tutup Cerita' : 'Lihat Alur Cerita'}
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Student Retelling Drawer */}
                  {isExpanded && item.storyRetelling && (
                    <div className="bg-amber-100/50 p-4 border-t border-amber-200 text-xs text-slate-800 space-y-2">
                      <div className="flex items-center justify-between font-black text-amber-900 uppercase">
                        <span>✍️ Ringkasan Alur Cerita Siswa ({item.storyRetelling.wordCount} kata):</span>
                        {item.storyRetelling.teacherRating && (
                          <span className="text-amber-700 normal-case font-bold">
                            Nilai Guru: {'⭐'.repeat(item.storyRetelling.teacherRating)}
                          </span>
                        )}
                      </div>
                      <p className="italic bg-white p-3 rounded-xl border border-amber-200 text-slate-700 leading-relaxed whitespace-pre-line">
                        &ldquo;{item.storyRetelling.studentText}&rdquo;
                      </p>
                      {item.storyRetelling.teacherFeedback && (
                        <div className="bg-amber-200/60 p-2.5 rounded-xl border border-amber-300 text-amber-950">
                          <strong>Catatan Guru:</strong> {item.storyRetelling.teacherFeedback}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
