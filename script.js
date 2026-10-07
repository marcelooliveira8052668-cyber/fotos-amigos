/* ============================================================
   Viagens e Momentos em Família — álbum digital
   ============================================================ */
(function () {
  'use strict';

  var TOTAL_SLOTS = 120;               // tamanho total do álbum
  var LABELS = {
    all: 'Todas',
    julho: 'Julho',
    setembro: 'Setembro',
    outubro: 'Outubro',
    novas: 'Adicionadas'
  };

  var ICON_PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>';
  var ICON_ZOOM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>';

  var gallery    = document.getElementById('gallery');
  var emptyEl    = document.getElementById('empty');
  var reserved   = document.getElementById('reserved');
  var reservedFull   = document.getElementById('reservedFull');
  var reservedCount  = document.getElementById('reservedCount');
  var countEl    = document.getElementById('count');
  var filters    = document.querySelector('.filters');
  var footerCount = document.getElementById('footerCount');

  var statPhotos    = document.getElementById('statPhotos');
  var statMeetings  = document.getElementById('statMeetings');
  var statFree      = document.getElementById('statFree');

  var lightbox  = document.getElementById('lightbox');
  var lbImg     = document.getElementById('lbImg');
  var lbDate    = document.getElementById('lbDate');
  var lbCounter = document.getElementById('lbCounter');
  var lbStage   = document.getElementById('lbStage');
  var lbClose   = document.getElementById('lbClose');
  var lbPrev    = document.getElementById('lbPrev');
  var lbNext    = document.getElementById('lbNext');

  var dropzone  = document.getElementById('dropzone');
  var toast     = document.getElementById('toast');
  var fileInput = document.getElementById('fileInput');
  var progressBar = document.getElementById('progressBar');
  var toTop     = document.getElementById('toTop');

  /* ---------------------------------------------------------
     utilidades
     --------------------------------------------------------- */
  function allCards() {
    return Array.prototype.slice.call(gallery.querySelectorAll('.photo-card'));
  }
  function visibleCards() {
    return allCards().filter(function (c) { return !c.hidden; });
  }
  function labelFor(key) {
    if (LABELS[key]) return LABELS[key];
    return key.charAt(0).toUpperCase() + key.slice(1);
  }

  /* ---------------------------------------------------------
     animação de entrada (reveal)
     --------------------------------------------------------- */
  var io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
  }

  function observe(el, i, instant) {
    if (!io || instant) {
      el.style.animation = 'none';
      el.classList.add('is-in');
      return;
    }
    el.style.animationDelay = ((i % 8) * 45) + 'ms';
    io.observe(el);
  }

  /* ---------------------------------------------------------
     filtros
     --------------------------------------------------------- */
  var activeFilter = 'all';

  function collectionsMap() {
    var map = new Map();
    allCards().forEach(function (c) {
      var k = c.dataset.collection || 'novas';
      map.set(k, (map.get(k) || 0) + 1);
    });
    return map;
  }

  function syncChips() {
    var map = collectionsMap();
    if (activeFilter !== 'all' && !map.has(activeFilter)) activeFilter = 'all';

    var hadFocus = document.activeElement &&
                   document.activeElement.classList &&
                   document.activeElement.classList.contains('chip');

    filters.innerHTML = '';
    ['all'].concat(Array.from(map.keys())).forEach(function (key) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (key === activeFilter ? ' is-active' : '');
      b.dataset.filter = key;
      b.appendChild(document.createTextNode(labelFor(key) + ' '));
      var n = document.createElement('span');
      n.textContent = key === 'all' ? totalPhotos() : map.get(key);
      b.appendChild(n);
      filters.appendChild(b);
    });

    if (hadFocus) {
      var active = filters.querySelector('.chip.is-active');
      if (active) active.focus();
    }
  }

  function totalPhotos() { return allCards().length; }

  function applyFilter(f) {
    activeFilter = f;
    allCards().forEach(function (card) {
      card.hidden = !(f === 'all' || card.dataset.collection === f);
    });

    var tot = totalPhotos();
    var vis = visibleCards().length;
    countEl.textContent = 'Mostrando ' + vis + ' de ' + tot + (tot === 1 ? ' foto' : ' fotos');
    emptyEl.hidden = vis > 0;

    Array.prototype.forEach.call(filters.querySelectorAll('.chip'), function (c) {
      c.classList.toggle('is-active', c.dataset.filter === f);
    });

    if (lbOpen && lbList.indexOf(currentCard()) === -1) closeLb();
  }

  filters.addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (!chip) return;
    applyFilter(chip.dataset.filter);
  });

  /* ---------------------------------------------------------
     espaços reservados
     --------------------------------------------------------- */
  function renderReserved() {
    var used = totalPhotos();
    var free = Math.max(0, TOTAL_SLOTS - used);
    var sectionVisible = reserved.getBoundingClientRect().top < window.innerHeight;

    reserved.innerHTML = '';

    for (var i = 0; i < free; i++) {
      (function (n) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'placeholder-card reveal';
        b.setAttribute('aria-label', 'Adicionar uma foto no espaço ' + n);

        var icon = document.createElement('span');
        icon.className = 'placeholder-card__icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.innerHTML = ICON_PLUS;

        var txt = document.createElement('span');
        txt.textContent = 'Espaço ' + n;

        b.appendChild(icon);
        b.appendChild(txt);
        b.addEventListener('click', function () { fileInput.click(); });

        reserved.appendChild(b);
        observe(b, i, sectionVisible);
      })(used + 1 + i);
    }

    reservedFull.hidden = free > 0;
    reservedCount.textContent = free > 0
      ? free + (free === 1 ? ' espaço livre' : ' espaços livres') + ' · ' + TOTAL_SLOTS + ' no total'
      : 'Álbum completo · ' + TOTAL_SLOTS + ' fotos';

    updateStats();
  }

  function updateStats() {
    var total = totalPhotos();
    var free = Math.max(0, TOTAL_SLOTS - total);
    statPhotos.textContent = total;
    statMeetings.textContent = collectionsMap().size;
    statFree.textContent = free;
    footerCount.textContent = total + (total === 1 ? ' foto · ' : ' fotos · ') + TOTAL_SLOTS + ' espaços no total';
  }

  function refreshLabels() {
    var total = totalPhotos();
    allCards().forEach(function (card, i) {
      var btn = card.querySelector('.photo-card__open');
      if (btn) btn.setAttribute('aria-label', 'Ampliar foto ' + (i + 1) + ' de ' + total);
    });
  }

  /* ---------------------------------------------------------
     lightbox
     --------------------------------------------------------- */
  var lbOpen = false;
  var lbList = [];
  var lbIdx = 0;
  var lastFocused = null;

  function currentCard() { return lbList[lbIdx]; }

  function openLb(card) {
    lbList = visibleCards();
    if (!lbList.length) return;
    lbIdx = lbList.indexOf(card);
    if (lbIdx < 0) lbIdx = 0;

    lastFocused = document.activeElement;
    lightbox.hidden = false;
    lbOpen = true;
    document.body.style.overflow = 'hidden';
    renderLb();
    lbClose.focus();
  }

  function renderLb() {
    var card = currentCard();
    if (!card) return;
    var src = card.querySelector('img');
    lbImg.src = src.currentSrc || src.src;
    lbImg.alt = src.alt || '';
    lbDate.textContent = card.dataset.date || '';
    lbCounter.textContent = (lbIdx + 1) + ' / ' + lbList.length;
    preload(lbIdx + 1);
    preload(lbIdx - 1);
  }

  function preload(i) {
    var c = lbList[(i + lbList.length) % lbList.length];
    if (!c) return;
    var im = c.querySelector('img');
    if (!im) return;
    var p = new Image();
    p.src = im.currentSrc || im.src;
  }

  function nav(delta) {
    if (!lbList.length) return;
    lbIdx = (lbIdx + delta + lbList.length) % lbList.length;
    renderLb();
  }

  function closeLb() {
    if (!lbOpen) return;
    lbOpen = false;
    lightbox.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.isConnected) lastFocused.focus();
  }

  gallery.addEventListener('click', function (e) {
    var btn = e.target.closest('.photo-card__open');
    if (!btn) return;
    var card = btn.closest('.photo-card');
    if (card) openLb(card);
  });

  lbClose.addEventListener('click', closeLb);
  lbPrev.addEventListener('click', function () { nav(-1); });
  lbNext.addEventListener('click', function () { nav(1); });

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLb();
  });

  document.addEventListener('keydown', function (e) {
    if (!lbOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); closeLb(); }
    else if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); nav(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); nav(-1); }
    else if (e.key === 'Home') { e.preventDefault(); lbIdx = 0; renderLb(); }
    else if (e.key === 'End') { e.preventDefault(); lbIdx = lbList.length - 1; renderLb(); }
    else if (e.key === 'Tab') {
      var f = [lbClose, lbPrev, lbNext];
      var pos = f.indexOf(document.activeElement);
      e.preventDefault();
      var next = e.shiftKey ? pos - 1 : pos + 1;
      if (next < 0) next = f.length - 1;
      if (next >= f.length) next = 0;
      f[next < 0 ? 0 : next].focus();
    }
  });

  // swipe em telas de toque
  var startX = 0, startY = 0, swiping = false;
  lightbox.addEventListener('pointerdown', function (e) {
    if (e.target.closest('button')) { swiping = false; return; }
    swiping = true; startX = e.clientX; startY = e.clientY;
  });
  lightbox.addEventListener('pointerup', function (e) {
    if (!swiping) return;
    swiping = false;
    var dx = e.clientX - startX, dy = e.clientY - startY;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) nav(dx < 0 ? 1 : -1);
  });

  /* ---------------------------------------------------------
     adicionar fotos
     --------------------------------------------------------- */
  function buildCard(src, file) {
    var today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    var fig = document.createElement('figure');
    fig.className = 'photo-card reveal';
    fig.dataset.collection = 'novas';
    fig.dataset.date = today;
    fig.innerHTML =
      '<span class="photo-card__badge">Nova</span>' +
      '<button class="photo-card__open" type="button">' +
        '<img decoding="async">' +
        '<span class="photo-card__meta">' +
          '<span class="photo-card__date"></span>' +
          '<span class="photo-card__zoom" aria-hidden="true">' + ICON_ZOOM + '</span>' +
        '</span>' +
      '</button>';

    var img = fig.querySelector('img');
    img.alt = 'Foto adicionada — ' + (file ? file.name : today);
    img.src = src;
    fig.querySelector('.photo-card__date').textContent = today;

    // reserva o espaço correto para evitar "pulo" no masonry
    var probe = new Image();
    probe.onload = function () {
      img.setAttribute('width', probe.naturalWidth);
      img.setAttribute('height', probe.naturalHeight);
    };
    probe.src = src;

    return fig;
  }

  function addFiles(fileList) {
    var files = Array.prototype.slice.call(fileList || [])
      .filter(function (f) { return f && f.type && f.type.indexOf('image/') === 0; });

    if (!files.length) {
      showToast('Escolha arquivos de imagem (JPG, PNG, WEBP…).');
      return;
    }

    var firstIndex = totalPhotos();
    files.forEach(function (file, i) {
      var url = URL.createObjectURL(file);
      var card = buildCard(url, file);
      gallery.appendChild(card);
      observe(card, firstIndex + i, false);
    });

    activeFilter = 'all';
    renderReserved();
    syncChips();
    applyFilter('all');
    refreshLabels();
    updateStats();

    showToast(
      files.length === 1
        ? '1 foto adicionada · visível só neste navegador'
        : files.length + ' fotos adicionadas · visíveis só neste navegador'
    );

    var last = gallery.querySelector('.photo-card:last-child');
    if (last) {
      window.setTimeout(function () {
        last.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-add]'), function (b) {
    b.addEventListener('click', function () { fileInput.click(); });
  });

  fileInput.addEventListener('change', function () {
    addFiles(fileInput.files);
    fileInput.value = '';
  });

  /* ---------------------------------------------------------
     drag & drop
     --------------------------------------------------------- */
  function hasFiles(e) {
    var dt = e.dataTransfer;
    if (!dt) return false;
    var types = dt.types;
    return types && Array.prototype.indexOf.call(types, 'Files') !== -1;
  }

  var dragDepth = 0;

  window.addEventListener('dragenter', function (e) {
    if (!hasFiles(e)) return;
    dragDepth++;
    dropzone.classList.add('is-on');
  });

  window.addEventListener('dragover', function (e) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  });

  window.addEventListener('dragleave', function (e) {
    if (!hasFiles(e)) return;
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) dropzone.classList.remove('is-on');
  });

  window.addEventListener('drop', function (e) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth = 0;
    dropzone.classList.remove('is-on');
    addFiles(e.dataTransfer.files);
  });

  /* ---------------------------------------------------------
     toast
     --------------------------------------------------------- */
  var toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-on');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove('is-on');
    }, 3800);
  }

  /* ---------------------------------------------------------
     barra de progresso + voltar ao topo
     --------------------------------------------------------- */
  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    progressBar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    toTop.classList.toggle('is-on', window.scrollY > 720);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------------------------------------------------------
     init
     --------------------------------------------------------- */
  allCards().forEach(function (card, i) { observe(card, i, false); });
  syncChips();
  applyFilter('all');
  refreshLabels();
  renderReserved();
  onScroll();

  document.documentElement.dataset.albumReady = '1';
})();
