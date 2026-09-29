// Homepage interactions copied from the main project.
document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu
  // Toggle the menu and its label. Close it when a link is picked or Escape is pressed.
  document.body.classList.add('nav-ready');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  function setMenu(open) {
    if (!toggle || !links) return;
    links.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    toggle.textContent = open ? '×' : '☰';
  }
  toggle?.addEventListener('click', () => setMenu(!links?.classList.contains('open')));
  links?.addEventListener('click', event => {
    if (event.target.closest('a, button')) setMenu(false);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.nav')) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && links?.classList.contains('open')) {
      setMenu(false);
      toggle.focus();
    }
  });
  // Keep this width in sync with the CSS when changing the mobile layout.
  const mobile = matchMedia('(max-width: 780px)');
  mobile.addEventListener('change', () => setMenu(false));
  if (!document.body.classList.contains('site')) return;

  // Scroll animations
  // Fade sections in as they come into view, unless the user prefers less motion.
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduced.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('reveal-pending');
          // This section is already visible, so we’re done watching it.
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
    reveals.forEach((element, index) => {
      // Give the cards a small delay so they don’t all pop in at once.
      element.style.setProperty('--reveal-delay', `${index % 3 * 70}ms`);
      element.classList.add('reveal-pending');
      observer.observe(element);
    });
    reduced.addEventListener('change', () => {
      if (reduced.matches) {
        observer.disconnect();
        reveals.forEach(element => element.classList.remove('reveal-pending'));
      }
    });
  }

  // Rotating headline
  // Swap the headline phrase now and then. Pause if asked or if the tab is hidden.
  const headline = document.querySelector('.rotating-text');
  const motionButton = document.querySelector('.motion-toggle');
  const words = ['text us.', 'need us.', 'book us.'];
  let wordIndex = 0, interval, transition, paused = false;
  function updateMotion() {
    // Clear the old timers first so we don’t accidentally speed up the rotation.
    clearInterval(interval);
    clearTimeout(transition);
    headline?.classList.remove('is-changing');
    if (motionButton) motionButton.hidden = reduced.matches;
    if (!headline || reduced.matches || paused || document.hidden) return;
    interval = setInterval(() => {
      headline.classList.add('is-changing');
      transition = setTimeout(() => {
        wordIndex = (wordIndex + 1) % words.length;
        headline.textContent = words[wordIndex];
        headline.classList.remove('is-changing');
      }, 220);
    }, 3600);
  }
  motionButton?.addEventListener('click', () => {
    paused = !paused;
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.textContent = paused ? 'Resume headline' : 'Pause headline';
    updateMotion();
  });
  reduced.addEventListener('change', updateMotion);
  document.addEventListener('visibilitychange', updateMotion);
  updateMotion();

  // Before and after slider
  // Let the user move the divider by dragging, touching, or using the slider keys.
  const comparison = document.querySelector('[data-comparison]');
  const range = comparison?.querySelector('input');
  const stage = comparison?.querySelector('.comparison-stage');
  function reveal(value) {
    // The value is the divider's position from the left: 0% to 100%.
    // Keep the divider inside the image, even if the drag goes past the edge.
    range.value = String(Math.round(Math.max(0, Math.min(100, value))));
    comparison.style.setProperty('--reveal', `${range.value}%`);
    range.setAttribute('aria-valuetext', `${range.value}% from left, ${100 - Number(range.value)}% clean image revealed`);
  }
  if (range && stage) {
    range.addEventListener('input', () => reveal(Number(range.value)));
    const drag = event => {
      const rect = stage.getBoundingClientRect();
      reveal((event.clientX - rect.left) / rect.width * 100);
    };
    stage.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0) return;
      // Keep following the drag if the pointer slips outside the image.
      stage.setPointerCapture(event.pointerId);
      range.focus({ preventScroll: true });
      drag(event);
    });
    stage.addEventListener('pointermove', event => {
      if (stage.hasPointerCapture(event.pointerId)) drag(event);
    });
    ['pointerup', 'pointercancel'].forEach(type => stage.addEventListener(type, event => {
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    }));
    reveal(50);
  }

  // Booking steps
  // Show the explanation for the chosen step and move the progress line along.
  const stepButtons = Array.from(document.querySelectorAll('[data-step]'));
  const stepPanels = document.querySelectorAll('[data-step-panel]');
  const stepProgress = document.querySelector('.step-progress span');
  function selectStep(index) {
    stepButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    stepPanels.forEach((panel, i) => { panel.hidden = i !== index; });
    if (stepProgress) stepProgress.style.transform = `scaleX(${(index + 1) / stepButtons.length})`;
  }
  stepButtons.forEach((button, index) => {
    button.addEventListener('click', () => selectStep(index));
    // Arrow keys move between steps. Home and End jump to either end.
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % stepButtons.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + stepButtons.length) % stepButtons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = stepButtons.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        selectStep(next);
        stepButtons[next].focus();
      }
    });
  });

  // Mobile booking button
  // The × tucks the bar away; the small Book button brings it back
  const quickAction = document.querySelector('.mobile-booking-bar');
  const reopenBooking = document.querySelector('.mobile-booking-toggle');
  if (quickAction && reopenBooking) {
    let collapsed = false;
    // Remember the choice across pages in this tab. If storage is blocked, no big deal.
    try { collapsed = sessionStorage.getItem('linisgo-booking-collapsed') === 'true'; } catch { /* Just remember it on this page if storage isn’t available. */ }
    // Hide both on desktop. On mobile, show the bar or its reopen button.
    function updateBookingBar() {
      quickAction.hidden = !mobile.matches || collapsed;
      reopenBooking.hidden = !mobile.matches || !collapsed;
      reopenBooking.setAttribute('aria-expanded', String(!collapsed));
    }
    function setCollapsed(value) {
      collapsed = value;
      try { sessionStorage.setItem('linisgo-booking-collapsed', String(value)); } catch { /* The buttons still work even if we can’t save the choice. */ }
      updateBookingBar();
      if (mobile.matches) (value ? reopenBooking : quickAction.querySelector('a')).focus({ preventScroll: true });
    }
    quickAction.querySelector('.mobile-booking-close').addEventListener('click', () => setCollapsed(true));
    reopenBooking.addEventListener('click', () => setCollapsed(false));
    mobile.addEventListener('change', updateBookingBar);
    updateBookingBar();
  }
});
