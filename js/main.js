// One script for all five pages.
// Let the HTML load first so the buttons and forms are ready to use.
// If a page doesn’t have a feature, just skip that part.
// querySelector finds one element; querySelectorAll finds a list of elements.
// The ?. bit skips the call if the element isn’t there.
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

  // Service filters
  // Show the chosen category and update the number of visible cards.
  const serviceFilters = document.querySelector('.service-filters');
  const serviceCards = Array.from(document.querySelectorAll('[data-service-category]'));
  function filterServices(category) {
    serviceFilters?.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.serviceFilter === category));
    });
    serviceCards.forEach(card => { card.hidden = category !== 'all' && card.dataset.serviceCategory !== category; });
    const status = document.querySelector('#service-filter-status');
    if (status) status.textContent = `${serviceCards.filter(card => !card.hidden).length} services shown`;
  }
  if (serviceFilters) {
    serviceFilters.hidden = false;
    serviceFilters.addEventListener('click', event => {
      const button = event.target.closest('[data-service-filter]');
      if (button) filterServices(button.dataset.serviceFilter);
    });
    // Don’t let a filter hide the service someone just linked to.
    const revealLinkedService = () => {
      const linkedCard = serviceCards.find(card => `#${card.id}` === location.hash);
      if (linkedCard?.hidden) {
        filterServices('all');
        linkedCard.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' });
      }
    };
    addEventListener('hashchange', revealLinkedService);
    document.querySelector('.equipment-help a')?.addEventListener('click', () => filterServices('all'));
    revealLinkedService();
  }
  // Equipment checklist
  // Count what’s checked and let the user start over with Reset.
  const equipment = Array.from(document.querySelectorAll('.equipment-item input'));
  const equipmentStatus = document.querySelector('.equipment-status');
  const equipmentReset = document.querySelector('.equipment-reset');
  function updateEquipment() {
    if (equipmentStatus) equipmentStatus.textContent = `${equipment.filter(input => input.checked).length} of ${equipment.length} items checked · vacuum optional`;
  }
  equipment.forEach(input => input.addEventListener('change', updateEquipment));
  if (equipmentReset) {
    equipmentReset.hidden = false;
    equipmentReset.addEventListener('click', () => {
      equipment.forEach(input => { input.checked = false; });
      updateEquipment();
    });
  }

  // Shared prices and phone validation
  // Keep the rates in one place so Pricing and Booking don’t disagree.
  const currency = new Intl.NumberFormat('en-PH', {
    style: 'currency', currency: 'PHP', maximumFractionDigits: 0
  });
  // Show prices in pesos, with no decimal places.
  function money(value) {
    return currency.format(value);
  }
  // Spaces, brackets and dashes are fine, but we still need 7–15 digits.
  function validatePhone(value) {
    const digits = value.replace(/\D/g, '');
    return /^[+()\d\s.-]+$/.test(value) && digits.length >= 7 && digits.length <= 15;
  }

  // The size numbers mean bedrooms. Anything not listed needs a custom quote.
  const cleaningRates = { basic: { '1': 600, '2': 800, '3': 1000 }, deep: { '2': 1500, '3': 1500 } };
  const addonRates = { ironing: 250, supplies: 450, rush: 150, first: 50 };
  // Price calculator
  // Take the home size and extras, then work out the total and payment split.
  const estimateForm = document.querySelector('#estimate-form');
  if (estimateForm) {
    const estimateOutput = document.querySelector('#estimate-output');

    function updateEstimate() {
      // Heads up: FormData leaves out unchecked checkboxes.
      const choices = new FormData(estimateForm);
      const size = choices.get('size');
      const deep = choices.get('clean') === 'deep';
      const rate = cleaningRates[deep ? 'deep' : 'basic'][size];
      const duration = deep ? '5–8 hours' : ({ '1': '2–3 hours', '2': '3–4 hours', '3': '4–6 hours' })[size];
      const extraLines = [];
      let extras = 0;
      [['ironing', 'Ironing', addonRates.ironing], ['supplies', 'All-in-One supplies', addonRates.supplies], ['rush', 'Rush booking', addonRates.rush]].forEach(([key, title, cost]) => {
        if (choices.has(key)) { extras += cost; extraLines.push(`<div><dt>${title}</dt><dd>${money(cost)}</dd></div>`); }
      });
      // Pass the cleaning choices to Booking through the URL. No personal details here.
      const requestParams = new URLSearchParams({ size, clean: deep ? 'deep' : 'basic' });
      ['ironing', 'supplies', 'rush', 'first'].forEach(key => { if (choices.has(key)) requestParams.set(key, '1'); });
      document.querySelector('.estimate-summary > a').href = `book.html?${requestParams.toString()}#booking-form`;
      const first = choices.has('first');
      // No listed rate? Ask for a quote instead of guessing a price.
      const supported = rate !== undefined;
      const total = supported ? rate + extras - (first ? addonRates.first : 0) : null;
      const homeLabel = size === 'other' ? 'Custom home size' : `${size} bedroom${size === '1' ? '' : 's'}`;
      estimateOutput.innerHTML = `<p class="estimate-selection">${homeLabel} · ${deep ? 'Deep' : 'Basic'} Clean</p>
        <p class="estimate-total">${supported ? money(total) : 'Request a quote'}</p>
        <p class="estimate-duration">${supported ? `Estimated cleaning time: ${duration}${choices.has('ironing') ? ' + 30–60 min ironing' : ''}` : 'A standard rate is not listed for this combination. Ask our team for a tailored quote.'}</p>
        <dl class="estimate-breakdown"><div><dt>${deep ? 'Deep' : 'Basic'} Clean</dt><dd>${supported ? money(rate) : 'To be quoted'}</dd></div>${extraLines.join('')}${first ? '<div><dt>First-clean offer</dt><dd>−₱50</dd></div>' : ''}</dl>
        ${supported ? `<div class="estimate-payment"><span>50% downpayment <strong>${money(total / 2)}</strong></span><span>Balance after inspection <strong>${money(total / 2)}</strong></span></div>` : `<p class="estimate-custom-note">Selected extras: ${money(extras)}. The total and downpayment will be confirmed with your quote${first ? ', including eligibility for the ₱50 first-clean offer' : ''}.</p>`}`;
    }
    estimateForm.addEventListener('change', updateEstimate);
    // Let Reset finish clearing the fields before working out the total again.
    estimateForm.addEventListener('reset', () => requestAnimationFrame(updateEstimate));
    document.querySelector('#estimate').hidden = false;
    updateEstimate();
  }

  // Booking form and estimate
  // Bring over the calculator choices and update the plan as the form changes.
  const quoteForm = document.querySelector('#quoteForm');
  if (quoteForm) {
    // Only use home sizes and services we recognize from the pricing link.
    const imported = new URLSearchParams(location.search);
    const importedSize = { '1': '1 bedroom', '2': '2 bedrooms', '3': '3 bedrooms', other: 'Studio / other' }[imported.get('size')];
    const importedService = { basic: 'Basic clean', deep: 'Deep clean' }[imported.get('clean')];
    if (importedSize && importedService) {
      quoteForm.elements.propertyType.value = importedSize;
      quoteForm.querySelectorAll('[name="serviceType"]').forEach(input => { input.checked = input.value === importedService; });
      quoteForm.querySelectorAll('[name="addons"]').forEach(input => {
        input.checked = imported.get(input.value === 'Ironing' ? 'ironing' : 'supplies') === '1';
      });
      ['rush', 'first'].forEach(key => { quoteForm.elements[key].checked = imported.get(key) === '1'; });
      document.querySelector('#booking-import-note').hidden = false;
    }
    const summaryCard = document.querySelector('.booking-summary');
    const summaryMedia = matchMedia('(max-width: 860px)');
    // Put the summary above Submit on mobile; desktop has room for a sidebar.
    const positionSummary = () => {
      if (summaryMedia.matches) quoteForm.insertBefore(summaryCard, document.querySelector('#submitBtn'));
      else document.querySelector('.booking-sidebar').prepend(summaryCard);
    };
    summaryMedia.addEventListener('change', positionSummary);
    positionSummary();
    const dateField = quoteForm.querySelector('#preferredDate');
    // Use Manila time so the date limit follows the business’s local day.
    const todayInManila = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    dateField.min = todayInManila();
    dateField.addEventListener('focus', () => { dateField.min = todayInManila(); });
    // Link each error to its field so screen readers can explain what’s wrong.
    quoteForm.querySelectorAll('.field .error-text').forEach((message, i) => {
      message.id = `booking-error-${i}`;
      message.closest('.field').querySelectorAll('input, select, textarea').forEach(input => {
        input.setAttribute('aria-describedby', [input.getAttribute('aria-describedby'), message.id].filter(Boolean).join(' '));
      });
    });
    const summary = document.querySelector('#booking-summary');
    document.querySelector('.booking-summary').hidden = false;
    document.querySelector('.booking-completion').hidden = false;
    document.querySelector('#notes-count').hidden = false;
    let lastPlan = '';
    function updateBookingPlan() {
      const data = new FormData(quoteForm);
      const size = data.get('propertyType');
      const service = data.get('serviceType');
      const deep = service === 'Deep clean';
      const base = !service ? undefined : cleaningRates[deep ? 'deep' : 'basic'][{ '1 bedroom': '1', '2 bedrooms': '2', '3 bedrooms': '3' }[size]];
      const addons = data.getAll('addons');
      const extras = (addons.includes('Ironing') ? addonRates.ironing : 0) + (addons.includes('All-in-One supplies') ? addonRates.supplies : 0) + (data.has('rush') ? addonRates.rush : 0) - (data.has('first') ? addonRates.first : 0);

      // Only rebuild the summary when the plan changes. Typing a name doesn’t affect it.
      const planKey = JSON.stringify([size, service, addons, data.has('rush'), data.has('first'), data.get('preferredDate'), data.get('preferredTime')]);
      if (planKey !== lastPlan) {
        lastPlan = planKey;
        summary.replaceChildren();
        const selection = document.createElement('p');
        selection.textContent = `${service || 'Choose your clean'} · ${size || 'Choose home size'}`;
        const total = document.createElement('p'); total.className = 'plan-total';
        total.textContent = base !== undefined ? money(base + extras) : service && size ? 'Custom quote' : 'Let’s plan your clean';
        const details = document.createElement('p'); details.textContent = [...addons, ...(data.has('rush') ? ['Rush +₱150'] : []), ...(data.has('first') ? ['First-clean offer −₱50'] : [])].join(' · ') || 'No add-ons selected';
        const payment = document.createElement('p'); payment.textContent = base !== undefined ? `Estimated 50% downpayment: ${money((base + extras) / 2)}` : 'We’ll confirm your total before payment.';
        const schedule = document.createElement('p'); schedule.textContent = !dateField.checkValidity() ? 'Choose today or a future date for your visit.' : data.get('preferredDate') ? `Requested: ${data.get('preferredDate')}${data.get('preferredTime') ? ' · ' + data.get('preferredTime') : ''}` : 'Your schedule will be confirmed by our team.';
        summary.append(selection, total, details, payment, schedule);
      }
      // Count the required details that are valid. Optional fields don’t affect progress.
      const complete = ['fullName', 'phone', 'email', 'address', 'propertyType'].filter(name => {
        const input = quoteForm.elements.namedItem(name);
        if (!input.value.trim() || !input.checkValidity()) return false;
        if (name === 'phone') return validatePhone(input.value);
        return true;
      }).length + (service ? 1 : 0);
      document.querySelector('#booking-progress').value = complete;
      document.querySelector('#booking-progress-text').textContent = `${complete} of 6 required details completed`;
      document.querySelector('#notes-count').textContent = `${quoteForm.elements.notes.value.length} / 1000 characters`;
    }
    quoteForm.addEventListener('input', updateBookingPlan);
    quoteForm.addEventListener('change', updateBookingPlan);
    quoteForm.addEventListener('reset', () => requestAnimationFrame(() => {
      quoteForm.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
      quoteForm.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
      updateBookingPlan();
    }));
    updateBookingPlan();

    // Booking validation and success message
    // Check the details, then show the request summary. Nothing gets sent.
    const form = quoteForm;
    const statusBox = document.getElementById('statusBox');
    const submitBtn = document.getElementById('submitBtn');

    function showStatus(kind, message) {
      statusBox.className = 'status show ' + kind;
      statusBox.textContent = message;
      statusBox.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'center' });
    }

    // Mark the field as invalid both visually and for screen readers.
    function setFieldError(field, isInvalid) {
      const wrap = field.closest('.field');
      if (wrap) wrap.classList.toggle('invalid', isInvalid);
      field.setAttribute('aria-invalid', String(isInvalid));
    }

    function validate() {
      let valid = true;

      ['fullName', 'phone', 'email', 'address'].forEach((id) => {
        const el = document.getElementById(id);
        const bad = !el.value.trim() || (id === 'email' && !el.checkValidity()) || (id === 'phone' && !validatePhone(el.value));
        setFieldError(el, bad);
        if (bad) valid = false;
      });

      const propertyType = document.getElementById('propertyType');
      const propBad = !propertyType.value;
      setFieldError(propertyType, propBad);
      if (propBad) valid = false;

      const serviceChosen = form.querySelector('input[name="serviceType"]:checked');
      const serviceWrap = document.getElementById('serviceChips').parentElement;
      if (!serviceChosen) {
        serviceWrap.classList.add('invalid');
        valid = false;
      } else {
        serviceWrap.classList.remove('invalid');
      }

      const date = document.getElementById('preferredDate');
      const dateBad = !date.checkValidity();
      setFieldError(date, dateBad);
      if (dateBad) valid = false;
      form.querySelectorAll('input[name="serviceType"]').forEach(input => input.setAttribute('aria-invalid', String(!serviceChosen)));
      return valid;
    }

    // Check the field again as the user fixes it.
    form.addEventListener('input', function (event) {
      const field = event.target;
      if (field.getAttribute('aria-invalid') !== 'true') return;
      const bad = !field.checkValidity() || (field.required && !field.value.trim()) || (field.id === 'phone' && !validatePhone(field.value));
      setFieldError(field, bad);
    });

    form.addEventListener('submit', function (e) {
      // Stay on this page. This demo isn’t connected to a booking backend.
      e.preventDefault();
      if (submitBtn.disabled) return;
      statusBox.className = 'status';

      // Leave this hidden field empty. It’s there to catch bots that fill every field.
      const honeypot = document.getElementById('website').value;
      if (honeypot) {
        showStatus('failure', 'Your request could not be sent. Please refresh the page or contact us directly.');
        return;
      }

      if (!validate()) {
        showStatus('failure', 'Please check the highlighted fields before submitting.');
        form.querySelector('[aria-invalid="true"]')?.focus();
        return;
      }

      const details = document.getElementById('booking-success-details');
      details.replaceChildren();
      const data = new FormData(form);
      const rows = [
        ['Cleaning', data.get('serviceType')],
        ['Home size', data.get('propertyType')],
        ['Add-ons', data.getAll('addons').join(', ') || 'None selected'],
        ['Preferred visit', [data.get('preferredDate'), data.get('preferredTime')].filter(Boolean).join(' · ') || 'To be arranged'],
        ['Estimated total', document.querySelector('#booking-summary .plan-total')?.textContent || 'To be quoted']
      ];
      // Use textContent here so anything entered stays plain text.
      rows.forEach(([label, value]) => {
        const row = document.createElement('div');
        const term = document.createElement('dt'); term.textContent = label;
        const description = document.createElement('dd'); description.textContent = value;
        row.append(term, description); details.append(row);
      });
      form.hidden = true;
      document.querySelector('.booking-form-intro').hidden = true;
      document.getElementById('booking-success').hidden = false;
      document.getElementById('booking-success-title').focus({ preventScroll: true });
      document.getElementById('booking-success').scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' });

    });
    // Let the user go back and edit without filling everything in again.
    document.getElementById('edit-success').addEventListener('click', () => {
      document.getElementById('booking-success').hidden = true;
      form.hidden = false;
      document.querySelector('.booking-form-intro').hidden = false;
      document.getElementById('fullName').focus();
    });
    submitBtn.disabled = false;
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
  const stepControls = document.querySelector('.interactive-steps');
  const stepDetail = document.querySelector('#step-detail');
  function selectStep(index) {
    stepButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    stepPanels.forEach((panel, i) => { panel.hidden = i !== index; });
    if (stepProgress) stepProgress.style.transform = `scaleX(${(index + 1) / stepButtons.length})`;
    if (mobile.matches && stepControls && stepDetail) {
      const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height || 0;
      const bookingBar = document.querySelector('.mobile-booking-bar');
      const barHeight = bookingBar && !bookingBar.hidden ? bookingBar.getBoundingClientRect().height + 24 : 0;
      const visibleBottom = window.innerHeight - barHeight;
      // Move before the next frame so the panel animation starts in view.
      if (stepControls.getBoundingClientRect().top < headerHeight || stepDetail.getBoundingClientRect().bottom > visibleBottom) {
        stepControls.scrollIntoView({ behavior: 'instant', block: 'start' });
        // Very short screens may only have room for the explanation.
        if (stepDetail.getBoundingClientRect().bottom > visibleBottom) {
          stepDetail.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      }
    }
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
        stepButtons[next].focus({ preventScroll: true });
      }
    });
  });

  // Mobile booking button
  // The × tucks the bar away; the small Book button brings it back.
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
