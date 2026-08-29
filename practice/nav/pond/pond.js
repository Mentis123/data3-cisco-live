(() => {
  'use strict';
  const model = window.DATA3_PORTFOLIO;
  const level = model?.levels || { portfolio:{colour:'#11B8F5'}, practice:{colour:'#7F5CE4'}, capability:{colour:'#A20F9F'}, offering:{colour:'#D51BD3'} };
  const tray = document.getElementById('stoneTray');
  const pond = document.getElementById('pond');
  const canvas = document.getElementById('waterCanvas');
  const ctx = canvas?.getContext('2d');
  const svg = document.getElementById('linkLayer');
  const nodeLayer = document.getElementById('nodeLayer');
  const rippleLayer = document.getElementById('rippleLayer');
  const centreStone = document.getElementById('centreStone');
  if (!model || !tray || !pond || !nodeLayer || !centreStone) return;
  let activePractice = null, expandedCapId = '', positioned = [], selectedNodeId = '', raf = 0, phase = 0;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const PRACTICE_COLOURS = ['#00AEFF','#9B9BFF','#FF6B7D','#DAFF00','#00FF88','#FFB74A','#FF00FF','#00FFFF','#78DCFF'];
  const practiceColour = practice => PRACTICE_COLOURS[Math.max(0, model.practices.indexOf(practice)) % PRACTICE_COLOURS.length];

  function renderTray(){
    tray.innerHTML = model.practices.map(p=>`<button class="stoneChip${activePractice?.id===p.id?' active':''}" draggable="true" data-practice-id="${p.id}" style="--stone:${practiceColour(p)}"><i></i><b>${esc(p.name)}</b><small>${p.capabilities.length} capabilities</small></button>`).join('');
    tray.querySelectorAll('.stoneChip').forEach(button=>{
      const practice=model.practices.find(p=>p.id===button.dataset.practiceId);
      button.addEventListener('click',()=>autoDrop(practice,button));
      button.addEventListener('dragstart',event=>{ event.dataTransfer.setData('text/plain',practice.id); button.classList.add('dragging'); });
      button.addEventListener('dragend',()=>button.classList.remove('dragging'));
    });
  }

  function dropPractice(practice, point){
    activePractice = practice; expandedCapId = ''; selectedNodeId = '';
    renderTray();
    centreStone.classList.remove('is-empty');
    centreStone.style.setProperty('--stone', practiceColour(practice));
    centreStone.innerHTML = `<span class="stoneType">Practice</span><b>${esc(practice.name)}</b><small>${esc(practice.meta || '')}</small>`;
    document.getElementById('pondStatus').textContent = practice.name;
    document.getElementById('pondHint').textContent = `${practice.capabilities.length} capabilities · tap one to reveal its offerings`;
    renderGraph(); ripple(point); showOverview();
  }

  function autoDrop(practice, button){
    const from = button.getBoundingClientRect();
    const to = centreStone.getBoundingClientRect();
    animateDrop({x:from.left+from.width/2,y:from.top+from.height/2},{x:to.left+to.width/2,y:to.top+to.height/2},()=>dropPractice(practice,{x:to.left+to.width/2,y:to.top+to.height/2}),practice.name,practiceColour(practice));
  }

  function animateDrop(from,to,done,label,colour){
    const ghost=document.createElement('div');
    ghost.className='stoneDropGhost';
    ghost.style.left=from.x+'px'; ghost.style.top=from.y+'px';
    ghost.style.setProperty('--stone',colour||level.practice.colour);
    ghost.textContent=label.split(/\s+/).map(w=>w[0]).join('').slice(0,4);
    document.body.appendChild(ghost);
    requestAnimationFrame(()=>{ ghost.style.left=to.x+'px'; ghost.style.top=to.y+'px'; ghost.classList.add('falling'); });
    window.setTimeout(()=>{ ghost.remove(); done(); },520);
  }

  pond.addEventListener('dragover',event=>{ event.preventDefault(); pond.classList.add('dragOver'); });
  pond.addEventListener('dragleave',event=>{ if(!pond.contains(event.relatedTarget)) pond.classList.remove('dragOver'); });
  pond.addEventListener('drop',event=>{
    event.preventDefault(); pond.classList.remove('dragOver');
    const id=event.dataTransfer.getData('text/plain');
    const practice=model.practices.find(p=>p.id===id);
    if(!practice) return;
    const to=centreStone.getBoundingClientRect();
    animateDrop({x:event.clientX,y:event.clientY},{x:to.left+to.width/2,y:to.top+to.height/2},()=>dropPractice(practice,{x:event.clientX,y:event.clientY}),practice.name,practiceColour(practice));
  });

  const clamp = (value,min,max)=>Math.min(max,Math.max(min,value));

  function renderGraph(){
    if(!activePractice) return;
    const rect=pond.getBoundingClientRect(), w=rect.width, h=rect.height, cx=w/2, cy=h/2, min=Math.min(w,h);
    const capRadius=Math.min(min*.34,250);
    const caps=activePractice.capabilities;
    const capNodes=caps.map((c,index)=>{
      const angle=-Math.PI/2+Math.PI*2*index/Math.max(1,caps.length);
      return {id:c.id,label:c.name,kind:'capability',colour:level.capability.colour,parentId:'centre',capability:c,angle,
        x:cx+Math.cos(angle)*capRadius,y:cy+Math.sin(angle)*capRadius};
    });
    let offerNodes=[];
    if(expandedCapId){
      const parent=capNodes.find(n=>n.id===expandedCapId);
      if(parent){
        const offers=parent.capability.offerings;
        const n=offers.length;
        /* Offerings fan on an ellipse that uses the pond's full width, with a
           minimum angular step derived from node size so neighbours never collide. */
        const Rx=Math.max(capRadius+130, w/2-120);
        const Ry=Math.max(capRadius+64, h/2-58);
        const minStep=2*Math.asin(Math.min(.9, 172/(2*Math.min(Rx,Ry))));
        const step=n>1?Math.min((Math.PI*2)/n, Math.max(.5,minStep)):0;
        offerNodes=offers.map((o,index)=>{
          const angle=parent.angle+(index-(n-1)/2)*step;
          return {id:parent.id+'--'+o.id,label:o.name,short:o.vendor,kind:'offering',colour:level.offering.colour,parentId:parent.id,capability:parent.capability,offering:o,
            x:clamp(cx+Math.cos(angle)*Rx,90,w-90),y:clamp(cy+Math.sin(angle)*Ry,42,h-42)};
        });
      }
    }
    positioned=[...capNodes,...offerNodes];
    nodeLayer.innerHTML='';
    svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
    const map=new Map(positioned.map(n=>[n.id,n]));
    map.set('centre',{x:cx,y:cy,id:'centre'});
    svg.innerHTML=[...capNodes.map(c=>({from:'centre',to:c.id})),...offerNodes.map(n=>({from:n.parentId,to:n.id}))].map(link=>{
      const a=map.get(link.from),b=map.get(link.to);
      if(!a||!b)return'';
      const qx=(a.x+b.x)/2+(b.y-a.y)*.04, qy=(a.y+b.y)/2-(b.x-a.x)*.04;
      return `<path class="mapLink" data-from="${link.from}" data-to="${link.to}" d="M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${qx.toFixed(1)} ${qy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}"></path>`;
    }).join('');
    positioned.forEach((node,index)=>{
      const b=document.createElement('button');
      b.type='button';
      b.className='mapNode';
      b.dataset.nodeId=node.id;
      b.dataset.kind=node.kind;
      b.style.left=node.x+'px';
      b.style.top=node.y+'px';
      b.style.setProperty('--node',node.colour);
      b.style.transitionDelay=Math.min(index*16,220)+'ms';
      if(node.kind==='capability'){
        const count=node.capability.offerings.length;
        const open=node.id===expandedCapId;
        b.classList.toggle('is-open',open);
        if(expandedCapId&&!open)b.classList.add('minor');
        b.innerHTML=`<b>${esc(node.label)}</b><small>${count} offering${count===1?'':'s'} ${open?'−':'+'}</small>`;
      } else {
        b.innerHTML=`<b>${esc(node.label)}</b><small>${esc(node.short||'Data#3')}</small>`;
      }
      b.addEventListener('click',()=>selectNode(node.id));
      nodeLayer.appendChild(b);
      requestAnimationFrame(()=>b.classList.add('enter'));
    });
    highlight();
  }

  function descendants(id){ const ids=new Set([id]); let changed=true; while(changed){ changed=false; positioned.forEach(n=>{ if(ids.has(n.parentId)&&!ids.has(n.id)){ids.add(n.id); changed=true;} }); } return ids; }
  function ancestors(id){ const ids=new Set(['centre']); let current=positioned.find(n=>n.id===id); while(current){ ids.add(current.id); if(current.parentId==='centre') break; current=positioned.find(n=>n.id===current.parentId); } return ids; }

  function highlight(){
    const active=selectedNodeId?new Set([...ancestors(selectedNodeId),...descendants(selectedNodeId)]):null;
    nodeLayer.querySelectorAll('.mapNode').forEach(button=>{
      const visible=!active||active.has(button.dataset.nodeId);
      button.classList.toggle('selected',button.dataset.nodeId===selectedNodeId);
      button.classList.toggle('highlighted',Boolean(active&&visible));
      button.classList.toggle('dimmed',Boolean(active&&!visible));
    });
    svg.querySelectorAll('.mapLink').forEach(path=>{
      const visible=!active||(active.has(path.dataset.from)&&active.has(path.dataset.to));
      path.classList.toggle('highlighted',Boolean(active&&visible));
      path.classList.toggle('dimmed',Boolean(active&&!visible));
    });
  }

  function crumbs(node){ const chain=[]; let cur=node; while(cur){ chain.unshift(cur.label); if(cur.parentId==='centre') break; cur=positioned.find(n=>n.id===cur.parentId); } return ['Portfolio',activePractice.name,...chain]; }
  function renderCrumbs(items){ document.getElementById('pathCrumbs').innerHTML=items.map(item=>`<span>${esc(item)}</span>`).join(''); }

  function renderConnected(nodes,emptyText){
    const list=document.getElementById('connectedList');
    list.innerHTML=nodes.slice(0,12).map(n=>`<button type="button" data-connected="${n.id}" style="--offer:${level.offering.colour}">${esc(n.label)}<span>›</span></button>`).join('')||`<span class="emptyConnected">${emptyText||'No mapped offering yet.'}</span>`;
    list.querySelectorAll('[data-connected]').forEach(b=>b.addEventListener('click',()=>selectNode(b.dataset.connected)));
  }

  function showOverview(){
    document.getElementById('panelKicker').textContent='Practice';
    document.getElementById('panelTitle').textContent=activePractice.name;
    document.getElementById('panelLead').textContent=activePractice.meta||'';
    renderCrumbs(['Portfolio',activePractice.name]);
    document.getElementById('insightHeading').textContent='Capabilities';
    document.getElementById('insightBody').textContent=activePractice.capabilities.map(c=>c.name).join(' · ');
    renderConnected(positioned.filter(n=>n.kind==='offering'),'Open a capability on the map to list its offerings here.');
    document.getElementById('offerDetail').hidden=true;
    document.getElementById('connectedSection').hidden=false;
  }

  function showCapability(node){
    const linked=positioned.filter(n=>n.kind==='offering'&&n.parentId===node.id);
    document.getElementById('panelKicker').textContent='Capability';
    document.getElementById('panelTitle').textContent=node.label;
    document.getElementById('panelLead').textContent=`${linked.length} mapped offering${linked.length===1?'':'s'}`;
    renderCrumbs(crumbs(node));
    document.getElementById('insightHeading').textContent='Offering set';
    document.getElementById('insightBody').textContent=node.capability.description;
    renderConnected(linked);
    document.getElementById('offerDetail').hidden=true;
    document.getElementById('connectedSection').hidden=false;
  }

  function showOffer(node){
    document.getElementById('panelKicker').textContent='Offering';
    document.getElementById('panelTitle').textContent=node.label;
    document.getElementById('panelLead').textContent='';
    renderCrumbs(crumbs(node));
    document.getElementById('connectedSection').hidden=true;
    const offerDetail=document.getElementById('offerDetail');
    offerDetail.hidden=false;
    document.getElementById('offerMeta').textContent=[node.offering.vendor||'Data#3','Offering'].filter(Boolean).join(' · ');
    document.getElementById('offerTldr').textContent=`${node.capability.name} in ${activePractice.name}.`;
    document.getElementById('offerTags').innerHTML=`<span>${esc(activePractice.name)}</span><span>${esc(node.capability.name)}</span>${node.offering.vendor?`<span>${esc(node.offering.vendor)}</span>`:''}`;
    document.getElementById('offerWhy').textContent=node.capability.name;
    document.getElementById('offerNext').textContent='Salesforce extract + portfolio workbook';
  }

  function selectNode(id){
    const node=positioned.find(n=>n.id===id);
    if(!node) return;
    if(node.kind==='capability'){
      if(expandedCapId===node.id){
        expandedCapId=''; selectedNodeId='';
        renderGraph(); showOverview();
      } else {
        expandedCapId=node.id; selectedNodeId=node.id;
        renderGraph(); showCapability(positioned.find(n=>n.id===id));
      }
      return;
    }
    selectedNodeId=selectedNodeId===id?'':id;
    highlight();
    if(!selectedNodeId){ const parent=positioned.find(n=>n.id===node.parentId); parent?showCapability(parent):showOverview(); return; }
    showOffer(node);
  }

  function ripple(point){
    const r=document.createElement('span');
    r.className='rippleBurst';
    const pr=pond.getBoundingClientRect();
    r.style.left=((point?.x||pr.left+pr.width/2)-pr.left)+'px';
    r.style.top=((point?.y||pr.top+pr.height/2)-pr.top)+'px';
    rippleLayer.appendChild(r);
    window.setTimeout(()=>r.remove(),900);
  }

  function paintWater(){
    if(!ctx) return;
    const rect=pond.getBoundingClientRect();
    const ratio=window.devicePixelRatio||1;
    if(canvas.width!==Math.floor(rect.width*ratio)||canvas.height!==Math.floor(rect.height*ratio)){canvas.width=Math.floor(rect.width*ratio);canvas.height=Math.floor(rect.height*ratio);}
    ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.clearRect(0,0,rect.width,rect.height);
    phase+=.012;
    for(let i=0;i<8;i++){
      const y=rect.height*(.18+i*.095)+Math.sin(phase*2+i)*6;
      ctx.beginPath();
      ctx.strokeStyle=`rgba(17,184,245,${.035+i*.004})`;
      ctx.lineWidth=1;
      for(let x=0;x<=rect.width;x+=18){ const yy=y+Math.sin(x*.016+phase*3+i)*8; if(x===0)ctx.moveTo(x,yy);else ctx.lineTo(x,yy);}
      ctx.stroke();
    }
    raf=requestAnimationFrame(paintWater);
  }

  document.getElementById('replayRipple')?.addEventListener('click',()=>ripple());
  document.getElementById('resetPond')?.addEventListener('click',()=>{
    activePractice=null;expandedCapId='';selectedNodeId='';positioned=[];
    nodeLayer.innerHTML='';svg.innerHTML='';
    centreStone.classList.add('is-empty');
    centreStone.innerHTML='<span class="stoneType">Practice</span><b>Choose above</b><small></small>';
    document.getElementById('pondStatus').textContent='Ready';
    document.getElementById('pondHint').textContent='Pick a Practice.';
    renderTray();
  });
  window.addEventListener('resize',()=>activePractice&&renderGraph());

  renderTray();
  raf=requestAnimationFrame(paintWater);
  window.addEventListener('pagehide',()=>cancelAnimationFrame(raf));
})();
