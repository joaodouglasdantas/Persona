(function () {
  'use strict';

  function initConnectionsFade() {
    const wrap = document.getElementById('profile-connections-wrap');
    const list = document.getElementById('profile-connections');
    if (!wrap || !list) return;

    function checkScroll() {
      const canScroll = list.scrollHeight > list.clientHeight + 4;
      const atBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 8;
      wrap.classList.toggle('has-scroll', canScroll && !atBottom);
    }

    list.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(list);
    checkScroll();
  }

  function updateConnectionsCount(people) {
    const list = document.getElementById('profile-connections');
    if (!list) return;

    const oldBadge = list.parentElement?.querySelector('.connections-count');
    if (oldBadge) oldBadge.remove();

    if (people && people.length > 5) {
      const badge = document.createElement('div');
      badge.className = 'connections-count';
      badge.textContent = `${people.length} conexões no total • Role para ver mais`;
      list.parentElement.appendChild(badge);
    }
  }

  function initCanvasResize() {
    const wrap = document.getElementById('network-canvas')?.parentElement;
    const canvas = document.getElementById('network-canvas');
    if (!wrap || !canvas) return;

    const ro = new ResizeObserver(() => {
      window.dispatchEvent(new Event('resize'));
    });
    ro.observe(wrap);
  }

  window.truncateLabel = function (name, maxChars) {
    if (!name) return '?';
    maxChars = maxChars || 14;
    if (name.length <= maxChars) return name;
    return name.slice(0, maxChars - 1) + '…';
  };

  function patchTopbarTooltip() {
    const nameEl = document.getElementById('topbar-name');
    if (!nameEl) return;

    const obs = new MutationObserver(() => {
      const text = nameEl.textContent || '';
      if (text.length > 18) {
        nameEl.title = text;
      } else {
        nameEl.removeAttribute('title');
      }
    });
    obs.observe(nameEl, { childList: true, characterData: true, subtree: true });
  }

  function patchToast() {
    const toast = document.getElementById('toast');
    if (!toast) return;

    const msgEl = document.getElementById('toast-msg');
    if (!msgEl) return;

    const origShow = window.showToast;
    if (typeof origShow === 'function') {
      window.showToast = function (msg, icon) {
        if (msg && msg.length > 80) {
          msg = msg.slice(0, 77) + '…';
        }
        origShow(msg, icon);
      };
    }
  }

  function patchModals() {
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      document.querySelectorAll('.modal-overlay.open').forEach((m) => {
        m.classList.remove('open');
      });
    });
  }

  function patchOptionButtons() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.option-btn');
      if (!btn) return;
      btn.style.wordBreak = 'break-word';
      btn.style.overflowWrap = 'anywhere';
    });

    const grids = ['test-options-grid', 'add-options-grid'];
    grids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const mo = new MutationObserver(() => {
        el.querySelectorAll('.option-btn').forEach((btn) => {
          btn.style.wordBreak = 'break-word';
          btn.style.overflowWrap = 'anywhere';
          btn.style.whiteSpace = 'normal';
          btn.style.lineHeight = '1.5';
        });
      });
      mo.observe(el, { childList: true });
    });
  }

  function patchExplainModal() {
    const modal = document.getElementById('explain-modal');
    if (!modal) return;

    const box = modal.querySelector('.modal-box');
    if (box) {
      box.style.overflowY = 'auto';
    }
  }

  window.getNodeRadius = function (totalNodes) {
    if (totalNodes <= 5)  return 28;
    if (totalNodes <= 10) return 24;
    if (totalNodes <= 20) return 20;
    if (totalNodes <= 35) return 16;
    return 13;
  };

  window.getEdgeWidth = function (totalNodes) {
    if (totalNodes <= 10) return 2;
    if (totalNodes <= 20) return 1.5;
    return 1;
  };

  window.getSimulationStrength = function (totalNodes) {
    if (totalNodes <= 10) return -180;
    if (totalNodes <= 20) return -120;
    if (totalNodes <= 35) return -90;
    return -70;
  };

  window.groupConnectionsByCompat = function (people) {
    if (!people || people.length <= 8) return null;

    const groups = {
      excelente: [],
      boa: [],
      desafiadora: [],
    };

    people.forEach((p) => {
      const label = (p.compatLabel || '').toLowerCase();
      if (label.includes('excelente') || label.includes('muito boa')) {
        groups.excelente.push(p);
      } else if (label.includes('boa') || label.includes('complementar') || label.includes('neutra')) {
        groups.boa.push(p);
      } else {
        groups.desafiadora.push(p);
      }
    });

    return groups;
  };

  if (window.location.search.includes('debug')) {
    window.detectOverflows = function () {
      const all = document.querySelectorAll('*');
      const bad = [];
      all.forEach((el) => {
        if (el.scrollWidth > el.clientWidth + 2) {
          bad.push({ el, diff: el.scrollWidth - el.clientWidth });
        }
      });
      console.table(bad.map((b) => ({ tag: b.el.tagName, class: b.el.className, overflow: b.diff })));
    };
    window.addEventListener('load', () => setTimeout(window.detectOverflows, 500));
  }

  function init() {
    initConnectionsFade();
    initCanvasResize();
    patchTopbarTooltip();
    patchToast();
    patchModals();
    patchOptionButtons();
    patchExplainModal();

    document.addEventListener('viewChanged', (e) => {
      if (e.detail === 'dashboard') {
        setTimeout(() => {
          initConnectionsFade();
          patchTopbarTooltip();
        }, 100);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.overflowPatch = { updateConnectionsCount, initConnectionsFade };
})();
