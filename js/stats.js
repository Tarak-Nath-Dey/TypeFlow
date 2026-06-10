/**
 * TypeFlow Stats Calculation Module
 */
import { state } from './state.js';

/**
 * Calculates current WPM, accuracy, consistency, combo streaks, and trend indicators
 */
export function calculateRealTimeMetrics() {
  try {
    const elapsed = state.duration - state.timeLeft;
    
    // 1. Calculate WPM
    // Get total correct characters currently typed
    const charSpans = document.querySelectorAll('#words .char');
    let correctCount = 0;
    
    charSpans.forEach((span, idx) => {
      if (idx < state.charIndex && span.classList.contains('correct')) {
        correctCount++;
      }
    });
    
    if (elapsed > 0) {
      const calculatedWpm = (correctCount / 5) / (elapsed / 60);
      state.finalWpm = Math.round(calculatedWpm);
      
      if (state.finalWpm > state.peakWpm) {
        state.peakWpm = state.finalWpm;
      }
    } else {
      state.finalWpm = 0;
    }
    
    // 2. Calculate Accuracy
    if (state.totalKeystrokes > 0) {
      state.accuracy = Math.round((state.correctKeystrokes / state.totalKeystrokes) * 100);
    } else {
      state.accuracy = 100;
    }
    
    // 3. Calculate Consistency Score (Math stdDev based)
    state.consistency = calculateConsistencyScore();
  } catch (err) {
    console.error("Failed to calculate typing metrics:", err);
  }
}

/**
 * Calculates typing consistency using Standard Deviation of correct keys intervals
 */
export function calculateConsistencyScore() {
  if (state.correctKeyTimestamps.length < 5) {
    return 100;
  }
  
  const intervals = [];
  for (let i = 1; i < state.correctKeyTimestamps.length; i++) {
    const gap = state.correctKeyTimestamps[i] - state.correctKeyTimestamps[i - 1];
    // Filter out huge pauses (e.g. standard developer pauses > 1.5 seconds)
    if (gap < 1500) {
      intervals.push(gap);
    }
  }
  
  if (intervals.length < 4) return 100;
  
  const sum = intervals.reduce((acc, val) => acc + val, 0);
  const mean = sum / intervals.length;
  
  const varianceSum = intervals.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
  const variance = varianceSum / intervals.length;
  const stdDev = Math.sqrt(variance);
  
  const cv = stdDev / mean;
  return Math.max(0, Math.min(100, Math.round(100 * (1 - cv))));
}

/**
 * Updates WPM Trend delta
 */
export function updateWpmTrend() {
  if (state.wpmHistory.length > 0) {
    const previousWpm = state.wpmHistory[state.wpmHistory.length - 1];
    state.wpmTrend = state.finalWpm - previousWpm;
  } else {
    state.wpmTrend = 0;
  }
}

/**
 * Increments current correct typing streak
 */
export function incrementStreak() {
  state.streak++;
  if (state.streak > state.peakStreak) {
    state.peakStreak = state.streak;
  }
}

/**
 * Resets streak on mistake
 */
export function resetStreak() {
  state.streak = 0;
}

/**
 * Tracks expected character that was missed
 */
export function recordMistake(expectedChar) {
  if (!expectedChar) return;
  // Normalize whitespaces or empty chars to 'space'
  const charKey = expectedChar === ' ' ? 'space' : expectedChar;
  state.mistakeMap[charKey] = (state.mistakeMap[charKey] || 0) + 1;
}

/**
 * Returns sorted list of mistakes e.g. [{ letter: 'e', count: 5 }, ...]
 */
export function getSortedMistakes() {
  return Object.entries(state.mistakeMap)
    .map(([letter, count]) => ({ letter, count }))
    .sort((a, b) => b.count - a.count);
}
