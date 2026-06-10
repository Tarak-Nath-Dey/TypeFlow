/**
 * TypeFlow Web Audio Synth Module
 */
import { state } from './state.js';

let audioCtx = null;

/**
 * Initializes/resumes audio context safely
 */
export function initAudio() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch (err) {
    console.error("Failed to initialize AudioContext:", err);
  }
}

/**
 * Programmatically synthesizes mechanical key and buzz sounds
 */
export function playKeySound(type) {
  if (!state.isSoundEnabled) return;
  
  try {
    initAudio();
    if (!audioCtx) return;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    if (type === 'correct') {
      // Light mechanical click
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.04);
      
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      
      osc.start(now);
      osc.stop(now + 0.045);
    } else if (type === 'incorrect') {
      // Soft buzz warning
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      
      osc.start(now);
      osc.stop(now + 0.155);
    } else if (type === 'backspace') {
      // Soft mechanical key reset
      osc.type = 'sine';
      osc.frequency.setValueAtTime(550, now);
      osc.frequency.exponentialRampToValueAtTime(250, now + 0.03);
      
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      
      osc.start(now);
      osc.stop(now + 0.035);
    }
  } catch (err) {
    console.warn("Audio synth error:", err);
  }
}

/**
 * Spawns a beautiful, pulsing sound state toast in the middle of the screen
 */
export function showSoundToggleToast(isEnabled) {
  try {
    let toast = document.getElementById('sound-feedback-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'sound-feedback-toast';
      toast.className = 'sound-toast';
      document.body.appendChild(toast);
    }
    
    toast.innerHTML = isEnabled ? '🔊 ON' : '🔇 OFF';
    toast.classList.remove('pulse-animation');
    
    // Force reflow to restart CSS animation
    void toast.offsetWidth;
    
    toast.className = 'sound-toast active pulse-animation';
    
    if (window._soundToastTimeout) {
      clearTimeout(window._soundToastTimeout);
    }
    
    window._soundToastTimeout = setTimeout(() => {
      toast.classList.remove('active');
    }, 900);
  } catch (err) {
    console.error("Toast spawn error:", err);
  }
}
