import { GoogleGenerativeAI, type Content } from '@google/generative-ai';
import type { ChatMessage } from './types';

function toContents(messages: ChatMessage[]): Content[] {
  const contents: Content[] = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  // Gemini rejects a history that opens with a model turn, which trimming to the latest 20 can produce.
  while (contents.length > 0 && contents[0].role === 'model') contents.shift();
  return contents;
}

export async function streamAnswer(
  messages: ChatMessage[],
  systemInstruction: string,
): Promise<ReadableStream<Uint8Array>> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? '',
    systemInstruction,
  });
  const result = await model.generateContentStream({ contents: toContents(messages) });
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

export function isRateLimitError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const { status, message } = err as { status?: unknown; message?: unknown };
  return status === 429 || (typeof message === 'string' && message.includes('429'));
}
