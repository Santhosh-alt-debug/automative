/* Stackly Automotive — shared script (vanilla JS, no libraries) */
'use strict';
/* ---------- Shared state (declared first) ---------- */
const REAL_PAGES = ['index.html','models.html','service.html','pricing.html','about.html','contact.html','signin.html','signup.html','dashboard-customer.html','dashboard-admin.html','404.html'];
window.REAL_PAGES = REAL_PAGES;
const NAV = [{"href": "index.html", "label": "Home"}, {"href": "models.html", "label": "Models"}, {"href": "service.html", "label": "Service"}, {"href": "pricing.html", "label": "Pricing"}, {"href": "about.html", "label": "About"}, {"href": "contact.html", "label": "Contact"}];
window.NAV = NAV;
const STORE = { accounts:'sa_accounts', session:'sa_session', notice:'sa_notice', data:'sa_data_' };
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = window.matchMedia('(pointer: fine)').matches;
const COMMON_PW = ['password','password1','password12','password123','password@123','passw0rd','passw0rd!','12345678','123456789','1234567890','qwerty123','qwerty@123','qwertyuiop','iloveyou','admin123','admin@123','welcome1','welcome@123','abc12345','abcd1234','letmein1','india123','india@123','sunshine1','football1','monkey123','dragon123','test@123','changeme1','default1'];
const FX = {};               // set-piece registry, filled below
const fxDone = new WeakSet(); // set-pieces already run
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

/* ---------- Storage helpers ---------- */
function lsGet(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }
function lsSet(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function ssSet(k, v){ try{ sessionStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function ssGet(k){ try{ const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : null; }catch(e){ return null; } }
function hashPw(s){ let h = 2166136261; for (const c of 'sa::' + s){ h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); }
function getSession(){ return ssGet(STORE.session) || lsGet(STORE.session, null); }
function setSession(s){ lsSet(STORE.session, s); ssSet(STORE.session, s); }
function clearSession(){ try{ localStorage.removeItem(STORE.session); sessionStorage.removeItem(STORE.session); }catch(e){} }
const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');

/* ---------- Routing: anything not real → 404 ---------- */
function sweepLinks(){
  $$('a[href]').forEach(a => {
    const h = a.getAttribute('href').trim();
    if (h.startsWith('#') && h.length > 1) return;         // in-page anchors (dashboard views)
    if (a.dataset.keep === '1') return;
    if (/^(tel:|mailto:|https?:|\/\/|javascript:)/i.test(h) || h === '#' || h === ''){ a.setAttribute('href','404.html'); return; }
    const file = (h.split(/[?#]/)[0].split('/').pop() || 'index.html').toLowerCase();
    if (!REAL_PAGES.includes(file)) a.setAttribute('href','404.html');
  });
}

/* ---------- Close every overlay (back/forward safety) ---------- */
function closeAll(){
  document.body.classList.remove('menu-open','drawer-open','page-out');
  $('.burger')?.setAttribute('aria-expanded','false');
  $('.splash')?.classList.remove('on');
  $$('.modal.on').forEach(m => m.classList.remove('on'));
  $$('.cs.open').forEach(c => closeCs(c));
  $$('.npanel.on').forEach(p => { p.classList.remove('on'); $('.dh-act .bell')?.setAttribute('aria-expanded','false'); });
}
window.addEventListener('pageshow', closeAll);
window.addEventListener('popstate', closeAll);
window.addEventListener('pagehide', closeAll);

/* ---------- Header: burger with circle reveal ---------- */
function initMenu(){
  const b = $('.burger'); if (!b) return;
  b.addEventListener('click', () => {
    const r = b.getBoundingClientRect();
    const m = $('.mmenu');
    m.style.setProperty('--cx', (r.left + r.width/2) + 'px');
    m.style.setProperty('--cy', (r.top + r.height/2) + 'px');
    const open = !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open);
    b.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')){ closeAll(); b.focus(); } });
  window.addEventListener('resize', () => { if (innerWidth >= 1100) document.body.classList.remove('menu-open'); });
}

/* ---------- Logo splash + soft page fade ---------- */
function initNavFx(){
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const h = a.getAttribute('href');
    if (h.startsWith('#')) return;
    if (a.classList.contains('logo')){
      e.preventDefault();
      const s = $('.splash'); s?.classList.add('on');
      setTimeout(() => { location.href = h; }, REDUCED ? 0 : 520);
      return;
    }
    if (REDUCED) return;
    e.preventDefault();
    document.body.classList.add('page-out');
    setTimeout(() => { location.href = h; }, 200);
  });
}

/* ---------- Reveals (staggered, multi-direction) ---------- */
function initReveals(){
  const els = $$('[data-r]');
  $$('[data-stagger]').forEach(g => $$(':scope > [data-r]', g).forEach((el, i) => el.style.setProperty('--d', (i * 0.09) + 's')));
  const vh = innerHeight;
  els.forEach(el => { const r = el.getBoundingClientRect(); if (r.top < vh && r.bottom > 0) el.classList.add('in'); });
  document.documentElement.classList.add('rv-ready');
  if (REDUCED || !('IntersectionObserver' in window)){ els.forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin:'0px 0px -8% 0px' });
  els.filter(el => !el.classList.contains('in')).forEach(el => io.observe(el));
}

/* ---------- Set-pieces dispatched by data-fx ---------- */
function runFx(el){
  if (fxDone.has(el)) return;
  fxDone.add(el);
  const fn = FX[el.dataset.fx];
  if (!fn){ console.error('Unknown data-fx value: "' + el.dataset.fx + '"'); return; }
  fn(el, REDUCED);
}
function initFx(){
  const els = $$('[data-fx]');
  if (!els.length) return;
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting){ runFx(en.target); io.unobserve(en.target); } }), { threshold:0.15 }) : null;
  els.forEach(el => io ? io.observe(el) : runFx(el));
  // Scroll sweep: a jump-scroll past a set-piece still runs it
  let tick = false;
  const sweep = () => { tick = false; const vh = innerHeight; const atEnd = scrollY + vh >= document.documentElement.scrollHeight - 4; els.forEach(el => { if (atEnd && !fxDone.has(el) && el.getClientRects().length) { runFx(el); return; } if (!fxDone.has(el) && el.getClientRects().length && el.getBoundingClientRect().top < vh * 0.92) runFx(el); }); };
  addEventListener('scroll', () => { if (!tick){ tick = true; requestAnimationFrame(sweep); } }, { passive:true });
  sweep();
}
FX.stripe = (el, rm) => el.classList.add(rm ? 'done' : 'run');
FX.drive = (el, rm) => {   // hero car draws in, fills, wheels spin
  el.classList.add('drawn');
  if (rm) return;
  const road = $('.roadline', el.parentElement || el);
  if (road) addEventListener('scroll', () => { road.style.transform = 'translateX(' + (-(scrollY * 0.25) % 64) + 'px)'; el.style.transform = 'translateY(' + Math.min(scrollY * 0.08, 40) + 'px)'; }, { passive:true });
};
FX.count = (el, rm) => {
  $$('[data-to]', el).forEach(n => {
    const to = +n.dataset.to, suf = n.dataset.suf || '', div = +(n.dataset.div || 1), fmt = v => (div > 1 ? (v / div).toFixed(1) : Math.round(v).toLocaleString('en-IN')) + suf;
    if (rm){ n.textContent = fmt(to); return; }
    const t0 = performance.now(), d = 1600;
    const step = t => { const p = Math.min((t - t0) / d, 1); n.textContent = fmt(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
};
FX.gears = el => el.classList.add('run');
FX.steps = (el, rm) => el.classList.add(rm ? 'done' : 'run');
FX.road = (el, rm) => el.classList.add(rm ? 'done' : 'run');
FX.bars = (el, rm) => el.classList.add(rm ? 'done' : 'run');
FX.gauge = el => { el.dataset.live = '1'; if (window.__gaugeUpdate) window.__gaugeUpdate(); };
FX.timeline = (el, rm) => {
  const fill = $('.fill', el), items = $$('li', el);
  const upd = () => {
    const r = el.getBoundingClientRect();
    const p = rm ? 1 : Math.max(0, Math.min(1, (innerHeight * 0.75 - r.top) / r.height));
    fill.style.height = (p * (r.height - 12)) + 'px';
    items.forEach((li, i) => li.classList.toggle('on', p >= (i / Math.max(items.length - 1, 1)) - 0.001));
  };
  upd();
  if (!rm) addEventListener('scroll', () => requestAnimationFrame(upd), { passive:true });
};

/* ---------- Luxury touches ---------- */
function initTouches(){
  if (!FINE || REDUCED) return;
  $$('.btn').forEach(b => {
    b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); b.style.transform = 'translate(' + ((e.clientX - r.left - r.width/2) * 0.18) + 'px,' + ((e.clientY - r.top - r.height/2) * 0.25) + 'px)'; });
    b.addEventListener('mouseleave', () => { b.style.transform = ''; });
  });
  document.addEventListener('pointermove', e => {
    const c = e.target.closest && e.target.closest('.card'); if (!c) return;
    const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
  $$('.hero-card').forEach(h => {
    h.addEventListener('mousemove', e => { const r = h.getBoundingClientRect(); h.style.transform = 'perspective(900px) rotateY(' + ((e.clientX - r.left) / r.width - .5) * 6 + 'deg) rotateX(' + -((e.clientY - r.top) / r.height - .5) * 6 + 'deg)'; });
    h.addEventListener('mouseleave', () => { h.style.transform = ''; });
  });
}

/* ---------- Custom dropdowns (real <select> keeps value) ---------- */
function closeCs(w){ w.classList.remove('open','up'); $('.cs-btn', w)?.setAttribute('aria-expanded','false'); }
function syncCs(w){
  const sel = $('select', w), btn = $('.cs-btn', w), o = sel.options[sel.selectedIndex];
  const ph = !sel.value; btn.classList.toggle('ph', ph); $('span', btn).textContent = o ? o.text : '';
  $$('li', w).forEach(li => li.setAttribute('aria-selected', String(li.dataset.v === sel.value && !ph)));
}
function buildCs(sel){
  if (sel.closest('.cs')) return;
  const w = document.createElement('div'); w.className = 'cs';
  sel.parentNode.insertBefore(w, sel); w.appendChild(sel);
  sel.tabIndex = -1; sel.setAttribute('aria-hidden','true');
  const id = sel.id || ('s' + Math.random().toString(36).slice(2));
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'cs-btn'; btn.id = id + '-btn';
  btn.setAttribute('role','combobox'); btn.setAttribute('aria-haspopup','listbox'); btn.setAttribute('aria-expanded','false'); btn.setAttribute('aria-controls', id + '-list');
  btn.innerHTML = '<span></span>';
  const lbl = document.querySelector('label[for="' + sel.id + '"]');
  if (lbl){ lbl.setAttribute('for', btn.id); btn.setAttribute('aria-labelledby', (lbl.id || (lbl.id = id + '-lbl')) + ' ' + btn.id); }
  const ul = document.createElement('ul'); ul.className = 'cs-list'; ul.id = id + '-list'; ul.setAttribute('role','listbox'); ul.tabIndex = -1;
  w.append(btn, ul);
  const fill = () => { ul.innerHTML = ''; Array.from(sel.options).forEach((o, i) => { const li = document.createElement('li'); li.setAttribute('role','option'); li.id = id + '-o' + i; li.dataset.v = o.value; li.textContent = o.text; if (!o.value) li.className = 'ph'; ul.appendChild(li); }); syncCs(w); };
  fill(); sel._csRefresh = fill;
  let act = -1;
  const opts = () => $$('li:not(.ph)', ul);
  const setAct = i => { const os = opts(); if (!os.length) return; act = (i + os.length) % os.length; os.forEach((li, j) => li.classList.toggle('act', j === act)); btn.setAttribute('aria-activedescendant', os[act].id); os[act].scrollIntoView({ block:'nearest' }); };
  const open = () => {
    $$('.cs.open').forEach(c => c !== w && closeCs(c));
    w.classList.add('open'); btn.setAttribute('aria-expanded','true');
    const r = btn.getBoundingClientRect(); const below = innerHeight - r.bottom; w.classList.toggle('up', below < 260 && r.top > below);
    const os = opts(); setAct(Math.max(0, os.findIndex(li => li.dataset.v === sel.value)));
  };
  const choose = li => { sel.value = li.dataset.v; syncCs(w); closeCs(w); sel.dispatchEvent(new Event('change', { bubbles:true })); sel.dispatchEvent(new Event('input', { bubbles:true })); btn.focus(); };
  btn.addEventListener('click', () => w.classList.contains('open') ? closeCs(w) : open());
  btn.addEventListener('keydown', e => {
    const isOpen = w.classList.contains('open');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); if (!isOpen) open(); else setAct(act + (e.key === 'ArrowDown' ? 1 : -1)); }
    else if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); if (!isOpen) open(); else if (opts()[act]) choose(opts()[act]); }
    else if (e.key === 'Escape'){ if (isOpen){ e.preventDefault(); closeCs(w); } }
    else if (e.key === 'Tab'){ if (isOpen) closeCs(w); }
    else if (e.key === 'Home' && isOpen){ e.preventDefault(); setAct(0); }
    else if (e.key === 'End' && isOpen){ e.preventDefault(); setAct(-1); }
  });
  btn.addEventListener('blur', () => setTimeout(() => { if (!w.contains(document.activeElement) && !w.matches(':hover')) { closeCs(w); } }, 120));
  ul.addEventListener('mousedown', e => e.preventDefault());
  ul.addEventListener('click', e => { const li = e.target.closest('li'); if (li && !li.classList.contains('ph')) choose(li); });
  sel.addEventListener('change', () => syncCs(w));
}
document.addEventListener('click', e => { $$('.cs.open').forEach(w => { if (!w.contains(e.target)) closeCs(w); }); });

/* ---------- Validation ---------- */
function vEmail(v){
  if (!v) return 'Please enter your email address.';
  if (/\s/.test(v)) return 'Email cannot contain spaces.';
  if (v.length > 64) return 'Email can be at most 64 characters.';
  const at = v.split('@');
  if (at.length !== 2) return 'Email must contain exactly one @.';
  const [loc, dom] = at;
  if (!loc || !dom) return 'Enter a valid email, e.g. name@gmail.com.';
  if (v.startsWith('.') || v.endsWith('.') || loc.startsWith('.') || loc.endsWith('.') || dom.startsWith('.')) return 'Email cannot start or end with a dot.';
  if (v.includes('..')) return 'Email cannot contain two dots in a row.';
  if (!/^[A-Za-z0-9._%+-]+$/.test(loc)) return 'Email contains characters that are not allowed.';
  const labels = dom.split('.');
  if (labels.length < 2) return 'Enter a valid domain, e.g. name@gmail.com.';
  for (const l of labels){
    if (!/^[A-Za-z0-9-]+$/.test(l)) return 'Domain contains characters that are not allowed.';
    if (l.startsWith('-') || l.endsWith('-')) return 'Domain parts cannot start or end with a hyphen.';
    if (l.length < 2) return 'Each domain part needs at least 2 characters.';
    if (/^\d+$/.test(l)) return 'Domain parts cannot be only numbers.';
  }
  if (!/^[A-Za-z]{2,}$/.test(labels[labels.length - 1])) return 'The ending (like .com) must use letters only.';
  return '';
}
function vPassword(v){
  if (!v) return 'Please enter a password.';
  if (COMMON_PW.includes(v.toLowerCase())) return 'This password is too common. Choose something harder to guess.';
  if (v.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(v)) return 'Add at least one uppercase letter.';
  if (!/[a-z]/.test(v)) return 'Add at least one lowercase letter.';
  if (!/\d/.test(v)) return 'Add at least one number.';
  if (!/[^A-Za-z0-9]/.test(v)) return 'Add at least one symbol, e.g. @ # $ !';
  return '';
}
const RULES = {
  name: v => !v ? 'This field is required.' : !/^[A-Za-z]+$/.test(v) ? 'Only alphabets are allowed.' : '',
  phone: v => !v ? 'Please enter your phone number.' : !/^\d+$/.test(v) ? 'Only numbers are allowed.' : v.length !== 10 ? 'Enter exactly 10 digits.' : !/^[6-9]/.test(v) ? 'Mobile numbers must start with 6, 7, 8 or 9.' : '',
  email: vEmail,
  password: vPassword,
  pwlogin: v => !v ? 'Please enter your password.' : '',
  confirm: (v, el) => { const p = el.form.querySelector('[data-v=password]'); return !v ? 'Please confirm your password.' : v !== p.value ? 'Passwords do not match.' : ''; },
  reg: v => !v ? 'Please enter the registration number.' : !/^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/.test(v) ? 'Use the Indian format, e.g. TN30AB1234.' : '',
  pin: v => !v ? 'Please enter the pincode.' : !/^\d+$/.test(v) ? 'Only numbers are allowed.' : v.length !== 6 ? 'Pincode must be exactly 6 digits.' : v[0] === '0' ? 'Pincode cannot start with 0.' : '',
  future: v => { if (!v) return 'Please choose a date.'; const d = new Date(v + 'T00:00:00'), t = new Date(); t.setHours(0,0,0,0); return d > t ? '' : 'Choose a date after today.'; },
  select: v => v ? '' : 'Please choose an option.',
  radio: (v, el) => el.form.querySelector('input[name="' + el.name + '"]:checked') ? '' : 'Please choose an option.',
  text: v => { const n = v.trim().length; return !n ? 'Please write a message.' : n < 10 ? 'Write at least 10 characters.' : n > 600 ? 'Keep it under 600 characters.' : ''; },
  check: (v, el) => el.checked ? '' : (el.dataset.msg || 'Please tick this box to continue.'),
  tenure: v => { const n = +v; return v === '' ? 'Please enter a tenure.' : !/^\d+$/.test(v) ? 'Only numbers are allowed.' : n < 12 || n > 84 ? 'Tenure must be between 12 and 84 months.' : ''; },
  down: (v, el) => { const tot = +(el.dataset.total || 0); if (v === '') return 'Please enter a down payment.'; if (!/^\d+$/.test(v)) return 'Only numbers are allowed.'; const n = +v; return n < tot * 0.1 || n > tot * 0.9 ? 'Down payment must be between ' + inr(Math.ceil(tot * 0.1)) + ' and ' + inr(Math.floor(tot * 0.9)) + ' (10%–90%).' : ''; },
  rate: v => { const n = parseFloat(v); return v === '' ? 'Please enter an interest rate.' : !/^\d+(\.\d{1,2})?$/.test(v) ? 'Only numbers are allowed.' : n < 6 || n > 20 ? 'Rate must be between 6% and 20%.' : ''; }
};
function fldOf(el){ return el.closest('.fld'); }
function setErr(el, msg){
  const f = fldOf(el); if (!f) return;
  let b = $(':scope > .bub', f);
  if (!b){ b = document.createElement('div'); b.className = 'bub'; b.id = (el.id || el.name) + '-err'; b.setAttribute('role','alert'); f.appendChild(b); }
  b.textContent = msg || '';
  f.classList.toggle('err', !!msg);
  const target = el.closest('.cs') ? $('.cs-btn', el.closest('.cs')) : el;
  target.setAttribute('aria-invalid', msg ? 'true' : 'false');
  if (msg) target.setAttribute('aria-describedby', b.id); else target.removeAttribute('aria-describedby');
}
function check(el){ const r = RULES[el.dataset.v]; if (!r) return true; const msg = r(el.type === 'checkbox' ? '' : el.value.trim ? el.value.trim() : el.value, el); setErr(el, msg); return !msg; }
function initFields(root = document){
  $$('select', root).forEach(buildCs);
  $$('[data-v]', root).forEach(el => {
    const kind = el.dataset.v;
    if (kind === 'name'){
      el.addEventListener('keydown', e => { if (e.key === ' ') e.preventDefault(); });
      el.addEventListener('paste', e => { e.preventDefault(); const t = (e.clipboardData || window.clipboardData).getData('text').replace(/\s+/g, ''); document.execCommand('insertText', false, t.slice(0, 16)); });
      el.addEventListener('input', () => { if (/\s/.test(el.value)) el.value = el.value.replace(/\s+/g, ''); });
    }
    if (kind === 'reg') el.addEventListener('input', () => { const p = el.selectionStart; el.value = el.value.toUpperCase().replace(/\s+/g, ''); try{ el.setSelectionRange(p, p); }catch(e){} });
    if (kind === 'email') el.addEventListener('input', () => {});
    const evt = (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'radio') ? 'change' : 'input';
    el.addEventListener(evt, () => { setErr(el, ''); if (evt === 'change' && el.form && el.form.dataset.tried) check(el); });
    if (el.tagName === 'SELECT'){ const btn = $('.cs-btn', el.closest('.cs')); btn?.addEventListener('blur', () => setTimeout(() => { if (!el.closest('.cs').classList.contains('open') && el.form?.dataset.touched && RULES.select(el.value)) check(el); }, 150)); btn?.addEventListener('click', () => { if (el.form) el.form.dataset.touched = '1'; }); }
    else if (el.type !== 'checkbox' && el.type !== 'radio') el.addEventListener('blur', () => { if ((el.value !== '' || el.form?.dataset.tried) && !fldOf(el)?.classList.contains('err')) check(el); });
  });
  $$('textarea[maxlength]', root).forEach(t => { const c = t.parentElement.querySelector('.count'); if (c){ const u = () => c.textContent = t.value.length + ' / ' + t.maxLength; t.addEventListener('input', u); u(); } });
  $$('.eye', root).forEach(b => b.addEventListener('click', () => { const i = b.parentElement.querySelector('input'); const show = i.type === 'password'; i.type = show ? 'text' : 'password'; b.setAttribute('aria-pressed', String(show)); b.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); }));
}
function validateForm(form){
  form.dataset.tried = '1';
  const seen = new Set(); let first = null, ok = true;
  $$('[data-v]', form).forEach(el => {
    if (el.type === 'radio'){ if (seen.has(el.name)) return; seen.add(el.name); }
    if (el.closest('[hidden]')) return;
    if (!check(el)){ ok = false; if (!first) first = el; }
  });
  if (first){ const t = first.closest('.cs') ? $('.cs-btn', first.closest('.cs')) : (first.type === 'radio' || first.type === 'checkbox') ? first : first; try{ t.focus({ preventScroll:true }); }catch(e){} fldOf(first)?.scrollIntoView({ block:'center', behavior: REDUCED ? 'auto' : 'smooth' }); }
  return ok;
}
function toast(msg, ms = 2600){ let t = $('.toast'); if (!t){ t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role','status'); document.body.appendChild(t); } t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), ms); }
function resetForm(form){ form.reset(); delete form.dataset.tried; delete form.dataset.touched; $$('.fld.err', form).forEach(f => f.classList.remove('err')); $$('.cs', form).forEach(syncCs); $$('textarea', form).forEach(t => t.dispatchEvent(new Event('input'))); $$('.fld.err', form).forEach(f => f.classList.remove('err')); }

/* Simple public forms (contact, service booking, find-car) */
function initSimpleForms(){
  $$('form[data-form=simple]').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); if (!validateForm(f)) return; toast(f.dataset.ok || 'Thank you — we will call you within one working day.'); resetForm(f); }));
  const qs = $('#quick-search');
  qs?.addEventListener('submit', e => { e.preventDefault(); if (!validateForm(qs)) return; location.href = 'models.html?body=' + encodeURIComponent($('#qs-body').value) + '&budget=' + encodeURIComponent($('#qs-budget').value) + '#browse'; });
}

/* ---------- Modals ---------- */
function openModal(id){ const m = document.getElementById(id); if (!m) return; m.classList.add('on'); m._ret = document.activeElement; setTimeout(() => $('button', m)?.focus(), 30); }
document.addEventListener('click', e => { const c = e.target.closest('[data-close]'); if (c){ const m = c.closest('.modal'); m.classList.remove('on'); m._ret?.focus?.(); } else if (e.target.classList?.contains('modal')) e.target.classList.remove('on'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.modal.on').forEach(m => m.classList.remove('on')); });

/* ---------- Auth ---------- */
function initAuth(){
  const up = $('#signup-form');
  if (up){
    up.addEventListener('submit', e => {
      e.preventDefault();
      const ok = validateForm(up);
      const terms = $('#su-terms');
      if (ok && !terms.checked){ openModal('terms-modal'); return; }
      if (!ok) return;
      const email = $('#su-email').value.trim().toLowerCase();
      const accs = lsGet(STORE.accounts, []);
      if (accs.some(a => a.email === email)){ setErr($('#su-email'), 'An account with this email already exists. Sign in instead.'); $('#su-email').focus(); return; }
      accs.push({ first: $('#su-first').value.trim(), last: $('#su-last').value.trim(), email, phone: $('#su-phone').value.trim(), role: up.querySelector('input[name=role]:checked').value, pw: hashPw($('#su-pass').value), created: Date.now() });
      lsSet(STORE.accounts, accs);
      lsSet(STORE.notice, email);
      location.href = 'signin.html';
    });
  }
  const inF = $('#signin-form');
  if (inF){
    const n = lsGet(STORE.notice, null);
    if (n){ const box = $('#created'); box.hidden = false; $('#si-email').value = n; try{ localStorage.removeItem(STORE.notice); }catch(e){} }
    inF.addEventListener('submit', e => {
      e.preventDefault();
      if (!validateForm(inF)) return;
      const email = $('#si-email').value.trim().toLowerCase(), role = $('#si-role').value;
      const acc = lsGet(STORE.accounts, []).find(a => a.email === email);
      if (!acc){ setErr($('#si-email'), 'No account found with this email. Create one first.'); $('#si-email').focus(); return; }
      if (acc.pw !== hashPw($('#si-pass').value)){ setErr($('#si-pass'), 'Incorrect password. Please try again.'); $('#si-pass').focus(); return; }
      if (acc.role !== role){ setErr($('#si-role'), 'This account is registered as ' + (acc.role === 'staff' ? 'Staff' : 'Customer') + '. Choose that role.'); return; }
      setSession({ email: acc.email, first: acc.first, last: acc.last, role: acc.role, at: Date.now() });
      location.href = acc.role === 'staff' ? 'dashboard-admin.html' : 'dashboard-customer.html';
    });
  }
}

window.__carSvg = k => { const t = document.getElementById('tpl-car-' + k); return t ? t.innerHTML : ''; };
/* ---------- Dashboards ---------- */
function dashData(s){
  const k = STORE.data + s.email;
  let d = lsGet(k, null);
  if (!d){
    d = s.role === 'staff' ? {
      queue:[{ id:'BK-2041', cust:'Karthik R', car:'Aurelia Sedan · TN30AB4521', svc:'General service', date:'Today 10:30', st:'New', tech:'' },
             { id:'BK-2040', cust:'Priya S', car:'Volta EV · TN30EV2088', svc:'EV battery check', date:'Today 11:15', st:'Assigned', tech:'Murugan' },
             { id:'BK-2038', cust:'Arun Kumar', car:'Terra SUV · TN54C7710', svc:'AC service', date:'Today 12:00', st:'In progress', tech:'Selvi' },
             { id:'BK-2035', cust:'Deepa M', car:'Pico Hatch · TN28Z3302', svc:'Wheel alignment', date:'Today 14:30', st:'New', tech:'' }],
      techs:[{ name:'Murugan K', skill:'EV & hybrid systems', bay:'Bay 2', st:'On job' },{ name:'Selvi R', skill:'AC & electricals', bay:'Bay 4', st:'On job' },{ name:'Rajesh P', skill:'Engine & transmission', bay:'Bay 1', st:'Available' },{ name:'Anitha V', skill:'Alignment & tyres', bay:'Bay 5', st:'On leave' }]
    } : {
      cars:[{ model:'Aurelia Sedan', kind:'sedan', reg:'TN30AB1234', next:'12 Jan 2027', km:'18,420 km' },{ model:'Volta EV', kind:'ev', reg:'TN30EV5521', next:'02 Mar 2027', km:'6,210 km' }],
      history:[{ id:'SR-1182', car:'TN30AB1234', svc:'General service', date:'14 Jul 2026', amt:6499, st:'Completed' },{ id:'SR-1097', car:'TN30EV5521', svc:'EV battery check', date:'02 Jun 2026', amt:1999, st:'Completed' },{ id:'SR-0950', car:'TN30AB1234', svc:'Wheel alignment', date:'18 Feb 2026', amt:1299, st:'Completed' }]
    };
    lsSet(k, d);
  }
  return { d, save: () => lsSet(k, d) };
}
const stTag = s => { const m = { 'Completed':'tg-ok', 'Ready':'tg-ok', 'Available':'tg-ok', 'In progress':'tg-prog', 'On job':'tg-prog', 'Assigned':'tg-prog', 'Booked':'tg-warn', 'New':'tg-warn', 'On leave':'tg-err', 'Cancelled':'tg-err' }; return '<span class="tg ' + (m[s] || 'tg-neu') + '">' + s + '</span>'; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
function initDash(){
  const root = $('.dash'); if (!root) return;
  const want = root.dataset.role, s = getSession();
  if (!s){ location.replace('signin.html'); return; }
  if (s.role !== want){ location.replace(s.role === 'staff' ? 'dashboard-admin.html' : 'dashboard-customer.html'); return; }
  setSession(s);
  const full = s.first + (s.last ? ' ' + s.last : '');
  $$('[data-user=initial]').forEach(e => e.textContent = s.first.charAt(0).toUpperCase());
  $$('[data-user=name]').forEach(e => e.textContent = full);
  $$('[data-user=first]').forEach(e => e.textContent = s.first);
  $$('[data-user=email]').forEach(e => { e.textContent = s.email; e.title = s.email; });
  root.hidden = false;
  const dh = $('.dh'); const setDh = () => document.documentElement.style.setProperty('--dh', dh.offsetHeight + 'px'); setDh(); addEventListener('resize', setDh);
  $('#logout')?.addEventListener('click', () => { clearSession(); location.href = 'signin.html'; });
  const bell = $('.dh-act .bell'), np = $('.npanel');
  bell?.addEventListener('click', e => { e.stopPropagation(); const on = !np.classList.contains('on'); np.classList.toggle('on', on); bell.setAttribute('aria-expanded', String(on)); });
  document.addEventListener('click', e => { if (np && !np.contains(e.target)){ np.classList.remove('on'); bell?.setAttribute('aria-expanded','false'); } });
  $('.dburger')?.addEventListener('click', () => { const on = !document.body.classList.contains('drawer-open'); document.body.classList.toggle('drawer-open', on); $('.dburger').setAttribute('aria-expanded', String(on)); });
  $('.dback')?.addEventListener('click', () => document.body.classList.remove('drawer-open'));
  const views = $$('.view').map(v => v.id);
  const show = () => {
    const h = location.hash.slice(1); const id = views.includes(h) ? h : views[0];
    $$('.view').forEach(v => { const on = v.id === id; v.classList.toggle('on', on); v.hidden = !on; });
    $$('.side a').forEach(a => { const on = a.getAttribute('href') === '#' + id; a.classList.toggle('act', on); if (on) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
    document.body.classList.remove('drawer-open');
    const v = document.getElementById(id); $$('[data-fx]', v).forEach(runFx);
    window.scrollTo(0, 0);
  };
  addEventListener('hashchange', show); show();
  const { d, save } = dashData(s);
  if (want === 'customer'){
    const carSvg = k => window.__carSvg ? window.__carSvg(k) : '';
    const renderCars = () => { $('#cars-grid').innerHTML = d.cars.map(c => '<article class="card mcard"><div class="gfx photo">' + carSvg(c.kind) + '</div><span class="tg tg-gold">' + esc(c.reg) + '</span><h3>' + esc(c.model) + '</h3><p class="mute grow">Odometer ' + esc(c.km) + '</p><div class="foot"><span>Next service<br><b class="price">' + esc(c.next) + '</b></span><a class="btn sm" href="#book">Book service</a></div></article>').join(''); };
    const renderHist = () => { $('#hist-body').innerHTML = d.history.map(h => '<tr><td data-label="Ref">' + esc(h.id) + '</td><td data-label="Car">' + esc(h.car) + '</td><td data-label="Service">' + esc(h.svc) + '</td><td data-label="Date" class="num">' + esc(h.date) + '</td><td data-label="Amount" class="num">' + inr(h.amt) + '</td><td data-label="Status">' + stTag(h.st) + '</td></tr>').join(''); };
    renderCars(); renderHist();
    $('#m-cars').textContent = d.cars.length; $('#m-svc').textContent = d.history.length; $('#m-spent').textContent = inr(d.history.reduce((a, h) => a + h.amt, 0));
    const regSel = $('#bk-car'); regSel.innerHTML = '<option value="">Choose your car</option>' + d.cars.map(c => '<option value="' + esc(c.reg) + '">' + esc(c.model) + ' · ' + esc(c.reg) + '</option>').join(''); regSel._csRefresh?.();
    const f = $('#book-form');
    f.addEventListener('submit', e => {
      e.preventDefault(); if (!validateForm(f)) return;
      const price = { general:6499, major:12999, ac:3499, align:1299, ev:1999, detail:8999 }, names = { general:'General service', major:'Major service', ac:'AC service', align:'Wheel alignment', ev:'EV battery check', detail:'Detailing & ceramic' };
      const pk = $('#bk-pkg').value, dt = new Date($('#bk-date').value + 'T00:00:00');
      d.history.unshift({ id:'SR-' + (1200 + d.history.length), car: $('#bk-car').value, svc: names[pk], date: dt.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }), amt: price[pk], st:'Booked' });
      save(); renderHist(); $('#m-svc').textContent = d.history.length; resetForm(f); location.hash = 'history'; toast('Service booked — it is at the top of your history.');
    });
  } else {
    const techOpts = () => d.techs.filter(t => t.st !== 'On leave');
    const renderQ = () => {
      $('#q-body').innerHTML = d.queue.map((q, i) => '<tr><td data-label="Ref">' + esc(q.id) + '</td><td data-label="Customer">' + esc(q.cust) + '</td><td data-label="Car">' + esc(q.car) + '</td><td data-label="Service">' + esc(q.svc) + '</td><td data-label="Slot" class="num">' + esc(q.date) + '</td><td data-label="Status">' + stTag(q.st) + (q.tech ? ' <span class="mute">' + esc(q.tech) + '</span>' : '') + '</td><td data-label="Action">' + (q.st === 'New' ? '<button class="btn sm" data-assign="' + i + '">Assign</button>' : '<button class="btn sm ghost" disabled>Assigned</button>') + '</td></tr>').join('');
      $('#m-new').textContent = d.queue.filter(q => q.st === 'New').length;
    };
    const renderT = () => { $('#t-body').innerHTML = d.techs.map(t => '<tr><td data-label="Name"><b>' + esc(t.name) + '</b></td><td data-label="Skill">' + esc(t.skill) + '</td><td data-label="Bay">' + esc(t.bay) + '</td><td data-label="Status">' + stTag(t.st) + '</td></tr>').join(''); $('#m-tech').textContent = d.techs.length; };
    renderQ(); renderT();
    let rr = 0;
    $('#q-body').addEventListener('click', e => { const b = e.target.closest('[data-assign]'); if (!b) return; const q = d.queue[+b.dataset.assign]; const ts = techOpts(); const t = ts[rr++ % ts.length]; q.st = 'Assigned'; q.tech = t.name.split(' ')[0]; save(); renderQ(); toast(q.id + ' assigned to ' + t.name + '.'); });
    const f = $('#tech-form');
    f.addEventListener('submit', e => {
      e.preventDefault(); if (!validateForm(f)) return;
      d.techs.unshift({ name: $('#tf-first').value.trim() + ' ' + $('#tf-last').value.trim(), skill: $('#tf-skill').selectedOptions[0].text, bay: $('#tf-bay').selectedOptions[0].text, st:'Available' });
      save(); renderT(); resetForm(f); location.hash = 'techs'; toast('Technician added — shown at the top of the list.');
    });
  }
}

/* ---------- Home widgets ---------- */
function initCarousel3d(){
  const c = $('.c3d'); if (!c) return;
  const ring = $('.c3d-ring', c), cards = $$('.c3d-card', c), n = cards.length, step = 360 / n;
  let ang = 0, timer = null;
  const radius = () => Math.round(ring.offsetWidth / 2 / Math.tan(Math.PI / n)) + 30;
  const place = () => { const r = radius(); cards.forEach((cd, i) => cd.style.transform = 'rotateY(' + (i * step) + 'deg) translateZ(' + r + 'px)'); ring.style.transform = 'translateZ(' + -r + 'px) rotateY(' + ang + 'deg)'; };
  const go = d => { ang -= d * step; place(); };
  place(); addEventListener('resize', place);
  $('.c3d-prev')?.addEventListener('click', () => { go(-1); restart(); });
  $('.c3d-next')?.addEventListener('click', () => { go(1); restart(); });
  let sx = null, sa = 0;
  c.addEventListener('pointerdown', e => { sx = e.clientX; sa = ang; c.classList.add('drag'); c.setPointerCapture(e.pointerId); stop(); });
  c.addEventListener('pointermove', e => { if (sx === null) return; ang = sa + (e.clientX - sx) * 0.4; place(); });
  const end = e => { if (sx === null) return; const dx = (e && e.clientX !== undefined ? e.clientX : sx) - sx; sx = null; c.classList.remove('drag'); ang = Math.abs(dx) > 40 ? sa + Math.sign(dx) * step : sa; place(); restart(); };
  c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
  c.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); });
  const start = () => { if (!REDUCED && !timer) timer = setInterval(() => go(1), 3800); };
  const stop = () => { clearInterval(timer); timer = null; };
  const restart = () => { stop(); start(); };
  c.addEventListener('mouseenter', stop); c.addEventListener('mouseleave', start);
  start();
}
function initTestimonials(){
  const t = $('.tcar'); if (!t) return;
  const track = $('.tcar-t', t), n = $$('.tcar-s', t).length, dots = $('.dots', t.parentElement);
  let i = 0, tm;
  dots.innerHTML = Array.from({ length:n }, (_, k) => '<button type="button" aria-label="Show review ' + (k + 1) + '"></button>').join('');
  const go = k => { i = (k + n) % n; track.style.transform = 'translateX(' + (-i * 100) + '%)'; $$('button', dots).forEach((b, j) => b.setAttribute('aria-current', String(j === i))); $$('.tcar-s', t).forEach((s, j) => s.setAttribute('aria-hidden', String(j !== i))); };
  $$('button', dots).forEach((b, k) => b.addEventListener('click', () => { go(k); restart(); }));
  $('.t-prev')?.addEventListener('click', () => { go(i - 1); restart(); });
  $('.t-next')?.addEventListener('click', () => { go(i + 1); restart(); });
  const restart = () => { clearInterval(tm); if (!REDUCED) tm = setInterval(() => go(i + 1), 6000); };
  go(0); restart();
}

/* ---------- Models page ---------- */
function initModels(){
  const grid = $('#model-grid'); if (!grid) return;
  const cards = $$('.mcard', grid), state = { body:'all', fuel:'all', budget:'all', trans:'all', saved:false };
  const p = new URLSearchParams(location.search);
  if (p.get('body')) state.body = p.get('body'); if (p.get('budget')) state.budget = p.get('budget');
  const saved = new Set(lsGet('sa_saved', [])), cmp = new Set();
  const apply = () => {
    let shown = 0;
    cards.forEach(c => { const ok = (state.body === 'all' || c.dataset.body === state.body) && (state.fuel === 'all' || c.dataset.fuel === state.fuel) && (state.budget === 'all' || c.dataset.budget === state.budget) && (state.trans === 'all' || c.dataset.trans.includes(state.trans)) && (!state.saved || saved.has(c.dataset.id)); c.hidden = !ok; if (ok) shown++; });
    $('#no-match').hidden = shown > 0; $('#match-count').textContent = shown + (shown === 1 ? ' car' : ' cars');
    $$('.chip[data-f]').forEach(ch => ch.setAttribute('aria-pressed', String(state[ch.dataset.f] === ch.dataset.val)));
  };
  $$('.chip[data-f]').forEach(ch => ch.addEventListener('click', () => { state[ch.dataset.f] = ch.dataset.val; apply(); }));
  $('#only-saved')?.addEventListener('click', e => { state.saved = !state.saved; e.currentTarget.setAttribute('aria-pressed', String(state.saved)); apply(); });
  cards.forEach(c => {
    const sv = $('.t-save', c), cp = $('.t-cmp', c), id = c.dataset.id;
    sv.setAttribute('aria-pressed', String(saved.has(id)));
    sv.addEventListener('click', () => { saved.has(id) ? saved.delete(id) : saved.add(id); lsSet('sa_saved', [...saved]); sv.setAttribute('aria-pressed', String(saved.has(id))); sv.textContent = saved.has(id) ? 'Saved' : 'Save'; if (state.saved) apply(); });
    sv.textContent = saved.has(id) ? 'Saved' : 'Save';
    cp.addEventListener('click', () => {
      if (cmp.has(id)) cmp.delete(id); else { if (cmp.size >= 3){ toast('You can compare up to 3 cars. Remove one first.'); return; } cmp.add(id); }
      cp.setAttribute('aria-pressed', String(cmp.has(id))); updCmp();
    });
  });
  const updCmp = () => { const bar = $('.cmpbar'); bar.classList.toggle('on', cmp.size > 0); $('#cmp-n').textContent = cmp.size + ' of 3 selected: ' + [...cmp].map(i => $('.mcard[data-id="' + i + '"] h3').textContent).join(', '); $$('#spec-table [data-col]').forEach(el => el.classList.toggle('hl', cmp.has(el.dataset.col))); };
  $('#cmp-clear')?.addEventListener('click', () => { cmp.clear(); $$('.t-cmp').forEach(b => b.setAttribute('aria-pressed','false')); updCmp(); });
  apply();
}

/* ---------- Pricing calculator ---------- */
function initPricing(){
  const f = $('#calc'); if (!f) return;
  let MODELS = {}; try{ MODELS = JSON.parse($('#models-data').textContent); }catch(e){ console.error('Pricing data missing'); }
  const STATES = { salem:['Tamil Nadu',0], chennai:['Tamil Nadu',0], coimbatore:['Tamil Nadu',0], madurai:['Tamil Nadu',0], bengaluru:['Karnataka',1], kochi:['Kerala',2], puducherry:['Puducherry',3] };
  // Indicative road-tax rules per state: [<10L, ≥10L, EV]
  const RTO = [[0.12,0.15,0],[0.18,0.20,0],[0.10,0.15,0.05],[0.06,0.08,0]];
  const INS = { comp:0.032, zero:0.041, tp:0.0 };
  const ACC = { none:0, essential:18500, premium:46500, signature:89000 };
  const mSel = $('#c-model'), vSel = $('#c-variant');
  const fillVar = () => { const m = MODELS[mSel.value]; vSel.innerHTML = '<option value="">Choose a variant</option>' + (m ? m.v.map((v, i) => '<option value="' + i + '">' + v[0] + ' — ' + inr(v[1]) + '</option>').join('') : ''); vSel._csRefresh?.(); };
  mSel.addEventListener('change', () => { fillVar(); if (MODELS[mSel.value]) { vSel.value = '0'; vSel._csRefresh?.(); } calc(); });
  const down = $('#c-down'), ten = $('#c-tenure'), tenR = $('#c-tenure-r'), rate = $('#c-rate');
  ten.addEventListener('input', () => { if (/^\d+$/.test(ten.value)) tenR.value = Math.min(84, Math.max(12, +ten.value)); calc(); });
  tenR.addEventListener('input', () => { ten.value = tenR.value; setErr(ten, ''); calc(); });
  let lastTotal = 0, userDown = false;
  down.addEventListener('input', () => { userDown = true; calc(); });
  ['#c-city','#c-ins','#c-acc','#c-variant'].forEach(s => $(s).addEventListener('change', calc));
  rate.addEventListener('input', calc);
  function calc(){
    const m = MODELS[mSel.value], v = m && m.v[+vSel.value];
    const out = id => $('#' + id);
    if (!m || !v){ ['b-ex','b-rto','b-ins','b-tcs','b-acc','b-tot'].forEach(i => out(i).textContent = '—'); out('emi').textContent = '—'; return; }
    const ex = v[1], st = STATES[$('#c-city').value] || STATES.salem, rules = RTO[st[1]];
    const rto = Math.round(ex * (m.fuel === 'ev' ? rules[2] : ex < 1000000 ? rules[0] : rules[1]));
    const insType = $('#c-ins').value || 'comp';
    const ins = insType === 'tp' ? 3416 : Math.round(ex * INS[insType]);
    const tcs = ex > 1000000 ? Math.round(ex * 0.01) : 0;
    const acc = ACC[$('#c-acc').value || 'none'];
    const tot = ex + rto + ins + tcs + acc;
    out('b-ex').textContent = inr(ex); out('b-rto').textContent = inr(rto) + (m.fuel === 'ev' && rules[2] === 0 ? ' (EV exempt)' : ''); out('b-ins').textContent = inr(ins); out('b-tcs').textContent = tcs ? inr(tcs) : '₹0 (under ₹10 lakh)'; out('b-acc').textContent = inr(acc); out('b-tot').textContent = inr(tot); out('b-state').textContent = st[0];
    if (!userDown || tot !== lastTotal && !userDown){ down.value = Math.round(tot * 0.2); }
    lastTotal = tot; down.dataset.total = tot;
    $('#down-hint').textContent = 'Between ' + inr(Math.ceil(tot * 0.1)) + ' and ' + inr(Math.floor(tot * 0.9));
    const dv = +down.value, n = +ten.value, r = parseFloat(rate.value) / 1200;
    const okIn = !RULES.down(down.value, down) && !RULES.tenure(ten.value) && !RULES.rate(rate.value);
    if (!okIn){ out('emi').textContent = 'Check inputs'; setGauge(0); return; }
    const P = tot - dv, emi = r ? P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1) : P / n;
    out('emi').textContent = inr(emi); out('b-loan').textContent = inr(P); out('b-int').textContent = inr(emi * n - P);
    setGauge(emi);
  }
  function setGauge(emi){
    const g = $('.gauge'); if (!g) return;
    const p = Math.max(0, Math.min(1, emi / 100000));
    g._p = p; if (!g.closest('[data-live]') && !REDUCED && !g.dataset.live) return;
    $('.needle', g).style.transform = 'rotate(' + (-120 + p * 240) + 'deg)';
    $('.arc', g).style.strokeDashoffset = String(1 - p);
    $('#g-val').textContent = emi ? inr(emi) : '₹0';
  }
  window.__gaugeUpdate = () => { const g = $('.gauge'); g.dataset.live = '1'; calc(); };
  f.addEventListener('submit', e => { e.preventDefault(); if (validateForm(f)){ calc(); toast('Quote updated. A sales advisor can lock this price for 7 days.'); } });
  mSel.value = mSel.options[1].value; fillVar(); vSel.value = '0'; $$('.cs', f).forEach(syncCs); calc();
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  sweepLinks();
  closeAll();
  if (!REDUCED) document.body.classList.add('page-in');
  initMenu(); initNavFx(); initFields(); initSimpleForms(); initAuth(); initDash();
  initCarousel3d(); initTestimonials(); initModels(); initPricing();
  initReveals(); initFx(); initTouches();
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
});
