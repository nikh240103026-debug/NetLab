import type { Chapter } from '@/lib/types';
import ch01 from './ch01-intro-models';
import ch02 from './ch02-physical';
import ch03 from './ch03-data-link';
import ch04 from './ch04-ip-addressing';
import ch05 from './ch05-routing';
import ch06 from './ch06-transport';
import ch07 from './ch07-application';
import ch08 from './ch08-security';
import ch09 from './ch09-wireless-iot';
import ch10 from './ch10-modern-networking';

export const chapters: Chapter[] = [ch01, ch02, ch03, ch04, ch05, ch06, ch07, ch08, ch09, ch10];

export function getChapter(slug: string): Chapter | undefined {
  return chapters.find((c) => c.slug === slug);
}
