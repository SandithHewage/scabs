'use strict';

/* ─── ACCORDION ──────────────────────────────────────────────── */

function initAccordion() {
  var items = Array.from(document.querySelectorAll('.accordion-item'));
  var accScrollOrigin = null;

  function closeItem(item) {
    var body = item.querySelector('.accordion-body');
    body.style.height = body.offsetHeight + 'px';
    body.offsetHeight; // force reflow
    body.style.height = '0';
    item.classList.remove('is-open');
    item.querySelector('.accordion-header').setAttribute('aria-expanded', 'false');
    if (window.innerWidth <= 768 && accScrollOrigin !== null) {
      window.scrollTo({ top: accScrollOrigin, behavior: 'smooth' });
      accScrollOrigin = null;
    }
  }

  function openItem(item) {
    var body = item.querySelector('.accordion-body');
    var targetHeight = body.scrollHeight;
    body.style.height = '0';
    body.offsetHeight; // force reflow
    body.style.height = targetHeight + 'px';
    item.classList.add('is-open');
    item.querySelector('.accordion-header').setAttribute('aria-expanded', 'true');
    body.addEventListener('transitionend', function handler() {
      body.removeEventListener('transitionend', handler);
      if (item.classList.contains('is-open')) body.style.height = 'auto';
    });
    if (window.innerWidth <= 768) {
      accScrollOrigin = window.scrollY;
      setTimeout(function () {
        var rect           = body.getBoundingClientRect();
        var bodyCenter     = rect.top + rect.height / 2;
        var viewportCenter = window.innerHeight / 2;
        window.scrollBy({ top: bodyCenter - viewportCenter, behavior: 'smooth' });
      }, 360);
    }
  }

  function toggleItem(item) {
    var isOpen = item.classList.contains('is-open');
    items.forEach(function (i) {
      if (i !== item && i.classList.contains('is-open')) closeItem(i);
    });
    isOpen ? closeItem(item) : openItem(item);
  }

  items.forEach(function (item) {
    var header = item.querySelector('.accordion-header');

    header.addEventListener('click', function () {
      toggleItem(item);
    });

    header.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') toggleItem(item);
      if (e.key === ' ')    { e.preventDefault(); toggleItem(item); }
    });
  });
}


/* ─── SIZING UNIT TOGGLE ─────────────────────────────────────── */

function initSizingToggle() {
  document.querySelectorAll('.sizing-toggle').forEach(function (toggle) {
    toggle.addEventListener('click', function (e) {
      var btn = e.target.closest('.sizing-toggle__btn');
      if (!btn) return;
      var unit = btn.dataset.unit;
      toggle.querySelectorAll('.sizing-toggle__btn').forEach(function (b) {
        b.classList.toggle('is-active', b === btn);
      });
      toggle.closest('.sizing-chart').querySelectorAll('td[data-in]').forEach(function (td) {
        td.textContent = td.dataset[unit];
      });
    });
  });
}


/* ─── SIZE CALCULATOR ────────────────────────────────────────── */

function initSizeCalculator() {
  var modal    = document.getElementById('calc-modal');
  var backdrop = document.getElementById('calc-backdrop');
  var closeBtn = document.getElementById('calc-modal-close');
  var openBtn  = document.querySelector('.sizing-calc-trigger');

  if (!modal || !openBtn) return;

  var step1 = document.getElementById('calc-step-1');
  var step2 = document.getElementById('calc-step-2');
  var step3 = document.getElementById('calc-step-3');

  var currentUnit           = 'imperial';
  var heightInches          = 0;
  var weightLbs             = 0;
  var prevFocus             = null;
  var heightWarningShown    = false;

  /* — open / close — */

  function openModal() {
    prevFocus = document.activeElement;
    resetModal();
    modal.classList.add('is-visible');
    backdrop.classList.add('is-visible');
    modal.setAttribute('aria-hidden', 'false');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { modal.focus(); }, 50);
  }

  function closeModal() {
    modal.classList.remove('is-visible');
    backdrop.classList.remove('is-visible');
    modal.setAttribute('aria-hidden', 'true');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (prevFocus) { prevFocus.focus(); prevFocus = null; }
  }

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('is-visible')) closeModal();
  });

  /* — reset — */

  function resetModal() {
    showStep(1);
    currentUnit = 'imperial';
    heightWarningShown = false;
    document.querySelectorAll('.calc-unit-btn').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.unit === 'imperial');
    });
    showUnitFields('imperial');
    ['calc-ft', 'calc-in', 'calc-lbs', 'calc-cm', 'calc-kg'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.querySelectorAll('.calc-error').forEach(function (el) { el.textContent = ''; });
    document.querySelectorAll('.calc-type-btn').forEach(function (b) { b.classList.remove('is-active'); });
  }

  function showStep(n) {
    [step1, step2, step3].forEach(function (s, i) { s.hidden = (i + 1) !== n; });
  }

  function showUnitFields(unit) {
    document.getElementById('calc-imperial-fields').hidden = unit !== 'imperial';
    document.getElementById('calc-metric-fields').hidden  = unit !== 'metric';
  }

  /* — unit toggle — */

  document.querySelectorAll('.calc-unit-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      currentUnit = btn.dataset.unit;
      document.querySelectorAll('.calc-unit-btn').forEach(function (b) {
        b.classList.toggle('is-active', b === btn);
      });
      showUnitFields(currentUnit);
      document.querySelectorAll('.calc-error').forEach(function (el) { el.textContent = ''; });
      heightWarningShown = false;
    });
  });

  /* — step 1: validate & advance — */

  function validate() {
    if (currentUnit === 'imperial') {
      var ft  = parseInt(document.getElementById('calc-ft').value,  10);
      var ins = parseInt(document.getElementById('calc-in').value,  10);
      var lbs = parseFloat(document.getElementById('calc-lbs').value);
      if (isNaN(ft) || isNaN(ins) || isNaN(lbs)) return 'all fields required.';
      if (ft  < 4  || ft  > 7)  return 'height must be between 4\'0" and 7\'0".';
      if (ins < 0  || ins > 11) return 'inches must be between 0 and 11.';
      if (lbs < 80 || lbs > 400) return 'weight must be between 80 and 400 lbs.';
    } else {
      var cm = parseFloat(document.getElementById('calc-cm').value);
      var kg = parseFloat(document.getElementById('calc-kg').value);
      if (isNaN(cm) || isNaN(kg)) return 'all fields required.';
      if (cm < 140 || cm > 220) return 'height must be between 140 and 220 cm.';
      if (kg < 40  || kg > 180) return 'weight must be between 40 and 180 kg.';
    }
    return null;
  }

  function isOverMaxFit() {
    if (currentUnit === 'imperial') {
      var ft  = parseInt(document.getElementById('calc-ft').value, 10);
      var ins = parseInt(document.getElementById('calc-in').value, 10);
      var lbs = parseFloat(document.getElementById('calc-lbs').value);
      var tallOverLimit   = !isNaN(ft) && !isNaN(ins) && (ft * 12 + ins) > 77;
      var heavyOverLimit  = !isNaN(lbs) && lbs > 200;
      return tallOverLimit || heavyOverLimit;
    }
    var cm = parseFloat(document.getElementById('calc-cm').value);
    var kg = parseFloat(document.getElementById('calc-kg').value);
    return (!isNaN(cm) && cm > 196) || (!isNaN(kg) && kg > 90);
  }

  function showError(msg) {
    var id = currentUnit === 'imperial' ? 'calc-imperial-error' : 'calc-metric-error';
    document.getElementById(id).textContent = msg;
  }

  function computeMeasurements() {
    if (currentUnit === 'imperial') {
      var ft  = parseInt(document.getElementById('calc-ft').value,  10);
      var ins = parseInt(document.getElementById('calc-in').value,  10);
      heightInches = (ft * 12) + ins;
      weightLbs    = parseFloat(document.getElementById('calc-lbs').value);
    } else {
      heightInches = parseFloat(document.getElementById('calc-cm').value) / 2.54;
      weightLbs    = parseFloat(document.getElementById('calc-kg').value) * 2.20462;
    }
  }

  document.getElementById('calc-next').addEventListener('click', function () {
    var error = validate();
    if (error) { showError(error); heightWarningShown = false; return; }
    if (isOverMaxFit() && !heightWarningShown) {
      showError('your measurements are outside the typical fit range for this item — the recommendation provided may not fully reflect your proportions.');
      heightWarningShown = true;
      return;
    }
    heightWarningShown = false;
    computeMeasurements();
    showStep(2);
  });

  /* — step 2: body type → result — */

  var adjustments = { slim: -2.5, regular: 0, athletic: 2, broad: 4 };

  document.querySelectorAll('.calc-type-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.calc-type-btn').forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');

      var bmi   = (weightLbs / (heightInches * heightInches)) * 703;
      var score = bmi + adjustments[btn.dataset.type];
      var size  = score < 21.5 ? 'S' : score < 25.5 ? 'M' : 'L';

      document.getElementById('calc-result-size').textContent = size;
      showStep(3);
    });
  });

  /* — step 2: back — */

  document.getElementById('calc-back-2').addEventListener('click', function () {
    document.querySelectorAll('.calc-error').forEach(function (el) { el.textContent = ''; });
    heightWarningShown = false;
    showStep(1);
  });

  /* — step 3: back / select size — */

  document.getElementById('calc-back').addEventListener('click', function () {
    showStep(2);
  });

  document.getElementById('calc-checkout').addEventListener('click', function () {
    var size  = document.getElementById('calc-result-size').textContent.toLowerCase();
    var radio = document.querySelector('input[name="size"][value="' + size + '"]');
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change'));
    }
    closeModal();
  });
}


/* ─── IMAGE PROTECTION ───────────────────────────────────────── */

document.addEventListener('contextmenu', function (e) {
  if (e.target.tagName === 'IMG') e.preventDefault();
});

document.addEventListener('dragstart', function (e) {
  if (e.target.tagName === 'IMG') e.preventDefault();
});


/* ─── LIGHTBOX ───────────────────────────────────────────────── */

function initLightbox(imgSrcs) {
  var lb       = document.getElementById('lightbox');
  var lbTrack  = lb.querySelector('.lightbox__track');
  var lbClose  = lb.querySelector('.lightbox__close');
  var lbPrev   = lb.querySelector('.lightbox__btn--prev');
  var lbNext   = lb.querySelector('.lightbox__btn--next');
  var lbDotsEl = lb.querySelector('.lightbox__dots');
  if (!lb) return;

  var total = imgSrcs.length;

  /* build track images */
  imgSrcs.forEach(function (src, i) {
    var img = document.createElement('img');
    img.className = 'lightbox__img';
    img.src = src;
    img.alt = '';
    lbTrack.appendChild(img);
  });

  /* clone first/last for infinite loop */
  var firstClone = lbTrack.children[0].cloneNode(true);
  var lastClone  = lbTrack.children[total - 1].cloneNode(true);
  lbTrack.appendChild(firstClone);
  lbTrack.insertBefore(lastClone, lbTrack.children[0]);

  /* real images at indices 1…total */
  var current       = 1;
  var transitioning = false;

  /* build dots */
  var lbDots = [];
  for (var i = 0; i < total; i++) {
    var dot = document.createElement('button');
    dot.className = 'lightbox__dot';
    dot.type = 'button';
    (function(idx) {
      dot.addEventListener('click', function () { if (!transitioning) goTo(idx + 1, false); });
    })(i);
    lbDotsEl.appendChild(dot);
    lbDots.push(dot);
  }

  function updateDots() {
    var realIndex = current - 1;
    if (current === 0)         realIndex = total - 1;
    if (current === total + 1) realIndex = 0;
    lbDots.forEach(function (d, i) {
      d.classList.toggle('is-active', i === realIndex);
    });
  }

  function goTo(index, instant) {
    if (instant) {
      lbTrack.style.transition = 'none';
      lbTrack.offsetWidth;
      transitioning = false;
    } else {
      lbTrack.style.transition = '';
      transitioning = true;
    }
    current = index;
    lbTrack.style.transform = 'translateX(-' + (current * 100) + '%)';
    updateDots();
  }

  lbTrack.addEventListener('transitionend', function () {
    if (current === total + 1) { goTo(1, true); return; }
    if (current === 0)         { goTo(total, true); return; }
    transitioning = false;
  });

  function open(index) {
    goTo(index + 1, true);
    lb.classList.add('is-visible');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lb.classList.remove('is-visible');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  lbClose.addEventListener('click', close);
  lbPrev.addEventListener('click', function () { if (!transitioning) goTo(current - 1, false); });
  lbNext.addEventListener('click', function () { if (!transitioning) goTo(current + 1, false); });

  lb.addEventListener('click', function (e) {
    if (e.target !== lbClose && !lbPrev.contains(e.target) && !lbNext.contains(e.target) && !lbDotsEl.contains(e.target)) close();
  });

  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('is-visible')) return;
    if (e.key === 'Escape')     close();
    if (e.key === 'ArrowLeft'  && !transitioning) goTo(current - 1, false);
    if (e.key === 'ArrowRight' && !transitioning) goTo(current + 1, false);
  });

  /* touch swipe */
  var lbTouchStartX = 0;
  var lbTouchDeltaX = 0;

  lb.addEventListener('touchstart', function (e) {
    lbTouchStartX = e.touches[0].clientX;
    lbTouchDeltaX = 0;
  }, { passive: true });

  lb.addEventListener('touchmove', function (e) {
    lbTouchDeltaX = e.touches[0].clientX - lbTouchStartX;
  }, { passive: true });

  lb.addEventListener('touchend', function () {
    if (Math.abs(lbTouchDeltaX) > 40 && !transitioning) {
      goTo(lbTouchDeltaX < 0 ? current + 1 : current - 1, false);
    }
    lbTouchDeltaX = 0;
  });

  return { open: open };
}


/* ─── GALLERY ────────────────────────────────────────────────── */

function initGallery() {
  var track   = document.querySelector('.gallery__track');
  var prevBtn = document.querySelector('.gallery__btn--prev');
  var nextBtn = document.querySelector('.gallery__btn--next');
  var dotsEl  = document.querySelector('.gallery__dots');
  if (!track || !prevBtn || !nextBtn) return;

  var imgs     = Array.from(track.querySelectorAll('.gallery__img'));
  var total    = imgs.length;
  var imgSrcs  = imgs.map(function (img) { return img.src; });
  var lightbox = initLightbox(imgSrcs);

  /* build dots */
  var dots = [];
  if (dotsEl) {
    for (var i = 0; i < total; i++) {
      var dot = document.createElement('button');
      dot.className = 'gallery__dot';
      dot.type = 'button';
      (function(idx) {
        dot.addEventListener('click', function () { if (!transitioning) goTo(idx + 1, false); });
      })(i);
      dotsEl.appendChild(dot);
      dots.push(dot);
    }
  }

  function updateDots() {
    var realIndex = current - 1;
    if (current === 0) realIndex = total - 1;
    if (current === total + 1) realIndex = 0;
    dots.forEach(function (d, i) {
      d.classList.toggle('is-active', i === realIndex);
    });
  }

  /* clone first after last, clone last before first */
  var firstClone = imgs[0].cloneNode(true);
  var lastClone  = imgs[total - 1].cloneNode(true);
  track.appendChild(firstClone);
  track.insertBefore(lastClone, imgs[0]);

  /* real images now occupy indices 1 … total */
  var current      = 1;
  var transitioning = false;

  function goTo(index, instant) {
    if (instant) {
      track.style.transition = 'none';
      track.offsetWidth; /* force reflow */
      transitioning = false;
    } else {
      track.style.transition = '';
      transitioning = true;
    }
    current = index;
    track.style.transform = 'translateX(-' + (current * 100) + '%)';
    updateDots();
  }

  track.addEventListener('transitionend', function () {
    if (current === total + 1) { goTo(1, true); return; }
    if (current === 0)         { goTo(total, true); return; }
    transitioning = false;
  });

  prevBtn.addEventListener('click', function () { if (!transitioning) goTo(current - 1, false); });
  nextBtn.addEventListener('click', function () { if (!transitioning) goTo(current + 1, false); });

  /* touch swipe */
  var touchStartX = 0;
  var touchDeltaX = 0;

  track.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
    touchDeltaX = 0;
  }, { passive: true });

  track.addEventListener('touchmove', function (e) {
    touchDeltaX = e.touches[0].clientX - touchStartX;
  }, { passive: true });

  track.addEventListener('touchend', function () {
    if (Math.abs(touchDeltaX) > 40 && !transitioning) {
      goTo(touchDeltaX < 0 ? current + 1 : current - 1, false);
    }
    touchDeltaX = 0;
  });

  /* open lightbox on image click */
  imgs.forEach(function (img, i) {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', function () { lightbox.open(i); });
  });

  goTo(1, true);
}


/* ─── INIT ───────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function () {
  initAccordion();
  initSizingToggle();
  initSizeCalculator();
  initGallery();
});
