(function () {
  'use strict';

  var projects = window.BH_PROJECTS || [];
  var render = window.BH_RENDER;
  var root = document.getElementById('detail-content');
  var related = document.getElementById('related');
  var relatedSection = document.getElementById('related-section');
  var projectId = new URLSearchParams(window.location.search).get('id');
  var project = projects.find(function (item) { return item.id === projectId; });

  if (!root) return;
  if (!project || !render) {
    document.title = '프로젝트를 찾을 수 없습니다 | 푸른 수염 스튜디오';
    root.innerHTML = '<section class="detail-copy"><h1>프로젝트를 찾을 수 없습니다.</h1>' +
      '<p class="detail-lead">주소를 다시 확인하거나 전체 작품 목록에서 프로젝트를 선택해 주세요.</p>' +
      '<a class="btn btn-primary" href="./#work">전체 작품 보기 <span aria-hidden="true">→</span></a></section>';
    if (relatedSection) relatedSection.hidden = true;
    return;
  }

  var esc = render.esc;
  document.title = project.title + ' | 푸른 수염 스튜디오';
  var descriptionMeta = document.querySelector('meta[name="description"]');
  if (descriptionMeta) descriptionMeta.content = project.desc;

  function projectLink(link) {
    return '<a class="btn ' + (link.kind === 'primary' ? 'btn-primary' : 'btn-white') +
      '" href="' + esc(link.url) + '" target="_blank" rel="noopener noreferrer">' +
      esc(link.label) + ' <span aria-hidden="true">↗</span></a>';
  }

  var gallery = Array.isArray(project.gallery) ? project.gallery : [];
  root.innerHTML =
    '<section class="detail-top" aria-labelledby="project-title">' +
      '<div class="detail-copy">' +
        '<div class="detail-status">' +
          '<span class="category-chip">' + esc(render.labels[project.category]) + '</span>' +
          '<span class="status-chip' + (project.status === '개발 중' ? ' dev' : '') + '">' + esc(project.status) + '</span>' +
        '</div>' +
        '<p class="eyebrow blue">' + esc(project.kicker) + '</p>' +
        '<h1 id="project-title">' + esc(project.title) + '</h1>' +
        '<p class="detail-lead">' + esc(project.desc) + '</p>' +
        '<div class="detail-links">' + project.links.map(projectLink).join('') + '</div>' +
      '</div>' +
      '<div class="detail-media">' + render.art(project, {
        eager: true,
        sizes: '(max-width: 700px) calc(100vw - 40px), (max-width: 1100px) 46vw, 560px'
      }) + '</div>' +
    '</section>' +
    '<section class="detail-content-grid" aria-label="프로젝트 상세 정보">' +
      '<div><span class="eyebrow blue">THE PROJECT</span><h2>프로젝트 소개</h2><p>' + esc(project.detail) + '</p></div>' +
      '<div><span class="eyebrow blue">HIGHLIGHTS</span><h2>핵심 특징</h2><ul class="feature-list">' +
        project.features.map(function (feature) { return '<li>' + esc(feature) + '</li>'; }).join('') +
      '</ul></div>' +
    '</section>' +
    (gallery.length ?
      '<section class="detail-gallery" aria-labelledby="gallery-title">' +
        '<span class="eyebrow blue">SCREENSHOTS</span><h2 id="gallery-title">실제 게임 화면</h2>' +
        '<p class="detail-lead">이미지를 선택하면 크게 볼 수 있습니다.</p>' +
        '<div class="gallery-grid">' + gallery.map(function (src, index) {
          return '<button type="button" data-image="' + index + '" aria-haspopup="dialog" aria-label="' +
            esc(project.short) + ' 스크린샷 ' + (index + 1) + ' 크게 보기">' +
            '<img src="' + esc(src) + '" alt="' + esc(project.short) + ' 실제 게임 화면 ' + (index + 1) +
            '" loading="lazy" decoding="async" width="1920" height="1080"></button>';
        }).join('') + '</div>' +
      '</section>' : '');

  var siblings = projects.filter(function (item) {
    return item.id !== project.id && item.category === project.category;
  }).slice(0, 3);
  if (siblings.length < 3) {
    siblings = siblings.concat(projects.filter(function (item) {
      return item.id !== project.id && !siblings.some(function (sibling) { return sibling.id === item.id; });
    }).slice(0, 3 - siblings.length));
  }
  if (related) related.innerHTML = siblings.map(function (item) { return render.card(item); }).join('');
  if (relatedSection) relatedSection.hidden = !siblings.length;
  if (typeof render.bindImageFallbacks === 'function') {
    render.bindImageFallbacks(root);
    if (related) render.bindImageFallbacks(related);
  }

  var dialog = document.getElementById('image-dialog');
  var dialogImage = document.getElementById('image-dialog-image');
  var dialogTitle = document.getElementById('image-dialog-title');
  var closeButton = document.getElementById('image-dialog-close');
  if (!dialog || !dialogImage || !closeButton || !gallery.length) return;

  var previousFocus = null;
  var previousOverflow = '';

  root.querySelectorAll('[data-image]').forEach(function (button) {
    button.addEventListener('click', function () {
      var index = Number(button.dataset.image);
      if (!gallery[index] || dialog.open) return;
      previousFocus = button;
      previousOverflow = document.body.style.overflow;
      dialogImage.src = gallery[index];
      dialogImage.alt = project.short + ' 실제 게임 화면 ' + (index + 1) + ' 확대';
      dialogTitle.textContent = project.short + ' 스크린샷 ' + (index + 1) + ' / ' + gallery.length;
      dialog.showModal();
      document.body.style.overflow = 'hidden';
      closeButton.focus();
    });
  });

  closeButton.addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) dialog.close();
  });
  // The native dialog handles Escape and keeps keyboard focus within the modal.
  dialog.addEventListener('close', function () {
    document.body.style.overflow = previousOverflow;
    dialogImage.removeAttribute('src');
    if (previousFocus && previousFocus.isConnected) previousFocus.focus();
    previousFocus = null;
  });
}());
