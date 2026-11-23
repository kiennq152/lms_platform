import { Platform, Share } from 'react-native';

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Downloads a CSV on web (UTF-8 BOM so Excel shows Vietnamese correctly); shares the text on native. */
export async function exportCsv(filename: string, header: string[], rows: unknown[][]) {
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
  if (Platform.OS === 'web') {
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  await Share.share({ title: filename, message: csv });
}
