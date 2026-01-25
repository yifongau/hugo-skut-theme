// De gehele executie van de code wordt omvat door window.onload.
// Dit betekent dat de code pas draait
// wanneer de hele webpagina, 
// incluis afbeeldingen en stylesheets,
// geladen is.
//
// Dit is nodig voor de correcte manipulatie van het DOM.
window.onload = function () {


// BEGINWAARDEN VAN GLOBALE VARIABELEN
	
    let leftVisible = false;
    let rightVisible = false;
//    const searchIndex = buildSearchIndex(titlesByKey);
    let lastTrackedList = [];
    let suppressRenderTracking = false;
    let searchActive = false;
    let previousLeftMenuSelection = null;

   
    let uidCounter = 0;
    function uid(prefix = "id") {
      uidCounter += 1;
      return `${prefix}-${Date.now()}-${uidCounter}`;
    }
 
  // ASYNCHROON: PARALLEL VS. IN SEQUENTIE
  // Na het laden van de gehele pagina 
  // begint de javascript met een asynchrone fetchTitles(),
  // waarin een json-bestand wordt opgehaald van de SKUT-webhost.
  //
  // Het is belangrijk hier om te onderscheiden
  // welke zaken afhankelijk en welke zaken onafhankelijk zijn
  // van het antwoord op fetchTitles().
  //
  // Je zou een asynchrone functie kunnen zien als een functie
  // die een deel van het programma afsplitst 
  // en blootstelt aan de buitenwereld,
  // en alleen dat deel afhankelijk maakt van de externe wereld.
  
  // Normaliter heeft een programma geen afhankelijkheden van de wereld,
  // en kan diens voortgang geïsoleerd verlopen van de wereld.
  //
  // In een asynchrone functie zit een aanroep van de externe wereld,
  // die buiten de controle van het programma ligt.
  // Daarmee wordt de tijd van een deel van het programma verstrengeld
  // met de tijd van de wereld.
  //
  // Binnen de asynchrone functie plaats je alle zaken 
  // die afhankelijk moeten zijn
  // van een gespecificeerde gebeurtenis.
  // D.w.z. moeten weten van het wel en wee
  // van de gebeurtenis.
  //
  // Met elke asynchrone functie ontstaat er een nieuwe splitsing
  // in de tijd van het programma. 

  fetchTitles()

  // CONTENT-FUNCTIES
    async function fetchTitles() {
      const initFetch = await fetch('index.json')
      
      if (!initFetch.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

      const initJSON = await initFetch.json();
      renderTitles(initJSON);

    }
      
    function renderTitles(list) {
      const container = document.getElementById('titles');
      if (!container) return;

      const items = Array.isArray(list) ? list : [];
      if (!suppressRenderTracking) {
        lastTrackedList = items;
        searchActive = false;
      }

      container.innerHTML = '';

      items.forEach(item => {
        const articleId = uid('art');
        const contentId = uid('content');

        const el = document.createElement('article');
        el.className = 'block';
        el.setAttribute('data-article-id', articleId);

        // hier wordt het format van het titel-item bepaald 
        el.innerHTML = `
          ${item.reeksen ? `<div class="meta">${item.reeksen}</div>` : ''}
          <h3 class="title">
            <button type="button"
                    class="title-toggle"
                    aria-expanded="false"
                    aria-controls="${contentId}">
              ${item.title}
            </button>
          </h3>
          ${item.auteurs ? `<div class="kicker">${item.auteurs}</div>` : ''}
          ${item.img ? `<img class="titleimg" src="${item.img}" alt="">` : ''}

          <div id="${contentId}" class="content" hidden>
            ${item.content ? item.content : ''}
          </div>
        `;
        container.appendChild(el);
      });
      
      if (!items || items.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'block';
        empty.textContent = 'Geen titels.';
        container.appendChild(empty);
      }
    }

    // TODO: Vervangen door hugo search library
    function buildSearchIndex(map) {
      const entries = [];
      Object.entries(map || {}).forEach(([key, items]) => {
        (items || []).forEach(item => {
          const textBlob = [
            key,
            item?.title,
            item?.meta,
            item?.tag,
            stripHTML(item?.content || '')
          ].filter(Boolean).join(' ');
          entries.push({
            key,
            item,
            searchBlob: normalizeText(textBlob),
          });
        });
      });
      return entries;
    }

    // NUTSFUNCTIES
    function stripHTML(value) {
      return (value || '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function normalizeText(value) {
      return (value || '')
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    }

    // TODO: Vervangen door hugo search library
    function combineSearchTag(key, tag) {
      const cleanKey = (key || '').trim();
      const cleanTag = (tag || '').trim();
      if (!cleanKey && !cleanTag) return '';
      if (!cleanTag) return cleanKey;
      if (!cleanKey) return cleanTag;
      if (normalizeText(cleanKey) === normalizeText(cleanTag)) return cleanTag;
      return `${cleanKey} · ${cleanTag}`;
    }

    document.getElementById('middle-col')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.title-toggle');
      if (!btn) return;

      const contentId = btn.getAttribute('aria-controls');
      const contentEl = document.getElementById(contentId);
      if (!contentEl) return;

      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      btn.setAttribute('aria-expanded', String(!isOpen));
      if (isOpen) {
        collapse(contentEl);
      } else {
        expand(contentEl);
      }
    });

    // NAVIGATIE-FUNCTIES
    function expand(el) {
      const article = el.closest('.block');
      article?.classList.add('open');
      if (!el) return;
      el.hidden = false;
      el.style.maxHeight = '0px';
      el.offsetHeight; 
      el.style.transition = 'max-height 0.3s ease';
      el.style.maxHeight = el.scrollHeight + 'px';

      const onEnd = (evt) => {
        if (evt.propertyName !== 'max-height') return;
        el.style.maxHeight = 'none';
        el.style.transition = '';
        el.removeEventListener('transitionend', onEnd);
      };
      el.addEventListener('transitionend', onEnd, { once: true });
    }

    function collapse(el) {
      const article = el.closest('.block');
      article?.classList.remove('open');
      if (!el) return;
      el.style.transition = '';
      el.style.maxHeight = el.scrollHeight + 'px';
      el.offsetHeight; 
      el.style.transition = 'max-height 0.3s ease';
      el.style.maxHeight = '0px';

      const onEnd = (evt) => {
        if (evt.propertyName !== 'max-height') return;
        el.hidden = true;
        el.style.transition = '';
        el.removeEventListener('transitionend', onEnd);
      };
      el.addEventListener('transitionend', onEnd, { once: true });
    }

    function createPaneCloseButtons() {
      document.querySelectorAll('.pane').forEach(pane => {
        if (pane.querySelector('.pane-close')) return;
        const id = pane.id || '';
        if (!id.startsWith('left-') && !id.startsWith('right-')) return;

        const side = id.startsWith('right-') ? 'right' : 'left';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pane-close';
        btn.setAttribute('aria-label', 'Sluit paneel');
        btn.innerHTML = '<span class="sr-only">Sluit paneel</span>';

        btn.addEventListener('click', () => {
          closeCol(side);
          document
            .querySelector(`.menu-${side} .menu a[aria-selected="true"]`)
            ?.setAttribute('aria-selected','false');
        });

        pane.insertBefore(btn, pane.firstChild);
      });
    }

    function setActivePane(side, target){
      const scope = side === 'left' ? '.left' : '.right';
      document.querySelectorAll(`${scope} .pane`).forEach(p => p.classList.remove('active'));
      const pane = document.getElementById(`${side}-${target}`);
      pane?.classList.add('active');
      if (pane) onPaneActivated(side, target, pane);
    }

    function onPaneActivated(side, target, pane) {
      if (side === 'left' && target === 'zoeken') {
        if (suppressNextSearchFocus) {
          suppressNextSearchFocus = false;
          return;
        }
        const searchInput = pane.querySelector('input[type="search"]');
        if (searchInput) {
          const alreadyFocused = document.activeElement === searchInput;
          const shouldSelect = !searchInput.value;
          requestAnimationFrame(() => {
            if (!alreadyFocused) {
              searchInput.focus();
            }
            if (shouldSelect) {
              searchInput.select();
            }
          });
        }
        suppressNextSearchFocus = false;
      }
    }


if (typeof leftVisible === 'undefined')  window.leftVisible  = false;
if (typeof rightVisible === 'undefined') window.rightVisible = false;

const MOBILE_BP = 900;
const gridEl   = document.getElementById('grid');
const leftEl   = document.querySelector('.left');
const rightEl  = document.querySelector('.right');
const bodyEl   = document.body;
const headerEl = document.querySelector('header');
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mobileSearchToggle = document.querySelector('.mobile-search-toggle');
const menusContainer = document.getElementById('header-menus');
const contrastToggleBtn = document.querySelector('[data-action="toggle-contrast"]');
const fontButtons = document.querySelectorAll('.accessibility-controls [data-action^="font-"]');
const searchForms = Array.from(document.querySelectorAll('[data-search-form]'));
const searchInputs = searchForms
  .map(form => form.querySelector('[data-search-input]'))
  .filter(Boolean);
const paneSearchInput = searchInputs.find(input => input.dataset.searchSource === 'pane') || null;
const mobileSearchInput = searchInputs.find(input => input.dataset.searchSource === 'mobile') || null;
const searchHintEl = document.querySelector('.search-hint');
const defaultSearchHintText = searchHintEl?.textContent || '';
const FONT_SCALE_MIN = -3;
const FONT_SCALE_MAX = 3;
let suppressSearchInputSync = false;
let suppressNextSearchFocus = false;
let mobileSearchOpen = false;
let lastScrollY = 0;
let ticking = false;
let hidden = false;

const ACCESSIBILITY_STORAGE_KEY = 'skut-accessibility-preferences';
const defaultAccessibilityState = { contrast: false, fontScale: 0 };
let accessibilityState = loadAccessibilityState();

// TOEGANKELIJKHEIDSFUNCTIES
function loadAccessibilityState() {
  try {
    // TODO: Controleer of cookiebanner nodig is bij dit gebruik van localStorage
    const raw = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
    if (!raw) return { ...defaultAccessibilityState };
    const parsed = JSON.parse(raw);
    return {
      contrast: !!parsed.contrast,
      fontScale: typeof parsed.fontScale === 'number'
        ? Math.max(FONT_SCALE_MIN, Math.min(FONT_SCALE_MAX, Math.round(parsed.fontScale)))
        : 0,
    };
  } catch (err) {
    return { ...defaultAccessibilityState };
  }
}

function saveAccessibilityState() {
  try {
    localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(accessibilityState));
  } catch (err) {
    /* storage not available */
  }
}

function applyContrastSetting(enabled) {
  bodyEl.classList.toggle('contrast-inverted', !!enabled);
  contrastToggleBtn?.setAttribute('aria-pressed', String(!!enabled));
}

function applyFontScaleSetting(scale) {
  if (!bodyEl) return;
  const clamped = Math.max(FONT_SCALE_MIN, Math.min(FONT_SCALE_MAX, Math.round(scale)));
  bodyEl.setAttribute('data-font-scale', String(clamped));
}

function updateFontButtons() {
  fontButtons.forEach(btn => {
    const action = btn.dataset.action;
    const current = accessibilityState.fontScale;
    let pressed = false;
    if (action === 'font-reset') {
      pressed = current === 0;
    }
    btn.setAttribute('aria-pressed', String(pressed));
    if (action === 'font-decrease') {
      btn.disabled = current <= FONT_SCALE_MIN;
    } else if (action === 'font-increase') {
      btn.disabled = current >= FONT_SCALE_MAX;
    } else {
      btn.disabled = false;
    }
  });
}

function applyAccessibilityState() {
  applyContrastSetting(accessibilityState.contrast);
  applyFontScaleSetting(accessibilityState.fontScale);
  updateFontButtons();
}

function setContrast(enabled) {
  accessibilityState = {
    ...accessibilityState,
    contrast: !!enabled,
  };
  applyContrastSetting(accessibilityState.contrast);
  saveAccessibilityState();
}

function setFontScale(value) {
  const clamped = Math.max(FONT_SCALE_MIN, Math.min(FONT_SCALE_MAX, Math.round(value)));
  accessibilityState = {
    ...accessibilityState,
    fontScale: clamped,
  };
  applyFontScaleSetting(accessibilityState.fontScale);
  updateFontButtons();
  saveAccessibilityState();
}

contrastToggleBtn?.addEventListener('click', () => {
  setContrast(!accessibilityState.contrast);
});

fontButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    if (action === 'font-decrease') {
      setFontScale(accessibilityState.fontScale - 1);
    } else if (action === 'font-increase') {
      setFontScale(accessibilityState.fontScale + 1);
    } else if (action === 'font-reset') {
      setFontScale(0);
    }
  });
});

applyAccessibilityState();

// ZOEKFORMULIER-FUNCTIES
// TODO: Aanpassen naar hugo search library
function resetSearchForm() {
  suppressSearchInputSync = true;
  searchInputs.forEach(input => {
    input.value = '';
  });
  suppressSearchInputSync = false;
  if (searchHintEl) searchHintEl.textContent = defaultSearchHintText;
  searchActive = false;
}

function syncSearchInputs(source, value) {
  if (suppressSearchInputSync) return;
  suppressSearchInputSync = true;
  searchInputs.forEach(input => {
    if (input === source) return;
    if (input.value !== value) input.value = value;
  });
  suppressSearchInputSync = false;
}

function focusSearchInput(preferMobile = false) {
  const candidates = [];
  if (preferMobile && mobileSearchInput) candidates.push(mobileSearchInput);
  if (paneSearchInput) candidates.push(paneSearchInput);
  if (!preferMobile && mobileSearchInput) candidates.push(mobileSearchInput);

  const target = candidates.find(input => document.contains(input));
  if (!target) return;
  requestAnimationFrame(() => {
    target.focus();
    if (!target.value) target.select();
  });
}

function setMobileSearch(open, options = {}) {
  const { focus = open, skipMenuSync = false } = options;
  const isMob = isMobile();
  if (!isMob) {
    if (mobileSearchOpen) {
      mobileSearchOpen = false;
      headerEl?.classList.remove('search-open');
      mobileSearchToggle?.setAttribute('aria-expanded', 'false');
      updateHeaderOffsetVar();
    }
    return;
  }

  const next = !!open;
  if (next === mobileSearchOpen) {
    if (next && focus) focusSearchInput(true);
    return;
  }

  mobileSearchOpen = next;
  headerEl?.classList.toggle('search-open', mobileSearchOpen);
  mobileSearchToggle?.setAttribute('aria-expanded', String(mobileSearchOpen));

  if (mobileSearchOpen) {
    if (!skipMenuSync) setMobileMenu(false);
    headerEl?.classList.remove('hide');
    hidden = false;
    leftVisible = false;
    rightVisible = false;
    applyLayout();
    focusSearchInput(true);
  } else if (focus) {
    const hasQuery = searchInputs.some(input => input.value.trim().length);
    if (!hasQuery) resetSearchForm();
  }

  updateHeaderOffsetVar();
}

// CONTENT-FUNCTIE?
function updateLeftMenuSelection(linkToSelect) {
  document.querySelectorAll('.menu-left .menu a').forEach(link => {
    link.setAttribute('aria-selected', String(link === linkToSelect));
  });
}

// ZOEKFUNCTIE
function performSearch(rawQuery, options = {}, sourceInput = null) {
  const query = (rawQuery || '').toString();
  const trimmed = query.trim();

  if (!trimmed) {
    searchActive = false;
    if (searchHintEl) {
      searchHintEl.textContent = options.announceEmpty
        ? 'Voer een zoekterm in.'
        : defaultSearchHintText;
    }
    suppressRenderTracking = true;
    const fallbackList = lastTrackedList && lastTrackedList.length
      ? lastTrackedList
      : (titlesByKey["Obe Alkema"] || []);
    renderTitles(fallbackList);
    suppressRenderTracking = false;
    const searchLink = document.querySelector('.menu-left .menu a[data-target="zoeken"]');
    if (searchLink) {
      searchLink.setAttribute('aria-selected', 'false');
    }
    if (previousLeftMenuSelection && document.body.contains(previousLeftMenuSelection)) {
      updateLeftMenuSelection(previousLeftMenuSelection);
    } else {
      updateLeftMenuSelection(null);
    }
    if (options.focusOnReset) {
      focusSearchInput(isMobile());
    }
    return;
  }

  const wasActive = searchActive;
  const normalized = normalizeText(trimmed);
  const matches = searchIndex
    .filter(entry => entry.searchBlob.includes(normalized))
    .map(entry => {
      const displayTag = combineSearchTag(entry.key, entry.item?.tag);
      if (displayTag === (entry.item?.tag || '')) {
        return entry.item;
      }
      return {
        ...entry.item,
        tag: displayTag,
      };
    });

  suppressRenderTracking = true;
  renderTitles(matches);
  suppressRenderTracking = false;

  if (searchHintEl) {
    if (matches.length > 0) {
      searchHintEl.textContent = `${matches.length} ${matches.length === 1 ? 'resultaat' : 'resultaten'} voor "${trimmed}".`;
    } else {
      searchHintEl.textContent = `Geen resultaten voor "${trimmed}".`;
    }
  }

  const searchLink = document.querySelector('.menu-left .menu a[data-target="zoeken"]');
  if (searchLink) {
    if (!wasActive) {
      const currentSelection = document.querySelector('.menu-left .menu a[aria-selected="true"]');
      if (currentSelection && currentSelection.dataset.target !== 'zoeken') {
        previousLeftMenuSelection = currentSelection;
      }
    }
    updateLeftMenuSelection(searchLink);
  }

  if (!wasActive) {
    const isMob = isMobile();
    const leftPaneEl = document.getElementById('left-zoeken');
    const sourceInsidePane = !!(sourceInput && leftPaneEl?.contains(sourceInput));
    suppressNextSearchFocus = !!sourceInput && !sourceInsidePane;
    setActivePane('left', 'zoeken');
    if (!isMob) {
      openCol('left');
    } else {
      leftVisible = false;
      rightVisible = false;
      applyLayout();
    }
    suppressNextSearchFocus = false;
  }
  searchActive = true;
}

// ZOEKEN: voeg eventlisteners toe aan alle zoekformulieren
searchForms.forEach(form => {
  const input = form.querySelector('[data-search-input]');
  if (!input) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    syncSearchInputs(input, input.value);
    performSearch(input.value || '', { announceEmpty: true, focusOnReset: true }, input);
  });

  input.addEventListener('input', (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    if (!suppressSearchInputSync) {
      syncSearchInputs(input, event.target.value);
    }
    performSearch(event.target.value || '', {}, input);
  });
});

// LAYOUT- EN UITERLIJK
let backdropEl = null;     
let lastMobile = isMobile();
let mobileMenuOpen = false;

  function isMobile() {
  return window.innerWidth <= MOBILE_BP;
}

function ensureBackdrop() {
  if (backdropEl) return;
  backdropEl = document.createElement('div');
  backdropEl.className = 'overlay-backdrop';
  Object.assign(backdropEl.style, {
    position: 'fixed',
    left: '0',
    right: '0',
    bottom: '0',
    top: '0',
    background: 'rgba(0,0,0,0.15)',
    zIndex: '1999',
  });
  backdropEl.addEventListener('click', closeAll);
  document.body.appendChild(backdropEl);
  updateBackdropOffset();
}

function updateBackdropOffset() {
  if (!backdropEl) return;
  const header = headerEl;
  const headerHidden = header?.classList.contains('hide');
  const headerHeight = header && !headerHidden ? header.offsetHeight : 0;
  backdropEl.style.top = `${headerHeight}px`;
}

function updateHeaderOffsetVar() {
  const header = headerEl;
  const headerHidden = header?.classList.contains('hide');
  const headerHeight = header && !headerHidden ? header.offsetHeight : 0;
  document.documentElement.style.setProperty('--header-offset', `${headerHeight}px`);
}

function removeBackdrop() {
  if (!backdropEl) return;
  backdropEl.removeEventListener('click', closeAll);
  backdropEl.remove();
  backdropEl = null;
}

let savedOverflow = '';
function lockBodyScroll(lock) {
  if (lock) {
    if (!savedOverflow) savedOverflow = bodyEl.style.overflow || '';
    bodyEl.style.overflow = 'hidden';
  } else {
    bodyEl.style.overflow = savedOverflow;
    savedOverflow = '';
  }
}

function setMobileMenu(open) {
  if (!isMobile()) {
    mobileMenuOpen = false;
    headerEl?.classList.remove('menu-open');
    mobileMenuToggle?.setAttribute('aria-expanded', 'false');
    menusContainer?.removeAttribute('aria-hidden');
    setMobileSearch(false, { focus: false, skipMenuSync: true });
    updateHeaderOffsetVar();
    if (leftVisible || rightVisible) updateBackdropOffset();
    return;
  }

  const next = !!open;
  if (next) {
    setMobileSearch(false, { focus: false, skipMenuSync: true });
  }

  mobileMenuOpen = next;

  if (mobileMenuOpen && (leftVisible || rightVisible)) {
    closeColumns();
  }

  headerEl?.classList.toggle('menu-open', mobileMenuOpen);
  if (mobileMenuOpen) {
    headerEl?.classList.remove('hide');
  }
  mobileMenuToggle?.setAttribute('aria-expanded', String(mobileMenuOpen));
  menusContainer?.setAttribute('aria-hidden', String(!mobileMenuOpen));

  updateHeaderOffsetVar();
  if (leftVisible || rightVisible) updateBackdropOffset();
}

function setColAria() {
  if (leftEl)  leftEl.setAttribute('aria-hidden',  String(!leftVisible));
  if (rightEl) rightEl.setAttribute('aria-hidden', String(!rightVisible));
}

function syncMobileOverlays() {
  if (!isMobile()) {
    leftEl?.classList.remove('open');
    rightEl?.classList.remove('open');
    removeBackdrop();
    lockBodyScroll(false);
    return;
  }
  if (mobileSearchOpen) {
    leftEl?.classList.remove('open');
    rightEl?.classList.remove('open');
    removeBackdrop();
    lockBodyScroll(false);
    return;
  }
  leftEl?.classList.toggle('open',  !!leftVisible);
  rightEl?.classList.toggle('open', !!rightVisible);
  if (leftEl) {
    leftEl.style.zIndex = leftVisible && !rightVisible ? '2001' : '2000';
  }
  if (rightEl) {
    rightEl.style.zIndex = rightVisible && !leftVisible ? '2001' : '2000';
  }

  const anyOpen = !!leftVisible || !!rightVisible;
  if (anyOpen) {
    ensureBackdrop();
    updateBackdropOffset();
    lockBodyScroll(true);
  } else {
    removeBackdrop();
    lockBodyScroll(false);
  }
}

function closeColumns() {
  leftVisible = false;
  rightVisible = false;
  applyLayout();
}

function applyLayout(){
  updateHeaderOffsetVar();
  if (!gridEl) return;
  gridEl.classList.remove('left-closed','right-closed','both-closed','all-open');

  if (!leftVisible && !rightVisible) gridEl.classList.add('both-closed');
  else if (!leftVisible && rightVisible) gridEl.classList.add('left-closed');
  else if (leftVisible && !rightVisible) gridEl.classList.add('right-closed');
  else gridEl.classList.add('all-open');

  syncMobileOverlays();
  setColAria();
}

function openCol(side){
  const el = side === 'left' ? leftEl : rightEl;
  if (!el) return;

  const mobile = isMobile();
  if (side === 'left') {
    leftVisible = true;
    if (mobile) rightVisible = false;
  } else if (side === 'right') {
    rightVisible = true;
    if (mobile) leftVisible = false;
  }

  if (mobile) {
    applyLayout();
    return;
  }

  if (side === 'left')  leftEl.style.borderRight = '1px solid var(--ink)';
  if (side === 'right') rightEl.style.borderLeft  = '1px solid var(--ink)';

  applyLayout();
}

function closeCol(side){
  const el = side === 'left' ? leftEl : rightEl;
  if (!el) return;

  if (side === 'left')  leftVisible  = false;
  if (side === 'right') rightVisible = false;

  if (isMobile()) {
    applyLayout();
    return;
  }

  const propName = 'flex-basis';
  function onEnd(e){
    if (e.propertyName === propName) {
      if (side === 'left')  leftEl.style.borderRight = 'none';
      if (side === 'right') rightEl.style.borderLeft  = 'none';
      el.removeEventListener('transitionend', onEnd);
    }
  }
  el.addEventListener('transitionend', onEnd);
  applyLayout();
}

function toggleCol(side){
  const visible = side === 'left' ? leftVisible : rightVisible;
  if (visible) closeCol(side); else openCol(side);
}

function closeAll() {
  closeColumns();
  setMobileMenu(false);
  setMobileSearch(false, { focus: false, skipMenuSync: true });
}

// EVENTLISTENERS
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isMobile() && (leftVisible || rightVisible || mobileMenuOpen || mobileSearchOpen)) {
    e.preventDefault();
    closeAll();
  }
});


let resizeRaf = null;
window.addEventListener('resize', () => {
  if (resizeRaf) return;
  resizeRaf = requestAnimationFrame(() => {
    resizeRaf = null;
    const nowMobile = isMobile();
    updateHeaderOffsetVar();
    if (leftVisible || rightVisible) {
      updateBackdropOffset();
    }
    if (nowMobile !== lastMobile) {
      lastMobile = nowMobile;
      applyLayout();
      setMobileMenu(false);
      setMobileSearch(false, { focus: false, skipMenuSync: true });
    }
  });
});

createPaneCloseButtons();
applyLayout();
setMobileMenu(false);


    document.querySelectorAll('.menu a').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const paneSide = a.dataset.pane;
        const target   = a.dataset.target;
        const isSearchTarget = paneSide === 'left' && target === 'zoeken';

        const menu = a.closest('.menu');
        const wasSelected = a.getAttribute('aria-selected') === 'true';

        menu.querySelectorAll('a').forEach(x => x.setAttribute('aria-selected','false'));
        a.setAttribute('aria-selected','true');

        if (!isSearchTarget) {
          resetSearchForm();
        }

        if (paneSide && target) setActivePane(paneSide, target);

        if (paneSide === 'left' && target !== 'zoeken') {
          previousLeftMenuSelection = a;
        }

        if (isMobile()) {
          if (isSearchTarget) {
            setMobileSearch(true, { focus: true, skipMenuSync: true });
            setMobileMenu(false);
          } else {
            setMobileSearch(false, { focus: false, skipMenuSync: true });
          }
        }

        if (paneSide === 'left') {
          if (wasSelected && leftVisible) {
            closeCol('left');
            a.setAttribute('aria-selected', 'false');
          } else {
            openCol('left');
          }
        } else if (paneSide === 'right') {
          if (wasSelected && rightVisible) {
            closeCol('right');
            a.setAttribute('aria-selected', 'false');
          } else {
            openCol('right');
          }
        }

        if (isMobile()) {
          setMobileMenu(false);
        }

        if (isSearchTarget) {
          focusSearchInput(isMobile());
        }

      });
    });

    mobileSearchToggle?.addEventListener('click', () => {
      const next = !mobileSearchOpen;
      setMobileSearch(next);
      if (next) {
        const searchLink = document.querySelector('.menu-left .menu a[data-target="zoeken"]');
        if (searchLink) {
          const currentSelection = document.querySelector('.menu-left .menu a[aria-selected="true"]');
          if (!searchActive && currentSelection && currentSelection.dataset.target !== 'zoeken') {
            previousLeftMenuSelection = currentSelection;
          }
          updateLeftMenuSelection(searchLink);
        }
      } else if (!searchActive && previousLeftMenuSelection) {
        updateLeftMenuSelection(previousLeftMenuSelection);
      }
    });

    mobileMenuToggle?.addEventListener('click', () => {
      setMobileMenu(!mobileMenuOpen);
    });

  
    document.getElementById('left-col')?.addEventListener('click', (e) => {
      const a = e.target.closest('a.author, a.reeks, a.genre, .pane a');
      if (!a) return;
      e.preventDefault();
      const parent = a.closest('.block2, ul, .block, section') || document;
      parent.querySelectorAll('a.author, a.reeks, a.genre, .pane a').forEach(x => x.classList?.remove('active'));
      a.classList?.add('active');

      const key = a.dataset.key || a.dataset.author || a.textContent.trim();
      renderTitles(titlesByKey[key] || []);

      if (isMobile()) {
        closeColumns();
        setMobileMenu(false);
      }
    });

    document.getElementById('right-col')?.addEventListener('click', (e) => {
      if (!isMobile()) return;
      const interactive = e.target.closest('a, button, input, textarea, select');
      if (!interactive) return;
      closeColumns();
      setMobileMenu(false);
    });

  
    // TODO: Herschrijf initfunctie
    (function init(){
      const leftActive  = document.querySelector('.menu-left  a[aria-selected="true"]')?.dataset.target || 'auteurs';
      const rightActive = document.querySelector('.menu-right a[aria-selected="true"]')?.dataset.target || 'over';
      setActivePane('left', leftActive);
      setActivePane('right', rightActive);
      const defaultLeftLink = document.querySelector(`.menu-left .menu a[data-target="${leftActive}"]`);
      if (defaultLeftLink) {
        updateLeftMenuSelection(defaultLeftLink);
        if (leftActive !== 'zoeken') {
          previousLeftMenuSelection = defaultLeftLink;
        }
      } else {
        updateLeftMenuSelection(null);
      }

      leftVisible = false;
      rightVisible = false;
      applyLayout();

      renderTitles(titlesByKey["Obe Alkema"] || []);
    })();


// SCROLL-FUNCTIES
function isReadingMode() {
  const grid = document.getElementById('grid');
  const articleOpen = document.querySelector('.middle .block.open');
  if (isMobile()) {
    return !leftVisible && !rightVisible && !!articleOpen;
  }
  return grid?.classList.contains('both-closed') && !!articleOpen;
}

function onScroll(currentY, fromWindow = false, sourceEl = null) {
  const header = document.querySelector('header');

  if (!isReadingMode()) {
    if (header?.classList.contains('hide')) {
      header.classList.remove('hide');
      updateHeaderOffsetVar();
    }
    hidden = false;
    lastScrollY = currentY;
    ticking = false;
    return;
  }

  
  let atBottom = false;
  if (fromWindow) {
    atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 5;
  } else if (sourceEl) {
    const remaining = sourceEl.scrollHeight - sourceEl.scrollTop - sourceEl.clientHeight;
    atBottom = remaining <= 5;
  }
  if (atBottom) {
    if (hidden && !isMobile()) {
      header?.classList.remove('hide');
      hidden = false;
      updateHeaderOffsetVar();
    }
    lastScrollY = currentY;
    ticking = false;
    return;
  }

  if (currentY > lastScrollY && currentY > 80) {
    if (!hidden) {
      header?.classList.add('hide');
      hidden = true;
      updateHeaderOffsetVar();
    }
  } else if (currentY < lastScrollY) {
    if (hidden) {
      header?.classList.remove('hide');
      hidden = false;
      updateHeaderOffsetVar();
    }
  }

  lastScrollY = currentY;
  if (backdropEl) updateBackdropOffset();
  ticking = false;
}


function attachScrollWatcher() {
  const activePane = document.querySelector('#middle-col .pane.active');
  if (!activePane) return;

  activePane.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => onScroll(activePane.scrollTop, false, activePane));
      ticking = true;
    }
  });
}


attachScrollWatcher();

window.addEventListener('scroll', () => {
  if (!isMobile()) return;
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(() => onScroll(window.scrollY, true));
  }
});

document.getElementById('middle-col')?.addEventListener('click', (e) => {
  if (e.target.closest('.title-toggle')) {
    setTimeout(attachScrollWatcher, 100);
  }
});

document.getElementById('middle-col')?.addEventListener('click', (e) => {
  closeColumns();
  document.querySelectorAll('.menu a').forEach(a => a.setAttribute('aria-selected','false'));
});

}
