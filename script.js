/* ============================================================
   Viagens e Momentos em Família — álbum digital
   ============================================================ */
(function () {
  'use strict';

  var TOTAL_SLOTS = 120;               // tamanho total do álbum
  var TOTAL_VIDEO_SLOTS = 6;           // espaços de vídeo
  var LABELS = {
    all: 'Todas',
    julho: 'Julho',
    setembro: 'Setembro',
    outubro: 'Outubro',
    novas: 'Adicionadas'
  };
  LABELS.dezembro = 'Dezembro';

  var ICON_PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>';
  var ICON_ZOOM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>';
  var ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';

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
  var lbPlay    = document.getElementById('lbPlay');
  var lbThumbs  = document.getElementById('lbThumbs');
  var lbTimer   = null;
  var LB_DELAY  = 4000; // apresentação automática: 4s por foto (ideal p/ telão)

  var dropzone  = document.getElementById('dropzone');
  var toast     = document.getElementById('toast');
  var fileInput = document.getElementById('fileInput');
  var progressBar = document.getElementById('progressBar');
  var toTop     = document.getElementById('toTop');

  var videoGallery = document.getElementById('videoGallery');
  var videoCount   = document.getElementById('videoCount');
  var videoEmpty   = document.getElementById('videoEmpty');
  var videoInput   = document.getElementById('videoInput');
  var statVideos   = document.getElementById('statVideos');
  var lbVideo      = document.getElementById('lbVideo');

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
    if (statVideos) statVideos.textContent = videoCards().length;
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
  var lbContainer = null;
  var lastFocused = null;

  function currentCard() { return lbList[lbIdx]; }

  function cardsIn(root) {
    return Array.prototype.slice.call(root.querySelectorAll('.photo-card, .video-card'));
  }
  function visibleIn(root) {
    return cardsIn(root).filter(function (c) { return !c.hidden; });
  }

  function openLb(card, container) {
    lbContainer = container || gallery;
    lbList = visibleIn(lbContainer);
    if (!lbList.length) return;
    lbIdx = lbList.indexOf(card);
    if (lbIdx < 0) lbIdx = 0;

    lastFocused = document.activeElement;
    lightbox.hidden = false;
    lbOpen = true;
    document.body.style.overflow = 'hidden';
    renderLb();
    renderThumbs();
    lbClose.focus();
  }

  function stopMedia() {
    if (lbVideo) {
      try { lbVideo.pause(); } catch (e) {}
      lbVideo.removeAttribute('src');
      try { lbVideo.load(); } catch (e) {}
      lbVideo.hidden = true;
    }
    lbImg.hidden = true;
  }

  function renderLb() {
    var card = currentCard();
    if (!card) return;

    stopMedia();

    if ((card.dataset.kind || '') === 'file' && lbVideo) {
      lbVideo.hidden = false;
      lbVideo.src = card.dataset.src;
      var p = lbVideo.play();
      if (p && p.catch) p.catch(function () {});
    } else {
      var src = card.querySelector('img');
      if (src) {
        lbImg.src = src.currentSrc || src.src;
        lbImg.alt = src.alt || '';
        lbImg.hidden = false;
      }
    }

    lbDate.textContent = card.dataset.date || '';
    lbCounter.textContent = (lbIdx + 1) + ' / ' + lbList.length;
    markThumb();
    preload(lbIdx + 1);
    preload(lbIdx - 1);
  }

  /* carrossel de miniaturas: qualquer foto abre clicando */
  function renderThumbs() {
    if (!lbThumbs) return;
    lbThumbs.innerHTML = '';
    lbList.forEach(function (card, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'lb-thumb';
      b.setAttribute('aria-label', 'Ir para o item ' + (i + 1) + ' de ' + lbList.length);
      var im = card.querySelector('img');
      if (im) {
        var t = document.createElement('img');
        t.src = im.currentSrc || im.src;
        t.alt = '';
        t.loading = 'lazy';
        b.appendChild(t);
      } else {
        b.classList.add('is-video');
        b.innerHTML = '<span aria-hidden="true">▶</span>';
      }
      (function (n) {
        b.addEventListener('click', function () { lbIdx = n; renderLb(); });
      })(i);
      lbThumbs.appendChild(b);
    });
    markThumb();
  }
  function markThumb() {
    if (!lbThumbs || !lbThumbs.children.length) return;
    Array.prototype.forEach.call(lbThumbs.children, function (el, i) {
      var on = i === lbIdx;
      el.classList.toggle('is-on', on);
      if (on) {
        el.setAttribute('aria-current', 'true');
        try { el.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) {}
      } else {
        el.removeAttribute('aria-current');
      }
    });
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
    stopSlideshow();
    lbOpen = false;
    stopMedia();
    lightbox.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.isConnected) lastFocused.focus();
  }

  /* apresentação automática (telão): avança 1 foto a cada 4s, em loop */
  function isVideoCard(card) { return card && (card.dataset.kind || '') === 'file'; }
  function updatePlayBtn() {
    if (!lbPlay) return;
    var on = lbTimer !== null;
    lbPlay.classList.toggle('is-on', on);
    lbPlay.setAttribute('aria-pressed', on ? 'true' : 'false');
    lbPlay.setAttribute('aria-label', on ? 'Pausar apresentação' : 'Apresentação automática');
    var playIcon = lbPlay.querySelector('.lb-play__play');
    var pauseIcon = lbPlay.querySelector('.lb-play__pause');
    if (playIcon) playIcon.hidden = on;
    if (pauseIcon) pauseIcon.hidden = !on;
  }
  function stopSlideshow() {
    if (lbTimer !== null) { clearInterval(lbTimer); lbTimer = null; }
    updatePlayBtn();
  }
  function startSlideshow() {
    stopSlideshow();
    lbTimer = setInterval(function () {
      nav(1);
      if (isVideoCard(currentCard())) stopSlideshow(); // pausa no vídeo p/ assistir
    }, LB_DELAY);
    updatePlayBtn();
  }
  function toggleSlideshow() {
    if (lbTimer !== null) stopSlideshow();
    else startSlideshow();
  }

  gallery.addEventListener('click', function (e) {
    var btn = e.target.closest('.photo-card__open');
    if (!btn) return;
    var card = btn.closest('.photo-card');
    if (card) openLb(card, gallery);
  });

  if (videoGallery) {
    videoGallery.addEventListener('click', function (e) {
      var btn = e.target.closest('.video-card__open');
      if (!btn) return;
      var card = btn.closest('.video-card');
      if (card) openLb(card, videoGallery);
    });
  }

  lbClose.addEventListener('click', closeLb);
  lbPrev.addEventListener('click', function () { nav(-1); });
  lbNext.addEventListener('click', function () { nav(1); });
  if (lbPlay) lbPlay.addEventListener('click', function () { toggleSlideshow(); });

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
    else if (e.key === ' ' && !(e.target.closest && e.target.closest('button,input,textarea'))) { e.preventDefault(); toggleSlideshow(); }
    else if (e.key === 'Tab') {
      var f = [lbClose, lbPlay, lbPrev, lbNext].filter(function (el) { return !!el; });
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
     vídeos
     --------------------------------------------------------- */
  function videoCards() {
    return videoGallery ? Array.prototype.slice.call(videoGallery.querySelectorAll('.video-card')) : [];
  }

  function renderVideoSlots() {
    if (!videoGallery) return;
    var used = videoCards().length;
    var free = Math.max(0, TOTAL_VIDEO_SLOTS - used);

    Array.prototype.forEach.call(videoGallery.querySelectorAll('.placeholder-card'), function (el) {
      el.parentNode.removeChild(el);
    });

    var sectionVisible = videoGallery.getBoundingClientRect().top < window.innerHeight;

    for (var i = 0; i < free; i++) {
      (function (n) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'placeholder-card';
        b.setAttribute('aria-label', 'Adicionar um vídeo no espaço ' + n);

        var icon = document.createElement('span');
        icon.className = 'placeholder-card__icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.innerHTML = ICON_PLAY;

        var txt = document.createElement('span');
        txt.textContent = 'Espaço ' + n;

        b.appendChild(icon);
        b.appendChild(txt);
        b.addEventListener('click', function () { if (videoInput) videoInput.click(); });

        videoGallery.appendChild(b);
        observe(b, i, sectionVisible);
      })(used + 1 + i);
    }

    if (videoCount) {
      videoCount.textContent = free > 0
        ? (used ? used + (used === 1 ? ' vídeo · ' : ' vídeos · ') : 'Nenhum vídeo ainda · ') +
          free + (free === 1 ? ' espaço' : ' espaços')
        : 'Espaços completos · ' + TOTAL_VIDEO_SLOTS;
    }
    if (videoEmpty) videoEmpty.hidden = used > 0;

    updateStats();
  }

  function buildVideoCard(file) {
    var today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    var url = URL.createObjectURL(file);
    var name = (file && file.name ? file.name : 'Vídeo').replace(/\.[^.]+$/, '');

    var fig = document.createElement('figure');
    fig.className = 'video-card';
    fig.dataset.kind = 'file';
    fig.dataset.src = url;
    fig.dataset.title = name;
    fig.dataset.date = today;
    fig.innerHTML =
      '<button class="video-card__open" type="button">' +
        '<span class="video-card__frame">' +
          '<video preload="metadata" muted playsinline></video>' +
          '<span class="video-card__play" aria-hidden="true"><span>' + ICON_PLAY + '</span></span>' +
        '</span>' +
        '<span class="video-card__info">' +
          '<span><strong></strong></span>' +
          '<span class="video-card__date"></span>' +
        '</span>' +
      '</button>';

    fig.querySelector('video').src = url;
    fig.querySelector('strong').textContent = name;
    fig.querySelector('.video-card__date').textContent = today;
    fig.querySelector('.video-card__open').setAttribute('aria-label', 'Assistir: ' + name);
    return fig;
  }

  function addVideoFiles(fileList) {
    var files = Array.prototype.slice.call(fileList || [])
      .filter(function (f) { return f && f.type && f.type.indexOf('video/') === 0; });

    if (!files.length) {
      showToast('Escolha arquivos de vídeo (MP4, MOV…).');
      return;
    }

    var acima = files.filter(function (f) { return f.size > 100 * 1024 * 1024; });

    files.forEach(function (file) {
      var card = buildVideoCard(file);
      var slot = videoGallery.querySelector('.placeholder-card');
      if (slot) videoGallery.insertBefore(card, slot);
      else videoGallery.appendChild(card);
    });

    renderVideoSlots();

    showToast(
      (files.length === 1 ? '1 vídeo adicionado' : files.length + ' vídeos adicionados') +
      ' · visível só neste navegador'
    );

    if (acima.length) {
      window.setTimeout(function () {
        showToast('Atenção: ' + acima.length + (acima.length === 1 ? ' arquivo passa' : ' arquivos passam') + ' de 100 MB — o GitHub recusa.');
      }, 4200);
    }
  }

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
    var list = Array.prototype.slice.call(fileList || []);
    var videos = list.filter(function (f) { return f && f.type && f.type.indexOf('video/') === 0; });
    var files  = list.filter(function (f) { return f && f.type && f.type.indexOf('image/') === 0; });

    if (videos.length) addVideoFiles(videos);

    if (!files.length) {
      if (!videos.length) showToast('Escolha arquivos de imagem ou vídeo (JPG, PNG, MP4…).');
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

  Array.prototype.forEach.call(document.querySelectorAll('[data-add-video]'), function (b) {
    b.addEventListener('click', function () { if (videoInput) videoInput.click(); });
  });

  fileInput.addEventListener('change', function () {
    addFiles(fileInput.files);
    fileInput.value = '';
  });

  if (videoInput) {
    videoInput.addEventListener('change', function () {
      addVideoFiles(videoInput.files);
      videoInput.value = '';
    });
  }

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
     busca na nav (fotos + vídeos)
     --------------------------------------------------------- */
  var buscaInput = document.getElementById('busca');
  var buscaLimpar = document.getElementById('buscaLimpar');

  function normTxt(s) {
    return (s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  function applySearch() {
    if (!buscaInput) return;
    var q = normTxt(buscaInput.value.trim());
    if (buscaLimpar) buscaLimpar.hidden = !q;

    if (!q) { // limpa: volta ao filtro do chip
      applyFilter(activeFilter);
      renderVideoSlots();
      return;
    }

    var vis = 0, tot = totalPhotos();
    allCards().forEach(function (card) {
      var img = card.querySelector('img');
      var hay = normTxt(
        (img ? (img.alt || '') : '') + ' ' +
        (card.dataset.date || '') + ' ' +
        (card.dataset.collection || '') + ' ' +
        labelFor(card.dataset.collection || '')
      );
      var ok = hay.indexOf(q) !== -1;
      card.hidden = !ok;
      if (ok) vis++;
    });
    countEl.textContent = vis + ' de ' + tot + (tot === 1 ? ' foto' : ' fotos') + ' para "' + buscaInput.value.trim() + '"';
    emptyEl.hidden = vis > 0;

    var vv = 0;
    videoCards().forEach(function (card) {
      var hay = normTxt((card.dataset.title || '') + ' ' + (card.dataset.date || ''));
      var ok = hay.indexOf(q) !== -1;
      card.hidden = !ok;
      if (ok) vv++;
    });
    if (videoCount) {
      videoCount.textContent = vv
        ? vv + (vv === 1 ? ' vídeo para "' : ' vídeos para "') + buscaInput.value.trim() + '"'
        : 'Nada em vídeos para "' + buscaInput.value.trim() + '"';
    }
    if (videoEmpty) videoEmpty.hidden = true;
  }

  if (buscaInput) {
    buscaInput.addEventListener('input', applySearch);
    buscaInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var alvo = document.getElementById('album');
        if (alvo) alvo.scrollIntoView({ behavior: 'smooth' });
      }
      if (e.key === 'Escape') { buscaInput.value = ''; applySearch(); buscaInput.blur(); }
    });
  }
  if (buscaLimpar) buscaLimpar.addEventListener('click', function () {
    if (!buscaInput) return;
    buscaInput.value = '';
    applySearch();
    buscaInput.focus();
  });

  /* ---------------------------------------------------------
     init
     --------------------------------------------------------- */
  allCards().forEach(function (card, i) { observe(card, i, false); });
  syncChips();
  applyFilter('all');
  refreshLabels();
  renderReserved();
  renderVideoSlots();
  onScroll();

  document.documentElement.dataset.albumReady = '1';
})();
