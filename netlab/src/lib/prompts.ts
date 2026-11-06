import { chapters, getChapter } from '@/content/chapters';
import type { ChatMode } from './types';
import { parseTerm } from './utils';

export const CHAT_MODES: { id: ChatMode; label: string }[] = [
  { id: 'explain', label: 'Explain concept' },
  { id: 'numerical', label: 'Solve numerical step by step' },
  { id: 'beginner', label: "Explain like I'm new" },
  { id: 'exam', label: 'Exam answer (concise)' },
  { id: 'troubleshoot', label: 'Troubleshoot a scenario' },
  { id: 'output', label: 'Explain command or packet output' },
];

export function isChatMode(value: unknown): value is ChatMode {
  return CHAT_MODES.some((m) => m.id === value);
}

const MODE_INSTRUCTIONS: Record<ChatMode, string> = {
  explain:
    'Mode: Explain concept. Structure the answer as definition, intuition, how it works, real-world use, common mistakes, and a 3-line summary.',
  numerical:
    'Mode: Solve numerical step by step. Show the given data, the formula, numbered steps with the substitution, and the final answer with units.',
  beginner:
    "Mode: Explain like I'm new. Start with an everyday analogy, then explain in plain language. Introduce a technical term only after the idea is clear.",
  exam: 'Mode: Exam answer (concise). Write 5 to 8 lines suitable for a 5 or 10 mark university question. Use precise terms and no filler.',
  troubleshoot:
    'Mode: Troubleshoot a scenario. If the symptoms are missing, ask for them first. Otherwise give a layer-by-layer diagnosis path with the exact commands to run and how to read their output.',
  output:
    'Mode: Explain command or packet output. The user pastes output. Explain it line by line and say clearly what is normal and what is wrong.',
};

export function buildSystemInstruction(mode: ChatMode, chapterSlug?: string): string {
  const titles = chapters.map((c) => c.title).join('; ');
  const parts = [
    'You are the NetLab tutor for Computer Networks, helping engineering undergraduates.',
    'Answer only networking and closely related topics: OS networking basics, cryptography as applied to networks, and cloud networking. Politely redirect anything unrelated back to networking.',
    'Be accurate and say when you are unsure instead of guessing.',
    'Use Markdown with short headings, bullet points, tables for comparisons, and code blocks for commands, headers and binary.',
    'For numericals always show the given data, the formula, numbered steps and the final answer with units.',
    'When useful, include a text diagram in a code block.',
    `End every answer with a final line in exactly this form: Related chapter: <chapter title>. Choose the title from this list and copy it exactly: ${titles}.`,
    MODE_INSTRUCTIONS[mode],
  ];
  const chapter = chapterSlug ? getChapter(chapterSlug) : undefined;
  if (chapter) {
    const terms = chapter.keyTerms.map((t) => parseTerm(t).term).join(', ');
    const sections = chapter.sections.map((s) => s.title).join(', ');
    parts.push(
      `The student is studying the chapter "${chapter.title}". Its sections are: ${sections}. Its key terms are: ${terms}. Prefer examples that fit this chapter.`,
    );
  }
  return parts.join('\n');
}
