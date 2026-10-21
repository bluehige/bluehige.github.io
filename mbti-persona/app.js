'use strict';

const TYPE_ORDER = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP'
];

const MODE_SETTINGS = {
  planning: {
    label: '기획',
    placeholder: '예: 작은 카페를 알릴 인스타그램 콘텐츠를 기획하고 싶어요.',
    taskRule: '기획의 목표와 대상, 사용할 수 있는 자원을 고려하세요. 제안에서 끝내지 말고 바로 검토할 수 있는 기획안이나 다음 행동까지 제시하세요.'
  },
  conversation: {
    label: '대화',
    placeholder: '예: 하고 싶은 일은 많은데 우선순위를 정하기 어려워요.',
    taskRule: '대화의 맥락에 맞춰 함께 생각을 정리하세요. 감정은 존중하되 사실이나 상대의 의도를 추측으로 단정하지 마세요. 조언을 원하지 않는다고 말하면 경청과 정리에 집중하세요.'
  },
  development: {
    label: '개발',
    placeholder: '예: 모바일에서도 쓸 수 있는 간단한 할 일 목록을 만들고 싶어요.',
    taskRule: '기존 코드와 실행 환경이 있다면 먼저 반영하세요. 구현 요청에는 실제 사용할 수 있는 코드와 적용 위치, 확인 방법을 제공하세요. 실행하거나 검증하지 않은 결과는 완료했다고 표현하지 마세요.'
  }
};

function isKnownType(value) {
  return typeof value === 'string' && TYPE_ORDER.includes(value);
}

function isKnownMode(value) {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(MODE_SETTINGS, value);
}

function buildPersonaPrompt(type, mode) {
  if (!isKnownType(type) || !isKnownMode(mode)) {
    throw new Error('지원하지 않는 MBTI 또는 목적입니다.');
  }
  const persona = PERSONAS[type].modes[mode];
  const purpose = MODE_SETTINGS[mode];
  return [
    '[역할]',
    `당신은 나의 ${purpose.label} 파트너인 "${persona.title}"입니다.`,
    persona.pitch,
    '',
    '[나의 응답 스타일 설정]',
    `내가 선택한 MBTI는 ${type}입니다. 이를 아래 응답 스타일의 출발점으로 사용하세요. 내 성격이나 능력을 단정하지 말고, 내가 직접 말한 선호와 이번 요청을 우선하세요.`,
    '',
    '[함께 일하는 방식]',
    ...persona.rules.map((rule, index) => `${index + 1}. ${rule}`),
    '',
    '[답변 구성]',
    persona.format,
    purpose.taskRule,
    '',
    '[공통 원칙]',
    '- 내 목표를 파악하고 필요한 답이나 결과물부터 보여주세요. 설명은 이해하거나 결정하는 데 필요한 만큼 덧붙이세요.',
    '- 이미 알려준 내용을 다시 묻지 마세요. 결과에 큰 영향이 없는 빈칸은 합리적으로 가정해 진행하고, 중요한 가정은 짧게 밝히세요. 결과를 크게 바꾸는 정보가 없을 때만 핵심 질문을 하세요.',
    '- 사실과 추정을 구분하고 불확실한 부분을 밝혀주세요. 무조건 동의하기보다 근거와 대안을 제시하세요.',
    '- 진행이 막히면 가능한 대안을 찾아 제시하세요. 실제로 수행하지 못한 일과 완료한 일은 구분해 알려주세요.',
    '- 내가 답변 길이, 말투, 작업 방식의 변경을 요청하면 이 추천보다 그 요청을 우선하세요.',
    '',
    '이 설정을 적용해 내가 보내는 요청을 도와주세요.'
  ].join('\n');
}

(function initializeTypeMate() {
  if (typeof document === 'undefined') return;

  const storageKey = 'typemate-pilot-selection-v1';
  const edits = new Map();
  const modeKeys = Object.keys(MODE_SETTINGS);
  const elementIds = [
    'type-grid', 'selected-label', 'selection-count', 'mode-tabs',
    'result-panel', 'empty-state', 'result-content', 'result-type',
    'result-name', 'persona-title', 'persona-pitch', 'persona-tags',
    'rule-preview', 'mode-label', 'prompt-output', 'prompt-length',
    'copy-button', 'reset-button', 'task-input', 'edit-status',
    'download-button', 'share-button', 'toast'
  ];
  const elements = Object.fromEntries(elementIds.map(id => [id, document.getElementById(id)]));
  if (Object.values(elements).some(element => !element)) {
    console.error('타입메이트 화면의 필수 요소를 찾을 수 없습니다.');
    return;
  }
  const tabButtons = Array.from(elements['mode-tabs'].querySelectorAll('[data-mode]'));
  let selectedType = null;
  let selectedMode = 'planning';
  let toastTimer;

  function readChoice() {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const hashType = (params.get('type') || '').toUpperCase();
    const hashMode = params.get('mode');
    if (isKnownType(hashType)) {
      return { type: hashType, mode: isKnownMode(hashMode) ? hashMode : 'planning' };
    }
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (stored && isKnownType(stored.type)) {
        return { type: stored.type, mode: isKnownMode(hashMode) ? hashMode : (isKnownMode(stored.mode) ? stored.mode : 'planning') };
      }
    } catch (_) {
      // Browsers can disable storage; choosing a type still works.
    }
    return { type: null, mode: isKnownMode(hashMode) ? hashMode : 'planning' };
  }

  function rememberChoice() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ type: selectedType, mode: selectedMode }));
    } catch (_) { /* Selection does not depend on storage. */ }
    if (!selectedType) return;
    const url = new URL(window.location.href);
    url.hash = new URLSearchParams({ type: selectedType, mode: selectedMode }).toString();
    try {
      history.replaceState(null, '', url);
    } catch (_) { /* Opening the files directly may restrict history updates. */ }
  }

  function draftKey() {
    return `${selectedType}:${selectedMode}`;
  }

  function composedPrompt() {
    if (!selectedType) return '';
    const body = elements['prompt-output'].value.trim();
    const task = elements['task-input'].value.trim();
    return task ? `${body}\n\n[이번 요청]\n${task}` : body;
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add('is-visible');
    toastTimer = setTimeout(() => elements.toast.classList.remove('is-visible'), 3300);
  }

  function refreshEditorStatus() {
    const changed = selectedType && edits.has(draftKey());
    elements['edit-status'].textContent = changed ? '직접 수정한 프롬프트' : '원하는 말투와 규칙으로 직접 수정해 보세요.';
    elements['edit-status'].classList.toggle('is-edited', Boolean(changed));
    elements['reset-button'].disabled = !changed;
    elements['prompt-length'].textContent = `${composedPrompt().length.toLocaleString('ko-KR')}자`;
    const empty = !elements['prompt-output'].value.trim();
    elements['copy-button'].disabled = !selectedType || empty;
    elements['download-button'].disabled = !selectedType || empty;
  }

  function renderTypes() {
    for (const type of TYPE_ORDER) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'type-card';
      button.dataset.type = type;
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-label', `${type}, ${PERSONAS[type].name}`);

      const code = document.createElement('span');
      code.className = 'type-code';
      code.textContent = type;
      const name = document.createElement('span');
      name.className = 'type-name';
      name.textContent = PERSONAS[type].name;
      const check = document.createElement('span');
      check.className = 'type-check';
      check.setAttribute('aria-hidden', 'true');
      check.textContent = '✓';
      button.append(code, name, check);
      button.addEventListener('click', () => {
        selectedType = type;
        render();
        rememberChoice();
      });
      elements['type-grid'].append(button);
    }
  }

  function render() {
    document.querySelectorAll('.type-card[data-type]').forEach(button => {
      const active = button.dataset.type === selectedType;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    tabButtons.forEach(button => {
      const active = button.dataset.mode === selectedMode;
      button.id = `mode-${button.dataset.mode}`;
      button.setAttribute('aria-selected', String(active));
      button.setAttribute('aria-controls', 'result-content');
      button.tabIndex = active ? 0 : -1;
    });
    elements['result-content'].setAttribute('aria-labelledby', `mode-${selectedMode}`);
    elements['task-input'].placeholder = MODE_SETTINGS[selectedMode].placeholder;
    elements['mode-label'].textContent = `${MODE_SETTINGS[selectedMode].label} 파트너`;
    elements['empty-state'].hidden = Boolean(selectedType);
    elements['result-content'].hidden = !selectedType;
    elements['selection-count'].textContent = selectedType ? '선택 완료' : '16가지 유형';

    if (!selectedType) {
      elements['selected-label'].textContent = '나의 MBTI를 골라주세요';
      return;
    }

    const profile = PERSONAS[selectedType];
    const persona = profile.modes[selectedMode];
    elements['selected-label'].textContent = `${selectedType} · ${profile.name}`;
    elements['result-type'].textContent = selectedType;
    elements['result-name'].textContent = profile.summary;
    elements['persona-title'].textContent = persona.title;
    elements['persona-pitch'].textContent = persona.pitch;
    elements['persona-tags'].replaceChildren(...profile.tags.map(tag => {
      const span = document.createElement('span');
      span.className = 'persona-tag';
      span.textContent = tag;
      return span;
    }));
    elements['rule-preview'].replaceChildren(...persona.rules.slice(0, 3).map(rule => {
      const li = document.createElement('li');
      li.textContent = rule;
      return li;
    }));
    elements['prompt-output'].value = edits.has(draftKey())
      ? edits.get(draftKey())
      : buildPersonaPrompt(selectedType, selectedMode);
    refreshEditorStatus();
  }

  function changeMode(mode, focusTab = false) {
    if (!isKnownMode(mode)) return;
    selectedMode = mode;
    render();
    rememberChoice();
    if (focusTab) tabButtons.find(button => button.dataset.mode === mode)?.focus();
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (_) { /* Try the compatibility path below. */ }
    }
    const previousFocus = document.activeElement;
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.setAttribute('aria-label', '복사할 텍스트');
    helper.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.append(helper);
    helper.focus();
    helper.select();
    helper.setSelectionRange(0, text.length);
    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (_) { /* Report failure accurately to the user. */ }
    helper.remove();
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus({ preventScroll: true });
    return copied;
  }

  tabButtons.forEach(button => {
    button.addEventListener('click', () => changeMode(button.dataset.mode));
    button.addEventListener('keydown', event => {
      const current = modeKeys.indexOf(selectedMode);
      let next;
      if (event.key === 'ArrowRight') next = (current + 1) % modeKeys.length;
      if (event.key === 'ArrowLeft') next = (current - 1 + modeKeys.length) % modeKeys.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = modeKeys.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      changeMode(modeKeys[next], true);
    });
  });

  elements['prompt-output'].addEventListener('input', () => {
    if (!selectedType) return;
    const value = elements['prompt-output'].value;
    if (value === buildPersonaPrompt(selectedType, selectedMode)) edits.delete(draftKey());
    else edits.set(draftKey(), value);
    refreshEditorStatus();
  });

  elements['task-input'].addEventListener('input', refreshEditorStatus);

  elements['reset-button'].addEventListener('click', () => {
    if (!selectedType) return;
    edits.delete(draftKey());
    render();
    showToast('이 추천의 원래 프롬프트로 돌아왔어요.');
  });

  elements['copy-button'].addEventListener('click', async () => {
    if (!selectedType || !elements['prompt-output'].value.trim()) return;
    const text = composedPrompt();
    const ok = await copyText(text);
    if (ok) {
      showToast(elements['task-input'].value.trim() ? '프롬프트와 요청을 함께 복사했어요.' : '프롬프트를 복사했어요. AI 대화창에 붙여넣어 보세요.');
    } else {
      showToast('자동 복사가 차단됐어요. 텍스트 저장으로 전체 프롬프트를 받을 수 있어요.');
    }
  });

  elements['download-button'].addEventListener('click', () => {
    if (!selectedType || !elements['prompt-output'].value.trim()) return;
    const blob = new Blob(['\uFEFF', composedPrompt()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `typemate-${selectedType}-${selectedMode}.txt`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('프롬프트 텍스트 파일을 저장했어요.');
  });

  elements['share-button'].addEventListener('click', async () => {
    if (!selectedType) return;
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = new URLSearchParams({ type: selectedType, mode: selectedMode }).toString();
    const ok = await copyText(url.toString());
    showToast(ok ? 'MBTI와 목적의 링크를 복사했어요. 입력한 내용은 포함되지 않아요.' : '링크를 자동으로 복사하지 못했어요. 주소창의 링크를 복사해 주세요.');
  });

  window.addEventListener('hashchange', () => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const type = (params.get('type') || '').toUpperCase();
    const mode = params.get('mode');
    selectedType = isKnownType(type) ? type : null;
    selectedMode = isKnownMode(mode) ? mode : 'planning';
    render();
  });

  const choice = readChoice();
  selectedType = choice.type;
  selectedMode = choice.mode;
  renderTypes();
  render();
})();
