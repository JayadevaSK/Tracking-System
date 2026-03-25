/**
 * windowTracker.ts
 * Gets the active window title and process name using PowerShell.
 * No native compilation required — works on any Windows machine with Node.js.
 */

import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

export interface WindowInfo {
  title: string;
  appName: string;
  category: string;
  description: string; // human-readable summary of what the user was doing
}

function categorize(title: string, appName: string): string {
  const t = (title || '').toLowerCase();
  const a = (appName || '').toLowerCase();

  if (['chrome', 'firefox', 'msedge', 'iexplore', 'opera', 'brave'].some(b => a.includes(b))) {
    if (t.includes('localhost') || t.includes('work tracker') || t.includes('employee')) return 'Work App';
    if (t.includes('github') || t.includes('gitlab') || t.includes('jira') || t.includes('confluence') || t.includes('bitbucket')) return 'Dev Tools';
    if (t.includes('gmail') || t.includes('outlook') || t.includes('mail') || t.includes('yahoo mail')) return 'Email';
    if (t.includes('youtube') || t.includes('netflix') || t.includes('twitch') || t.includes('spotify')) return 'Entertainment';
    if (t.includes('slack') || t.includes('teams') || t.includes('zoom') || t.includes('meet') || t.includes('discord')) return 'Communication';
    if (t.includes('stackoverflow') || t.includes('mdn') || t.includes('docs.')) return 'Dev Tools';
    return 'Browser';
  }
  if (['code', 'devenv', 'idea64', 'pycharm', 'webstorm', 'rider', 'clion', 'goland'].some(x => a.includes(x))) return 'IDE / Code Editor';
  if (['excel', 'winword', 'powerpnt', 'onenote', 'outlook'].some(x => a.includes(x))) return 'Office';
  if (['slack', 'teams', 'zoom', 'discord', 'skype', 'telegram', 'whatsapp'].some(x => a.includes(x))) return 'Communication';
  if (['explorer'].some(x => a === x)) return 'File Manager';
  if (['cmd', 'powershell', 'windowsterminal', 'bash', 'wsl'].some(x => a.includes(x))) return 'Terminal';
  if (['taskmgr', 'regedit', 'mmc', 'control'].some(x => a.includes(x))) return 'System';
  return 'Other';
}

/** Generate a short human-readable description of what the user was doing */
function describe(title: string, appName: string, category: string): string {
  const t = (title || '').trim();
  const a = (appName || '').toLowerCase();

  // Strip common browser suffixes from page titles
  const cleanTitle = t
    .replace(/ [-–|] Google Chrome$/, '')
    .replace(/ [-–|] Mozilla Firefox$/, '')
    .replace(/ [-–|] Microsoft Edge$/, '')
    .replace(/ [-–|] Brave$/, '')
    .trim();

  switch (category) {
    case 'Work App':
      return `Working on ${cleanTitle || 'Work Tracker'}`;
    case 'Dev Tools':
      if (a.includes('code') || a.includes('devenv') || a.includes('idea') || a.includes('pycharm') || a.includes('webstorm'))
        return `Coding in ${cleanTitle || appName}`;
      return `Using dev tools: ${cleanTitle || appName}`;
    case 'IDE / Code Editor':
      return `Coding: ${cleanTitle || appName}`;
    case 'Email':
      return `Reading/writing email`;
    case 'Entertainment':
      if (t.toLowerCase().includes('youtube')) return `Watching YouTube: ${cleanTitle}`;
      if (t.toLowerCase().includes('netflix')) return `Watching Netflix`;
      return `Entertainment: ${cleanTitle || appName}`;
    case 'Communication':
      return `Communicating via ${appName || cleanTitle}`;
    case 'Browser':
      return cleanTitle ? `Browsing: ${cleanTitle}` : 'Browsing the web';
    case 'Office':
      return `Working in ${appName.includes('excel') ? 'Excel' : appName.includes('winword') ? 'Word' : appName.includes('powerpnt') ? 'PowerPoint' : 'Office'}: ${cleanTitle}`;
    case 'File Manager':
      return `Managing files: ${cleanTitle || 'File Explorer'}`;
    case 'Terminal':
      return `Running terminal commands`;
    case 'System':
      return `System administration`;
    default:
      if (t && t !== 'Unknown') return `Using ${cleanTitle}`;
      return `Desktop activity`;
  }
}

// Write PS script to a temp file once to avoid CMD escaping issues
let PS_SCRIPT_PATH: string | null = null;

export function clearPsScriptCache(): void {
  if (PS_SCRIPT_PATH && fs.existsSync(PS_SCRIPT_PATH)) {
    try { fs.unlinkSync(PS_SCRIPT_PATH); } catch { /* ignore */ }
  }
  PS_SCRIPT_PATH = null;
}

function getPsScriptPath(): string {
  if (PS_SCRIPT_PATH && fs.existsSync(PS_SCRIPT_PATH)) return PS_SCRIPT_PATH;

  // IMPORTANT: The closing "@ of a PowerShell here-string MUST be at column 0 (no leading whitespace).
  // Do NOT indent this block — it will break the heredoc syntax.
  const script = [
    'Add-Type @"',
    '  using System;',
    '  using System.Runtime.InteropServices;',
    '  public class Win32 {',
    '    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();',
    '    [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);',
    '    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);',
    '  }',
    '"@',  // must be at column 0 — array join ensures no leading whitespace
    '$hwnd = [Win32]::GetForegroundWindow()',
    '$sb = New-Object System.Text.StringBuilder 256',
    '[Win32]::GetWindowText($hwnd, $sb, 256) | Out-Null',
    '$title = $sb.ToString()',
    '$pid2 = 0',
    '[Win32]::GetWindowThreadProcessId($hwnd, [ref]$pid2) | Out-Null',
    '$proc = ""',
    'try { $proc = (Get-Process -Id $pid2 -ErrorAction Stop).Name } catch {}',
    'Write-Output "$proc|||$title"',
  ].join('\r\n');

  const tmpPath = path.join(os.tmpdir(), 'wt-agent-getwindow.ps1');
  fs.writeFileSync(tmpPath, script, 'utf-8');
  PS_SCRIPT_PATH = tmpPath;
  return tmpPath;
}

export function getActiveWindow(): WindowInfo {
  try {
    const scriptPath = getPsScriptPath();
    const output = execFileSync('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy', 'Bypass',
      '-File', scriptPath,
    ], { timeout: 3000, windowsHide: true }).toString().trim();

    const sepIdx = output.indexOf('|||');
    if (sepIdx === -1) return { title: output || 'Unknown', appName: 'unknown', category: 'Other', description: 'Desktop activity' };

    const appName = output.slice(0, sepIdx).trim();
    const title = output.slice(sepIdx + 3).trim();

    return {
      title: title || 'Unknown',
      appName: appName || 'unknown',
      category: categorize(title, appName),
      description: describe(title, appName, categorize(title, appName)),
    };
  } catch {
    return { title: 'Unknown', appName: 'unknown', category: 'Other', description: 'Desktop activity' };
  }
}
