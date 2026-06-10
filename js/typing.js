/**
 * TypeFlow Typing Engine Rendering Module
 */
import { state, PARAGRAPHS, getDailyChallengeParagraph } from './state.js';

/**
 * Loads a new paragraph based on selected difficulty and daily challenge setting
 */
export function loadNewParagraphText() {
  let list = PARAGRAPHS[state.difficulty] || PARAGRAPHS['easy'];
  let newPara = '';
  
  if (state.isDailyChallenge) {
    newPara = getDailyChallengeParagraph(state.difficulty);
  } else {
    newPara = state.paragraph;
    // Select distinct paragraph from database
    while (newPara === state.paragraph && list.length > 1) {
      const idx = Math.floor(Math.random() * list.length);
      newPara = list[idx];
    }
    if (list.length === 1) {
      newPara = list[0];
    }
  }
  
  state.paragraph = newPara;
}

/**
 * Splits and renders the active paragraph as nested spans inside word container divs
 */
export function renderParagraphDOM(container) {
  if (!container) return;
  container.innerHTML = '';
  
  const words = state.paragraph.split(' ');
  words.forEach((wordText, wordIdx) => {
    const wordDiv = document.createElement('div');
    wordDiv.className = 'word';
    wordDiv.dataset.wordIdx = wordIdx;
    
    for (let i = 0; i < wordText.length; i++) {
      const charSpan = document.createElement('span');
      charSpan.className = 'char';
      charSpan.textContent = wordText[i];
      wordDiv.appendChild(charSpan);
    }
    
    // Trailing space (unless last word)
    if (wordIdx < words.length - 1) {
      const spaceSpan = document.createElement('span');
      spaceSpan.className = 'char space';
      spaceSpan.textContent = ' ';
      wordDiv.appendChild(spaceSpan);
    }
    
    container.appendChild(wordDiv);
  });
  
  // Set first character as active
  const firstChar = container.querySelector('.char');
  if (firstChar) {
    firstChar.classList.add('active');
  }
  
  // Set first word as active highlight
  const firstWord = container.querySelector('.word');
  if (firstWord) {
    firstWord.classList.add('active-word');
  }
}

/**
 * Aligns the gliding caret to the active character span
 */
export function updateCaretPosition(caretElement, containerElement) {
  if (!caretElement || !containerElement) return;
  
  const charSpans = containerElement.querySelectorAll('.char');
  if (charSpans.length === 0) return;
  
  caretElement.style.display = 'block';
  
  let targetSpan = charSpans[state.charIndex];
  const containerRect = containerElement.getBoundingClientRect();
  
  if (targetSpan) {
    const spanRect = targetSpan.getBoundingClientRect();
    caretElement.style.left = `${spanRect.left - containerRect.left}px`;
    caretElement.style.top = `${spanRect.top - containerRect.top}px`;
    caretElement.style.height = `${spanRect.height}px`;
  } else {
    // Caret at the end of the text (after last character)
    const lastSpan = charSpans[charSpans.length - 1];
    const spanRect = lastSpan.getBoundingClientRect();
    caretElement.style.left = `${spanRect.right - containerRect.left}px`;
    caretElement.style.top = `${spanRect.top - containerRect.top}px`;
    caretElement.style.height = `${spanRect.height}px`;
  }
}

/**
 * Handles highlight states of the active word
 */
export function updateWordHighlights(containerElement) {
  if (!containerElement) return;
  
  const activeChar = containerElement.querySelector('.char.active');
  const allWords = containerElement.querySelectorAll('.word');
  
  allWords.forEach(word => word.classList.remove('active-word'));
  
  if (activeChar) {
    const parentWord = activeChar.closest('.word');
    if (parentWord) {
      parentWord.classList.add('active-word');
    }
  }
}

/**
 * Centers the active row vertically within the container
 */
export function scrollActiveWordIntoView(containerElement) {
  if (!containerElement) return;
  
  const activeChar = containerElement.querySelector('.char.active');
  if (!activeChar) return;
  
  const activeWord = activeChar.closest('.word');
  if (!activeWord) return;
  
  const containerHeight = containerElement.clientHeight;
  const wordTop = activeWord.offsetTop;
  const wordHeight = activeWord.clientHeight;
  
  // Center scrolling layout
  const idealScroll = wordTop - (containerHeight / 2) + (wordHeight / 2);
  containerElement.scrollTop = Math.max(0, idealScroll);
}
