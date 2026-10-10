// Navigation, estimates, contact drafts and booking interactions.
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

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  // Service filters
  // Show the chosen category and update the number of visible cards.
  const serviceFilters = document.querySelector('.service-filters');
  const serviceCards = Array.from(document.querySelectorAll('[data-service-category]'));
  function filterServices(category) {
    serviceFilters?.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.serviceFilter === category));
    });
    serviceCards.forEach(card => { card.hidden = category !== 'all' && card.dataset.serviceCategory !== category; });
    // Collapse empty groups so the selected cards sit directly under the filters.
    document.querySelectorAll('[data-service-group]').forEach(group => {
      group.hidden = !Array.from(group.querySelectorAll('[data-service-category]')).some(card => !card.hidden);
    });
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
    revealLinkedService();
  }
  const { config, money, calculate, fromParams, toParams } = window.LinisGo;
  function validatePhone(value) {
    const digits = value.replace(/\D/g, '');
    return /^[+()\d\s.-]+$/.test(value) && digits.length >= 7 && digits.length <= 15;
  }
  const node = (tag, text, className) => {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  document.querySelectorAll('[data-hours]').forEach(element => { element.textContent = config.hours; });
  document.querySelectorAll('[data-facebook]').forEach(link => { link.href = config.contact.facebook; });
  function renderPlan(output, plan, booking = false) {
    output.replaceChildren();
    const home = plan.size === 'other' ? 'Studio / 4+ bedrooms / other' : plan.size ? `${plan.size} bedroom${plan.size === '1' ? '' : 's'}` : 'Choose home size';
    const service = { basic: 'Basic Clean', deep: 'Deep Clean' }[plan.clean] || 'Choose your clean';
    output.append(node('p', `${home} · ${service}`, 'estimate-selection'));
    output.append(node('p', plan.supported ? money(plan.total) : plan.complete ? 'Quote required' : 'Let’s plan your clean', booking ? 'plan-total' : 'estimate-total'));
    output.append(node('p', plan.supported ? 'Estimated starting total' : !plan.complete ? 'Choose a core service and home size to see your starting estimate.' : plan.customScope ? 'Your requested scope needs a tailored quote.' : 'A standard rate is not listed for this combination.', 'estimate-duration'));
    if (!plan.complete) return;
    if (plan.duration) output.append(node('p', `Core clean: about ${plan.duration}. Add-on time is extra.`, 'estimate-duration'));
    const breakdown = node('dl', undefined, 'estimate-breakdown');
    const line = (label, value) => {
      const row = node('div');
      row.append(node('dt', label), node('dd', value));
      breakdown.append(row);
    };
    line(service, plan.supported ? money(plan.base) : 'To be quoted');
    plan.addons.forEach(key => {
      const addon = config.addons[key];
      line(`${addon.label} · ${key === 'refrigerator' ? '1 unit' : '30 minutes'}`, `${key === 'refrigerator' ? 'From ' : ''}${money(addon.rate)}`);
    });
    if (plan.rush) line('Rush request · availability to be confirmed', money(config.rush));
    if (plan.first) line('First-clean offer (if eligible)', `−${money(config.firstCleanDiscount)}`);
    output.append(breakdown);
    if (plan.supported) {
      const payment = node('div', undefined, 'estimate-payment');
      [['Estimated 50% downpayment', plan.deposit], ['Estimated balance after inspection', plan.balance]].forEach(([label, value]) => {
        const row = node('span'); row.append(node('span', label), node('strong', money(value))); payment.append(row);
      });
      output.append(payment);
    } else {
      output.append(node('p', 'Final total and deposit require a quote.', 'estimate-custom-note'));
    }
  }
  const estimateForm = document.querySelector('#estimate-form');
  if (estimateForm) {
    const output = document.querySelector('#estimate-output');
    function updateEstimate() {
      const data = new FormData(estimateForm);
      const plan = calculate({
        size: data.get('size'), clean: data.get('clean'),
        addons: Object.keys(config.addons).filter(key => data.has(key)),
        rush: data.has('rush'), first: data.has('first'), customScope: data.has('customScope')
      });
      renderPlan(output, plan);
      document.querySelector('.estimate-summary > a').href = `book.html?${toParams(plan)}#booking-form`;
    }
    estimateForm.addEventListener('change', updateEstimate);
    estimateForm.addEventListener('submit', event => event.preventDefault());
    estimateForm.addEventListener('reset', () => requestAnimationFrame(updateEstimate));
    document.querySelector('#estimate').hidden = false;
    updateEstimate();
  }

  // Contact message drafts
  // Keep a draft for each topic while this page is open, ready to copy.
  const inquiryTopic = document.querySelector('#inquiry-topic');
  const inquiryMessage = document.querySelector('#inquiry-message');
  const inquiryStatus = document.querySelector('#inquiry-copy-status');
  if (inquiryTopic && inquiryMessage) {
    const drafts = {
      booking: inquiryMessage.value,
      pricing: 'Hi LinisGo! Could you help me with a cleaning quote?\nHome size: [number of bedrooms]\nLocation: [area or subdivision]\nService: [Basic or Deep Clean]\nAdd-ons: [ironing, refrigerator interior, folding, or none]\nPlease confirm what is included and the total price.',
      area: 'Hi LinisGo! I would like to request cleaning in [location within Mabalacat City].\nHome size: [number of bedrooms]\nPreferred date: [date]\nPlease confirm the scope, quote, and available schedule.',
      existing: 'Hi LinisGo! I have a question about my existing booking.\nBooking name: [name]\nScheduled date: [date]\nMy question or requested change: [details]'
    };
    let previousTopic = inquiryTopic.value;
    inquiryTopic.addEventListener('change', () => {
      // Hang on to these edits before switching topics.
      drafts[previousTopic] = inquiryMessage.value;
      previousTopic = inquiryTopic.value;
      inquiryMessage.value = drafts[inquiryTopic.value] || drafts.booking;
      inquiryStatus.textContent = '';
    });
    inquiryMessage.addEventListener('input', () => { inquiryStatus.textContent = ''; });
    const copyInquiry = document.querySelector('#copy-inquiry');
    copyInquiry.hidden = false;
    copyInquiry.addEventListener('click', async () => {
      if (!inquiryMessage.value.trim()) { inquiryStatus.textContent = 'Write a message before copying.'; inquiryMessage.focus(); return; }
      try {
        await navigator.clipboard.writeText(inquiryMessage.value);
        inquiryStatus.textContent = 'Message copied. Paste it into your preferred contact channel.';
      } catch {
        // If copying is blocked, select the text so the user can copy it themselves.
        inquiryMessage.focus(); inquiryMessage.select();
        inquiryStatus.textContent = 'Copy is unavailable here. Your message is selected so you can copy it manually.';
      }
    });
  }
  const quoteForm = document.querySelector('#quoteForm');
  if (quoteForm) {
    const sizeNames = { '1': '1 bedroom', '2': '2 bedrooms', '3': '3 bedrooms', other: 'Studio / 4+ bedrooms / other' };
    const serviceNames = { basic: 'Basic clean', deep: 'Deep clean' };
    const imported = fromParams(new URLSearchParams(location.search));
    if (imported.clean || imported.size || imported.addons.length || imported.first || imported.rush || imported.customScope) {
      if (imported.size) quoteForm.elements.propertyType.value = sizeNames[imported.size];
      quoteForm.querySelectorAll('[name="serviceType"]').forEach(input => { input.checked = input.value === serviceNames[imported.clean]; });
      quoteForm.querySelectorAll('[name="addons"]').forEach(input => { input.checked = imported.addons.includes(input.value); });
      ['rush', 'first', 'customScope'].forEach(key => { quoteForm.elements[key].checked = imported[key]; });
      document.querySelector('#booking-import-note').hidden = false;
    }
    const summaryCard = document.querySelector('.booking-summary');
    const summaryMedia = matchMedia('(max-width: 860px)');
    const positionSummary = () => {
      if (summaryMedia.matches) quoteForm.insertBefore(summaryCard, document.querySelector('#submitBtn'));
      else document.querySelector('.booking-sidebar').prepend(summaryCard);
    };
    summaryMedia.addEventListener('change', positionSummary);
    positionSummary();
    const dateField = quoteForm.elements.preferredDate;
    const todayInManila = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    dateField.min = todayInManila();
    dateField.addEventListener('focus', () => { dateField.min = todayInManila(); });
    quoteForm.querySelectorAll('.field .error-text').forEach((message, i) => {
      message.id = `booking-error-${i}`;
      message.closest('.field').querySelectorAll('input, select, textarea').forEach(input => {
        input.setAttribute('aria-describedby', [input.getAttribute('aria-describedby'), message.id].filter(Boolean).join(' '));
      });
    });
    const summary = document.querySelector('#booking-summary');
    summaryCard.hidden = false;
    document.querySelector('.booking-completion').hidden = false;
    document.querySelector('#notes-count').hidden = false;
    const required = ['fullName', 'phone', 'address', 'propertyType'];
    const readPlan = () => {
      const data = new FormData(quoteForm);
      return calculate({
        size: Object.keys(sizeNames).find(key => sizeNames[key] === data.get('propertyType')) || '',
        clean: Object.keys(serviceNames).find(key => serviceNames[key] === data.get('serviceType')) || '',
        addons: data.getAll('addons'), rush: data.has('rush'), first: data.has('first'), customScope: data.has('customScope')
      });
    };
    let lastPlan = '';
    function updateBookingPlan() {
      const plan = readPlan();
      const planKey = JSON.stringify([plan, dateField.value, quoteForm.elements.preferredTime.value]);
      if (planKey !== lastPlan) {
        lastPlan = planKey;
        renderPlan(summary, plan, true);
        const schedule = dateField.value && dateField.checkValidity() ? `Requested: ${dateField.value}${quoteForm.elements.preferredTime.value ? ' · ' + quoteForm.elements.preferredTime.value : ''}` : 'Your schedule and any same-day request are subject to availability.';
        summary.append(node('p', schedule));
      }
      const complete = required.filter(name => {
        const input = quoteForm.elements.namedItem(name);
        return input.value.trim() && input.checkValidity() && (name !== 'phone' || validatePhone(input.value));
      }).length + (plan.clean ? 1 : 0);
      document.querySelector('#booking-progress').value = complete;
      document.querySelector('#booking-progress-text').textContent = `${complete} of 5 required details completed`;
      document.querySelector('#notes-count').textContent = `${quoteForm.elements.notes.value.length} / 1000 characters`;
    }
    quoteForm.addEventListener('input', updateBookingPlan);
    quoteForm.addEventListener('change', updateBookingPlan);
    quoteForm.addEventListener('reset', () => requestAnimationFrame(() => {
      quoteForm.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
      quoteForm.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
      document.querySelector('#statusBox').className = 'status';
      updateBookingPlan();
    }));
    updateBookingPlan();
    const statusBox = document.querySelector('#statusBox');
    function setFieldError(field, invalid) {
      field.closest('.field')?.classList.toggle('invalid', invalid);
      field.setAttribute('aria-invalid', String(invalid));
    }
    function validate() {
      dateField.min = todayInManila();
      let valid = true;
      quoteForm.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]), select, textarea').forEach(input => {
        const bad = !input.checkValidity() || (input.required && !input.value.trim()) || (input.name === 'phone' && !validatePhone(input.value));
        setFieldError(input, bad);
        if (bad) valid = false;
      });
      const serviceChosen = Boolean(readPlan().clean);
      document.querySelector('#serviceChips').closest('.field').classList.toggle('invalid', !serviceChosen);
      quoteForm.querySelectorAll('[name="serviceType"]').forEach(input => input.setAttribute('aria-invalid', String(!serviceChosen)));
      return valid && serviceChosen;
    }
    quoteForm.addEventListener('input', event => {
      const input = event.target;
      if (input.getAttribute('aria-invalid') !== 'true') return;
      const bad = !input.checkValidity() || (input.required && !input.value.trim()) || (input.name === 'phone' && !validatePhone(input.value));
      setFieldError(input, bad);
    });
    quoteForm.addEventListener('change', () => {
      if (readPlan().clean) {
        document.querySelector('#serviceChips').closest('.field').classList.remove('invalid');
        quoteForm.querySelectorAll('[name="serviceType"]').forEach(input => input.removeAttribute('aria-invalid'));
      }
    });
    const review = document.querySelector('#booking-success');
    quoteForm.addEventListener('submit', event => {
      event.preventDefault();
      statusBox.className = 'status';
      if (quoteForm.elements.website.value || !validate()) {
        statusBox.className = 'status show failure';
        statusBox.textContent = 'Please check the highlighted fields before reviewing your request.';
        quoteForm.querySelector('[aria-invalid="true"]')?.focus();
        return;
      }
      const data = new FormData(quoteForm);
      const plan = readPlan();
      const entered = name => String(data.get(name) ?? '').trim();
      const rows = [
        ['Name', entered('fullName')], ['Phone', entered('phone')],
        ...(entered('email') ? [['Email', entered('email')]] : []),
        ['Property address', entered('address')], ['Cleaning', serviceNames[plan.clean]], ['Home size', sizeNames[plan.size]],
        ['Add-ons', plan.addons.map(key => `${config.addons[key].label} · ${config.addons[key].unit}`).join('; ') || 'None selected'],
        ['Scope', plan.customScope ? 'Custom scope · quote required' : 'Standard scope, subject to confirmation'],
        ['Rush', plan.rush ? 'Requested · +₱150, availability to be confirmed' : 'Not requested'],
        ['First-clean offer', plan.first ? '−₱50, eligibility to be confirmed' : 'Not selected'],
        ['Preferred visit', [data.get('preferredDate'), data.get('preferredTime')].filter(Boolean).join(' · ') || 'To be arranged'],
        ['Estimated starting total', plan.supported ? money(plan.total) : 'Quote required'],
        ['Estimated 50% downpayment', plan.supported ? money(plan.deposit) : 'Based on the confirmed quote'],
        ['Estimated balance', plan.supported ? money(plan.balance) : 'Based on the confirmed quote'],
        ['Notes', entered('notes') || 'None']
      ];
      const details = document.querySelector('#booking-success-details');
      details.replaceChildren();
      rows.forEach(([label, value]) => {
        const row = node('div'); row.append(node('dt', label), node('dd', value)); details.append(row);
      });
      quoteForm.hidden = true;
      document.querySelector('.booking-form-intro').hidden = true;
      review.hidden = false;
      document.querySelector('#booking-success-title').focus({ preventScroll: true });
      review.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' });
    });
    document.querySelector('#edit-success').addEventListener('click', () => {
      review.hidden = true; quoteForm.hidden = false;
      document.querySelector('.booking-form-intro').hidden = false;
      quoteForm.elements.fullName.focus();
    });
    document.querySelector('#submitBtn').disabled = false;
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

  // Mobile offers expand in the page; desktop keeps the floating popup.
  const welcomeOffer = document.querySelector('#welcome-offer');
  const offerToggle = document.querySelector('.offer-toggle');
  if (welcomeOffer && offerToggle) {
    const offerSlot = document.createElement('div');
    offerSlot.className = 'welcome-offer-slot';
    const hero = document.querySelector('main .hero, main .page-hero');
    if (hero) hero.after(offerSlot);
    else document.querySelector('main').prepend(offerSlot);
    offerSlot.append(welcomeOffer, offerToggle);
    let offerCollapsed = mobile.matches;
    try {
      if (!mobile.matches) offerCollapsed = sessionStorage.getItem('linisgo-offer-collapsed') === 'true';
    } catch { /* Storage is optional. */ }
    mobile.addEventListener('change', () => {
      if (mobile.matches) setOfferCollapsed(true, welcomeOffer.contains(document.activeElement));
    });
    function setOfferCollapsed(collapsed, moveFocus = false) {
      welcomeOffer.hidden = collapsed;
      offerToggle.hidden = !collapsed;
      offerToggle.setAttribute('aria-expanded', String(!collapsed));
      try { sessionStorage.setItem('linisgo-offer-collapsed', String(collapsed)); } catch { /* Keep the controls usable without storage. */ }
      if (moveFocus) (collapsed ? offerToggle : welcomeOffer.querySelector('.offer-close')).focus({ preventScroll: true });
    }
    welcomeOffer.querySelector('.offer-close').addEventListener('click', () => setOfferCollapsed(true, true));
    offerToggle.addEventListener('click', () => setOfferCollapsed(false, true));
    welcomeOffer.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOfferCollapsed(true, true);
      }
    });
    setOfferCollapsed(offerCollapsed);
  }

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
