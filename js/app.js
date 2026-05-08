const STORE_MAIN    = 'persona_main';
const STORE_PERSONS = 'persona_persons';

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let state = {
  view:            'welcome',
  dashTab:         'network',
  testAnswers:     [],
  currentQ:        0,
  shuffledQs:      [],
  addMode:         null,
  addName:         '',
  addAnswers:      [],
  addCurrentQ:     0,
  addResultData:   null
};

let network = null;

function getMainUser()  { return JSON.parse(localStorage.getItem(STORE_MAIN) || 'null'); }
function getPersons()   { return JSON.parse(localStorage.getItem(STORE_PERSONS) || '[]'); }

function saveMainUser(user)   { localStorage.setItem(STORE_MAIN, JSON.stringify(user)); }
function savePersons(persons) { localStorage.setItem(STORE_PERSONS, JSON.stringify(persons)); }

function addPersonToStore(person) {
  const persons = getPersons();
  persons.push(person);
  savePersons(persons);
}

function removePersonFromStore(id) {
  savePersons(getPersons().filter(p => p.id !== id));
}

function resetAllData() {
  localStorage.removeItem(STORE_MAIN);
  localStorage.removeItem(STORE_PERSONS);
}

function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const view = document.getElementById('view-' + id);
  if (view) view.classList.add('active');
  state.view = id;
}

function showDashTab(tab) {
  state.dashTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('active', p.id === 'tab-' + tab);
  });
  if (tab === 'network') {
    if (network) network.onTabVisible(true);
    setTimeout(() => {
      if (network) network._resize();
    }, 100);
  } else {
    if (network) network.onTabVisible(false);
  }
}

function startSelfTest(name) {
  state.testName   = name.trim();
  state.testAnswers = [];
  state.currentQ   = 0;
  state.shuffledQs = shuffleOptions([...QUESTIONS]);
  showView('test');
  renderQuestion();
}

function renderQuestion() {
  const q = state.shuffledQs[state.currentQ];
  const total = state.shuffledQs.length;
  const pct = Math.round((state.currentQ / total) * 100);

  document.getElementById('test-progress-fill').style.width = pct + '%';
  document.getElementById('test-question-num').textContent = `Pergunta ${state.currentQ + 1} de ${total}`;
  document.getElementById('test-question-num-inner').textContent = `PERGUNTA ${state.currentQ + 1}`;
  document.getElementById('test-question-text').textContent = q.stemSelf;

  const letters = ['A', 'B', 'C', 'D'];
  const grid = document.getElementById('test-options-grid');
  grid.innerHTML = '';

  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.dataset.letter = letters[i];
    btn.dataset.color  = opt.color;
    btn.textContent    = opt.text;
    btn.addEventListener('click', () => selectSelfOption(opt.color, btn));
    grid.appendChild(btn);
  });

  document.getElementById('test-next-btn').disabled = true;
  document.getElementById('test-next-btn').textContent =
    state.currentQ === total - 1 ? 'Ver meu perfil →' : 'Próxima →';
}

function selectSelfOption(color, clickedBtn) {
  document.querySelectorAll('#test-options-grid .option-btn').forEach(b => {
    b.classList.remove('selected');
  });
  clickedBtn.classList.add('selected');
  state.selectedAnswer = color;
  document.getElementById('test-next-btn').disabled = false;
}

function advanceSelfTest() {
  if (!state.selectedAnswer) return;
  state.testAnswers.push(state.selectedAnswer);
  state.currentQ++;
  state.selectedAnswer = null;

  if (state.currentQ >= state.shuffledQs.length) {
    finishSelfTest();
  } else {
    renderQuestion();
  }
}

function finishSelfTest() {
  const result = calculatePersonality(state.testAnswers);
  const user = {
    id:          'main',
    name:        state.testName,
    color:       result.dominant,
    scores:      result.scores,
    percentages: result.percentages,
    createdAt:   Date.now()
  };
  saveMainUser(user);
  showResultScreen(user, result);
}

function showResultScreen(user, result, isSelf = true) {
  const p = PERSONALITIES[result.dominant];

  document.getElementById('result-icon').textContent     = p.icon;
  document.getElementById('result-color-name').textContent  = p.name;
  document.getElementById('result-color-name').style.color  = p.color;
  document.getElementById('result-color-title').textContent = p.title;
  document.getElementById('result-tagline').textContent     = p.tagline;

  const card = document.getElementById('result-profile-card');
  card.style.borderColor = p.color;
  card.style.background  = `rgba(${p.colorRgb}, 0.08)`;

  const barsEl = document.getElementById('result-bars');
  barsEl.innerHTML = '';
  const sorted = Object.entries(result.percentages).sort((a, b) => b[1] - a[1]);
  sorted.forEach(([key, pct]) => {
    const pd = PERSONALITIES[key];
    barsEl.innerHTML += `
      <div class="result-bar-row">
        <span class="result-bar-label" style="color:${pd.color}">${pd.name}</span>
        <div class="result-bar-track">
          <div class="result-bar-fill bar-${key}" style="width:0%" data-target="${pct}"></div>
        </div>
        <span class="result-bar-pct">${pct}%</span>
      </div>`;
  });

  document.getElementById('result-user-name').textContent = user.name;
  document.getElementById('result-action-btn').textContent = isSelf
    ? 'Ir para o Dashboard →'
    : 'Confirmar e Adicionar →';
  document.getElementById('result-action-btn').dataset.isSelf = isSelf ? '1' : '0';

  showView('result');

  setTimeout(() => {
    document.querySelectorAll('.result-bar-fill').forEach(el => {
      el.style.width = el.dataset.target + '%';
    });
  }, 200);
}

function onResultAction() {
  const btn = document.getElementById('result-action-btn');
  if (btn.dataset.isSelf === '1') {
    initDashboard();
  } else {
    confirmAddPerson();
  }
}

function initDashboard() {
  const user    = getMainUser();
  const persons = getPersons();

  if (!user) { showView('welcome'); return; }

  const p = PERSONALITIES[user.color];

  document.getElementById('topbar-name').textContent    = user.name;
  document.getElementById('topbar-badge').textContent   = p.name;
  document.getElementById('topbar-badge').style.background  = `rgba(${p.colorRgb},0.2)`;
  document.getElementById('topbar-badge').style.color        = p.color;
  document.getElementById('topbar-avatar').textContent  = user.name[0].toUpperCase();
  document.getElementById('topbar-avatar').style.background = `rgba(${p.colorRgb},0.2)`;
  document.getElementById('topbar-avatar').style.borderColor = p.color;
  document.getElementById('topbar-avatar').style.color  = p.color;

  showView('dashboard');
  showDashTab(state.dashTab);

  renderProfileTab(user, persons);
  renderExplainTab(user);
  initNetwork(user, persons);
}

function initNetwork(user, persons) {
  if (!network) {
    const canvas = document.getElementById('network-canvas');
    network = new PersonaNetwork(canvas);
    window.onNetworkNodeClick = onNetworkNodeClick;
  }
  network.loadAll(user, persons);

  const emptyEl = document.getElementById('network-empty');
  if (emptyEl) emptyEl.style.display = persons.length === 0 ? 'flex' : 'none';
}

function onNetworkNodeClick(node) {
  if (node.isMain) {
    showDashTab('profile');
    return;
  }
  showNodeModal(node);
}

function showNodeModal(node) {
  const p = PERSONALITIES[node.color];
  const mainUser = getMainUser();
  const compat = mainUser ? getCompatibility(mainUser.color, node.color) : null;

  const modal = document.getElementById('node-modal');
  document.getElementById('modal-avatar-icon').textContent   = p.icon;
  document.getElementById('modal-avatar-icon').style.background   = `rgba(${p.colorRgb},0.2)`;
  document.getElementById('modal-person-name').textContent   = node.name;
  document.getElementById('modal-person-color').textContent  = p.name + ' — ' + p.title;
  document.getElementById('modal-person-color').style.color  = p.color;
  document.getElementById('modal-person-desc').textContent   = p.description;
  document.getElementById('modal-remove-btn').dataset.id     = node.id;

  if (compat) {
    document.getElementById('modal-compat-label').textContent = compat.label;
    document.getElementById('modal-compat-desc').textContent  = compat.desc;
    const stars = '★'.repeat(compat.level) + '☆'.repeat(4 - compat.level);
    document.getElementById('modal-compat-stars').textContent = stars;
    document.getElementById('modal-compat-stars').style.color = p.color;
  }

  modal.classList.add('open');
}

function closeNodeModal() {
  document.getElementById('node-modal').classList.remove('open');
}

function renderProfileTab(user, persons) {
  const p = PERSONALITIES[user.color];

  document.getElementById('profile-avatar-icon').textContent   = p.icon;
  document.getElementById('profile-avatar-icon').style.background   = `rgba(${p.colorRgb},0.2)`;
  document.getElementById('profile-avatar-icon').style.borderColor  = p.color;
  document.getElementById('profile-main-name').textContent    = user.name;
  document.getElementById('profile-main-color').textContent   = p.name + ' — ' + p.title;
  document.getElementById('profile-main-color').style.color   = p.color;
  document.getElementById('profile-main-desc').textContent    = p.description;

  const card = document.getElementById('profile-main-card');
  card.style.borderColor  = p.color;
  card.style.background   = `rgba(${p.colorRgb},0.06)`;

  const strEl = document.getElementById('profile-strengths');
  strEl.innerHTML = p.strengths.map(s =>
    `<li><span class="trait-dot" style="background:${p.color}"></span>${s}</li>`
  ).join('');

  const chalEl = document.getElementById('profile-challenges');
  chalEl.innerHTML = p.challenges.map(c =>
    `<li><span class="trait-dot" style="background:#8888AA"></span>${c}</li>`
  ).join('');

  renderConnectionsList(user, persons);
}

function renderConnectionsList(user, persons) {
  const el = document.getElementById('profile-connections');
  if (!el) return;

  if (persons.length === 0) {
    el.innerHTML = '<p style="font-size:0.88rem;padding:8px 0">Nenhuma conexão ainda. Adicione alguém!</p>';
    return;
  }

  el.innerHTML = persons.map(person => {
    const pp = PERSONALITIES[person.color];
    const compat = getCompatibility(user.color, person.color);
    const compatColors = { 1: '#E05252', 2: '#D4A017', 3: '#3A87C8', 4: '#2EBC6E' };
    const compatColor = compatColors[compat.level] || '#888';
    const initials = person.name.split(' ').slice(0,2).map(s => s[0] || '').join('').toUpperCase();
    return `
      <div class="connection-item">
        <div class="connection-avatar" style="background:rgba(${pp.colorRgb},0.2);border-color:${pp.color};color:${pp.color}">${esc(initials)}</div>
        <div class="connection-info">
          <div class="connection-name">${esc(person.name)}</div>
          <div class="connection-type">${pp.icon} ${pp.name}</div>
        </div>
        <span class="connection-compat" style="background:${compatColor}22;color:${compatColor}">${compat.label}</span>
      </div>`;
  }).join('');
}

function renderExplainTab(user) {
  const explainGrid = document.getElementById('explain-personalities');
  if (explainGrid) {
    explainGrid.innerHTML = Object.values(PERSONALITIES).map(p => `
      <div class="explain-card" onclick="openExplainDetail('${p.id}')">
        <div class="explain-card-header">
          <div class="explain-card-icon" style="background:rgba(${p.colorRgb},0.18)">${p.icon}</div>
          <div>
            <h3 style="color:${p.color}">${p.name}</h3>
            <div style="font-size:0.82rem;color:var(--text-muted);margin-top:2px">${p.title}</div>
          </div>
          ${user.color === p.id ? `<span style="position:absolute;top:12px;right:12px;font-size:0.72rem;background:rgba(${p.colorRgb},0.2);color:${p.color};padding:3px 10px;border-radius:10px;font-weight:700">SEU PERFIL</span>` : ''}
          </div>
        <div class="explain-card-body">
          <p>${p.description}</p>
        </div>
      </div>
    `).join('');
  }

  const conflictsEl = document.getElementById('explain-conflicts');
  if (conflictsEl) {
    conflictsEl.innerHTML = CONFLICTS.map(c => {
      const p0 = PERSONALITIES[c.pair[0]];
      const p1 = PERSONALITIES[c.pair[1]];
      return `
        <div class="conflict-card">
          <div class="conflict-header">
            <span class="conflict-title">${c.icon} ${c.title}</span>
            <span class="tension-badge tension-${c.tensionLevel}">Tensão ${c.tension}</span>
          </div>
          <p class="conflict-desc">${c.description}</p>
          <div class="conflict-tip"><strong>💡 Como contornar:</strong> ${c.bridgeTip}</div>
        </div>`;
    }).join('');
  }

  const matrixEl = document.getElementById('explain-matrix');
  if (matrixEl) {
    const pKeys = ['V', 'A', 'Ve', 'Az'];
    let html = `<div class="compat-matrix"><table class="matrix-table"><thead><tr><th></th>`;
    pKeys.forEach(k => {
      const pd = PERSONALITIES[k];
      html += `<th style="color:${pd.color}">${pd.icon}<br>${pd.name}</th>`;
    });
    html += '</tr></thead><tbody>';
    pKeys.forEach(row => {
      const pr = PERSONALITIES[row];
      html += `<tr><th style="color:${pr.color}">${pr.icon} ${pr.name}</th>`;
      pKeys.forEach(col => {
        const c = COMPATIBILITY[row][col];
        html += `<td class="compat-${c.level}" title="${c.desc}">${c.label}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    matrixEl.innerHTML = html;
  }
}

function openExplainDetail(colorId) {
  const p = PERSONALITIES[colorId];
  const modal = document.getElementById('explain-modal');
  document.getElementById('explain-modal-icon').textContent  = p.icon;
  document.getElementById('explain-modal-name').textContent  = p.name;
  document.getElementById('explain-modal-name').style.color  = p.color;
  document.getElementById('explain-modal-title').textContent = p.title;
  document.getElementById('explain-modal-desc').textContent  = p.description;

  document.getElementById('explain-modal-strengths').innerHTML =
    p.strengths.map(s => `<li>${s}</li>`).join('');
  document.getElementById('explain-modal-challenges').innerHTML =
    p.challenges.map(c => `<li>${c}</li>`).join('');

  document.getElementById('explain-modal-communication').textContent = p.communicationTip;
  document.getElementById('explain-modal-motivations').textContent   = p.motivations;
  document.getElementById('explain-modal-fears').textContent         = p.fears;
  document.getElementById('explain-modal-body').textContent          = p.bodyLanguage;

  modal.classList.add('open');
}

function closeExplainModal() {
  document.getElementById('explain-modal').classList.remove('open');
}

function startAddPerson() {
  state.addMode     = null;
  state.addName     = '';
  state.addAnswers  = [];
  state.addCurrentQ = 0;
  state.addResultData = null;

  document.getElementById('add-name-input').value = '';
  document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('add-start-btn').disabled = true;

  showAddStep('step-who');
  showView('add');
}

function showAddStep(stepId) {
  document.querySelectorAll('.add-step').forEach(s => s.classList.remove('active'));
  const step = document.getElementById('add-' + stepId);
  if (step) step.classList.add('active');
}

function selectAddMode(mode) {
  state.addMode = mode;
  document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
  const card = document.querySelector(`.mode-card[data-mode="${mode}"]`);
  if (card) card.classList.add('selected');
  updateAddStartBtn();
}

function updateAddStartBtn() {
  const name = document.getElementById('add-name-input').value.trim();
  document.getElementById('add-start-btn').disabled = !state.addMode || !name;
}

function beginAddTest() {
  const nameInput = document.getElementById('add-name-input');
  state.addName = nameInput.value.trim();
  if (!state.addName || !state.addMode) return;

  if (state.addMode === 'direct') {
    document.getElementById('add-direct-name').textContent = state.addName;
    document.querySelectorAll('.direct-color-btn').forEach(b => b.classList.remove('selected'));
    showAddStep('step-direct');
    return;
  }

  state.addAnswers  = [];
  state.addCurrentQ = 0;
  state.addShuffledQs = shuffleOptions([...QUESTIONS]);

  document.getElementById('add-test-for-name').textContent =
    state.addMode === 'self'
      ? `${state.addName} está respondendo`
      : `Você está respondendo sobre ${state.addName}`;

  showAddStep('step-test');
  renderAddQuestion();
}

function renderAddQuestion() {
  const q = state.addShuffledQs[state.addCurrentQ];
  const total = state.addShuffledQs.length;
  const pct = Math.round((state.addCurrentQ / total) * 100);

  document.getElementById('add-progress-fill').style.width  = pct + '%';
  document.getElementById('add-question-num').textContent   = `Pergunta ${state.addCurrentQ + 1} de ${total}`;

  const stem = state.addMode === 'self'
    ? q.stemSelf
    : q.stemOther.replace(/{name}/g, state.addName);
  document.getElementById('add-question-text').textContent = stem;

  const letters = ['A', 'B', 'C', 'D'];
  const grid = document.getElementById('add-options-grid');
  grid.innerHTML = '';

  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.dataset.letter = letters[i];
    btn.dataset.color  = opt.color;
    btn.textContent    = opt.text;
    btn.addEventListener('click', () => selectAddOption(opt.color, btn));
    grid.appendChild(btn);
  });

  document.getElementById('add-next-btn').disabled = true;
  document.getElementById('add-next-btn').textContent =
    state.addCurrentQ === total - 1 ? 'Ver resultado →' : 'Próxima →';
}

function selectAddOption(color, clickedBtn) {
  document.querySelectorAll('#add-options-grid .option-btn').forEach(b => b.classList.remove('selected'));
  clickedBtn.classList.add('selected');
  state.addSelectedAnswer = color;
  document.getElementById('add-next-btn').disabled = false;
}

function advanceAddTest() {
  if (!state.addSelectedAnswer) return;
  state.addAnswers.push(state.addSelectedAnswer);
  state.addCurrentQ++;
  state.addSelectedAnswer = null;

  if (state.addCurrentQ >= state.addShuffledQs.length) {
    finishAddTest();
  } else {
    renderAddQuestion();
  }
}

function finishAddTest() {
  const result = calculatePersonality(state.addAnswers);
  state.addResultData = result;

  const p = PERSONALITIES[result.dominant];
  const mainUser = getMainUser();
  const compat   = mainUser ? getCompatibility(mainUser.color, result.dominant) : null;

  document.getElementById('add-result-name').textContent = state.addName;
  document.getElementById('add-result-icon').textContent = p.icon;
  document.getElementById('add-result-color').textContent = p.name + ' · ' + p.title;
  document.getElementById('add-result-color').style.color = p.color;

  const card = document.getElementById('add-result-card');
  card.style.borderColor = p.color;
  card.style.background  = `rgba(${p.colorRgb},0.08)`;

  if (compat) {
    document.getElementById('add-compat-label').textContent = compat.label;
    document.getElementById('add-compat-desc').textContent  = compat.desc;
    const compatColors = { 1: '#E05252', 2: '#D4A017', 3: '#3A87C8', 4: '#2EBC6E' };
    document.getElementById('add-compat-label').style.color = compatColors[compat.level];
  }

  showAddStep('step-result');
}

function selectDirectColor(colorKey) {
  const p = PERSONALITIES[colorKey];
  if (!p) return;

  document.querySelectorAll('.direct-color-btn').forEach(b => b.classList.remove('selected'));
  const btn = document.querySelector(`.direct-color-btn[data-color="${colorKey}"]`);
  if (btn) btn.classList.add('selected');

  const scores      = { V: 0, A: 0, Ve: 0, Az: 0 };
  const percentages = { V: 0, A: 0, Ve: 0, Az: 0 };
  scores[colorKey]      = 1;
  percentages[colorKey] = 100;

  state.addResultData = { dominant: colorKey, scores, percentages };

  const mainUser = getMainUser();
  const compat   = mainUser ? getCompatibility(mainUser.color, colorKey) : null;

  document.getElementById('add-result-name').textContent = state.addName;
  document.getElementById('add-result-icon').textContent = p.icon;
  document.getElementById('add-result-color').textContent = p.name + ' · ' + p.title;
  document.getElementById('add-result-color').style.color = p.color;

  const card = document.getElementById('add-result-card');
  card.style.borderColor = p.color;
  card.style.background  = `rgba(${p.colorRgb},0.08)`;

  if (compat) {
    document.getElementById('add-compat-label').textContent = compat.label;
    document.getElementById('add-compat-desc').textContent  = compat.desc;
    const compatColors = { 1: '#E05252', 2: '#D4A017', 3: '#3A87C8', 4: '#2EBC6E' };
    document.getElementById('add-compat-label').style.color = compatColors[compat.level];
  }

  showAddStep('step-result');
}

function confirmAddPerson() {
  if (!state.addResultData) return;

  const person = {
    id:          generateId(),
    name:        state.addName,
    color:       state.addResultData.dominant,
    scores:      state.addResultData.scores,
    percentages: state.addResultData.percentages,
    isSelf:      state.addMode === 'self',
    createdAt:   Date.now()
  };

  addPersonToStore(person);
  showToast(`${person.name} adicionado à sua teia! ${PERSONALITIES[person.color].icon}`);

  const user = getMainUser();
  const persons = getPersons();
  if (network) network.addPerson(person);
  renderProfileTab(user, persons);

  showView('dashboard');
  showDashTab('network');

  const emptyEl = document.getElementById('network-empty');
  if (emptyEl) emptyEl.style.display = 'none';
}

function goBackToDashboard() {
  showView('dashboard');
  showDashTab(state.dashTab);
}

function removePerson(id) {
  removePersonFromStore(id);
  if (network) network.removePerson(id);
  closeNodeModal();

  const user    = getMainUser();
  const persons = getPersons();
  renderProfileTab(user, persons);

  const emptyEl = document.getElementById('network-empty');
  if (emptyEl && persons.length === 0) emptyEl.style.display = 'flex';

  showToast('Conexão removida.');
}

let toastTimer = null;
function showToast(msg, icon = '✦') {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  document.getElementById('toast-icon').textContent = icon;
  t.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

function resetApp() {
  if (!confirm('Tem certeza? Todos os dados serão apagados.')) return;
  resetAllData();
  if (network) { network.stopLoop(); network = null; }
  state = {
    view: 'welcome', dashTab: 'network',
    testAnswers: [], currentQ: 0, shuffledQs: [],
    addMode: null, addName: '', addAnswers: [],
    addCurrentQ: 0, addResultData: null
  };
  showView('welcome');
}

document.addEventListener('DOMContentLoaded', () => {
  const mainUser = getMainUser();

  if (mainUser) {
    initDashboard();
  } else {
    showView('welcome');
  }

  document.getElementById('welcome-start-btn').addEventListener('click', () => {
    const name = document.getElementById('welcome-name').value.trim();
    if (!name) {
      document.getElementById('welcome-name').focus();
      showToast('Por favor, informe seu nome primeiro.', '⚠️');
      return;
    }
    startSelfTest(name);
  });

  document.getElementById('welcome-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('welcome-start-btn').click();
  });

  document.getElementById('test-next-btn').addEventListener('click', advanceSelfTest);

  document.getElementById('result-action-btn').addEventListener('click', onResultAction);

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => showDashTab(btn.dataset.tab));
  });

  document.getElementById('dash-add-btn').addEventListener('click', startAddPerson);

  document.getElementById('add-back-btn').addEventListener('click', goBackToDashboard);

  document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => selectAddMode(card.dataset.mode));
  });

  document.getElementById('add-name-input').addEventListener('input', updateAddStartBtn);
  document.getElementById('add-name-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !document.getElementById('add-start-btn').disabled) {
      document.getElementById('add-start-btn').click();
    }
  });

  document.getElementById('add-start-btn').addEventListener('click', beginAddTest);
  document.getElementById('add-next-btn').addEventListener('click', advanceAddTest);
  document.getElementById('add-confirm-btn').addEventListener('click', confirmAddPerson);
  document.getElementById('add-cancel-btn').addEventListener('click', goBackToDashboard);

  document.getElementById('node-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('node-modal')) closeNodeModal();
  });
  document.getElementById('explain-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('explain-modal')) closeExplainModal();
  });

  document.getElementById('modal-close-btn').addEventListener('click', closeNodeModal);
  document.getElementById('explain-modal-close').addEventListener('click', closeExplainModal);

  document.getElementById('modal-remove-btn').addEventListener('click', () => {
    const id = document.getElementById('modal-remove-btn').dataset.id;
    if (confirm('Remover esta conexão da teia?')) removePerson(id);
  });

  document.getElementById('reset-btn').addEventListener('click', resetApp);
});