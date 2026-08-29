'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');

const originalSendFile = express.response.sendFile;
const SID_FILE = 'staffnet-intelligent-directory.html';
const SOLCAT_FILE = 'staffnet-solution-prism.html';

// Avoid broad mutation of embedded SPA logic. We only apply a safe DOM-level
// terminology layer and the mobile chrome treatment for SolCat.
const TARGETS = new Set([SID_FILE, SOLCAT_FILE]);

function protectSourceTerms(html) {
  const protectedTerms = new Map([
    ['Business Advisory', '__D3_BUSINESS_ADVISORY__'],
    ['business advisory', '__d3_business_advisory__'],
    ['Digital & ICT Advisory', '__D3_DIGITAL_ICT_ADVISORY__'],
    ['Advisory & Assessment', '__D3_ADVISORY_ASSESSMENT__'],
    ['Bespoke Service - Consulting', '__D3_BESPOKE_SERVICE_CONSULTING__'],
    ['Bespoke Service - Managed', '__D3_BESPOKE_SERVICE_MANAGED__'],
    ['Data#3 Bespoke Service – Consulting', '__D3_BESPOKE_SERVICE_CONSULTING_DASH__']
  ]);
  let output = String(html);
  protectedTerms.forEach((token, term) => { output = output.replaceAll(term, token); });
  return { output, protectedTerms };
}

function restoreSourceTerms(html, protectedTerms) {
  let output = String(html);
  protectedTerms.forEach((token, term) => { output = output.replaceAll(token, term); });
  return output;
}

function canonicalTerminologyScript() {
  return `<script id="data3-canonical-terminology">
(function(){
  var replacements = [
    [/Bespoke/g, 'Project'],
    [/bespoke/g, 'project'],
    [/Advisory/g, 'Consulting'],
    [/advisory/g, 'consulting'],
    [/Lenses/g, 'Capabilities'],
    [/lenses/g, 'capabilities'],
    [/Lens/g, 'Capability'],
    [/lens/g, 'capability']
  ];
  function canon(value){
    var text = String(value == null ? '' : value);
    replacements.forEach(function(pair){ text = text.replace(pair[0], pair[1]); });
    return text;
  }
  function allowed(element){
    return element && !/^(SCRIPT|STYLE|TEXTAREA|CODE|PRE)$/i.test(element.tagName || '');
  }
  function normalizeAttributes(element){
    ['aria-label','title','placeholder','alt'].forEach(function(attribute){
      if (!element.hasAttribute || !element.hasAttribute(attribute)) return;
      var current = element.getAttribute(attribute);
      var next = canon(current);
      if (next !== current) element.setAttribute(attribute, next);
    });
  }
  function normalize(root){
    if (!root) return;
    if (root.nodeType === 3) {
      var nextText = canon(root.nodeValue);
      if (nextText !== root.nodeValue) root.nodeValue = nextText;
      return;
    }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: function(node){
        var element = node.nodeType === 1 ? node : node.parentElement;
        return allowed(element) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var node = walker.currentNode;
    while (node) {
      if (node.nodeType === 1) normalizeAttributes(node);
      if (node.nodeType === 3) {
        var next = canon(node.nodeValue);
        if (next !== node.nodeValue) node.nodeValue = next;
      }
      node = walker.nextNode();
    }
  }
  function mount(){
    normalize(document.body || document.documentElement);
    new MutationObserver(function(mutations){
      mutations.forEach(function(mutation){
        mutation.addedNodes && mutation.addedNodes.forEach(function(node){ normalize(node); });
        if (mutation.type === 'characterData') normalize(mutation.target);
      });
    }).observe(document.body || document.documentElement, { childList:true, subtree:true, characterData:true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once:true }); else mount();
})();
</script>`;
}

function solcatMobileEnhancement(html) {
  const style = `<style id="solcat-mobile-chrome-fix">
@media(max-width:760px){
  body.solcat-mobile-chrome .top{position:sticky!important;top:0!important;z-index:80!important;background:rgba(0,0,37,.96)!important}
  body.solcat-mobile-chrome .topin{min-height:auto!important;padding:10px 14px 8px!important;display:grid!important;grid-template-columns:minmax(0,1fr)!important;align-items:center!important;gap:8px!important;flex-wrap:nowrap!important}
  body.solcat-mobile-chrome .wordmark{grid-column:1/-1!important;padding:0!important;gap:8px!important;min-width:0!important}
  body.solcat-mobile-chrome .wordmark b{font-size:22px!important;letter-spacing:-.04em!important}
  body.solcat-mobile-chrome .wordmark span{font-size:16px!important;min-width:0!important;white-space:nowrap!important}
  body.solcat-mobile-chrome .topright{grid-column:1/-1!important;width:100%!important;margin:0!important;display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:8px!important;align-items:end!important}
  body.solcat-mobile-chrome .rolebox{min-width:0!important;display:grid!important;gap:4px!important}
  body.solcat-mobile-chrome .rolebox label{font-size:10px!important;letter-spacing:1.4px!important}
  body.solcat-mobile-chrome select.ctl,body.solcat-mobile-chrome input.ctl{max-width:none!important;width:100%!important;min-height:38px!important;padding:7px 10px!important;font-size:14px!important;border-radius:11px!important}
  body.solcat-mobile-chrome .btn{min-height:38px!important;padding:8px 11px!important;font-size:13px!important;border-radius:11px!important;white-space:nowrap!important}
  body.solcat-mobile-chrome .solcatPresenterButton{display:none!important}
  body.solcat-mobile-chrome .nav{grid-column:1/-1!important;flex-wrap:nowrap!important;overflow-x:auto!important;-webkit-overflow-scrolling:touch;padding:2px 0 0!important;gap:6px!important;scrollbar-width:none!important}
  body.solcat-mobile-chrome .nav::-webkit-scrollbar{display:none!important}
  body.solcat-mobile-chrome .nav button{flex:0 0 auto!important;min-height:36px!important;padding:8px 12px!important;font-size:13px!important;border-radius:12px!important}
  body.solcat-mobile-chrome .navlabel,body.solcat-mobile-chrome .navsep{display:none!important}
  body.solcat-mobile-chrome .shell{padding:14px 14px 88px!important}
  body.solcat-mobile-chrome .head{margin-bottom:12px!important}
  body.solcat-mobile-chrome h1{font-size:28px!important;line-height:1.08!important}
  body.solcat-mobile-chrome .lede{font-size:15px!important;line-height:1.45!important}
  body.solcat-mobile-chrome .mobileFilterToggle{width:100%!important;min-height:40px!important;margin:8px 0!important;padding:9px 13px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;border:1px solid rgba(0,174,255,.42)!important;border-radius:12px!important;background:rgba(0,174,255,.09)!important;color:#e8fbff!important;font-size:13px!important;font-weight:850!important}
  body.solcat-mobile-chrome .mobileFilterToggle::after{content:'+';color:#78dcff;font-weight:950;font-size:17px;line-height:1}
  body.solcat-mobile-chrome .mobileFilterToggle[aria-expanded="true"]::after{content:'–'}
  body.solcat-mobile-chrome .solcatFilterPanel{max-height:0!important;overflow:hidden!important;padding-top:0!important;padding-bottom:0!important;margin-top:0!important;margin-bottom:0!important;border-top:0!important;border-bottom:0!important;opacity:.01!important;transition:max-height .18s ease,opacity .18s ease,padding .18s ease!important}
  body.solcat-mobile-chrome .solcatFilterPanel.is-open{max-height:68svh!important;overflow:auto!important;opacity:1!important;padding-top:10px!important;padding-bottom:12px!important;border-top:1px solid rgba(255,255,255,.12)!important;border-bottom:1px solid rgba(255,255,255,.12)!important}
  body.solcat-mobile-chrome .solcatFilterPanel.is-open .row,body.solcat-mobile-chrome .solcatFilterPanel.is-open .grid{gap:8px!important}
}
</style>`;
  const script = `<script id="solcat-mobile-chrome-fix-script">
(function(){
  var mql = window.matchMedia('(max-width:760px)');
  var toggleId = 'solcat-mobile-filter-toggle';
  var scheduled = false;

  function cleanText(element){
    return String((element && (element.innerText || element.textContent)) || '').replace(/\\s+/g,' ').trim();
  }

  function markPresenter(){
    Array.prototype.slice.call(document.querySelectorAll('button')).forEach(function(button){
      if (!/^Presenter$/i.test(cleanText(button))) return;
      button.classList.add('solcatPresenterButton');
      button.setAttribute('title','Presentation mode hides editing chrome for a shared-screen demonstration.');
      button.setAttribute('aria-label','Presentation mode');
    });
  }

  function findFilterPanel(){
    var nodes = Array.prototype.slice.call(document.querySelectorAll('form,section,div'));
    return nodes.filter(function(element){
      if (!element || element.id === toggleId || element.classList.contains('mobileFilterToggle')) return false;
      if (element.closest && element.closest('.top,.topin,.nav')) return false;
      var text = cleanText(element);
      var controlCount = element.querySelectorAll ? element.querySelectorAll('input,select').length : 0;
      return controlCount >= 4 && /SEARCH/i.test(text) && /PRACTICE/i.test(text) && /INDUSTRY/i.test(text) && /STATUS/i.test(text) && /(Copy view|Clear)/i.test(text);
    }).sort(function(a,b){
      var controlDifference = a.querySelectorAll('input,select').length - b.querySelectorAll('input,select').length;
      if (controlDifference) return controlDifference;
      return cleanText(a).length - cleanText(b).length;
    })[0] || null;
  }

  function removeDuplicateToggles(){
    var toggles = Array.prototype.slice.call(document.querySelectorAll('.mobileFilterToggle,#' + toggleId));
    var keeper = document.getElementById(toggleId) || toggles[0] || null;
    toggles.forEach(function(toggle){ if (toggle !== keeper) toggle.remove(); });
    return keeper;
  }

  function ensureToggle(panel){
    if (!panel || !panel.parentNode) return;
    Array.prototype.slice.call(document.querySelectorAll('.solcatFilterPanel')).forEach(function(other){
      if (other !== panel) {
        other.classList.remove('solcatFilterPanel','is-open');
      }
    });
    panel.classList.add('solcatFilterPanel');

    var toggle = removeDuplicateToggles();
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.id = toggleId;
      toggle.className = 'mobileFilterToggle';
      toggle.setAttribute('aria-expanded','false');
      toggle.textContent = 'Filters';
    }

    if (toggle.parentNode !== panel.parentNode || toggle.nextSibling !== panel) {
      panel.parentNode.insertBefore(toggle, panel);
    }

    if (toggle.dataset.solcatBound !== 'true') {
      toggle.dataset.solcatBound = 'true';
      toggle.addEventListener('click', function(){
        var currentPanel = document.querySelector('.solcatFilterPanel');
        if (!currentPanel) return;
        var open = !currentPanel.classList.contains('is-open');
        currentPanel.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.textContent = open ? 'Hide filters' : 'Filters';
      });
    }
  }

  function mount(){
    scheduled = false;
    if (!document.body) return;
    document.body.classList.add('solcat-mobile-chrome');
    markPresenter();
    if (!mql.matches) return;
    var panel = findFilterPanel();
    if (panel) ensureToggle(panel);
  }

  function schedule(){
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(mount);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once:true }); else schedule();
  new MutationObserver(function(mutations){
    var relevant = mutations.some(function(mutation){ return mutation.addedNodes && mutation.addedNodes.length; });
    if (relevant) schedule();
  }).observe(document.documentElement, { childList:true, subtree:true });
  if (mql.addEventListener) mql.addEventListener('change', schedule); else if (mql.addListener) mql.addListener(schedule);
})();
</script>`;
  let output = String(html);
  const injection = style + canonicalTerminologyScript() + script;
  return output.includes('</head>') ? output.replace('</head>', `${injection}</head>`) : `${injection}${output}`;
}

function canonicalizeTaxonomy(html, basename) {
  if (basename === SOLCAT_FILE) return solcatMobileEnhancement(html);

  const protectedResult = protectSourceTerms(html);
  let output = protectedResult.output
    .replace(/id:'lens-advisory'/g, "id:'capability-consulting'")
    .replace(/id:'lens-bespoke'/g, "id:'capability-project'")
    .replace(/key:'advisory'/g, "key:'consulting'")
    .replace(/key:'bespoke'/g, "key:'project'")
    .replace(/name:'Advisory'/g, "name:'Consulting'")
    .replace(/name:'Bespoke'/g, "name:'Project'")
    .replace(/letter:'B'/g, "letter:'P'")
    .replace(/lens-advisory/g, 'capability-consulting')
    .replace(/lens-bespoke/g, 'capability-project')
    .replace(/Advisory creates/g, 'Consulting creates')
    .replace(/Bespoke creates/g, 'Project creates')
    .replace(/Bespoke without/g, 'Project without')
    .replace(/bespoke without/g, 'project without')
    .replace(/No bespoke/g, 'No project')
    .replace(/no bespoke/g, 'no project')
    .replace(/Bespoke solution/g, 'Project solution')
    .replace(/Bespoke offer/g, 'Project offer')
    .replace(/bespoke delivery/g, 'project delivery')
    .replace(/bespoke-no-managed-destination/g, 'project-no-managed-destination');

  output = restoreSourceTerms(output, protectedResult.protectedTerms);

  const sourceScript = '<script src="/nav/data.js?v=20260811-7"></script>';
  const contract = `<script>window.DATA3_PORTFOLIO_SOURCE='uploaded-source-0.1';window.DATA3_COMMERCIAL_MOTIONS=['Consulting','Packaged','Project','Managed'];</script>`;
  const migration = `<script>(function(){try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i),v=localStorage.getItem(k);if(typeof v==='string'&&(/lens-advisory|lens-bespoke|capability-advisory|capability-bespoke/i.test(v))){localStorage.setItem(k,v.replace(/lens-advisory/g,'capability-consulting').replace(/lens-bespoke/g,'capability-project').replace(/capability-advisory/g,'capability-consulting').replace(/capability-bespoke/g,'capability-project'));}}}catch(e){}})();</script>`;
  output = output.includes('</head>') ? output.replace('</head>', `${sourceScript}${contract}${canonicalTerminologyScript()}${migration}</head>`) : `${sourceScript}${contract}${canonicalTerminologyScript()}${migration}${output}`;
  return output;
}

express.response.sendFile = function patchedSendFile(filePath, options, callback) {
  let cb = callback;
  let opts = options;
  if (typeof options === 'function') { cb = options; opts = undefined; }
  const basename = path.basename(filePath);
  if (!TARGETS.has(basename)) return originalSendFile.call(this, filePath, opts, cb);
  try {
    const html = fs.readFileSync(filePath, 'utf8');
    this.type('html').send(canonicalizeTaxonomy(html, basename));
    if (typeof cb === 'function') cb();
    return this;
  } catch (error) {
    if (typeof cb === 'function') { cb(error); return this; }
    return originalSendFile.call(this, filePath, opts);
  }
};
