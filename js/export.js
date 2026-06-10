/**
 * TypeFlow Results Certificate Export Module
 */
import { state } from './state.js';
import { getPersonalRecords } from './storage.js';

/**
 * Helper to determine achievement badge names
 */
function getBadgeName(wpm) {
  if (wpm < 30) return 'Beginner';
  if (wpm < 55) return 'Intermediate';
  if (wpm < 80) return 'Expert';
  if (wpm < 100) return 'Master';
  return 'Grandmaster';
}

/**
 * Converts a hex code to a formatted RGBA string
 */
function hexToRgba(hex, alpha) {
  hex = hex.trim();
  if (hex.startsWith('#')) {
    hex = hex.substring(1);
  }
  let r = 6, g = 182, b = 212; // default neon cyan
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Dynamically draws the TypeFlow Certificate on canvas and saves it as a PNG
 */
export function exportResultsCertificate() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 850;
    canvas.height = 550;
    const ctx = canvas.getContext('2d');
    
    const w = canvas.width;
    const h = canvas.height;
    
    // 1. Theme-based background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    if (state.theme === 'dark') {
      bgGrad.addColorStop(0, '#0a0f1d');
      bgGrad.addColorStop(1, '#02040a');
    } else {
      bgGrad.addColorStop(0, '#ffffff');
      bgGrad.addColorStop(1, '#e2e8f0');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);
    
    // 2. Borders & Glows
    const accentColor = state.theme === 'dark' ? '#06b6d4' : '#6366f1';
    
    // Outer border
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 12;
    ctx.strokeRect(15, 15, w - 30, h - 30);
    
    // Inner glass border
    ctx.strokeStyle = state.theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 2;
    ctx.strokeRect(32, 32, w - 64, h - 64);
    
    // Decorative glows (ambient blobs)
    ctx.beginPath();
    ctx.arc(w - 50, 50, 150, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(accentColor, 0.04);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(50, h - 50, 150, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba('#a855f7', 0.04);
    ctx.fill();

    // 3. Header Texts
    ctx.textAlign = 'center';
    ctx.font = 'bold 38px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = state.theme === 'dark' ? '#ffffff' : '#0f172a';
    ctx.fillText('TYPEFLOW CERTIFICATE', w / 2, 85);
    
    ctx.font = '500 15px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = state.theme === 'dark' ? '#64748b' : '#94a3b8';
    const dateStr = new Date().toLocaleDateString(undefined, { dateStyle: 'long' });
    ctx.fillText(`Verified keyboard speed competency on ${dateStr}`, w / 2, 120);
    
    // Divider line
    ctx.strokeStyle = state.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.moveTo(120, 145);
    ctx.lineTo(w - 120, 145);
    ctx.stroke();
    
    // 4. Large stats columns
    const metrics = [
      { label: 'WPM Speed', val: state.finalWpm, col: accentColor },
      { label: 'Accuracy', val: `${state.accuracy}%`, col: state.theme === 'dark' ? '#10b981' : '#059669' },
      { label: 'Consistency', val: `${state.consistency}%`, col: '#a855f7' },
      { label: 'Peak Streak', val: `${state.peakStreak} keys`, col: '#ec4899' }
    ];
    
    const startX = 140;
    const spacingX = (w - 280) / 3;
    
    metrics.forEach((m, idx) => {
      const x = startX + idx * spacingX;
      
      // Value
      ctx.textAlign = 'center';
      ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = m.col;
      ctx.fillText(m.val, x, 240);
      
      // Label
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = state.theme === 'dark' ? '#4b5563' : '#94a3b8';
      ctx.fillText(m.label.toUpperCase(), x, 270);
    });
    
    // Detailed test profile footer sub-bar
    ctx.fillStyle = state.theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
    ctx.fillRect(80, 305, w - 160, 45);
    ctx.strokeStyle = state.theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    ctx.strokeRect(80, 305, w - 160, 45);
    
    ctx.textAlign = 'left';
    ctx.font = '600 13px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = state.theme === 'dark' ? '#94a3b8' : '#475569';
    ctx.fillText(`Difficulty:  ${state.difficulty.toUpperCase()}`, 110, 332);
    ctx.fillText(`Test Duration:  ${state.duration} seconds`, 310, 332);
    
    const totalMistakes = Object.values(state.mistakeMap).reduce((a, b) => a + b, 0);
    ctx.fillText(`Total Mistakes:  ${totalMistakes}`, 580, 332);
    
    // 5. Draw Achievement Badge
    const badge = getBadgeName(state.finalWpm);
    
    ctx.save();
    ctx.translate(w / 2, 435);
    
    // Badge outer glowing orbit ring
    ctx.beginPath();
    ctx.arc(0, -10, 32, 0, Math.PI * 2);
    ctx.fillStyle = state.theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
    ctx.fill();
    
    const badgeColor = badge === 'Grandmaster' ? '#c084fc' : 
                       badge === 'Master' ? '#38bdf8' :
                       badge === 'Expert' ? '#fbbf24' :
                       badge === 'Intermediate' ? '#cbd5e1' : '#cd7f32';
                       
    ctx.strokeStyle = badgeColor;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, -10, 26, 0, Math.PI * 2);
    ctx.stroke();
    
    // Center Star/Badge geometry
    ctx.fillStyle = badgeColor;
    ctx.beginPath();
    ctx.moveTo(0, -28); 
    ctx.lineTo(6, -16);
    ctx.lineTo(18, -10); 
    ctx.lineTo(6, -4);
    ctx.lineTo(0, 8); 
    ctx.lineTo(-6, -4);
    ctx.lineTo(-18, -10); 
    ctx.lineTo(-6, -16);
    ctx.closePath();
    ctx.fill();
    
    // Core white diamond dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(3, -10);
    ctx.lineTo(0, -4);
    ctx.lineTo(-3, -10);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
    
    // Badge Title
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = badgeColor;
    ctx.fillText(`${badge.toUpperCase()} RANK ACHIEVED`, w / 2, 485);
    
    // Footer signature branding
    ctx.textAlign = 'right';
    ctx.font = 'italic 11px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = state.theme === 'dark' ? '#374151' : '#94a3b8';
    ctx.fillText('Powered by TypeFlow Core Engine', w - 45, 515);
    
    // 6. Initiate PNG download trigger
    const dataUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.download = `typeflow-results-${state.difficulty}-${state.finalWpm}wpm.png`;
    downloadLink.href = dataUrl;
    downloadLink.click();
  } catch (err) {
    console.error("Canvas export failed:", err);
  }
}
