/* Owner configuration. Keep listed prices in the static HTML in sync when changing rates.
   No payment, authentication, availability, or message-delivery integration is configured. */
window.LinisGo = (() => {
  const config = {
    base: 'Xevera, Mabalacat City, Pampanga',
    coverage: 'All of Mabalacat City',
    contact: {
      phones: [],
      // Phone numbers remain redacted. The owner approved this personal profile.
      facebook: 'https://web.facebook.com/timothy.tique.1',
      facebookVerified: false,
      email: ''
    },
    hours: 'Monday–Saturday, 8 AM–5 PM · Last slot 2 PM · Sunday by request',
    rates: { basic: { '1': 900, '2': 1200, '3': 1500 }, deep: { '2': 2500, '3': 2500 } },
    durations: { basic: { '1': '2–3 hours', '2': '3–4 hours', '3': '4–6 hours' }, deep: { '2': '5–8 hours', '3': '5–8 hours' } },
    addons: {
      ironing: { label: 'Ironing', rate: 250, unit: 'one 30-minute block' },
      refrigerator: { label: 'Refrigerator Interior Cleaning', rate: 350, unit: 'one standard unit, up to 60 minutes' },
      folding: { label: 'Laundry Folding & Organizing', rate: 200, unit: 'one 30-minute block' }
    },
    rush: 150,
    firstCleanDiscount: 50,
    depositFraction: 0.5
  };
  const money = value => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  function normalize(input = {}) {
    return {
      clean: ['basic', 'deep'].includes(input.clean) ? input.clean : '',
      size: ['1', '2', '3', 'other'].includes(input.size) ? input.size : '',
      addons: Array.isArray(input.addons) ? Object.keys(config.addons).filter(key => input.addons.includes(key)) : [],
      rush: input.rush === true,
      first: input.first === true,
      customScope: input.customScope === true
    };
  }
  function calculate(input) {
    const plan = normalize(input);
    const complete = Boolean(plan.clean && plan.size);
    const rate = complete && own(config.rates[plan.clean], plan.size) ? config.rates[plan.clean][plan.size] : null;
    const supported = rate !== null && !plan.customScope;
    const extras = plan.addons.reduce((sum, key) => sum + config.addons[key].rate, 0);
    const total = supported ? rate + extras + (plan.rush ? config.rush : 0) - (plan.first ? config.firstCleanDiscount : 0) : null;
    return {
      ...plan, complete, supported, base: supported ? rate : null, extras, total,
      deposit: supported ? total * config.depositFraction : null,
      balance: supported ? total * (1 - config.depositFraction) : null,
      duration: supported ? config.durations[plan.clean][plan.size] : null
    };
  }
  function fromParams(params) {
    return normalize({
      clean: params.get('clean'), size: params.get('size'),
      addons: Object.keys(config.addons).filter(key => params.get(key) === '1'),
      rush: params.get('rush') === '1', first: params.get('first') === '1', customScope: params.get('customScope') === '1'
    });
  }
  function toParams(input) {
    const plan = normalize(input);
    const params = new URLSearchParams();
    if (plan.clean) params.set('clean', plan.clean);
    if (plan.size) params.set('size', plan.size);
    plan.addons.forEach(key => params.set(key, '1'));
    ['rush', 'first', 'customScope'].forEach(key => { if (plan[key]) params.set(key, '1'); });
    return params;
  }
  // Only whitelisted current selections enter the calculation. Old totals and removed
  // supplies identifiers are never consumed, persisted, or mapped to a new add-on.
  return { config, money, normalize, calculate, fromParams, toParams };
})();
