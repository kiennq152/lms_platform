import { Platform, Share } from 'react-native';

function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? '' : String(v);
  // Names are user input: stop Excel from running them as formulas.
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
}

/** Downloads a CSV on web (UTF-8 BOM so Excel shows Vietnamese correctly); shares the text on native. */
export async function exportCsv(filename: string, header: string[], rows: unknown[][]) {
  const csv = toCsv(header, rows);
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
