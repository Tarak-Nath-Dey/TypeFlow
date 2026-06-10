/**
 * TypeFlow UI Rendering Module
 */
import { state } from './state.js';
import { ACHIEVEMENTS, getUnlockedAchievements } from './storage.js';
import { getSortedMistakes } from './stats.js';

/**
 * Draws the WPM timeline graph inside the results canvas
 */
export function drawWpmHistoryChart(canvasId) {
  try {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Support high-res retina displays
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = 140 * 2;
    
    const w = canvas.width;
    const h = canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    let history = [...state.wpmHistory];
    if (history.length === 0) return;
    if (history.length === 1) {
      history = [0, history[0]];
    }
    
    const maxVal = Math.max(...history, 60);
    const minVal = 0;
    
    const padL = 60;
    const padR = 30;
    const padT = 30;
    const padB = 40;
    
    const graphW = w - padL - padR;
    const graphH = h - padT - padB;
    
    const styleTokens = getComputedStyle(document.documentElement);
    const gridColor = styleTokens.getPropertyValue('--border-color') || 'rgba(255,255,255,0.08)';
    const textColor = styleTokens.getPropertyValue('--text-muted') || '#475569';
    const accentColor = styleTokens.getPropertyValue('--accent') || '#06b6d4';
    
    // Draw horizontal gridlines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 2;
    ctx.fillStyle = textColor;
    ctx.font = '20px system-ui, sans-serif';
    
    const gridCount = 4;
    for (let i = 0; i <= gridCount; i++) {
      const val = Math.round(minVal + (maxVal - minVal) * (i / gridCount));
      const y = h - padB - (i / gridCount) * graphH;
      
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
      
      ctx.fillText(`${val}`, 12, y + 6);
    }
    
    // Map timeline coordinates
    const points = history.map((val, idx) => {
      const x = padL + (idx / (history.length - 1)) * graphW;
      const y = h - padB - ((val - minVal) / (maxVal - minVal)) * graphH;
      return { x, y };
    });
    
    // Area gradient under the line
    const fillGrad = ctx.createLinearGradient(0, padT, 0, h - padB);
    fillGrad.addColorStop(0, hexToRgba(accentColor, 0.22));
    fillGrad.addColorStop(1, hexToRgba(accentColor, 0.0));
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, h - padB);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, h - padB);
    ctx.closePath();
    ctx.fillStyle = fillGrad;
    ctx.fill();
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 5;
    ctx.stroke();
    
    // Draw node markers
    ctx.fillStyle = accentColor;
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });
  } catch (err) {
    console.error("Failed to draw WPM history graph:", err);
  }
}

/**
 * Converts a hex code to a formatted RGBA string
 */
function hexToRgba(hex, alpha) {
  hex = hex.trim();
  if (hex.startsWith('#')) {
    hex = hex.substring(1);
  }
  let r = 6, g = 182, b = 212;
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
 * Renders the Mistakes Heatmap layout
 */
export function renderMistakesHeatmap(container) {
  if (!container) return;
  container.innerHTML = '';
  
  const sortedMistakes = getSortedMistakes();
  
  if (sortedMistakes.length === 0) {
    container.innerHTML = `<div class="heatmap-empty">✨ Flawless typing! No mistakes recorded.</div>`;
    return;
  }
  
  // Render top 4 mistake letters
  const topMistakes = sortedMistakes.slice(0, 4);
  topMistakes.forEach(item => {
    const card = document.createElement('div');
    card.className = 'heatmap-card';
    
    const letterSpan = document.createElement('span');
    letterSpan.className = 'heatmap-letter';
    letterSpan.textContent = item.letter;
    
    const countSpan = document.createElement('span');
    countSpan.className = 'heatmap-count';
    countSpan.textContent = `${item.count} errors`;
    
    card.appendChild(letterSpan);
    card.appendChild(countSpan);
    container.appendChild(card);
  });
}

/**
 * Renders local achievements showcase panel
 */
export function renderAchievementsPanel(container) {
  if (!container) return;
  container.innerHTML = '';
  
  const unlocked = getUnlockedAchievements();
  
  Object.values(ACHIEVEMENTS).forEach(ach => {
    const isUnlocked = unlocked.includes(ach.id);
    
    const card = document.createElement('div');
    card.className = `achievement-item-card ${isUnlocked ? 'unlocked' : 'locked'}`;
    
    const iconDiv = document.createElement('div');
    iconDiv.className = 'ach-icon';
    iconDiv.textContent = ach.icon;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'ach-content';
    
    const title = document.createElement('h5');
    title.textContent = ach.title;
    
    const desc = document.createElement('p');
    desc.textContent = ach.description;
    
    contentDiv.appendChild(title);
    contentDiv.appendChild(desc);
    
    card.appendChild(iconDiv);
    card.appendChild(contentDiv);
    container.appendChild(card);
  });
}

/**
 * Injects comparison indicators (+/-) relative to Personal Best scores
 */
export function displayPBComparisons(diffs) {
  const wpmDiff = document.getElementById('modal-wpm-diff');
  const accDiff = document.getElementById('modal-accuracy-diff');
  
  if (!wpmDiff || !accDiff) return;
  
  // WPM diff styling
  if (diffs.wpm > 0) {
    wpmDiff.className = 'comparison-badge positive';
    wpmDiff.textContent = `↑ +${diffs.wpm} WPM (Best)`;
  } else if (diffs.wpm < 0) {
    wpmDiff.className = 'comparison-badge negative';
    wpmDiff.textContent = `↓ ${diffs.wpm} WPM`;
  } else {
    wpmDiff.className = 'comparison-badge equal';
    wpmDiff.textContent = `= Match Best`;
  }
  
  // Accuracy diff styling
  if (diffs.accuracy > 0) {
    accDiff.className = 'comparison-badge positive';
    accDiff.textContent = `↑ +${diffs.accuracy}% Accuracy`;
  } else if (diffs.accuracy < 0) {
    accDiff.className = 'comparison-badge negative';
    accDiff.textContent = `↓ ${diffs.accuracy}%`;
  } else {
    accDiff.className = 'comparison-badge equal';
    accDiff.textContent = `= Match Best`;
  }
}
