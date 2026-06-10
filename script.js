/**
 * TypeFlow v2 - Modular Controller
 * Orchestrates event handlers, key inputs, loops, and modal state
 */

import { state, resetState } from './js/state.js';
import { 
  loadAllSettings, 
  saveSetting, 
  getPersonalRecords, 
  savePerformanceAndCheckAchievements 
} from './js/storage.js';
import { 
  playKeySound, 
  showSoundToggleToast, 
  initAudio 
} from './js/audio.js';
import { 
  calculateRealTimeMetrics, 
  incrementStreak, 
  resetStreak, 
  recordMistake, 
  updateWpmTrend 
} from './js/stats.js';
import { 
  loadNewParagraphText,
  renderParagraphDOM, 
  updateCaretPosition, 
  updateWordHighlights, 
  scrollActiveWordIntoView 
} from './js/typing.js';
import { 
  drawWpmHistoryChart, 
  renderMistakesHeatmap, 
  renderAchievementsPanel, 
  displayPBComparisons 
} from './js/ui.js';
import { exportResultsCertificate } from './js/export.js';

// DOM selectors
const wordsContainer = document.getElementById('words');
const hiddenInput = document.getElementById('hidden-input');
const caret = document.getElementById('caret');
const typingOverlay = document.getElementById('typing-overlay');
const typingCard = document.getElementById('typing-card');
const overlayMsg = typingOverlay.querySelector('.overlay-msg');
const timerVal = document.getElementById('timer-val');
const timerProgress = document.getElementById('timer-progress');
const streakIndicator = document.getElementById('streak-indicator');

// Live metric widgets
const liveWpm = document.getElementById('live-wpm');
const liveWpmTrend = document.getElementById('live-wpm-trend');
const liveAccuracy = document.getElementById('live-accuracy');
const liveConsistency = document.getElementById('live-consistency');
const liveProgress = document.getElementById('live-progress');

// Settings control elements
const dailyChallengeBtn = document.getElementById('daily-challenge-btn');
const difficultySelect = document.getElementById('difficulty-select');
const durationSelect = document.getElementById('duration-select');
const focusToggle = document.getElementById('focus-toggle');
const soundToggle = document.getElementById('sound-toggle');
const themeToggle = document.getElementById('theme-toggle');
const restartBtn = document.getElementById('restart-btn');
const newParaBtn = document.getElementById('new-para-btn');

// Results modal elements
const resultsModal = document.getElementById('results-modal');
const modalWpm = document.getElementById('modal-wpm');
const modalAccuracy = document.getElementById('modal-accuracy');
const modalConsistency = document.getElementById('modal-consistency');
const modalDifficulty = document.getElementById('modal-difficulty');
const modalTotalKeys = document.getElementById('modal-total-keys');
const modalCorrectKeys = document.getElementById('modal-correct-keys');
const modalIncorrectKeys = document.getElementById('modal-incorrect-keys');
const modalPeakWpm = document.getElementById('modal-peak-wpm');
const modalAvgWpm = document.getElementById('modal-avg-wpm');
const badgeIconBox = document.getElementById('badge-icon-box');
const badgeName = document.getElementById('badge-name');
const motivationalMsg = document.getElementById('motivational-message');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalNewParaBtn = document.getElementById('modal-new-para-btn');
const exportImgBtn = document.getElementById('export-img-btn');
const mistakeHeatmap = document.getElementById('mistake-heatmap');
const achievementsShowcase = document.getElementById('achievements-showcase');

// App container for mobile layouts
const appContainer = document.querySelector('.app-container');

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  try {
    // 1. Load settings & records
    loadAllSettings();
    syncUIWithSettings();
    
    // 2. Set up event bindings
    bindEvents();
    
    // 3. Load initial text and reset UI
    resetTestFlow();
    
    // 4. Update achievements and personal best grids
    updatePBStatsDisplay();
  } catch (err) {
    console.error("Initialization failed:", err);
  }
});

function syncUIWithSettings() {
  // Theme sync
  document.documentElement.setAttribute('data-theme', state.theme);
  updateThemeIcons();
  
  // Sound sync
  updateSoundIcons();
  
  // Segmented controls sync
  updateSegmentedControl('difficulty-select', 'data-difficulty', state.difficulty);
  updateSegmentedControl('duration-select', 'data-duration', state.duration.toString());
  
  // Daily challenge button sync
  state.isDailyChallenge = localStorage.getItem('tf-daily') === 'true';
  if (state.isDailyChallenge) {
    dailyChallengeBtn.classList.add('active');
  } else {
    dailyChallengeBtn.classList.remove('active');
  }
}

function updateThemeIcons() {
  const sunIcon = document.getElementById('theme-icon-sun');
  const moonIcon = document.getElementById('theme-icon-moon');
  if (state.theme === 'light') {
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
  } else {
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
  }
}

function updateSoundIcons() {
  const soundOff = document.getElementById('sound-icon-off');
  const soundOn = document.getElementById('sound-icon-on');
  if (state.isSoundEnabled) {
    soundOff.classList.add('hidden');
    soundOn.classList.remove('hidden');
  } else {
    soundOff.classList.remove('hidden');
    soundOn.classList.add('hidden');
  }
}

function updateSegmentedControl(containerId, attribute, activeVal) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const btns = container.querySelectorAll('.control-btn');
  btns.forEach(btn => {
    if (btn.getAttribute(attribute) === activeVal) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

/* ==========================================================================
   EVENT HANDLERS & REGISTRATIONS
   ========================================================================== */

function bindEvents() {
  // Focus capturing click
  typingCard.addEventListener('click', () => {
    if (!state.isTestFinished) {
      hiddenInput.focus({ preventScroll: true });
    }
  });
  
  typingOverlay.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!state.isTestFinished) {
      hiddenInput.focus({ preventScroll: true });
    }
  });
  
  hiddenInput.addEventListener('focus', () => {
    typingCard.classList.add('focused');
    if (state.isTimerStarted && !state.isTestFinished && !state.timerIntervalId) {
      resumeTimerFlow();
    }
    caret.classList.add('typing');
    updateCaretPosition(caret, wordsContainer);
  });
  
  hiddenInput.addEventListener('blur', () => {
    typingCard.classList.remove('focused');
    caret.classList.remove('typing');
    
    // Pause active test
    if (state.isTimerStarted && !state.isTestFinished) {
      pauseTimerFlow();
      overlayMsg.textContent = "Test paused. Click to resume typing";
    }
  });

  // Typing inputs and prevent paste
  hiddenInput.addEventListener('input', handleInputs);
  hiddenInput.addEventListener('keydown', handleKeydowns);
  hiddenInput.addEventListener('paste', e => e.preventDefault());

  // Segmented selectors
  difficultySelect.addEventListener('click', (e) => {
    const btn = e.target.closest('.control-btn');
    if (!btn) return;
    const diff = btn.getAttribute('data-difficulty');
    
    // Disable Daily Challenge if user manually changes difficulty
    if (state.isDailyChallenge) {
      toggleDailyChallengeSetting(false);
    }
    
    state.difficulty = diff;
    saveSetting('difficulty', diff);
    updateSegmentedControl('difficulty-select', 'data-difficulty', diff);
    loadNewParagraph();
  });

  durationSelect.addEventListener('click', (e) => {
    const btn = e.target.closest('.control-btn');
    if (!btn) return;
    const dur = parseInt(btn.getAttribute('data-duration'), 10);
    
    state.duration = dur;
    state.timeLeft = dur;
    saveSetting('duration', dur.toString());
    updateSegmentedControl('duration-select', 'data-duration', dur.toString());
    resetTestFlow();
  });

  // Special Daily Challenge click
  dailyChallengeBtn.addEventListener('click', () => {
    toggleDailyChallengeSetting(!state.isDailyChallenge);
    loadNewParagraph();
  });

  // Quick Action bars
  focusToggle.addEventListener('click', toggleFocusModeUI);
  soundToggle.addEventListener('click', toggleSoundSettings);
  themeToggle.addEventListener('click', toggleThemeUI);

  // Restart buttons
  restartBtn.addEventListener('click', resetTestFlow);
  newParaBtn.addEventListener('click', loadNewParagraph);
  
  modalCloseBtn.addEventListener('click', () => {
    closeResultsModal();
    resetTestFlow();
  });
  modalNewParaBtn.addEventListener('click', () => {
    closeResultsModal();
    loadNewParagraph();
  });
  exportImgBtn.addEventListener('click', exportResultsCertificate);

  // Keyboard Shortcuts
  document.addEventListener('keydown', handleShortcuts);
}

/* ==========================================================================
   TYPING WORKFLOW ENGINE
   ========================================================================== */

function resetTestFlow() {
  try {
    resetState();
    
    // Restore UI metrics
    hiddenInput.value = '';
    hiddenInput.disabled = false;
    
    timerVal.textContent = state.timeLeft;
    timerProgress.style.strokeDasharray = '100, 100';
    
    // Load paragraph and bind DOM
    if (!state.paragraph) {
      loadNewParagraphText();
    }
    hiddenInput.maxLength = state.paragraph.length;
    renderParagraphDOM(wordsContainer);
    
    // Caret and streak reset
    caret.style.display = 'none';
    caret.classList.remove('typing');
    updateStreakUI();
    updateTrendUI(true);
    
    liveWpm.textContent = '0';
    liveAccuracy.textContent = '100%';
    liveConsistency.textContent = '100%';
    liveProgress.textContent = '0%';
    
    // After rendering, ensure container scroll is reset and caret positioned at start
    wordsContainer.scrollTop = 0;
    updateCaretPosition(caret, wordsContainer);
    // Ensure first character is active for correct highlighting
    const firstChar = wordsContainer.querySelector('.char');
    if (firstChar) {
      firstChar.classList.add('active');
    }
    updateWordHighlights(wordsContainer);
    updateStreakUI();
    
    // Clear layout classes
    typingCard.classList.remove('focused');
    appContainer.classList.remove('typing-active');
    overlayMsg.textContent = "Click here or press any key to focus and start typing";
    
    closeResultsModal();
  } catch (err) {
    console.error("Failed to reset test:", err);
  }
}

function loadNewParagraph() {
  loadNewParagraphText();
  resetTestFlow();
}

function handleKeydowns(e) {
  if (state.isTestFinished) return;
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  
  const expectedChar = state.paragraph[state.charIndex];

  if (e.key === 'Backspace') {
    playKeySound('backspace');
    state.totalKeystrokes++;
    
    // Interrupting resets typing combo streak
    resetStreak();
    updateStreakUI();
    return;
  }

  if (e.key.length === 1) {
    // Start timer on first valid keydown
    if (!state.isTimerStarted) {
      startTimerFlow();
    }
    
    state.totalKeystrokes++;
    
    if (e.key === expectedChar) {
      playKeySound('correct');
      state.correctKeystrokes++;
      state.correctKeyTimestamps.push(performance.now());
      
      incrementStreak();
      updateStreakUI();
    } else {
      playKeySound('incorrect');
      state.incorrectKeystrokes++;
      
      resetStreak();
      updateStreakUI();
      recordMistake(expectedChar);
    }
  }
}

function handleInputs() {
  if (state.isTestFinished) return;
  
  const typedText = hiddenInput.value;
  state.charIndex = typedText.length;
  
  // Calculate live progress %
  const progressPercent = Math.round((state.charIndex / state.paragraph.length) * 100);
  liveProgress.textContent = `${progressPercent}%`;

  // Letter Highlights loops
  const charSpans = wordsContainer.querySelectorAll('.char');
  charSpans.forEach((span, idx) => {
    if (idx < typedText.length) {
      if (typedText[idx] === state.paragraph[idx]) {
        span.className = 'char correct';
      } else {
        span.className = 'char incorrect';
      }
    } else if (idx === typedText.length) {
      span.className = 'char active';
    } else {
      span.className = 'char';
    }
  });

  // Update DOM positioning updates
  updateCaretPosition(caret, wordsContainer);
  updateWordHighlights(wordsContainer);
  scrollActiveWordIntoView(wordsContainer);

  // Calculate live stats
  calculateRealTimeMetrics();
  updateLiveMetricsUI();
  
  // Check text completed early
  if (typedText.length >= state.paragraph.length) {
    endTestFlow();
  }
}

function updateStreakUI() {
  if (state.streak >= 5) {
    streakIndicator.textContent = `🔥 ${state.streak} streak`;
    streakIndicator.classList.add('active');
    
    // Visual streak pop at multiples of 10
    if (state.streak % 10 === 0) {
      streakIndicator.classList.add('pop');
      setTimeout(() => streakIndicator.classList.remove('pop'), 150);
    }
  } else {
    streakIndicator.classList.remove('active');
  }
}

function updateLiveMetricsUI() {
  liveWpm.textContent = state.finalWpm;
  liveAccuracy.textContent = `${state.accuracy}%`;
  liveConsistency.textContent = `${state.consistency}%`;
}

function updateTrendUI(reset = false) {
  if (reset) {
    liveWpmTrend.className = 'wpm-trend-badge';
    return;
  }
  
  updateWpmTrend();
  
  if (state.isTimerStarted && state.wpmHistory.length > 0) {
    liveWpmTrend.classList.add('active');
    if (state.wpmTrend > 0) {
      liveWpmTrend.className = 'wpm-trend-badge active up';
      liveWpmTrend.textContent = `↑ +${state.wpmTrend}`;
    } else if (state.wpmTrend < 0) {
      liveWpmTrend.className = 'wpm-trend-badge active down';
      liveWpmTrend.textContent = `↓ ${state.wpmTrend}`;
    } else {
      liveWpmTrend.className = 'wpm-trend-badge active stable';
      liveWpmTrend.textContent = `=`;
    }
  } else {
    liveWpmTrend.className = 'wpm-trend-badge';
  }
}

/* ==========================================================================
   TIMER LOOP
   ========================================================================== */

function startTimerFlow() {
  state.isTimerStarted = true;
  initAudio();
  
  // Apply layout active typing classes (triggers mobile sticky)
  typingCard.classList.add('focused');
  appContainer.classList.add('typing-active');
  
  state.timerIntervalId = setInterval(() => {
    state.timeLeft--;
    timerVal.textContent = state.timeLeft;
    
    const progress = (state.timeLeft / state.duration) * 100;
    timerProgress.style.strokeDasharray = `${progress}, 100`;
    
    calculateRealTimeMetrics();
    updateLiveMetricsUI();
    updateTrendUI();
    
    state.wpmHistory.push(state.finalWpm);
    
    if (state.timeLeft <= 0) {
      endTestFlow();
    }
  }, 1000);
}

function pauseTimerFlow() {
  clearInterval(state.timerIntervalId);
  state.timerIntervalId = null;
}

function resumeTimerFlow() {
  appContainer.classList.add('typing-active');
  state.timerIntervalId = setInterval(() => {
    state.timeLeft--;
    timerVal.textContent = state.timeLeft;
    
    const progress = (state.timeLeft / state.duration) * 100;
    timerProgress.style.strokeDasharray = `${progress}, 100`;
    
    calculateRealTimeMetrics();
    updateLiveMetricsUI();
    updateTrendUI();
    
    state.wpmHistory.push(state.finalWpm);
    
    if (state.timeLeft <= 0) {
      endTestFlow();
    }
  }, 1000);
}

/* ==========================================================================
   TEST ENDING & MODAL UPDATES
   ========================================================================== */

function endTestFlow() {
  pauseTimerFlow();
  state.isTestFinished = true;
  hiddenInput.disabled = true;
  typingCard.classList.remove('focused');
  appContainer.classList.remove('typing-active');
  
  if (state.wpmHistory.length === 0) {
    state.wpmHistory.push(state.finalWpm);
  }
  const sum = state.wpmHistory.reduce((a, b) => a + b, 0);
  state.averageWpm = Math.round(sum / state.wpmHistory.length);

  // Write metrics, check achievements, and compare PBs
  const { records, newlyUnlocked, pbDiffs } = savePerformanceAndCheckAchievements();
  
  // Open Results dashboard
  openResultsModal(pbDiffs);
}

function openResultsModal(pbDiffs) {
  resultsModal.classList.add('active');
  
  // Set stats texts
  modalWpm.textContent = state.finalWpm;
  modalAccuracy.textContent = `${state.accuracy}%`;
  modalConsistency.textContent = `${state.consistency}%`;
  modalDifficulty.textContent = state.difficulty;
  
  modalTotalKeys.textContent = state.totalKeystrokes;
  modalCorrectKeys.textContent = state.correctKeystrokes;
  modalIncorrectKeys.textContent = state.incorrectKeystrokes;
  
  modalPeakWpm.textContent = state.peakWpm;
  modalAvgWpm.textContent = state.averageWpm;
  
  // Rank badge updates
  const badge = getBadgeRank(state.finalWpm);
  badgeName.textContent = badge;
  renderRankBadgeSvg(badge);
  
  // Motivational tagline
  motivationalMsg.textContent = getMotivationQuote(state.finalWpm, state.accuracy);
  
  // Heatmap & Achievements Checkbox renderers
  renderMistakesHeatmap(mistakeHeatmap);
  renderAchievementsPanel(achievementsShowcase);
  
  // PB comparison indicators
  if (pbDiffs) {
    displayPBComparisons(pbDiffs);
  }
  
  // Canvas graph timeline
  setTimeout(() => {
    drawWpmHistoryChart('wpmChart');
  }, 100);
}

function closeResultsModal() {
  resultsModal.classList.remove('active');
}

function getBadgeRank(wpm) {
  if (wpm < 30) return 'Beginner';
  if (wpm < 55) return 'Intermediate';
  if (wpm < 80) return 'Expert';
  if (wpm < 100) return 'Master';
  return 'Grandmaster';
}

function getMotivationQuote(wpm, acc) {
  if (acc < 85) return "Aim for accuracy over speed. Speed will catch up!";
  if (wpm < 30) return "A solid start. Daily keyboard training will unlock muscle speed.";
  if (wpm < 55) return "Great job! You have reached professional keyboard typing speed.";
  if (wpm < 80) return "Excellent pace! You type faster than the average tech developer.";
  if (wpm < 100) return "Amazing control! You glide through characters like a master.";
  return "Incredible speed! You typed at a celestial Grandmaster pace.";
}

function renderRankBadgeSvg(badge) {
  const badgeColors = {
    'Beginner': { primary: '#cd7f32', secondary: '#8c521a' },
    'Intermediate': { primary: '#cbd5e1', secondary: '#64748b' },
    'Expert': { primary: '#fbbf24', secondary: '#d97706' },
    'Master': { primary: '#38bdf8', secondary: '#0284c7' },
    'Grandmaster': { primary: '#c084fc', secondary: '#7e22ce' }
  };
  const colors = badgeColors[badge] || badgeColors['Beginner'];
  
  let svgContent = '';
  if (badge === 'Beginner') {
    svgContent = `<circle cx="50" cy="50" r="40" fill="url(#bronze-grad)" stroke="${colors.primary}" stroke-width="4"/>
      <circle cx="50" cy="50" r="30" fill="none" stroke="${colors.secondary}" stroke-width="2" stroke-dasharray="4 4"/>
      <path d="M50 30L55 45H70L58 55L63 70L50 60L37 70L42 55L30 45H45L50 30Z" fill="${colors.secondary}"/>
      <defs>
        <linearGradient id="bronze-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#e7a772"/>
          <stop offset="100%" stop-color="#8c521a"/>
        </linearGradient>
      </defs>`;
  } else if (badge === 'Intermediate') {
    svgContent = `<circle cx="50" cy="50" r="40" fill="url(#silver-grad)" stroke="${colors.primary}" stroke-width="4"/>
      <path d="M50 25C36.2 25 25 36.2 25 50C25 63.8 36.2 75 50 75C63.8 75 75 63.8 75 50C75 36.2 63.8 25 50 25ZM50 67C40.6 67 33 59.4 33 50C33 40.6 40.6 33 50 33C59.4 33 67 40.6 67 50C67 59.4 59.4 67 50 67Z" fill="${colors.secondary}"/>
      <path d="M50 40L53 48H61L55 53L57 61L50 56L43 61L45 53L39 48H47L50 40Z" fill="${colors.primary}"/>
      <defs>
        <linearGradient id="silver-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f1f5f9"/>
          <stop offset="100%" stop-color="#94a3b8"/>
        </linearGradient>
      </defs>`;
  } else if (badge === 'Expert') {
    svgContent = `<path d="M50 10L85 30V70L50 90L15 70V30L50 10Z" fill="url(#gold-grad)" stroke="${colors.primary}" stroke-width="4"/>
      <path d="M50 20L77 36V64L50 80L23 64V36L50 20Z" fill="none" stroke="${colors.secondary}" stroke-width="2"/>
      <path d="M50 35L54 45H65L57 52L60 62L50 56L40 62L43 52L35 45H46L50 35Z" fill="${colors.secondary}"/>
      <defs>
        <linearGradient id="gold-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fde047"/>
          <stop offset="100%" stop-color="#d97706"/>
        </linearGradient>
      </defs>`;
  } else if (badge === 'Master') {
    svgContent = `<path d="M50 8L88 30V70L50 92L12 70V30L50 8Z" fill="url(#platinum-grad)" stroke="${colors.primary}" stroke-width="4"/>
      <path d="M50 22L70 42V58L50 78L30 58V42L50 22Z" fill="none" stroke="${colors.secondary}" stroke-width="2"/>
      <circle cx="50" cy="50" r="10" fill="${colors.secondary}"/>
      <path d="M50 35L52 43H60L54 48L56 56L50 51L44 56L46 48L40 43H48L50 35Z" fill="#ffffff"/>
      <defs>
        <linearGradient id="platinum-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#bae6fd"/>
          <stop offset="50%" stop-color="#0284c7"/>
          <stop offset="100%" stop-color="#0369a1"/>
        </linearGradient>
      </defs>`;
  } else {
    svgContent = `<path d="M50 5L92 28V72L50 95L8 72V28L50 5Z" fill="url(#gm-grad)" stroke="#c084fc" stroke-width="4"/>
      <path d="M50 18L78 35V65L50 82L22 35V65L50 18Z" fill="none" stroke="#e9d5ff" stroke-width="1.5" stroke-dasharray="3 3"/>
      <polygon points="50,25 65,50 50,75 35,50" fill="url(#gm-inner-grad)"/>
      <circle cx="50" cy="50" r="6" fill="#ffffff"/>
      <defs>
        <linearGradient id="gm-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f472b6"/>
          <stop offset="50%" stop-color="#c084fc"/>
          <stop offset="100%" stop-color="#3b82f6"/>
        </linearGradient>
        <linearGradient id="gm-inner-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#a855f7"/>
        </linearGradient>
      </defs>`;
  }
  
  badgeIconBox.innerHTML = `<svg class="badge-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`;
}

function updatePBStatsDisplay() {
  const records = getPersonalRecords();
  
  const pbWpmVal = document.getElementById('pb-wpm');
  const pbAccuracyVal = document.getElementById('pb-accuracy');
  const pbCompletedVal = document.getElementById('pb-completed');
  const pbTimeVal = document.getElementById('pb-time');
  
  if (pbWpmVal) pbWpmVal.textContent = records.bestWPM;
  if (pbAccuracyVal) pbAccuracyVal.textContent = `${records.bestAccuracy}%`;
  if (pbCompletedVal) pbCompletedVal.textContent = records.testsCompleted;
  
  if (pbTimeVal) {
    let seconds = records.totalTypingTime;
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      pbTimeVal.textContent = `${mins}m ${secs}s`;
    } else {
      pbTimeVal.textContent = `${seconds}s`;
    }
  }
}

/* ==========================================================================
   SETTINGS METADATA WRITERS
   ========================================================================== */

function toggleDailyChallengeSetting(enable) {
  state.isDailyChallenge = enable;
  saveSetting('daily', enable.toString());
  if (enable) {
    dailyChallengeBtn.classList.add('active');
  } else {
    dailyChallengeBtn.classList.remove('active');
  }
}

function toggleFocusModeUI() {
  state.isFocusMode = !state.isFocusMode;
  if (state.isFocusMode) {
    document.body.classList.add('focus-mode');
  } else {
    document.body.classList.remove('focus-mode');
  }
  setTimeout(() => updateCaretPosition(caret, wordsContainer), 100);
}

function toggleSoundSettings() {
  state.isSoundEnabled = !state.isSoundEnabled;
  saveSetting('sound', state.isSoundEnabled.toString());
  updateSoundIcons();
  
  if (state.isSoundEnabled) {
    initAudio();
  }
  showSoundToggleToast(state.isSoundEnabled);
}

function toggleThemeUI() {
  const next = state.theme === 'dark' ? 'light' : 'dark';
  state.theme = next;
  document.documentElement.setAttribute('data-theme', next);
  saveSetting('theme', next);
  updateThemeIcons();
  
  if (resultsModal.classList.contains('active')) {
    drawWpmHistoryChart('wpmChart');
  }
}

/* ==========================================================================
   GLOBAL KEYBOARD SHORTCUTS
   ========================================================================== */

function handleShortcuts(e) {
  // 1. Esc -> Restart or exit focus mode
  if (e.key === 'Escape') {
    e.preventDefault();
    if (state.isFocusMode) {
      toggleFocusModeUI();
    } else {
      resetTestFlow();
    }
  }

  // 2. Ctrl + R -> New Paragraph
  if (e.ctrlKey && e.key.toLowerCase() === 'r') {
    e.preventDefault();
    loadNewParagraph();
  }

  // 3. Tab + Enter -> Quick Restart
  if (e.key === 'Tab') {
    window._tabPressedTime = performance.now();
  }
  if (e.key === 'Enter' && window._tabPressedTime && (performance.now() - window._tabPressedTime < 1000)) {
    e.preventDefault();
    window._tabPressedTime = 0;
    resetTestFlow();
  }

  // 4. Ctrl + D -> Toggle Theme
  if (e.ctrlKey && e.key.toLowerCase() === 'd') {
    e.preventDefault();
    toggleThemeUI();
  }

  // 5. Ctrl + M -> Toggle Sound
  if (e.ctrlKey && e.key.toLowerCase() === 'm') {
    e.preventDefault();
    toggleSoundSettings();
  }

  // 6. Ctrl + F -> Toggle Focus Mode
  if (e.ctrlKey && e.key.toLowerCase() === 'f') {
    e.preventDefault();
    toggleFocusModeUI();
  }

  // 7. Shortcut: 'F' toggles Focus Mode when typing input is NOT focused and modal is NOT active
  if (e.key.toLowerCase() === 'f' && 
      document.activeElement !== hiddenInput && 
      !resultsModal.classList.contains('active') &&
      !e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault();
    toggleFocusModeUI();
  }

  // 8. Autofocus input on pressing any valid typing character key when not focused
  if (document.activeElement !== hiddenInput && 
      !resultsModal.classList.contains('active') && 
      !e.ctrlKey && !e.altKey && !e.metaKey && 
      e.key.length === 1) {
    hiddenInput.focus({ preventScroll: true });
  }
}
