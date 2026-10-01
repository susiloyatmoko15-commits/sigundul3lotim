import React, { useState } from 'react';
import { Users, User, ArrowRight, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { PlayerInfo } from '../types/game';
import { sounds } from '../utils/audio';

interface Props {
  onStartGame: (player: PlayerInfo) => void;
  onBack: () => void;
}

export const PlayerSetup: React.FC<Props> = ({ onStartGame, onBack }) => {
  const [mode, setMode] = useState<'individual' | 'group'>('group');
  const [playerName, setPlayerName] = useState('');
  const [className, setClassName] = useState('Kelas 5A');
  const [memberInput, setMemberInput] = useState('');
  const [members, setMembers] = useState<string[]>(['Andi', 'Budi', 'Citra']);

  const handleAddMember = () => {
    if (!memberInput.trim()) return;
    sounds.playClick();
    if (!members.includes(memberInput.trim())) {
      setMembers([...members, memberInput.trim()]);
    }
    setMemberInput('');
  };

  const handleRemoveMember = (idx: number) => {
    sounds.playClick();
    setMembers(members.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    sounds.playClick();
    onStartGame({
      mode,
      playerName: playerName.trim(),
      className: className.trim(),
      members: mode === 'group' ? members : undefined,
    });
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-amber-300">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            sounds.playClick();
            onBack();
          }}
          className="text-xs font-bold text-slate-500 hover:text-amber-800 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>

        <span className="text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
          Daftar Petualang
        </span>
      </div>

      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-3xl shadow-md mb-3">
          🎒
        </div>
        <h2 className="text-2xl sm:text-3xl font-black font-display text-amber-950">
          Siapkan Tim Detektif Literasi!
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Masukkan identitas tim atau nama siswa sebelum menjelajahi 5 babak cerita bersambung di sekolah.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mode Selector: Individu vs Kelompok */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Pilih Mode Bermain:
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setMode('group');
                if (!playerName) setPlayerName('Kelompok Garuda');
              }}
              className={`p-3 rounded-2xl border-2 font-bold flex items-center justify-center gap-2 text-sm transition-all ${
                mode === 'group'
                  ? 'bg-amber-500 border-amber-600 text-white shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-amber-50'
              }`}
            >
              <Users className="w-4 h-4" /> Kelompok / Regu
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setMode('individual');
                if (playerName === 'Kelompok Garuda') setPlayerName('');
              }}
              className={`p-3 rounded-2xl border-2 font-bold flex items-center justify-center gap-2 text-sm transition-all ${
                mode === 'individual'
                  ? 'bg-amber-500 border-amber-600 text-white shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-amber-50'
              }`}
            >
              <User className="w-4 h-4" /> Individu
            </button>
          </div>
        </div>

        {/* Player / Team Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            {mode === 'group' ? 'Nama Kelompok:' : 'Nama Siswa:'}
          </label>
          <input
            type="text"
            required
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder={mode === 'group' ? 'Contoh: Kelompok Garuda' : 'Contoh: Andi Pratama'}
            className="w-full px-4 py-3 bg-amber-50/50 border-2 border-amber-200 focus:border-amber-500 rounded-2xl text-slate-900 font-bold focus:outline-hidden focus:bg-white text-base"
          />
        </div>

        {/* Class Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Kelas:
          </label>
          <select
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="w-full px-4 py-3 bg-amber-50/50 border-2 border-amber-200 focus:border-amber-500 rounded-2xl text-slate-900 font-bold focus:outline-hidden focus:bg-white text-base"
          >
            <option value="Kelas 5A">Kelas 5A</option>
            <option value="Kelas 5B">Kelas 5B</option>
            <option value="Kelas 5C">Kelas 5C</option>
            <option value="Kelas 6A">Kelas 6A</option>
            <option value="Kelas 6B">Kelas 6B</option>
            <option value="Kelas 6C">Kelas 6C</option>
            <option value="Kelas Lainnya">Kelas Lainnya</option>
          </select>
        </div>

        {/* Group Members List (if group mode) */}
        {mode === 'group' && (
          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-3">
            <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider">
              Daftar Anggota Kelompok:
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMember();
                  }
                }}
                placeholder="Ketik nama anggota lalu klik +"
                className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleAddMember}
                className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {members.map((member, idx) => (
                <span
                  key={idx}
                  className="bg-white text-slate-700 text-xs font-bold px-3 py-1 rounded-xl border border-amber-200 flex items-center gap-1.5 shadow-2xs"
                >
                  <span>{member}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(idx)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Start Adventure Button */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={!playerName.trim()}
            className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 disabled:opacity-50 text-white font-black text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-98 flex items-center justify-center gap-2 font-display uppercase tracking-wide"
          >
            MULAI PETUALANGAN <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
