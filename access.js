'use strict';
(() => {
  // A browser-only presentation gate, matching the In Her Words workflow.
  // Hosted access continues to be enforced by the existing Sites audience.
  const fingerprint = '3e8600ed6cd2ae4e1f8c7716d18427d493cd2f6833b2cd944a032388b0baa598';
  const storageKey = 'martin-quest-manual-access-v1';
  const gate = document.querySelector('#access-gate');
  const content = document.querySelector('#manual-content');
  const form = document.querySelector('#access-form');
  const input = document.querySelector('#access-password');
  const error = document.querySelector('#access-error');
  const submit = form.querySelector('[type="submit"]');
  const visibility = document.querySelector('#access-visibility');
  const lock = document.querySelector('#lock-manual');

  function remember(unlocked) {
    try {
      if (unlocked) sessionStorage.setItem(storageKey, fingerprint);
      else sessionStorage.removeItem(storageKey);
    } catch { /* The current page still works when storage is unavailable. */ }
  }
  function setUnlocked(unlocked, focus = true) {
    gate.hidden = unlocked;
    content.hidden = !unlocked;
    content.inert = !unlocked;
    document.documentElement.classList.toggle('manual-locked', !unlocked);
    input.value = '';
    input.type = 'password';
    visibility.textContent = 'Zobraziť';
    visibility.setAttribute('aria-label', 'Zobraziť heslo');
    visibility.setAttribute('aria-pressed', 'false');
    input.removeAttribute('aria-invalid');
    error.textContent = '';
    if (focus) {
      if (unlocked) {
        window.scrollTo({ top: 0, behavior: 'instant' });
        document.querySelector('#hero-title').focus({ preventScroll: true });
      } else input.focus({ preventScroll: true });
    }
  }
  let saved = false;
  try { saved = sessionStorage.getItem(storageKey) === fingerprint; } catch {}
  setUnlocked(saved, false);

  visibility.addEventListener('click', () => {
    const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    visibility.textContent = visible ? 'Skryť' : 'Zobraziť';
    visibility.setAttribute('aria-label', visible ? 'Skryť heslo' : 'Zobraziť heslo');
    visibility.setAttribute('aria-pressed', String(visible));
    input.focus();
  });
  input.addEventListener('input', () => {
    input.removeAttribute('aria-invalid');
    error.textContent = '';
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    error.textContent = '';
    try {
      const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input.value));
      const digest = [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
      if (digest === fingerprint) {
        remember(true);
        setUnlocked(true);
      } else {
        input.setAttribute('aria-invalid', 'true');
        error.textContent = 'Heslo nesedí. Skús ho zadať znova.';
        input.focus();
        input.select();
      }
    } catch {
      error.textContent = 'Overenie sa nepodarilo. Obnov stránku a skús to znova.';
    } finally {
      submit.disabled = false;
      submit.removeAttribute('aria-busy');
    }
  });
  lock.addEventListener('click', () => {
    const dialog = document.querySelector('#app-dialog');
    if (dialog.open) dialog.close();
    remember(false);
    setUnlocked(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
})();
