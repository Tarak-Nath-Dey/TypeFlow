/**
 * TypeFlow State & Paragraphs Module
 */

export const PARAGRAPHS = {
  easy: [
    "the quick brown fox jumps over the lazy dog they run across the green grass under the warm yellow sun all day long",
    "many people love to read books in their free time it helps them learn new things and dream of far away places and adventures",
    "code is just writing instructions for a computer to follow when you write clean code it runs fast and does not have bugs",
    "every morning the sun rises in the east and shines light upon the world making the trees and flowers grow big and tall",
    "typing fast is a skill that you can learn by practicing every day keep your hands in the right place and do not look down",
    "we should always be kind to others and help them when they are having a hard day a small smile can make someone happy again",
    "music has the power to make us feel happy or sad it can bring back old memories and make us want to dance with friends"
  ],
  medium: [
    "Web development is a creative field that combines design and logic. Programmers use languages like HTML, CSS, and JavaScript to build interactive websites.",
    "The stars in the night sky have always fascinated humanity. For thousands of years, ancient sailors used them to navigate across vast and dark oceans.",
    "Regular exercise, along with a balanced diet, is essential for maintaining physical and mental health. Even a simple walk outside can boost your energy.",
    "Learning a new language is a challenging but rewarding journey. It opens up opportunities to travel, connect with diverse cultures, and expand your mind.",
    "Deep in the forest, ancient trees stand tall as silent guardians of nature. The quiet rustle of leaves in the wind brings a feeling of deep peace.",
    "Technology is changing the way we work, communicate, and live. It is important to find a balance so we do not lose our connection with the real world.",
    "Artificial intelligence is developing rapidly, offering new tools to solve complex global issues, from climate change to medical diagnosis."
  ],
  hard: [
    "Executing `const api = new Service('v2', 443);` returned: { status: 'success', data: [99, 102, 244] }; however, the request took 450ms (latency limit: 200ms).",
    "In JavaScript, closures are created every time a function is created, at function creation time. As Douglas Crockford once stated: 'Good parts are worth mastering!'",
    "According to RFC-7519, JSON Web Tokens (JWT) consist of three parts: Header, Payload, and Signature; these parts are separated by dots (i.e. 'xxxx.yyyy.zzzz').",
    "While working on system-level performance, memory leaks (e.g. out-of-bounds array access) must be resolved immediately; check output in `/log/sys_09.txt`!",
    "The coefficient of variation (CV) is calculated using standard deviation divided by the mean (CV = \u03c3 / \u03bc). If CV > 0.5, the dataset shows high variation.",
    "To initialize the Git repository, execute: `git init && git add . && git commit -m 'Initial commit'`. Ensure you configure your `user.name` and `user.email`.",
    "We tested the UI response time using a 60Hz display, obtaining the following refresh values: [16.67ms, 33.33ms, 16.67ms]; consistency was estimated at 94.6%."
  ]
};

export const state = {
  difficulty: 'easy',
  duration: 60,
  timeLeft: 60,
  paragraph: '',
  charIndex: 0,
  isTimerStarted: false,
  isTestFinished: false,
  timerIntervalId: null,
  
  // Keystrokes counting
  totalKeystrokes: 0,
  correctKeystrokes: 0,
  incorrectKeystrokes: 0,
  
  // Real-time metrics
  wpmHistory: [],
  correctKeyTimestamps: [],
  peakWpm: 0,
  averageWpm: 0,
  finalWpm: 0,
  wpmTrend: 0, // Difference compared to 1 second ago
  accuracy: 100,
  consistency: 100,
  
  // Gamification features
  streak: 0,
  peakStreak: 0,
  mistakeMap: {}, // Expected char -> error count
  isDailyChallenge: false,
  
  // Settings
  isSoundEnabled: false,
  isFocusMode: false,
  theme: 'dark'
};

/**
 * Gets a deterministic paragraph for the current calendar date
 */
export function getDailyChallengeParagraph(difficulty) {
  const list = PARAGRAPHS[difficulty] || PARAGRAPHS['easy'];
  const today = new Date();
  // Generate date seed e.g. 20260610
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const index = seed % list.length;
  return list[index];
}

/**
 * Reset state values for a new test run
 */
export function resetState() {
  state.isTimerStarted = false;
  state.isTestFinished = false;
  state.timeLeft = state.duration;
  state.charIndex = 0;
  state.totalKeystrokes = 0;
  state.correctKeystrokes = 0;
  state.incorrectKeystrokes = 0;
  state.wpmHistory = [];
  state.correctKeyTimestamps = [];
  state.peakWpm = 0;
  state.averageWpm = 0;
  state.finalWpm = 0;
  state.wpmTrend = 0;
  state.accuracy = 100;
  state.consistency = 100;
  state.streak = 0;
  state.peakStreak = 0;
  state.mistakeMap = {};
  
  if (state.timerIntervalId) {
    clearInterval(state.timerIntervalId);
    state.timerIntervalId = null;
  }
}
