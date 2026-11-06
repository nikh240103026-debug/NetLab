import type { Metadata } from 'next';
import NetTools from '@/components/tools/NetTools';

export const metadata: Metadata = { title: 'Tools' };

export default function ToolsPage() {
  return <NetTools />;
}
