import {agentTree,visibleTree,treeTotals} from './tree.js';
import {getTasks,getMetrics,getProofs,timeText} from './model.js';
const paths={
 grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 tasks:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
 agents:'<rect x="5" y="7" width="14" height="12" rx="3"/><path d="M12 3v4M3 11H1m22 0h-2M9 15h6"/><circle cx="9" cy="11" r=".7"/><circle cx="15" cy="11" r=".7"/>',
 network:'<circle cx="12" cy="4" r="2.5"/><circle cx="4" cy="18" r="2.5"/><circle cx="20" cy="18" r="2.5"/><path d="m10.7 6.2-5.5 9.5m8.1-9.5 5.5 9.5M6.5 18h11"/><circle cx="12" cy="13" r="2"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9S4 17 4 12V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
 branches:'<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M6 7v10m12-10v2a6 6 0 0 1-6 6H6"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
 chevron:'<path d="m9 5 7 7-7 7"/>',
 external:'<path d="M14 4h6v6m0-6L10 14M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/>',
 code:'<path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18"/>',
 test:'<path d="M9 3h6m-5 0v7L4 19a1.3 1.3 0 0 0 1 2h14a1.3 1.3 0 0 0 1-2l-6-9V3M7 15h10"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
 pause:'<path d="M8 5v14M16 5v14"/>',
 play:'<path d="m7 4 13 8-13 8z"/>',
 reset:'<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',
 activity:'<path d="M2 12h4l3-8 6 16 3-8h4"/>',
 link:'<path d="m10 13 4-4m-5 7-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 0 2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
 terminal:'<path d="m4 6 6 6-6 6m10 0h6"/>',
 git:'<path d="M6 6v12M18 6v2a4 4 0 0 1-4 4h-4"/><circle cx="6" cy="4" r="2"/><circle cx="6" cy="20" r="2"/><circle cx="18" cy="4" r="2"/>',
 alert:'<path d="m12 3 10 18H2zM12 9v5m0 3v.1"/>',
 spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>'
};
const icon=(name)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.tasks}</svg>`;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s);
// Updates el in place to match markup, reusing unchanged nodes so focus, scroll, selection and animations survive each tick.
// Children carrying data-key are matched by key, the others by position.
function patch(el,markup){const tpl=document.createElement('template');tpl.innerHTML=markup;morphChildren(el,tpl.content);}
const keyOf=n=>n.nodeType===1?n.getAttribute('data-key'):null;
function morph(from,to){
 if(from.nodeType!==1){if(from.nodeValue!==to.nodeValue)from.nodeValue=to.nodeValue;return;}
 for(const a of [...from.attributes])if(!to.hasAttribute(a.name))from.removeAttribute(a.name);
 for(const a of to.attributes)if(from.getAttribute(a.name)!==a.value)from.setAttribute(a.name,a.value);
 morphChildren(from,to);
}
function morphChildren(from,to){
 const keyed=new Map();for(const c of from.children){const k=keyOf(c);if(k)keyed.set(k,c);}
 let cur=from.firstChild;
 for(const next of [...to.childNodes]){
  const k=keyOf(next),match=k?keyed.get(k):cur&&!keyOf(cur)?cur:null;keyed.delete(k);
  if(!match||match.nodeName!==next.nodeName){from.insertBefore(next,cur);continue;}
  if(match===cur)cur=cur.nextSibling;else from.insertBefore(match,cur);
  morph(match,next);
 }
 while(cur){const n=cur.nextSibling;from.removeChild(cur);cur=n;}
}
const state={elapsed:0,selected:142,tab:'live',nav:'supervision',filter:'all',search:'',paused:false,speed:1,drawer:null};
let tasks=getTasks(0),lastTick=performance.now();
const treeState={collapsed:new Set(),seen:new Set(),zoom:1};
const duration=n=>n<60?`${n} s`:`${Math.floor(n/60)} min ${n%60} s`;

const navItems=[['supervision','grid','Supervision'],['tasks','tasks','Tâches'],['agents','agents','Agents'],['decisions','network','Décisions'],['history','clock','Historique']];
const statusColor=s=>s==='Actif'?'indigo':s==='Terminé'?'green':s==='En attente'?'amber':'red';
const badge=(label,tone)=>`<span class="badge ${tone}">${escape(label)}</span>`;
function selected(){return tasks.find(t=>t.id===state.selected);}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),2200);}
function renderIcons(){document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));}
function renderNav(){
 patch($('#nav'),navItems.map(([id,ic,label])=>`<button class="nav-button ${state.nav===id?'active':''}" data-nav="${id}" aria-label="${label}" ${state.nav===id?'aria-current="page"':''} title="${label}"><span class="nav-icon">${icon(ic)}</span><span>${label}</span>${id==='tasks'?'<span class="nav-count">6</span>':''}</button>`).join(''));
 $('#crumb').textContent=navItems.find(x=>x[0]===state.nav)[2];
 const titles={supervision:['Les agents, en mouvement.','Suivez les délégations et le travail en parallèle, branche par branche.'],tasks:['Toutes les tâches','Six branches indépendantes. Des étapes qui avancent en parallèle.'],agents:['L’équipe en mouvement','Chaque agent, sa mission et ses dépendances, en un regard.'],decisions:['Décisions de l’orchestrateur','Les faits observés, les règles appliquées et les actions déclenchées.'],history:['Historique des événements','La trace des actions et résultats, rattachée à chaque exécution.']};
 $('#page-title').textContent=titles[state.nav][0];$('#page-description').textContent=titles[state.nav][1];
 $('#section-title').textContent=state.nav==='supervision'||state.nav==='tasks'?'Vos tâches':state.nav==='agents'?'Agents de toutes les tâches':state.nav==='decisions'?'Journal des décisions':'Trace d’exécution';
}
function renderMetrics(){
 const m=getMetrics(tasks);
 patch($('#metrics'),[['Tâches en cours',m.running,`${tasks.length} branches suivies`,'tasks',''],['Agents actifs',m.active,'travaillent en parallèle','agents','green'],['Dépendances en attente',m.waiting,'reprises automatiquement','branches',''],['Tâches intégrées',m.integrated,m.stopped?`${m.stopped} arrêt documenté`:'contrôles validés','check','green']].map(([label,n,sub,ic,color])=>`<div class="metric"><div class="metric-top"><span>${label}</span><span class="metric-icon">${icon(ic)}</span></div><div class="metric-bottom"><span class="metric-number">${n.toString().padStart(2,'0')}</span><small class="${color}">${sub}</small></div></div>`).join(''));
 $('#section-count').textContent=`${tasks.length} tâches · ${m.active} agents actifs`;
 $('#clock').textContent=timeText(state.elapsed);
 $('#live-label').textContent=state.paused?'En pause':'En direct';
 $('#live-label').parentElement.classList.toggle('amber',state.paused);
}
function renderTaskList(){
 const list=tasks.filter(t=>(state.filter==='all'||(state.filter==='active'?!t.terminal:t.terminal))&&`${escape(t.title)} ${escape(t.repo)} ${escape(t.branch)}`.toLowerCase().includes(state.search.toLowerCase()));
 patch($('#task-list'),list.map(t=>`<button class="task-card ${t.id===state.selected?'selected':''}" data-key="${t.id}" data-task="${t.id}" aria-pressed="${t.id===state.selected}"><div class="task-card-top"><h3>${escape(t.title)}</h3>${t.id===state.selected?icon('chevron'):''}</div><div class="repo">${escape(t.repo)} <span class="quiet">· #${t.id}</span></div><div class="branch">${icon('branches')}<code>${escape(t.branch)}</code></div><div class="badges">${t.badges.map(b=>badge(...b)).join('')}</div><div class="task-card-footer"><span class="mini-agents"><span class="mini-agent">D</span><span class="mini-agent">S</span><span class="mini-agent">T</span></span>${t.terminal?(t.stage===5?'Intégration terminée':'Diagnostic conservé'):`${t.active} actifs${t.waiting?' · '+t.waiting+' en attente':''}`}</div></button>`).join('')||'<div class="empty">Aucune tâche ne correspond à ce filtre.</div>');
}
function treeStatus(n){
 const cls=n.state==='Actif'?'active':n.state==='Terminé'?'done':n.state==='Échec'?'failed':n.state==='En attente'?'waiting':'';
 const mark=n.state==='Actif'?'<span class="tiny-spinner"></span>':icon(n.state==='Terminé'?'check':n.state==='Échec'?'alert':'pause');
 return `<span class="tree-status ${cls}">${mark}${escape(n.state==='Actif'?'En cours':n.state)}</span>`;
}
function liveView(t){
 const all=agentTree(t),nodes=visibleTree(all,treeState.collapsed),tot=treeTotals(all);
 const height=Math.max(560,...nodes.map(n=>n.y+180));
 const root=all[0],wires=[];
 for(const n of nodes.filter(n=>n.parent)){
  const parent=nodes.find(p=>p.id===n.parent);if(!parent)continue;
  let path;
  if(n.parent==='root'){
   const px=parent.x+113,py=parent.y+146,nx=n.x+113,ny=n.y;
   path=`M ${px} ${py} V 192 Q ${px} 202 ${px+(nx<px?-10:nx>px?10:0)} 202 H ${nx+(nx<px?10:nx>px?-10:0)} Q ${nx} 202 ${nx} 212 V ${ny}`;
  }else{
   const px=parent.x+16,py=parent.y+146,ny=n.y+24,nx=n.x;
   path=`M ${px} ${py} V ${ny-7} Q ${px} ${ny} ${px+7} ${ny} H ${nx}`;
  }
  wires.push(`<path class="tree-wire ${n.state==='Actif'?'live':''}" data-key="wire-${escape(n.id)}" d="${path}"/>${n.state==='Actif'&&!state.paused?`<path class="wire-pulse" data-key="pulse-${escape(n.id)}" d="${path}"/>`:''}`);
 }
 const ports=nodes.filter(n=>nodes.some(k=>k.parent===n.id)).map(n=>`<circle class="wire-port" data-key="port-${escape(n.id)}" cx="${n.id==='root'?n.x+113:n.x+16}" cy="${n.y+146}" r="3"/>`).join('');
 const cards=nodes.map(n=>{
  const fresh=!treeState.seen.has(n.key);treeState.seen.add(n.key);
  const children=all.filter(k=>k.parent===n.id).length;
  return `<article class="tree-card ${n.id==='root'?'root':''} ${n.state==='Échec'?'failed-node':''} ${fresh?'new-node':''}" style="left:${n.x}px;top:${n.y}px;height:146px" data-key="${escape(n.key)}" data-node-id="${escape(n.id)}" data-tree-node="${escape(n.id)}" data-task-id="${t.id}"><div class="tree-card-header"><span class="tree-role-icon">${icon(n.icon)}</span><div><button class="tree-card-title" data-tree-node="${escape(n.id)}" data-task-id="${t.id}" aria-label="${escape(n.name)}, ${escape(n.state)}, ouvrir les détails">${escape(n.name)}</button><div class="tree-card-model">${escape(n.model)}</div></div>${treeStatus(n)}</div><p class="tree-action"><span class="tool-icons">${n.tools.map(v=>`<span class="tool-chip" title="${escape(v)}">${escape(v[0])}</span>`).join('')}</span>${escape(n.action)}</p><div class="tree-bottom"><span>${duration(n.duration)}</span>${children?`<button class="node-collapse" data-collapse="${escape(n.id)}" aria-label="${treeState.collapsed.has(n.id)?'Déplier':'Replier'} les agents de ${escape(n.name)}" aria-expanded="${!treeState.collapsed.has(n.id)}">${children} ${icon('chevron')}</button>`:''}</div></article>`;
 }).join('');
 return `<div class="tree-toolbar"><div class="tree-label">${icon('spark')}Agents</div><div class="tree-stats"><span>${tot.count} agents</span><span class="running">${tot.active} en cours</span>${tot.failed?`<span class="failed">${tot.failed} échec${tot.failed>1?'s':''}</span>`:''}</div></div><div class="canvas-hint">Faites défiler pour explorer l’arbre. Touchez un agent pour ses détails.</div><div class="canvas-scroll" aria-label="Arbre de délégation des agents"><div class="canvas-sizer" style="width:${920*treeState.zoom}px;height:${height*treeState.zoom}px"><div class="tree-stage" style="height:${height}px;transform:scale(${treeState.zoom})"><svg class="tree-connections" aria-hidden="true">${wires.join('')}${ports}</svg>${cards}</div></div></div><div class="tree-bottom-bar"><div class="tree-legend"><span><i class="dot" style="color:#7ba6c8"></i>Délégation</span><span><i class="dot green"></i>Terminé</span><span><i class="dot red"></i>Échec conservé</span></div><div class="tree-controls"><button data-zoom="out" aria-label="Réduire le zoom">−</button><span>${Math.round(treeState.zoom*100)} %</span><button data-zoom="in" aria-label="Augmenter le zoom">+</button><button data-zoom="fit" aria-label="Ajuster l’arbre à la largeur">Ajuster</button></div></div><div class="tree-decision">${icon('network')}<div><strong>${escape(t.decision)}</strong><div class="tree-mode-note">Exécution #${t.run} · tentative ${t.attempt}/3 · activité simulée</div></div><button class="text-button" data-decision="${t.id}">Voir la décision ${icon('arrow')}</button></div>`;
}
function proofSummary(t,proofs){
 if(t.stage===5)return ['check','Tous les contrôles requis sont validés.'];
 if(t.stage===4)return ['check','Tous les contrôles sont validés sur le même commit. Intégration en cours.'];
 if(t.stage===7)return ['alert','Intégration interdite : test de migration en échec.'];
 if(t.stage===6)return ['alert',`Intégration bloquée : tentative ${t.attempt}/3 en cours après un échec.`];
 if(proofs[1].status==='Échec')return ['alert','Intégration bloquée : test de non-régression en échec.'];
 return ['shield','Validation finale en attente sur le correctif.'];
}
function proofsView(t){const proofs=getProofs(t),[ic,summary]=proofSummary(t,proofs);return `<div class="tab-intro"><h3>Des preuves, rattachées au code.</h3><p>Chaque contrôle identifie le commit vérifié. Toutes les données sont simulées.</p></div><div class="proof-summary">${icon(ic)}<span>${summary}</span></div><div class="proof-list">${proofs.map((p,i)=>`<article class="proof"><div class="proof-top"><h3>${escape(p.title)}</h3>${badge(p.status,p.tone)}</div><p>${escape(p.description)}</p><div class="proof-meta"><span>${p.commit?`Commit <code>${escape(p.commit)}</code>`:'Attend un nouveau commit'}</span><button class="text-button" data-proof="${i}" data-task-id="${t.id}">Consulter la preuve ${icon('arrow')}</button></div></article>`).join('')}</div>`;}
function decisionsView(t){return `<div class="tab-intro"><h3>Décisions et déclencheurs</h3><p>L’orchestrateur réagit aux résultats observés selon les règles du projet.</p></div><div class="proof-list">${t.decisions.slice().reverse().map(e=>`<article class="proof" data-key="${escape(e.key)}"><div class="proof-top"><h3>${timeText(e.at)} · Orchestrateur</h3>${badge('Exécution #'+e.run,'indigo')}</div><p>${escape(e.message)}</p><div class="proof-meta"><span>Politique : qualité stricte · maximum 3 tentatives</span></div></article>`).join('')}</div>`;}
function executionsView(t){return `<div class="tab-intro"><h3>Exécution #${t.run}</h3><p>Environnement isolé · ${escape(t.repo)} · ${escape(t.branch)}</p></div><div class="terminal"><div class="terminal-label"><span class="dot green"></span>SORTIES SIMULÉES · COMMIT ${escape(t.head)}</div>${t.recent.map(e=>escape(`[${timeText(e.at)}] ${e.role.padEnd(14)} ${e.message}`)).join('\n')}\n\n${escape(t.terminal?(t.stage===5?'✓ Pipeline terminé. Intégration réussie.':'✕ Pipeline arrêté. Aucune intégration.'):'● '+(t.agents.filter(a=>a.state==='Actif').map(a=>a.action).join('\n● ')||t.decision))}</div><div class="proof" style="margin-top:16px"><h3>Isolation de l’exécution</h3><p>Branche : ${escape(t.branch)}<br>Commit initial : ${escape(t.base)}<br>Commit courant : ${escape(t.head)}<br>Aucun accès à un dépôt ou à un service externe dans cette démo.</p></div>`;}
function renderDetail(){
 const t=selected();
 const tabNames=[['live','network','Arbre des agents'],['proofs','shield','Preuves'],['decisions','network','Décisions'],['executions','terminal','Exécutions']];
 patch($('#detail'),`<div class="detail-header"><div class="detail-title-row"><div><div class="eyebrow">TÂCHE #${t.id} <span style="margin:0 5px">·</span> ${escape(t.repo.toUpperCase())}</div><h2>${escape(t.title)}</h2></div><button class="outline-button" data-diff="${t.id}">Voir les changements ${icon('external')}</button></div><div class="task-meta"><span class="branch">${icon('branches')}<code>${escape(t.branch)}</code></span><span class="separator"></span><span>PR #${t.id}</span><span class="separator"></span><span>commit <code>${escape(t.head)}</code></span></div><div class="tabs" role="tablist" aria-label="Détail de la tâche">${tabNames.map(([key,ic,label])=>`<button class="tab ${state.tab===key?'active':''}" role="tab" aria-selected="${state.tab===key}" data-tab="${key}">${icon(ic)}${label}</button>`).join('')}</div></div><div class="detail-body" role="tabpanel">${state.tab==='live'?liveView(t):state.tab==='proofs'?proofsView(t):state.tab==='decisions'?decisionsView(t):executionsView(t)}</div><div class="detail-footer"><span>${icon('link')}Chaque preuve est liée à un commit.</span><button class="text-button" data-tab="${state.tab==='proofs'?'live':'proofs'}">${state.tab==='proofs'?'Revenir au direct':'Consulter les preuves'} ${icon('arrow')}</button></div>`);
}
function renderGlobal(){
 const el=$('#global-view');
 if(state.nav==='agents'){patch(el,`<div class="global-agent-grid">${tasks.flatMap(t=>{const nodes=agentTree(t);return nodes.map(n=>`<article class="agent-tile" data-key="${t.id}-${escape(n.id)}" tabindex="0" role="button" data-tree-node="${escape(n.id)}" data-task-id="${t.id}" aria-label="${escape(n.name)} pour ${escape(t.title)}"><div class="agent-tile-top"><span class="agent-icon">${icon(n.icon)}</span><strong>${escape(n.name)}</strong>${treeStatus(n)}</div><p>${escape(n.action)}</p><small>#${t.id} · ${escape(t.title)}</small><div class="branch" style="margin-top:8px">${icon('branches')}<code>${escape(t.branch)}</code></div><small>Lancé par ${escape(n.parent?nodes.find(p=>p.id===n.parent)?.name:'le moteur')}</small></article>`);}).join('')}</div>`);return;}
 const events=tasks.flatMap(t=>state.nav==='decisions'?t.decisions:t.events).sort((a,b)=>b.at-a.at).slice(0,70);
 patch(el,`<div class="global-card"><h2>${state.nav==='decisions'?'Décisions automatiques':'Événements de toutes les tâches'} <span class="counter">${events.length}</span></h2>${events.map(e=>{const t=tasks.find(t=>t.id===e.taskId);return `<button class="history-row" data-key="${escape(e.key)}" data-open-task="${t.id}" data-target-tab="${state.nav==='decisions'?'decisions':'executions'}"><time>${timeText(e.at)}</time><span><strong>${escape(t.title)}</strong><small>${escape(e.role)} · exécution #${e.run}</small></span><span class="history-result">${escape(e.message)}</span></button>`;}).join('')}</div>`);
}
function render(all=false){
 tasks=getTasks(state.elapsed);renderMetrics();
 const isGlobal=['agents','decisions','history'].includes(state.nav);$('#workspace').hidden=isGlobal;$('#global-view').hidden=!isGlobal;
 if(all)renderNav();
 if(isGlobal)renderGlobal();else{renderTaskList();renderDetail();}
 if(state.drawer&&$('#drawer').open)renderDrawer();
}
function showDrawer(type,id,extra){state.drawer={type,id,extra};renderDrawer();if(!$('#drawer').open)$('#drawer').showModal();}
function renderDrawer(){
 const d=state.drawer;if(!d)return;const t=tasks.find(t=>t.id===d.id)||selected();let body='';
 if(d.type==='tree'){
  const nodes=agentTree(t),n=nodes.find(n=>n.id===d.extra);
  $('#drawer-eyebrow').textContent='AGENT · EXÉCUTION #'+t.run;
  if(!n){body='<h2 class="drawer-title">Nouvelle exécution</h2><p class="drawer-subtitle">Cet agent sera lancé lorsque ses conditions de démarrage seront réunies.</p>';}
  else{
   const parent=nodes.find(p=>p.id===n.parent),children=nodes.filter(p=>p.parent===n.id);
   body=`<h2 class="drawer-title">${escape(n.name)}</h2><p class="drawer-subtitle">${escape(t.title)} · ${escape(n.model)}</p>${treeStatus(n)}<div class="drawer-section"><h3>Mission actuelle</h3><p>${escape(n.action)}</p></div><div class="drawer-stat"><span>Lancé par</span><strong>${escape(parent?.name||'Moteur autonome')}</strong></div><div class="drawer-stat"><span>Branche</span><code>${escape(t.branch)}</code></div><div class="drawer-stat"><span>Commit observé</span><code>${escape(n.commit)}</code></div><div class="drawer-stat"><span>Durée simulée</span><strong>${duration(n.duration)}</strong></div><div class="drawer-section"><h3>Agents délégués · ${children.length}</h3>${children.length?children.map(c=>`<div class="drawer-stat"><span>${escape(c.name)}</span>${treeStatus(c)}</div>`).join(''):'<p>Aucune délégation.</p>'}</div><div class="drawer-section"><h3>Trace d’exécution simulée</h3><pre class="terminal">${escape(`[${timeText(state.elapsed-t.local+n.start)}] Agent lancé par ${parent?.name||'le moteur'}\nMission : ${n.action}\nOutils : ${n.tools.join(', ')}\nCommit : ${n.commit}\nÉtat : ${n.state}`)}</pre></div>${n.state==='Échec'?'<div class="tree-note">L’échec est conservé dans l’arbre. L’orchestrateur décide automatiquement de la reprise ou de l’arrêt, dans la limite de trois tentatives.</div>':''}<button class="outline-button" style="margin-top:20px" data-drawer-tab="proofs">Consulter les preuves ${icon('arrow')}</button>`;
  }
 }else if(d.type==='decision'){
  $('#drawer-eyebrow').textContent='ORCHESTRATEUR · DÉCISION AUTOMATIQUE';body=`<h2 class="drawer-title">${escape(t.decision)}</h2><p class="drawer-subtitle">Tâche #${t.id} · ${timeText(t.decisionAt)}</p><div class="drawer-section"><h3>Déclencheur observé</h3><p>${escape(t.reason)}</p></div><div class="drawer-section"><h3>Règles appliquées</h3><div class="drawer-stat"><span>Maximum de tentatives</span><strong>3</strong></div><div class="drawer-stat"><span>Essai actuel</span><strong>${t.attempt}</strong></div><div class="drawer-stat"><span>Validation humaine</span><strong>Aucune</strong></div><div class="drawer-stat"><span>Condition d’intégration</span><strong>Tous les contrôles requis</strong></div></div><div class="drawer-section"><h3>Coordination des agents</h3>${t.agents.map(a=>`<div class="drawer-stat"><span>${escape(a.name)}</span><span class="${statusColor(a.state)}">${escape(a.state)}</span></div>`).join('')}</div><button class="outline-button" data-drawer-tab="decisions">Historique des décisions ${icon('arrow')}</button>`;
 }else if(d.type==='proof'){
  const p=getProofs(t)[d.extra];$('#drawer-eyebrow').textContent='PREUVE SIMULÉE · EXÉCUTION #'+t.run;
  body=`<h2 class="drawer-title">${escape(p.title)}</h2><p class="drawer-subtitle">${escape(t.title)}</p>${badge(p.status,p.tone)}<div class="drawer-section"><h3>Critère vérifié</h3><p>${escape(p.description)}</p></div><div class="drawer-stat"><span>Commit</span><code>${escape(p.commit||'En attente du correctif')}</code></div><div class="drawer-section"><h3>Résultat</h3><p>${escape(p.result)}</p><pre class="terminal">${escape(`$ verify ${p.test}\ncommit: ${p.commit||'pending'}\nstatus: ${p.status}\n\n${p.result}`)}</pre></div><div class="guardrail">${icon('info')}Preuve de démonstration : aucun test n’est réellement exécuté.</div>`;
 }else if(d.type==='diff'){
  $('#drawer-eyebrow').textContent='CHANGEMENTS · '+t.branch;
  const patches={142:['return createSubscription(customerId);','return db.transaction(async (tx) => {','  await tx.lockCustomer(customerId);','  const existing = await tx.findActive(customerId);','  return existing ?? tx.createSubscription(customerId);','});'],143:['return session;','if (session.expiresAt <= Date.now()) {','  await revokeSession(session.id);','  throw new UnauthorizedError();','}','return session;'],144:['while (page < lastPage) {','while (page <= lastPage) {','  await exportPage(page++);','}'],145:['attempts = await readCounter(key) + 1;','attempts = await incrementAtomic(key);','if (attempts > MAX_ATTEMPTS) {','  throw new TooManyRequestsError();','}'],146:['notifications.push(event);','if (!notifications.some(n => n.id === event.id)) {','  notifications.push(event);','}'],147:['return migrate(record);','const compatible = adaptLegacy(record);','return validateAndMigrate(compatible);']};const p=patches[t.id];
  body=`<h2 class="drawer-title">${escape(t.file)}</h2><p class="drawer-subtitle">${t.local<56?'Patch en préparation':'Patch enregistré'} · ${escape(t.head)}</p><div class="drawer-section"><h3>Objectif du changement</h3><p>${escape(t.fix)}.</p></div><div class="diff">  // src/${escape(t.file)}\n<span class="removed">− ${escape(p[0])}</span>${p.slice(1).map(l=>`<span class="added">+ ${escape(l)}</span>`).join('')}</div><div class="drawer-section"><h3>État de validation</h3><p>${t.stage===5?'Correctif vérifié et intégré.':t.stage===7?'Le correctif ne satisfait pas les contrôles. Aucune intégration.':'Vérifications en cours. Le correctif n’est pas encore intégré.'}</p></div><div class="guardrail">${icon('info')}Extrait illustratif de la simulation, sans dépôt connecté.</div><button class="outline-button" style="margin-top:20px" data-drawer-tab="proofs">Voir les preuves ${icon('arrow')}</button>`;
 }else{
  $('#drawer-eyebrow').textContent='BIENVENUE DANS CLAIR';body=`<h2 class="drawer-title">Un atelier d’agents.<br>Entièrement autonome.</h2><p class="drawer-subtitle">Une démonstration interactive de votre future interface de supervision.</p><div class="drawer-section"><h3>Observez le travail avancer</h3><p>Six tâches évoluent sur des branches distinctes. Développeurs, reviewers, agents de sécurité et testeurs travaillent en parallèle, coordonnés par l’orchestrateur.</p></div><div class="drawer-section"><h3>Explorez chaque décision</h3><p>Cliquez sur une tâche, puis sur un agent. Consultez ses actions, les dépendances, les changements de code et les preuves associées au commit.</p></div><div class="drawer-section"><h3>Une simulation, clairement identifiée</h3><p>Les scénarios durent 156 secondes simulées et se rejouent automatiquement. Le scénario de migration illustre trois échecs suivis d’un arrêt documenté. Les boutons de lecture ne contrôlent que la démonstration.</p></div><div class="guardrail">${icon('info')}Aucun agent réel, aucun dépôt connecté, aucune action externe. La simulation fonctionne tant que cette page est ouverte.</div>`;
 }
 patch($('#drawer-content'),body);
}
function selectTask(id,tab='live'){if(Number(id)!==state.selected)treeState.collapsed.clear();state.selected=Number(id);state.tab=tab;if(['agents','decisions','history'].includes(state.nav))state.nav='supervision';render(true);}
document.addEventListener('click',e=>{
 const collapse=e.target.closest('[data-collapse]');
 if(collapse){const id=collapse.dataset.collapse;treeState.collapsed.has(id)?treeState.collapsed.delete(id):treeState.collapsed.add(id);renderDetail();return;}
 const card=e.target.closest('[data-tree-node]');if(card){showDrawer('tree',Number(card.dataset.taskId),card.dataset.treeNode);return;}
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.zoom){const width=$('.canvas-scroll').clientWidth-24;treeState.zoom=b.dataset.zoom==='fit'?Math.max(.3,Math.min(1,width/920)):Math.min(1.25,Math.max(.3,treeState.zoom+(b.dataset.zoom==='in'?.1:-.1)));renderDetail();return;}
 if(b.dataset.nav){state.nav=b.dataset.nav;render(true);}
 if(b.dataset.task)selectTask(b.dataset.task);
 if(b.dataset.tab){state.tab=b.dataset.tab;renderDetail();}
 if(b.dataset.filter){state.filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('selected',x===b));renderTaskList();}
 if(b.dataset.decision)showDrawer('decision',Number(b.dataset.decision));
 if(b.hasAttribute('data-proof'))showDrawer('proof',Number(b.dataset.taskId),Number(b.dataset.proof));
 if(b.dataset.diff)showDrawer('diff',Number(b.dataset.diff));
 if(b.dataset.openTask)selectTask(b.dataset.openTask,b.dataset.targetTab);
 if(b.dataset.drawerTab){const taskId=state.drawer.id;$('#drawer').close();state.drawer=null;selectTask(taskId,b.dataset.drawerTab);}
});
$('#search').addEventListener('input',e=>{state.search=e.target.value;renderTaskList();});
$('#pause').addEventListener('click',()=>{state.paused=!state.paused;document.body.classList.toggle('playback-paused',state.paused);lastTick=performance.now();$('#pause').innerHTML=icon(state.paused?'play':'pause');$('#pause').setAttribute('aria-label',state.paused?'Reprendre la simulation':'Suspendre la simulation');$('#pause').title=state.paused?'Reprendre la simulation':'Suspendre la simulation';renderMetrics();toast(state.paused?'Simulation suspendue':'Simulation reprise');});
$('#speed').addEventListener('click',()=>{state.speed=state.speed===1?2:state.speed===2?4:1;$('#speed').textContent=state.speed+'×';toast(`Vitesse de simulation : ${state.speed}×`);});
$('#reset').addEventListener('click',()=>{state.elapsed=0;treeState.seen.clear();treeState.collapsed.clear();lastTick=performance.now();render();toast('Les six scénarios ont été réinitialisés');});
$('#info-button').addEventListener('click',()=>showDrawer('info'));
$('#close-drawer').addEventListener('click',()=>$('#drawer').close());
$('#drawer').addEventListener('close',()=>{state.drawer=null;});
$('#drawer').addEventListener('click',e=>{if(e.target===$('#drawer')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right)e.target.close();}});
$('.brand').addEventListener('click',e=>{e.preventDefault();state.nav='supervision';render(true);});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('#drawer').open){e.preventDefault();if($('#workspace').hidden){state.nav='supervision';render(true);}$('#search').focus();}});
// The saved theme is applied by an inline script in index.html before first paint; this keeps the button label in sync.
function syncThemeLabel(){$('#theme-button').setAttribute('aria-label',document.body.classList.contains('dark')?'Activer le thème clair':'Activer le thème sombre');}
$('#theme-button').addEventListener('click',()=>{const dark=document.body.classList.toggle('dark');syncThemeLabel();try{localStorage.setItem('clair-theme',dark?'dark':'light');}catch{}});
syncThemeLabel();
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-tree-node]')){e.preventDefault();showDrawer('tree',Number(e.target.dataset.taskId),e.target.dataset.treeNode);}});
renderIcons();render(true);
setInterval(()=>{const now=performance.now(),delta=(now-lastTick)/1000;lastTick=now;if(!state.paused){state.elapsed+=delta*state.speed;render();}},1000);
