(function () {
  'use strict';

  var projects = window.BH_PROJECTS || [];
  var labels = { game: '게임', app: '앱 · 웹', tool: '제작 도구', lab: 'AI 스킬 · 연구' };
  var cardSizes = '(max-width: 600px) calc(100vw - 36px), (max-width: 900px) calc((100vw - 64px) / 2), 390px';

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function nativeArt(project) {
    if (project.id === 'planner') {
      return '<div class="native-art"><small>MAKE YOUR NEXT GAME</small><strong>GamePlanner</strong><div class="native-flow" aria-hidden="true"><i>기획</i><b>→</b><i>제작</i><b>→</b><i>검증</i></div></div>';
    }
    if (project.id === 'gameux') {
      return '<div class="native-art"><small>DESIGN FOR PLAYERS</small><strong>Game UI/UX</strong><span>플레이어를 위한 화면 설계</span><div class="native-ui" aria-hidden="true"><i></i><i></i><i></i></div></div>';
    }
    if (project.id === 'voice') {
      return '<div class="native-art"><small>KEEP YOUR OWN VOICE</small><strong>VoiceGuard.</strong><span>이야기에 나만의 문체를.</span><div class="native-lines" aria-hidden="true"><i></i><i></i><i></i></div></div>';
    }
    return '<span class="art-fallback">' + esc(project.short) + '</span>';
  }

  function art(project, options) {
    options = options || {};
    var body;
    if (project.cover) {
      var srcset = project.coverSmall
        ? ' srcset="' + esc(project.coverSmall) + ' 480w, ' + esc(project.cover) + ' 960w" sizes="' + esc(options.sizes || cardSizes) + '"'
        : '';
      body = '<img src="' + esc(project.cover) + '"' + srcset
        + ' alt="' + esc(project.coverAlt || project.short + ' 소개 일러스트') + '"'
        + ' width="960" height="540" loading="' + (options.eager ? 'eager' : 'lazy') + '" decoding="async" data-image-fallback="' + esc(project.short) + '">';
    } else {
      body = nativeArt(project);
    }
    return '<div class="card-art art-' + esc(project.art) + (project.cover ? '' : ' art-native') + '">' + body + '</div>';
  }

  function statusClass(project) {
    return project.status === '개발 중' ? 'dev' : project.status === '소스 공개' ? 'source' : '';
  }

  function card(project) {
    return '<article class="project-card"><a class="card-link" href="./project.html?id=' + encodeURIComponent(project.id)
      + '" aria-label="' + esc(project.title) + ' 상세 소개 보기">' + art(project)
      + '<div class="card-body"><div class="card-top"><span class="category-chip">' + esc(labels[project.category])
      + '</span><span class="status-chip ' + statusClass(project) + '">' + esc(project.status) + '</span></div>'
      + '<h3>' + esc(project.title) + '</h3><p class="card-desc">' + esc(project.cardDesc || project.desc) + '</p>'
      + '<div class="card-footer"><span>' + esc(project.platform || labels[project.category])
      + '</span><strong>자세히 보기 <span aria-hidden="true">↗</span></strong></div></div></a></article>';
  }

  function bindImageFallbacks(root) {
    root.querySelectorAll('img[data-image-fallback]').forEach(function (img) {
      function replaceImage() {
        if (!img.isConnected) return;
        var caption = document.createElement('span');
        caption.className = 'art-fallback';
        caption.textContent = img.dataset.imageFallback;
        img.replaceWith(caption);
      }
      img.addEventListener('error', replaceImage, { once: true });
      if (img.complete && img.naturalWidth === 0) replaceImage();
    });
  }

  window.BH_RENDER = { art: art, card: card, esc: esc, labels: labels, bindImageFallbacks: bindImageFallbacks };
  var grid = document.getElementById('projects-grid');
  if (!grid) return;

  // Keep a visitor's selection when returning from a detail page.
  var storageKey = 'blue-hige:work-filters:v1';
  var category = 'all';
  var search = '';
  try {
    var saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    if (saved) {
      if (saved.category === 'all' || Object.prototype.hasOwnProperty.call(labels, saved.category)) category = saved.category;
      if (typeof saved.search === 'string') search = saved.search.slice(0, 200);
    }
  } catch (_) { /* Filtering also works when browser storage is unavailable. */ }

  var searchBox = document.getElementById('search');
  var filters = document.querySelectorAll('.filter');
  var empty = document.getElementById('empty');
  var resetButton = document.getElementById('reset-filters');
  var resultCount = document.getElementById('result-count');
  searchBox.value = search;
  document.getElementById('project-count').textContent = projects.length;
  document.querySelectorAll('[data-count]').forEach(function (element) {
    var key = element.dataset.count;
    element.textContent = projects.filter(function (project) { return key === 'all' || project.category === key; }).length;
  });

  function render() {
    var query = search.trim().toLocaleLowerCase();
    var list = projects.filter(function (project) {
      var text = [project.title, project.short, project.desc, project.kicker, project.platform, labels[project.category]].join(' ').toLocaleLowerCase();
      return (category === 'all' || category === project.category) && (!query || text.includes(query));
    });
    filters.forEach(function (button) {
      var active = button.dataset.category === category;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    grid.innerHTML = list.map(card).join('');
    empty.hidden = list.length > 0;
    resetButton.hidden = category === 'all' && !query;
    resultCount.textContent = (category === 'all' ? '전체' : labels[category]) + ' ' + list.length + '개 프로젝트' + (query ? ' · 검색 결과' : '');
    bindImageFallbacks(grid);
    try { sessionStorage.setItem(storageKey, JSON.stringify({ category: category, search: search })); } catch (_) {}
  }

  filters.forEach(function (button) {
    button.addEventListener('click', function () {
      category = button.dataset.category;
      render();
    });
  });
  var composing = false;
  searchBox.addEventListener('compositionstart', function () { composing = true; });
  searchBox.addEventListener('compositionend', function () { composing = false; search = searchBox.value; render(); });
  searchBox.addEventListener('input', function () { if (!composing) { search = searchBox.value; render(); } });

  function resetFilters() {
    category = 'all';
    search = '';
    searchBox.value = '';
    render();
    searchBox.focus({ preventScroll: true });
  }
  resetButton.addEventListener('click', resetFilters);
  document.getElementById('empty-reset').addEventListener('click', resetFilters);
  render();

  var featuredIds = ['mawang', 'type', 'pano-maker'];
  var featuredIndex = 0;
  var featureImage = document.getElementById('feature-img');
  var featureDots = document.querySelectorAll('[data-feature]');
  function showFeatured() {
    var project = projects.find(function (item) { return item.id === featuredIds[featuredIndex]; });
    if (!project) return;
    var href = './project.html?id=' + encodeURIComponent(project.id);
    document.getElementById('feature-title').textContent = project.title;
    document.getElementById('feature-desc').textContent = project.cardDesc || project.desc;
    document.getElementById('feature-category').textContent = labels[project.category];
    document.getElementById('feature-status').textContent = project.status;
    document.getElementById('feature-link').href = href;
    var imageLink = document.getElementById('feature-image-link');
    imageLink.href = href;
    imageLink.setAttribute('aria-label', project.short + ' 자세히 보기');
    var sources = project.coverSmall + ' 480w, ' + project.cover + ' 960w';
    if (project.hero && project.hero !== project.cover) sources += ', ' + project.hero + ' 1440w';
    featureImage.srcset = sources;
    featureImage.src = project.hero || project.cover;
    featureImage.alt = project.coverAlt || project.short + ' 소개 일러스트';
    document.getElementById('feature-position').textContent = String(featuredIndex + 1).padStart(2, '0') + ' / 03';
    featureDots.forEach(function (button) {
      var active = Number(button.dataset.feature) === featuredIndex;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }
  document.getElementById('feature-prev').addEventListener('click', function () {
    featuredIndex = (featuredIndex + featuredIds.length - 1) % featuredIds.length;
    showFeatured();
  });
  document.getElementById('feature-next').addEventListener('click', function () {
    featuredIndex = (featuredIndex + 1) % featuredIds.length;
    showFeatured();
  });
  featureDots.forEach(function (button) {
    button.addEventListener('click', function () {
      featuredIndex = Number(button.dataset.feature);
      showFeatured();
    });
  });
  showFeatured();
})();
