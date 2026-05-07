/**
 * Evan Café Racer — main.js
 * SCABS GROUP LLC
 */

'use strict';

/* ─── CONFIG ─────────────────────────────────────────────────── */

const ENDPOINT = {
  newsletter: 'https://script.google.com/macros/s/AKfycbzsl9mOIapTm-1ods1A6mqB-2bXEMvVb3vcR9V9Mn-474jQna1nHj-0961alHleajVK/exec',
  contact:    'https://script.google.com/macros/s/AKfycbz9cFS3fLJj0CxdZoBAGc9UOhEpzmzh9rOgVOhlWBuWSTdZhzP1Gp9FgSDC3oPqpUsREA/exec',
};

// 2026-05-30 at 11:00 AM PDT (UTC-7)
const EVENT_DATE = new Date('2026-05-30T11:00:00-07:00');

/* ─── UTILS ──────────────────────────────────────────────────── */

const byId = (id) => document.getElementById(id);
const pad  = (n)  => String(n).padStart(2, '0');

const getFocusable = (container) =>
  Array.from(container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  ));

async function submitForm(endpoint, data) {
  await fetch(endpoint, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(data).toString(),
  });
}

/* ─── CONTACT MODAL ──────────────────────────────────────────── */

function initContactModal() {
  const trigger  = byId('contact-trigger');
  const modal    = byId('contact-modal');
  const backdrop = byId('modal-backdrop');
  const closeBtn = byId('modal-close');
  const form     = byId('contact-form');
  const success  = byId('contact-success');

  if (!modal || !trigger) return;

  let prevFocus = null;

  function openModal() {
    prevFocus = document.activeElement;
    modal.setAttribute('aria-hidden', 'false');
    backdrop.setAttribute('aria-hidden', 'false');
    modal.classList.add('is-visible');
    backdrop.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const first = getFocusable(modal)[0];
      if (first) first.focus();
    }, 50);
  }

  function closeModal() {
    modal.classList.remove('is-visible');
    backdrop.classList.remove('is-visible');
    modal.setAttribute('aria-hidden', 'true');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (prevFocus) { prevFocus.focus(); prevFocus = null; }
    // Reset after fade-out completes so the form doesn't flash back during the transition
    setTimeout(() => {
      form.reset();
      form.hidden = false;
      success.hidden = true;
      form.querySelectorAll('.form-error').forEach((el) => { el.textContent = ''; });
      form.querySelectorAll('.form-input').forEach((el) => { el.removeAttribute('aria-invalid'); });
      const btn = form.querySelector('.modal__submit');
      if (btn) { btn.disabled = false; btn.textContent = 'send'; }
    }, 220);
  }

  function trapFocus(e) {
    if (!modal.classList.contains('is-visible') || e.key !== 'Tab') return;
    const focusable = getFocusable(modal);
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  trigger.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-visible')) closeModal();
    trapFocus(e);
  });

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const isValidMsg   = (v) => v.trim().length >= 5;

  function setError(inputId, msg) {
    const errEl = byId(`${inputId}-error`);
    if (errEl) errEl.textContent = msg;
    const input = byId(inputId);
    if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    setError('contact-email', '');
    setError('contact-message', '');

    const emailEl = byId('contact-email');
    const msgEl   = byId('contact-message');
    let valid = true;

    if (!isValidEmail(emailEl.value)) {
      setError('contact-email', 'enter a valid email.');
      valid = false;
    }
    if (!isValidMsg(msgEl.value)) {
      setError('contact-message', 'message is too short.');
      valid = false;
    }

    if (!valid) {
      const first = form.querySelector('[aria-invalid="true"]');
      if (first) first.focus();
      return;
    }

    const btn = form.querySelector('.modal__submit');
    btn.disabled = true;
    btn.textContent = 'sending...';

    try {
      await submitForm(ENDPOINT.contact, {
        email:   emailEl.value.trim(),
        message: msgEl.value.trim(),
      });
      form.hidden = true;
      success.hidden = false;
      setTimeout(closeModal, 2500);
    } catch (err) {
      console.error('[contact]', err);
      btn.disabled = false;
      btn.textContent = 'send';
    }
  });

  form.querySelectorAll('.form-input').forEach((input) => {
    input.addEventListener('input', () => setError(input.id, ''));
  });
}

/* ─── NEWSLETTER FORM ────────────────────────────────────────── */

function initNewsletterForm() {
  const form      = byId('newsletter-form');
  const formWrap  = byId('newsletter-form-wrap');
  if (!form) return;

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isValidPhone = (v) => v.length >= 7;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = byId('nl-email').value.trim();
    const phone = byId('nl-phone').value.trim();

    if (!isValidEmail(email) || !isValidPhone(phone)) {
      if (!isValidEmail(email)) byId('nl-email').focus();
      else byId('nl-phone').focus();
      return;
    }

    const btn = form.querySelector('.newsletter__submit');
    btn.disabled = true;

    try {
      await submitForm(ENDPOINT.newsletter, { email, phone });
      form.reset();
      if (formWrap) formWrap.classList.add('is-subscribed');
    } catch (err) {
      console.error('[newsletter]', err);
      btn.disabled = false;
    }
  });
}

/* ─── PRIVACY POLICY MODAL ───────────────────────────────────── */

function initPrivacyModal() {
  const trigger  = byId('privacy-trigger');
  const modal    = byId('privacy-modal');
  const backdrop = byId('privacy-backdrop');
  const closeBtn = byId('privacy-close');

  if (!modal || !trigger) return;

  let prevFocus = null;

  function openModal() {
    prevFocus = document.activeElement;
    modal.setAttribute('aria-hidden', 'false');
    backdrop.setAttribute('aria-hidden', 'false');
    modal.classList.add('is-visible');
    backdrop.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
    setTimeout(() => modal.focus(), 50);
  }

  function closeModal() {
    modal.classList.remove('is-visible');
    backdrop.classList.remove('is-visible');
    modal.setAttribute('aria-hidden', 'true');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (prevFocus) { prevFocus.focus(); prevFocus = null; }
  }

  function trapFocus(e) {
    if (!modal.classList.contains('is-visible') || e.key !== 'Tab') return;
    const focusable = getFocusable(modal);
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  trigger.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-visible')) closeModal();
    trapFocus(e);
  });

  // "contact us" links inside the policy close privacy modal and open the contact modal
  ['policy-contact-1', 'policy-contact-2'].forEach((id) => {
    const link = byId(id);
    if (!link) return;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal();
      // Small delay so privacy modal fades out before contact opens
      setTimeout(() => byId('contact-trigger').click(), 240);
    });
  });
}


/* ─── HERO COUNTDOWN ─────────────────────────────────────────── */

function initHeroCountdown() {
  const el = byId('hero-countdown');
  if (!el) return;

  function tick() {
    const diff = EVENT_DATE - Date.now();
    if (diff <= 0) {
      el.textContent = 'doors open now.';
      return;
    }
    const d = Math.floor(diff / 86_400_000);
    const h = Math.floor((diff % 86_400_000) / 3_600_000);
    const m = Math.floor((diff % 3_600_000)  /    60_000);
    const s = Math.floor((diff %    60_000)  /     1_000);
    el.textContent = `${pad(d)}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
  }

  tick();
  setInterval(tick, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
  initNewsletterForm();
  initContactModal();
  initPrivacyModal();
  initHeroCountdown();
});
