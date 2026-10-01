export type LiteracyQuestionType =
  | 'menemukan_informasi'
  | 'ide_pokok'
  | 'makna_kosakata'
  | 'evaluasi_amanat'
  | 'sebab_akibat'
  | 'pilihan_ganda'
  | 'isian_singkat';

export type QuestionType = 'pilihan_ganda' | 'isian_singkat' | 'menemukan_informasi' | 'ide_pokok' | 'makna_kosakata' | 'evaluasi_amanat';

export type DifficultyLevel = 'mudah' | 'sedang' | 'sulit';

export interface GlossaryItem {
  word: string;
  meaning: string;
}

export interface StoryChapter {
  chapterNumber: number; // 1 to 5
  title: string; // e.g. "Pos 1: Rahasia Bunga & Perkembangbiakan Generatif"
  subtitle?: string;
  imageCaption?: string;
  visualHighlights?: string[];
  paragraphs: string[]; // 4 to 10 paragraphs
  summaryClue: string; // Detective note unlocked after completing station
  glossary?: GlossaryItem[];
}

export interface Question {
  id: string;
  locationId: string; // 'pos_1' | 'pos_2' | 'pos_3' | 'pos_4' | 'pos_5'
  question: string;
  type: QuestionType;
  literacyCategory?: LiteracyQuestionType;
  difficulty: DifficultyLevel;
  targetParagraph?: number; // e.g. 2 for "Paragraf 2"
  options?: string[]; // for multiple choice
  correctAnswer: string; // for server/local validation
  explanation: string;
}

// Sanitized question sent to student during active game
export interface ClientQuestion {
  id: string;
  locationId: string;
  question: string;
  type: QuestionType;
  literacyCategory?: LiteracyQuestionType;
  difficulty: DifficultyLevel;
  targetParagraph?: number;
  options?: string[];
}

export interface LocationConfig {
  id: string; // 'pos_1' | 'pos_2' | 'pos_3' | 'pos_4' | 'pos_5'
  code: string; // e.g. "POS 1", "POS 5 (FINAL)"
  name: string; // e.g. "Perpustakaan - Babak 1"
  qrCode: string; // e.g. "LITERASI-POS-1"
  hint: string; // Petunjuk lokasi / teka-teki menuju pos
  isFinal: boolean;
  isActive: boolean;
  iconName: string; // Lucide icon identifier
  story: StoryChapter;
}

export interface GameSettings {
  durationMinutes: number; // 0 for unlimited, or 20, 30, 45, 60
  maxAttempts: number; // 2 or 3
  pointsFirstAttempt: number; // default 100
  pointsSecondAttempt: number; // default 75
  pointsThirdAttempt: number; // default 50
  pointsPosBonus: number; // default 100
  pointsGameBonus: number; // default 500
  hintMode: 'adventure' | 'easy'; // 'adventure' = riddles only, 'easy' = location name shown
  treasureCode: string; // default "DETEKTIF-LITERASI-JUARA"
  teacherMessage: string;
  leaderboardEnabled: boolean;
}

export interface PlayerInfo {
  mode: 'individual' | 'group';
  playerName: string; // e.g. "Tim Garuda" or "Andi"
  className: string; // e.g. "Kelas 5A"
  members?: string[]; // e.g. ["Andi", "Budi", "Citra"]
}

export interface PosProgress {
  locationId: string;
  qrVerified: boolean;
  completed: boolean;
  failed?: boolean;
  currentQuestionIndex: number;
  questionAttempts: { [questionId: string]: number };
  solvedQuestions: string[];
}

export interface StoryRetelling {
  studentText: string;
  wordCount: number;
  submittedAt: string;
  teacherRating?: number; // 1 to 5 stars
  teacherFeedback?: string;
}

export interface GameSession {
  gameId: string;
  player: PlayerInfo;
  startTime: number;
  endTime?: number;
  route: string[]; // ['pos_1', 'pos_2', 'pos_3', 'pos_4', 'pos_5']
  currentPosIndex: number; // 0 to 4
  score: number;
  totalCorrect: number;
  totalAttempts: number;
  posProgress: { [locationId: string]: PosProgress };
  status: 'active' | 'completed' | 'timeout' | 'failed';
  failedPosCode?: string;
  failedPosName?: string;
  failedReason?: string;
  screenLocked?: boolean;
  screenLockReason?: string;
  screenLockCount?: number;
  treasureUnlocked: boolean;
  storyRetelling?: StoryRetelling;
}

export interface LeaderboardEntry {
  id: string;
  gameId: string;
  playerName: string;
  mode: 'individual' | 'group';
  className: string;
  members?: string[];
  score: number;
  completedStations: number; // out of 5
  correctCount: number;
  totalQuestions: number;
  durationSeconds: number;
  accuracy: number; // percentage
  badge: string;
  completedAt: string;
  storyRetelling?: StoryRetelling;
}
