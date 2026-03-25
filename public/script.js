/* ===== Interactive Canvas Particles (Logic below) ===== */

/* ===== Pointer Glow Effect ===== */
const pointerGlow = document.getElementById('pointer-glow');
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let currentX = mouseX;
let currentY = mouseY;
const easing = 0.08; // How fast the glow catches up to the cursor
let hasMoved = false;

window.addEventListener('pointermove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;

  if (!hasMoved) {
    hasMoved = true;
    currentX = mouseX;
    currentY = mouseY;
    pointerGlow.style.opacity = '1';
  }
});

document.body.addEventListener('pointerleave', () => {
  pointerGlow.style.opacity = '0';
  hasMoved = false;
});

document.body.addEventListener('pointerenter', () => {
  if (hasMoved) pointerGlow.style.opacity = '1';
});

function animateGlow() {
  if (hasMoved) {
    currentX += (mouseX - currentX) * easing;
    currentY += (mouseY - currentY) * easing;
    pointerGlow.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
  }
  requestAnimationFrame(animateGlow);
}
requestAnimationFrame(animateGlow);

/* ===== Interactive Canvas Particles ===== */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let particlesArray;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();

window.addEventListener('resize', () => {
  resizeCanvas();
  initParticles();
});

class Particle {
  constructor(x, y, dx, dy, size, color) {
    this.x = x; this.y = y;
    this.dx = dx; this.dy = dy;
    this.size = size; this.color = color;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
  update() {
    if (this.x > canvas.width || this.x < 0) this.dx = -this.dx;
    if (this.y > canvas.height || this.y < 0) this.dy = -this.dy;

    // Mouse interactivity (Repel slightly)
    let dxMouse = mouseX - this.x;
    let dyMouse = mouseY - this.y;
    let distance = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

    if (distance < 120 && hasMoved) {
      this.x -= dxMouse / 40;
      this.y -= dyMouse / 40;
    }

    this.x += this.dx;
    this.y += this.dy;
    this.draw();
  }
}

function initParticles() {
  particlesArray = [];
  let numberOfParticles = (canvas.height * canvas.width) / 10000;
  for (let i = 0; i < numberOfParticles; i++) {
    let size = (Math.random() * 2) + 1;
    let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
    let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
    let dx = (Math.random() - 0.5) * 0.8;
    let dy = (Math.random() - 0.5) * 0.8;
    // Mix of primary and secondary orange hues
    let color = Math.random() > 0.5 ? 'rgba(255, 115, 0, 0.5)' : 'rgba(255, 157, 66, 0.4)';
    particlesArray.push(new Particle(x, y, dx, dy, size, color));
  }
}

function connect() {
  let opacityValue = 1;
  for (let a = 0; a < particlesArray.length; a++) {
    for (let b = a; b < particlesArray.length; b++) {
      let dx = particlesArray[a].x - particlesArray[b].x;
      let dy = particlesArray[a].y - particlesArray[b].y;
      let distance = dx * dx + dy * dy;

      if (distance < 12000) {
        opacityValue = 1 - (distance / 12000);
        ctx.strokeStyle = `rgba(255, 115, 0, ${opacityValue * 0.25})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
        ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
        ctx.stroke();
      }
    }

    // Draw lines to mouse pointer
    if (hasMoved) {
      let dx = mouseX - particlesArray[a].x;
      let dy = mouseY - particlesArray[a].y;
      let mouseDist = dx * dx + dy * dy;
      if (mouseDist < 20000) {
        opacityValue = 1 - (mouseDist / 20000);
        ctx.strokeStyle = `rgba(255, 157, 66, ${opacityValue * 0.6})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
        ctx.lineTo(mouseX, mouseY);
        ctx.stroke();
      }
    }
  }
}

function animateParticles() {
  requestAnimationFrame(animateParticles);
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  for (let i = 0; i < particlesArray.length; i++) {
    particlesArray[i].update();
  }
  connect();
}

initParticles();
animateParticles();

/* ===== Code Editor Sync & Highlighting ===== */
const codeInput = document.getElementById('code-input');
const lineNumbers = document.getElementById('line-numbers');
const charCount = document.getElementById('char-count');
const highlightingCode = document.getElementById('highlighting-code');
const highlightingPre = document.getElementById('highlighting-pre');
const languageSelect = document.getElementById('language-select');

function updateLineNumbers() {
  const lines = codeInput.value.split('\n').length;
  lineNumbers.textContent = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
}

function updateCharCount() {
  const len = codeInput.value.length;
  charCount.textContent = `${len.toLocaleString()} character${len !== 1 ? 's' : ''}`;
}

function updateHighlighting() {
  let code = codeInput.value;
  if (code[code.length - 1] === '\n') {
    code += ' ';
  }
  highlightingCode.textContent = code;

  delete highlightingCode.dataset.highlighted;
  highlightingCode.className = '';

  const lang = languageSelect.value.toLowerCase();
  if (lang !== 'auto-detect') {
    highlightingCode.classList.add(`language-${lang}`);
  }

  if (window.hljs && code.trim() !== '') {
    hljs.highlightElement(highlightingCode);
  }
}

function syncScroll() {
  lineNumbers.style.transform = `translateY(-${codeInput.scrollTop}px)`;
  highlightingPre.scrollTop = codeInput.scrollTop;
  highlightingPre.scrollLeft = codeInput.scrollLeft;
}

codeInput.addEventListener('input', () => {
  updateLineNumbers();
  updateCharCount();
  updateHighlighting();
  syncScroll();
});

codeInput.addEventListener('scroll', syncScroll);
languageSelect.addEventListener('change', updateHighlighting);

// Initialize
updateHighlighting();

// Handle tab key
codeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = codeInput.selectionStart;
    const end = codeInput.selectionEnd;
    codeInput.value = codeInput.value.substring(0, start) + '  ' + codeInput.value.substring(end);
    codeInput.selectionStart = codeInput.selectionEnd = start + 2;
    updateLineNumbers();
  }
});

/* ===== Theme Toggle Logic ===== */
const themeToggle = document.getElementById('theme-toggle');

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  
  // Toggle Highlight.js styles
  const darkHljs = document.getElementById('hljs-dark');
  const lightHljs = document.getElementById('hljs-light');
  if (darkHljs && lightHljs) {
    darkHljs.disabled = theme === 'light';
    lightHljs.disabled = theme === 'dark';
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

themeToggle.addEventListener('click', toggleTheme);

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  setTheme(savedTheme);
}

/* ===== Clear Button ===== */
document.getElementById('clear-btn').addEventListener('click', () => {
  codeInput.value = '';
  updateLineNumbers();
  updateCharCount();
  updateHighlighting(); // <-- Fix: ensure syntax layer also clears
  document.getElementById('results').hidden = true;
  hideError();
  codeInput.focus();
});

/* ===== Loading Steps ===== */
const loadingSteps = [
  'Detecting patterns and bugs…',
  'Analyzing code structure…',
  'Applying refactoring rules…',
  'Generating explanations…',
  'Finalizing output…',
];
let stepInterval = null;

function startLoadingSteps() {
  let i = 0;
  const el = document.getElementById('loading-step');
  el.textContent = loadingSteps[0];
  stepInterval = setInterval(() => {
    i = (i + 1) % loadingSteps.length;
    el.textContent = loadingSteps[i];
  }, 1800);
}

function stopLoadingSteps() {
  clearInterval(stepInterval);
}

/* ===== Error Toast ===== */
function showError(msg) {
  const toast = document.getElementById('error-toast');
  document.getElementById('error-message').textContent = msg;
  toast.hidden = false;
}

function hideError() {
  document.getElementById('error-toast').hidden = true;
}

document.getElementById('toast-close').addEventListener('click', hideError);

/* ===== Analyze ===== */
const analyzeBtn = document.getElementById('analyze-btn');

analyzeBtn.addEventListener('click', async () => {
  const code = codeInput.value.trim();
  const language = document.getElementById('language-select').value;

  if (!code) {
    // Premium Empty State UX
    const btnTextEl = analyzeBtn.querySelector('.btn-text');
    const originalText = btnTextEl.textContent;
    btnTextEl.textContent = 'Paste code first!';

    const editorContainer = document.querySelector('.code-editor-container');
    editorContainer.classList.add('shake-animation');
    analyzeBtn.classList.add('shake-animation'); // Shake the button too!

    // Focus the editor to guide the user naturally
    codeInput.focus();

    setTimeout(() => {
      btnTextEl.textContent = originalText;
      editorContainer.classList.remove('shake-animation');
      analyzeBtn.classList.remove('shake-animation');
    }, 1800);

    return;
  }

  hideError();
  document.getElementById('results').hidden = true;

  // Show loading
  analyzeBtn.disabled = true;
  analyzeBtn.querySelector('.btn-text').textContent = 'Analyzing…';
  document.getElementById('loading').hidden = false;
  startLoadingSteps();

  try {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers,
      body: JSON.stringify({ code, language }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Server error (${response.status})`);
    }

    renderResults(data);

  } catch (err) {
    showError(err.message || 'Failed to reach the server. Is it running?');
  } finally {
    document.getElementById('loading').hidden = true;
    stopLoadingSteps();
    analyzeBtn.disabled = false;
    analyzeBtn.querySelector('.btn-text').textContent = 'Analyze Code';
  }
});

let currentRefactoredWithComments = '';
let currentRefactoredNoComments = '';
let showingComments = true;

const commentToggle = document.getElementById('comment-toggle');

function updateCommentToggleUI() {
  const onIcon = commentToggle.querySelector('.comment-on');
  const offIcon = commentToggle.querySelector('.comment-off');
  onIcon.style.display = showingComments ? 'block' : 'none';
  offIcon.style.display = showingComments ? 'none' : 'block';
  commentToggle.title = showingComments ? 'Hide Comments' : 'Show Comments';
}

commentToggle.addEventListener('click', () => {
  showingComments = !showingComments;
  updateCommentToggleUI();
  renderCode(showingComments ? currentRefactoredWithComments : currentRefactoredNoComments);
});

/* ===== Render Results ===== */
function renderResults({ bugs = [], refactoredCode = '', refactoredCodeNoComments = '', explanation = [] }) {
  currentRefactoredWithComments = refactoredCode;
  currentRefactoredNoComments = refactoredCodeNoComments || refactoredCode; // Fallback for old history
  
  renderBugs(bugs);
  renderCode(showingComments ? currentRefactoredWithComments : currentRefactoredNoComments);
  renderExplanation(explanation);

  const results = document.getElementById('results');
  results.hidden = false;
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderBugs(bugs) {
  const list = document.getElementById('bugs-list');
  const countEl = document.getElementById('bug-count');
  list.innerHTML = '';

  const hasBugs = bugs.length > 0;
  countEl.textContent = bugs.length;
  countEl.classList.toggle('green', !hasBugs);

  if (!hasBugs) {
    const item = document.createElement('div');
    item.className = 'bug-item no-bugs-item';
    item.innerHTML = `
      <span class="bug-line">✓ All Clear</span>
      <p class="bug-desc">No bugs detected! Your code looks structurally sound. Check the refactored version for style and readability improvements.</p>
    `;
    list.appendChild(item);
    return;
  }

  bugs.forEach((bug, i) => {
    const item = document.createElement('div');
    item.className = 'bug-item';
    item.style.animationDelay = `${i * 0.07}s`;
    item.innerHTML = `
      <span class="bug-line">Line ${escHtml(String(bug.line ?? 'N/A'))}</span>
      <p class="bug-desc">${escHtml(bug.description ?? 'Unknown issue')}</p>
    `;
    list.appendChild(item);
  });
}

function renderCode(code) {
  const codeEl = document.getElementById('refactored-code');
  codeEl.textContent = code || '// No changes suggested.';

  // Apply highlight.js formatting if available
  if (window.hljs) {
    delete codeEl.dataset.highlighted;
    codeEl.className = '';
    hljs.highlightElement(codeEl);
  }
}

function renderExplanation(points) {
  const list = document.getElementById('explanation-list');
  list.innerHTML = '';

  if (!points || points.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">No explanation provided.</p>';
    return;
  }

  points.forEach((point, i) => {
    const item = document.createElement('div');
    item.className = 'explanation-item';
    item.style.animationDelay = `${i * 0.08}s`;
    item.innerHTML = `
      <span class="explanation-num">${i + 1}</span>
      <p class="explanation-text">${escHtml(point)}</p>
    `;
    list.appendChild(item);
  });
}

/* ===== Copy Button ===== */
document.getElementById('copy-btn').addEventListener('click', async () => {
  const code = document.getElementById('refactored-code').textContent;
  const btn = document.getElementById('copy-btn');

  try {
    await navigator.clipboard.writeText(code);
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
      Copied!
    `;
    btn.classList.add('btn-success');
    setTimeout(() => {
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        Copy
      `;
      btn.classList.remove('btn-success');
    }, 2000);
  } catch {
    showError('Could not copy to clipboard.');
  }
});

/* ===== Utility ===== */
function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ===== Auth & History Logic ===== */
const authBtn = document.getElementById('auth-btn');
const historyToggle = document.getElementById('history-toggle');
const authModal = document.getElementById('auth-modal');
const historyDrawer = document.getElementById('history-drawer');
const authForm = document.getElementById('auth-form');
const switchAuth = document.getElementById('switch-auth');
const modalTitle = document.getElementById('modal-title');
const authSubmit = document.getElementById('auth-submit');
const historyList = document.getElementById('history-list');

let isLoginMode = true;

// Auth UI Updates
function updateAuthUI() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  if (token && username) {
    authBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> Sign Out (${username})`;
    historyToggle.hidden = false;
  } else {
    authBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Sign In`;
    historyToggle.hidden = true;
    historyDrawer.hidden = true;
  }
}

// Modal Toggle
authBtn.addEventListener('click', () => {
  if (localStorage.getItem('token')) {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    updateAuthUI();
  } else {
    authModal.hidden = false;
  }
});

document.getElementById('modal-close').addEventListener('click', () => authModal.hidden = true);
document.getElementById('history-close').addEventListener('click', () => historyDrawer.hidden = true);

switchAuth.addEventListener('click', (e) => {
  e.preventDefault();
  isLoginMode = !isLoginMode;
  modalTitle.textContent = isLoginMode ? 'Sign In' : 'Sign Up';
  authSubmit.textContent = isLoginMode ? 'Sign In' : 'Sign Up';
  switchAuth.textContent = isLoginMode ? 'Sign Up' : 'Sign In';
  document.querySelector('.auth-switch').childNodes[0].textContent = isLoginMode ? "Don't have an account? " : "Already have an account? ";
});

// Auth Form Submit
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Auth failed');

    if (isLoginMode) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      authModal.hidden = true;
      updateAuthUI();
      authForm.reset();
    } else {
      alert('Account created! Please sign in.');
      isLoginMode = true;
      switchAuth.click();
    }
  } catch (err) {
    alert(err.message);
  }
});

// History Logic
historyToggle.addEventListener('click', async () => {
  historyDrawer.hidden = false;
  await fetchHistory();
});

async function fetchHistory() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch('/api/history', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    renderHistory(data);
  } catch (err) {
    console.error('History fetch failed:', err);
  }
}

function renderHistory(items) {
  historyList.innerHTML = items.length === 0 ? '<p class="text-muted" style="padding:20px;text-align:center;">No history yet.</p>' : '';
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <div class="history-item-header">
        <span class="history-item-lang">${item.language}</span>
        <span class="history-item-date">${new Date(item.created_at).toLocaleDateString()}</span>
      </div>
      <div class="history-item-snippet">${escHtml(item.original_code.substring(0, 60))}...</div>
    `;
    div.addEventListener('click', () => {
      codeInput.value = item.original_code;
      updateLineNumbers();
      updateCharCount();
      updateHighlighting();
      renderResults({
        bugs: JSON.parse(item.bugs),
        refactoredCode: item.refactored_code,
        refactoredCodeNoComments: item.refactored_code_no_comments,
        explanation: JSON.parse(item.explanation)
      });
      historyDrawer.hidden = true;
    });
    historyList.appendChild(div);
  });
}

/* ===== Init ===== */
updateLineNumbers();
updateCharCount();
updateAuthUI();
