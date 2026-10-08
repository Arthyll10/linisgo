/* Progressive motion: readable without JavaScript, instant with reduced motion. */
document.addEventListener('DOMContentLoaded', () => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const ease = 'cubic-bezier(.22, 1, .36, 1)';
  const reveals = Array.from(document.querySelectorAll('[data-reveal]'));
  let observer;

  if ('IntersectionObserver' in window && !reduced.matches) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('reveal-pending');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
    reveals.forEach(element => {
      // Stagger siblings in a row; unrelated sections don't inherit that delay.
      const siblings = Array.from(element.parentElement.children).filter(child => child.hasAttribute('data-reveal'));
      element.style.setProperty('--reveal-delay', `${Math.min(siblings.indexOf(element), 3) * 65}ms`);
      element.classList.add('reveal-pending');
      observer.observe(element);
    });
  }

  const settleDisclosures = [];
  document.querySelectorAll('.disclosure').forEach(details => {
    const summary = details.querySelector(':scope > summary');
    const content = details.querySelector(':scope > .disclosure-content');
    if (!summary || !content) return;
    let animation = null;
    let expanded = details.open;

    function settle() {
      const previous = animation;
      animation = null;
      previous?.cancel();
      details.open = expanded;
      details.style.removeProperty('height');
      details.style.removeProperty('overflow');
      details.dataset.expanded = String(expanded);
      summary.setAttribute('aria-expanded', String(expanded));
      content.inert = !expanded;
    }

    function setExpanded(next) {
      const startHeight = details.getBoundingClientRect().height;
      animation?.cancel();
      animation = null;
      expanded = next;
      details.dataset.expanded = String(next);
      summary.setAttribute('aria-expanded', String(next));
      if (!next && content.contains(document.activeElement)) summary.focus({ preventScroll: true });
      content.inert = !next;

      if (reduced.matches || typeof details.animate !== 'function') {
        settle();
        return;
      }

      // Keep native details open until the closing animation finishes. Measuring
      // natural height avoids fixed max-heights and accommodates wrapped text.
      details.open = true;
      details.style.height = 'auto';
      const style = getComputedStyle(details);
      const edges = ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth']
        .reduce((sum, property) => sum + (parseFloat(style[property]) || 0), 0);
      const endHeight = next ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height + edges;
      details.style.overflow = 'hidden';
      const distance = Math.abs(endHeight - startHeight);
      if (distance < 1) { settle(); return; }
      const current = details.animate(
        [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
        { duration: Math.min(420, 240 + distance * .3), easing: ease, fill: 'both' }
      );
      animation = current;
      current.finished.then(() => {
        if (animation === current) settle();
      }).catch(() => { /* A second activation can reverse an unfinished transition. */ });
    }

    summary.addEventListener('click', event => {
      event.preventDefault();
      setExpanded(!expanded);
    });
    details.addEventListener('toggle', () => {
      if (animation) return;
      expanded = details.open;
      settle();
    });
    settleDisclosures.push(settle);
    settle();
  });

  // Clear measured heights if the viewport or motion preference changes.
  addEventListener('resize', () => settleDisclosures.forEach(settle => settle()), { passive: true });
  reduced.addEventListener('change', () => {
    settleDisclosures.forEach(settle => settle());
    if (reduced.matches) {
      observer?.disconnect();
      reveals.forEach(element => element.classList.remove('reveal-pending'));
    }
  });
});
