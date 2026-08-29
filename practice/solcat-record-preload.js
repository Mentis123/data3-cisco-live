'use strict';

const express = require('express');

const previousSend = express.response.send;
const STYLE_ID = 'solcat-mobile-record-header-style';
const SCRIPT_ID = 'solcat-mobile-record-header-script';

function shouldEnhance(response, body) {
  if (!response || !response.req || typeof body !== 'string') return false;
  const requestPath = String(response.req.path || response.req.originalUrl || '');
  return requestPath.startsWith('/solcat') && body.includes('</head>') && !body.includes(STYLE_ID);
}

function enhancementMarkup() {
  return `<style id="${STYLE_ID}">
#solcat-mobile-record-header{display:none}
@media(max-width:760px){
  body.solcat-mobile-record-open{
    padding-top:calc(68px + env(safe-area-inset-top))!important;
    scroll-padding-top:calc(78px + env(safe-area-inset-top))!important;
  }
  body.solcat-mobile-record-open .top{display:none!important}
  body.solcat-mobile-record-open #solcat-mobile-record-header{
    position:fixed!important;
    inset:0 0 auto 0!important;
    z-index:2147483000!important;
    min-height:68px!important;
    padding:max(9px,env(safe-area-inset-top)) 12px 9px!important;
    display:grid!important;
    grid-template-columns:minmax(0,1fr) auto!important;
    gap:10px!important;
    align-items:center!important;
    background:rgba(0,0,37,.985)!important;
    border-bottom:1px solid rgba(0,174,255,.5)!important;
    box-shadow:0 12px 30px rgba(0,0,0,.34)!important;
    backdrop-filter:blur(18px)!important;
  }
  #solcat-mobile-record-header .solcatRecordHeaderCopy{min-width:0!important;display:grid!important;gap:2px!important}
  #solcat-mobile-record-header .solcatRecordHeaderType{color:#78dcff!important;font-size:10px!important;font-weight:900!important;letter-spacing:.14em!important;text-transform:uppercase!important}
  #solcat-mobile-record-header .solcatRecordHeaderTitle{min-width:0!important;color:#fff!important;font-size:17px!important;font-weight:900!important;line-height:1.12!important;letter-spacing:-.02em!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important}
  #solcat-mobile-record-header .solcatRecordHeaderClose{min-width:74px!important;height:44px!important;padding:0 12px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;border:1px solid rgba(120,220,255,.42)!important;border-radius:14px!important;background:rgba(0,174,255,.09)!important;color:#eaffff!important;font-size:13px!important;font-weight:900!important;line-height:1!important}
  #solcat-mobile-record-header .solcatRecordHeaderClose span{color:#00ffff!important;font-size:24px!important;font-weight:400!important;line-height:1!important}
  #solcat-mobile-record-header .solcatRecordHeaderClose:focus-visible{outline:3px solid rgba(0,255,255,.35)!important;outline-offset:2px!important}
}
</style>
<script id="${SCRIPT_ID}">
(function(){
  var media = window.matchMedia('(max-width:760px)');
  var headerId = 'solcat-mobile-record-header';
  var currentRecord = null;
  var currentClose = null;
  var scheduled = false;

  function textOf(element){
    return String((element && (element.innerText || element.textContent)) || '').replace(/\\s+/g,' ').trim();
  }

  function visible(element){
    if (!element || !element.isConnected) return false;
    var style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
    var rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && element.getClientRects().length > 0;
  }

  function smallestExactText(expression){
    return Array.prototype.slice.call(document.querySelectorAll('body *')).filter(function(element){
      if (!visible(element)) return false;
      var text = textOf(element);
      return expression.test(text) && (!element.children.length || Array.prototype.every.call(element.children,function(child){ return !expression.test(textOf(child)); }));
    }).sort(function(a,b){ return textOf(a).length - textOf(b).length; })[0] || null;
  }

  function findClose(container){
    if (!container) return null;
    var controls = Array.prototype.slice.call(container.querySelectorAll('button,[role="button"],a'));
    return controls.find(function(control){
      if (!visible(control)) return false;
      var label = [control.getAttribute('aria-label'),control.getAttribute('title'),textOf(control)].filter(Boolean).join(' ');
      return /(^|\\s)(close|dismiss)(\\s|$)/i.test(label) || /^[×✕✖x]$/i.test(textOf(control));
    }) || null;
  }

  function findRecordContainer(marker){
    if (!marker) return null;
    var direct = marker.closest('[role="dialog"],dialog,.drawer,.modal,.sheet,.overlay,[class*="drawer"],[class*="modal"],[class*="detail"]');
    if (direct && visible(direct)) return direct;
    var node = marker;
    var fallback = marker.parentElement;
    for (var depth = 0; node && node.parentElement && depth < 9; depth += 1) {
      node = node.parentElement;
      if (!visible(node)) continue;
      var rect = node.getBoundingClientRect();
      var hasHeading = !!node.querySelector('h1,h2,h3,[role="heading"]');
      var close = findClose(node);
      if (hasHeading && close && (rect.height >= 280 || textOf(node).length > 500)) return node;
      if (hasHeading && rect.height >= 360) fallback = node;
    }
    return fallback;
  }

  function findTitle(container, marker){
    if (!container) return null;
    var headings = Array.prototype.slice.call(container.querySelectorAll('h1,h2,h3,[role="heading"]')).filter(visible);
    var blocked = /^(solution record|offering record|recommended next action|customer problem|customer outcome|what this is|why it surfaced|trust and ownership)$/i;
    var title = headings.find(function(heading){
      var value = textOf(heading);
      return value && value.length <= 160 && !blocked.test(value);
    });
    if (title) return title;
    var markerParent = marker && marker.parentElement;
    var candidates = markerParent ? Array.prototype.slice.call(markerParent.parentElement ? markerParent.parentElement.children : []) : [];
    return candidates.find(function(element){
      var value = textOf(element);
      return visible(element) && value && value.length > 2 && value.length <= 160 && !blocked.test(value);
    }) || null;
  }

  function ensureHeader(){
    var header = document.getElementById(headerId);
    if (header) return header;
    header = document.createElement('div');
    header.id = headerId;
    header.setAttribute('role','region');
    header.setAttribute('aria-label','Open offering');
    header.innerHTML = '<div class="solcatRecordHeaderCopy"><span class="solcatRecordHeaderType">Offering</span><strong class="solcatRecordHeaderTitle">Offering details</strong></div><button class="solcatRecordHeaderClose" type="button" aria-label="Close offering">Close <span aria-hidden="true">×</span></button>';
    header.querySelector('.solcatRecordHeaderClose').addEventListener('click',function(){
      var target = currentClose && currentClose.isConnected ? currentClose : (currentRecord ? findClose(currentRecord) : null);
      if (target) {
        target.click();
      } else {
        document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true}));
      }
      window.setTimeout(schedule,0);
    });
    document.body.appendChild(header);
    return header;
  }

  function clearRecord(){
    currentRecord = null;
    currentClose = null;
    document.body.classList.remove('solcat-mobile-record-open');
    var header = document.getElementById(headerId);
    if (header) header.removeAttribute('data-record-title');
  }

  function mount(){
    scheduled = false;
    if (!document.body) return;
    var marker = smallestExactText(/^(solution|offering) record$/i) || smallestExactText(/^(solution|offering) record\b/i);
    var record = marker ? findRecordContainer(marker) : null;
    var close = record ? findClose(record) : null;
    var titleElement = record ? findTitle(record,marker) : null;
    var title = textOf(titleElement);

    if (!media.matches || !record || !visible(record) || !title) {
      clearRecord();
      return;
    }

    var header = ensureHeader();
    currentRecord = record;
    currentClose = close;
    document.body.classList.add('solcat-mobile-record-open');
    var titleNode = header.querySelector('.solcatRecordHeaderTitle');
    if (titleNode.textContent !== title) titleNode.textContent = title;
    header.setAttribute('data-record-title',title);
  }

  function schedule(){
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(mount);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',schedule,{once:true}); else schedule();
  new MutationObserver(function(mutations){
    if (mutations.some(function(mutation){ return mutation.addedNodes.length || mutation.removedNodes.length || mutation.type === 'characterData'; })) schedule();
  }).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  document.addEventListener('click',function(){ window.setTimeout(schedule,0); },true);
  document.addEventListener('keydown',function(event){ if (event.key === 'Escape') window.setTimeout(schedule,0); },true);
  if (media.addEventListener) media.addEventListener('change',schedule); else if (media.addListener) media.addListener(schedule);
})();
</script>`;
}

express.response.send = function patchedSend(body) {
  let output = body;
  if (shouldEnhance(this, body)) {
    output = body.replace('</head>', `${enhancementMarkup()}</head>`);
  }
  return previousSend.call(this, output);
};
