export type DiagramKind = 'block' | 'flowchart' | 'working-diagram' | 'working-flowchart';

export type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'points'; items: string[] }
  | { type: 'callout'; variant: 'formula' | 'remember' | 'exam-tip' | 'real-world'; text: string }
  | { type: 'diagram'; id: string; title: string; caption: string; kind: DiagramKind; mermaid: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'example'; title: string; steps: string[] }
  | { type: 'command-lab'; title: string; command: string; output: string; explanation: string[] }
  | { type: 'mini-lab'; title: string; goal: string; steps: string[]; expected: string }
  | { type: 'wireshark'; filter: string; whatToLook: string[] }
  | { type: 'case-study'; title: string; scenario: string; steps: string[] }
  | { type: 'troubleshoot'; symptom: string; checks: string[]; fix: string };

export type DiagramBlock = Extract<Block, { type: 'diagram' }>;

export type Section = { id: string; title: string; blocks: Block[]; videoId?: string };

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
};

export type Chapter = {
  slug: string;
  number: number;
  title: string;
  shortTitle: string;
  summary: string;
  estMinutes: number;
  learningObjectives: string[];
  overviewVideoId: string;
  sections: Section[];
  flashcards: { front: string; back: string }[];
  quiz: QuizQuestion[];
  importantQuestions: { q: string; modelAnswer: string; marks: number }[];
  numericals: { question: string; steps: string[]; answer: string }[];
  keyTerms: string[];
  formulas: { name: string; expression: string; note?: string }[];
  handsOnChecklist: string[];
};

export type VideoMeta = {
  id: string;
  chapter: number;
  title: string;
  concept: string;
  realWorld: string;
  tools: string;
  durationSec: number;
  url?: string;
};

export type VideoManifest = {
  chapters: { number: number; folder: string; title: string }[];
  videos: VideoMeta[];
};

export type ChapterStatus = 'not-started' | 'in-progress' | 'completed';

export type QuizResult = {
  best: number;
  last: number;
  attempts: number;
  wrongTopics: string[];
  at: string;
};

export type MockResult = {
  id: string;
  at: string;
  total: number;
  correct: number;
  percent: number;
  durationSec: number;
  perChapter: { chapter: number; correct: number; total: number }[];
  wrongTopics: string[];
};

export type Bookmark = {
  id: string;
  kind: 'chapter' | 'section' | 'question';
  slug: string;
  title: string;
  href: string;
  at: string;
};

export type ActivityItem = {
  id: string;
  label: string;
  href?: string;
  at: string;
};

export type ProgressState = {
  completedChapters: string[];
  lastVisited: Record<string, string>;
  quizResults: Record<string, QuizResult>;
  mockHistory: MockResult[];
  flashcards: Record<string, 'known' | 'review'>;
  bookmarks: Bookmark[];
  notes: Record<string, string>;
  checklist: Record<string, boolean>;
  studyDays: string[];
  activity: ActivityItem[];
};

export type PublicUser = { id: string; name: string; email: string };

export type StoredUser = PublicUser & { passwordHash: string; createdAt: string };

export type ChatMode = 'explain' | 'numerical' | 'beginner' | 'exam' | 'troubleshoot' | 'output';

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = { role: ChatRole; content: string };

export type StoredChatMessage = ChatMessage & { id: string };
