import { projects } from './content.js';

const root = document.documentElement;
const media = matchMedia('(prefers-reduced-motion: reduce)');
const motionButton = document.querySelector('.motion-toggle');
const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-navigation');
let paused = media.matches;
let sceneController = null;
let lastDialogTrigger = null;

function updateMotion() {
  root.classList.toggle('motion-paused', paused);
  root.dataset.motion = paused ? 'paused' : 'active';
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.setAttribute('aria-label', media.matches ? 'Reduced motion enabled by your system' : paused ? 'Resume animations' : 'Pause animations');
  motionButton.title = motionButton.getAttribute('aria-label');
  motionButton.disabled = media.matches;
  motionButton.innerHTML = paused
    ? '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 6 9 6-9 6V6Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6v12M15 6v12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  sceneController?.setPaused(paused);
}
motionButton.addEventListener('click', () => { paused = !paused; updateMotion(); });
media.addEventListener('change', () => { paused = media.matches; updateMotion(); });
updateMotion();

function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
  mobileNav.hidden = true;
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  mobileNav.hidden = !open;
});
mobileNav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuButton.focus(); }
});
matchMedia('(min-width: 651px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

document.querySelector('#year').textContent = new Date().getFullYear();
const progress = document.querySelector('.reading-progress');
let scrollFrame = 0;
function syncProgress() {
  scrollFrame = 0;
  const distance = root.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${distance > 0 ? Math.min(1, scrollY / distance) : 0})`;
}
function queueProgress() { if (!scrollFrame) scrollFrame = requestAnimationFrame(syncProgress); }
addEventListener('scroll', queueProgress, { passive: true });
addEventListener('resize', queueProgress, { passive: true });
syncProgress();
const sectionObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    document.querySelectorAll('.desktop-nav a').forEach(link => {
      if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
}, { rootMargin: '-15% 0px -60% 0px' });
document.querySelectorAll('#home,#work,#about,#toolkit,#contact').forEach(section => sectionObserver.observe(section));

function addTextElement(parent, tag, text, className = '') {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  parent.append(element);
  return element;
}
function openDialog(dialog, trigger) {
  lastDialogTrigger = trigger;
  document.body.classList.add('modal-open');
  dialog.showModal();
}
function renderProject(id, trigger) {
  const project = projects[id];
  if (!project) return;
  const dialog = document.querySelector('#project-dialog');
  const content = document.querySelector('#project-dialog-content');
  content.replaceChildren();
  addTextElement(content, 'p', project.category, 'eyebrow');
  addTextElement(content, 'h2', project.title).id = 'dialog-title';
  addTextElement(content, 'p', project.tagline, 'detail-lead');
  const image = document.createElement('img');
  image.src = project.image;
  image.alt = project.imageAlt;
  image.className = 'detail-image';
  image.decoding = 'async';
  content.append(image);
  for (const [heading, text] of [['The problem', project.problem], ['What I built', project.approach]]) {
    addTextElement(content, 'h3', heading);
    addTextElement(content, 'p', text);
  }
  const list = document.createElement('ul');
  for (const feature of project.features) addTextElement(list, 'li', feature);
  content.append(list);
  addTextElement(content, 'h3', 'What makes it interesting');
  addTextElement(content, 'p', project.learning);
  addTextElement(content, 'p', project.boundary, 'detail-note');
  const actions = document.createElement('div');
  actions.className = 'detail-actions';
  for (const [label, href, className] of [['Explore source on GitHub ↗', project.github, 'button button-primary'], ['Open browser demo ↗', project.demo, 'button button-quiet']]) {
    if (!href) continue;
    const link = addTextElement(actions, 'a', label, className);
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  content.append(actions);
  openDialog(dialog, trigger);
}
document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => renderProject(button.dataset.project, button)));
document.querySelector('#privacy-open').addEventListener('click', event => openDialog(document.querySelector('#privacy-dialog'), event.currentTarget));
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    lastDialogTrigger?.focus({ preventScroll: true });
  });
});

let selectedLight = 'violet';
document.querySelectorAll('[data-light]').forEach(button => button.addEventListener('click', () => {
  selectedLight = button.dataset.light;
  document.querySelectorAll('[data-light]').forEach(swatch => {
    const selected = swatch === button;
    swatch.classList.toggle('selected', selected);
    swatch.setAttribute('aria-pressed', String(selected));
  });
  const colors = { violet: '#b59aff', blue: '#82c8fc', amber: '#ebbc7e' };
  root.style.setProperty('--light-color', colors[selectedLight]);
  sceneController?.setLight(selectedLight);
}));

// The page never waits for WebGL. Content and links are already visible.
// Loading Three.js is optional, same-origin, and deferred until the hero is visible.
const sceneHost = document.querySelector('#avatar-scene');
const status = document.querySelector('#scene-status');
const saveData = navigator.connection?.saveData === true;
async function loadScene() {
  if (saveData) { status.textContent = 'Lightweight view · data saver enabled'; return; }
  try {
    const { createScene } = await import('./scene.js');
    sceneController = await createScene(sceneHost, { paused, light: selectedLight });
    status.textContent = paused ? 'Motion paused · same curious mind' : 'Move your pointer. Say hello.';
    motionButton.addEventListener('click', () => {
      status.textContent = paused ? 'Motion paused · same curious mind' : 'Move your pointer. Say hello.';
    });
  } catch {
    sceneHost.classList.add('unavailable');
    status.textContent = 'Lightweight view · all the same work';
    document.querySelectorAll('[data-light]').forEach(button => { button.disabled = true; });
  }
}
const heroObserver = new IntersectionObserver(entries => {
  if (entries.some(entry => entry.isIntersecting)) { heroObserver.disconnect(); loadScene(); }
}, { rootMargin: '150px' });
heroObserver.observe(sceneHost);
addEventListener('pagehide', () => { sceneController?.setPaused(true); });
addEventListener('pageshow', () => { sceneController?.setPaused(paused); });
if (import.meta.hot) import.meta.hot.dispose(() => {
  sceneController?.dispose();
  heroObserver.disconnect();
  sectionObserver.disconnect();
  cancelAnimationFrame(scrollFrame);
});
