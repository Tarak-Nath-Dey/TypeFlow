/**
 * TypeFlow Storage & Achievements Module
 */
import { state } from './state.js';

// Achievements Definitions
export const ACHIEVEMENTS = {
  first_test: {
    id: 'first_test',
    title: 'First Flight',
    description: 'Complete your first typing speed test.',
    icon: '🚀'
  },
  speed_demon: {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Exceed 60 WPM in a test.',
    icon: '⚡'
  },
  speed_god: {
    id: 'speed_god',
    title: 'Centurion',
    description: 'Exceed 100 WPM in a test.',
    icon: '👑'
  },
  laser_focus: {
    id: 'laser_focus',
    title: 'Laser Focus',
    description: 'Finish a test with 98% accuracy or higher.',
    icon: '🎯'
  },
  consistency_king: {
    id: 'consistency_king',
    title: 'Consistency King',
    description: 'Maintain 90% typing consistency or higher.',
    icon: '⚖️'
  },
  streak_master: {
    id: 'streak_master',
    title: 'Streak Master',
    description: 'Reach a correct streak of 40 characters or higher.',
    icon: '🔥'
  }
};

/**
 * Loads and applies settings and local records
 */
export function loadAllSettings() {
  try {
    // Theme load
    state.theme = localStorage.getItem('tf-theme') || 'dark';
    
    // Sound load
    state.isSoundEnabled = localStorage.getItem('tf-sound') === 'true';
    
    // Difficulty load
    state.difficulty = localStorage.getItem('tf-difficulty') || 'easy';
    
    // Duration load
    state.duration = parseInt(localStorage.getItem('tf-duration') || '60', 10);
    state.timeLeft = state.duration;
  } catch (err) {
    console.error("Failed to load settings from LocalStorage:", err);
  }
}

/**
 * Saves a setting key-value pair
 */
export function saveSetting(key, value) {
  try {
    localStorage.setItem(`tf-${key}`, value);
  } catch (err) {
    console.error(`Failed to save setting ${key}:`, err);
  }
}

/**
 * Retrieves personal records
 */
export function getPersonalRecords() {
  try {
    return JSON.parse(localStorage.getItem('tf-records')) || {
      bestWPM: 0,
      bestAccuracy: 0,
      testsCompleted: 0,
      totalTypingTime: 0
    };
  } catch (err) {
    console.error("Failed to fetch records:", err);
    return { bestWPM: 0, bestAccuracy: 0, testsCompleted: 0, totalTypingTime: 0 };
  }
}

/**
 * Retrieves unlocked achievements list
 */
export function getUnlockedAchievements() {
  try {
    return JSON.parse(localStorage.getItem('tf-achievements')) || [];
  } catch (err) {
    console.error("Failed to fetch achievements:", err);
    return [];
  }
}

/**
 * Updates stats and triggers achievement evaluation.
 * Returns { records, newlyUnlocked, pbDiffs }
 */
export function savePerformanceAndCheckAchievements() {
  const pbDiffs = { wpm: 0, accuracy: 0 };
  const newlyUnlocked = [];
  let records = getPersonalRecords();
  
  try {
    const elapsed = state.duration - state.timeLeft;
    
    // Calculate differences against old records *before* updating
    if (records.testsCompleted > 0) {
      pbDiffs.wpm = state.finalWpm - records.bestWPM;
      pbDiffs.accuracy = state.accuracy - records.bestAccuracy;
    } else {
      pbDiffs.wpm = state.finalWpm;
      pbDiffs.accuracy = state.accuracy;
    }
    
    // Update local records values
    records.testsCompleted++;
    records.totalTypingTime += elapsed;
    
    if (state.finalWpm > records.bestWPM) {
      records.bestWPM = state.finalWpm;
    }
    if (state.accuracy > records.bestAccuracy) {
      records.bestAccuracy = state.accuracy;
    }
    
    localStorage.setItem('tf-records', JSON.stringify(records));
    
    // Check and unlock achievements
    const unlockedList = getUnlockedAchievements();
    
    // Check definitions
    if (!unlockedList.includes('first_test')) {
      newlyUnlocked.push('first_test');
    }
    if (state.finalWpm > 60 && !unlockedList.includes('speed_demon')) {
      newlyUnlocked.push('speed_demon');
    }
    if (state.finalWpm > 100 && !unlockedList.includes('speed_god')) {
      newlyUnlocked.push('speed_god');
    }
    if (state.accuracy >= 98 && state.totalKeystrokes > 30 && !unlockedList.includes('laser_focus')) {
      newlyUnlocked.push('laser_focus');
    }
    if (state.consistency >= 90 && state.correctKeyTimestamps.length > 20 && !unlockedList.includes('consistency_king')) {
      newlyUnlocked.push('consistency_king');
    }
    if (state.peakStreak >= 40 && !unlockedList.includes('streak_master')) {
      newlyUnlocked.push('streak_master');
    }
    
    if (newlyUnlocked.length > 0) {
      const updatedList = [...unlockedList, ...newlyUnlocked];
      localStorage.setItem('tf-achievements', JSON.stringify(updatedList));
    }
  } catch (err) {
    console.error("Error writing metrics and achievements:", err);
  }
  
  return { records, newlyUnlocked, pbDiffs };
}
