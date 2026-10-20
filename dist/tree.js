import {commitAt,TIMELINE} from './model.js';
// A deterministic, simulated parent/child execution trace.
export function agentTree(t){
 const l=t.local,{reproduced,fixed,retested,revalidated,integrated,lastRetry,stopped}=TIMELINE;
 const status=t.stage===7?'Arrêté':t.stage===5?'Terminé':'Actif';
 const nodes=[];
 function add(id,parent,name,model,action,start,end,phase,x,y,icon,tools){
  if(l<start)return;
  const duration=Math.max(0,Math.min(l,end)-start);
  // A node reports the last commit it worked on; the developer authors each fix, so it reports the latest one.
  const seen=id==='dev'?l:Math.min(l,end-1);
  nodes.push({id,parent,name,model,action,start,end,state:phase,x,y,icon,tools,duration:Math.floor(duration),key:`${t.id}-${t.run}-${id}`,commit:commitAt(t,t.run,seen)});
 }
 add('root',null,'Orchestrateur','Clair · coordination',t.title,0,t.fails?stopped:integrated,status,337,25,'network',['Plan','Git']);
 const dev=t.agents[0],review=t.agents[1],security=t.agents[2];
 add('dev','root','Développeur','Agent de développement',dev.action,2,t.fails?stopped:fixed,dev.state,45,225,'code',['Git','Éditeur']);
 add('review','root','Reviewer','Agent de revue de code',review.action,10,t.fails?stopped:revalidated,review.state,337,225,'search',['Git','Analyse']);
 add('security','root','Sécurité','Agent de sécurité',security.action,16,revalidated,security.state,629,225,'shield',['Scan','Règles']);
 add('test','dev','Testeur','Scénario de reproduction',l>=reproduced?t.problem:'Reproduit les cas limites',20,reproduced,l>=reproduced?'Échec':'Actif',67,415,'test',['Tests']);
 add('lint','review','Analyse statique','Sous-agent du reviewer','Vérifie les types et les conventions',22,43,l>=43?'Terminé':'Actif',359,415,'code',['Types','Lint']);
 add('audit','security','Audit des dépendances','Sous-agent de sécurité','Analyse les dépendances du projet',24,48,l>=48?'Terminé':'Actif',651,415,'shield',['Packages']);
 if(l>=fixed)add('retry','dev','Testeur · reprise 1','Nouveau commit',t.fails?'Vérifie les données historiques':'Valide le correctif et les cas limites',fixed,retested,l>=retested?(t.fails?'Échec':'Terminé'):'Actif',67,585,'test',['Tests','Git']);
 if(t.fails&&l>=revalidated)add('retry2','dev','Testeur · reprise 2','Stratégie alternative','Vérifie l’adaptateur de compatibilité',revalidated,lastRetry,l>=lastRetry?'Échec':'Actif',67,755,'test',['Tests']);
 if(t.fails&&l>=lastRetry)add('retry3','dev','Testeur · reprise 3','Dernier essai automatique','Valide la conversion des données',lastRetry,stopped,l>=stopped?'Échec':'Actif',67,925,'test',['Tests']);
 return nodes;
}
export function visibleTree(nodes,collapsed){
 const byId=new Map(nodes.map(n=>[n.id,n]));
 return nodes.filter(n=>{let parent=n.parent;while(parent){if(collapsed.has(parent))return false;parent=byId.get(parent)?.parent;}return true;});
}
export function treeTotals(nodes){return {count:nodes.length,active:nodes.filter(n=>n.state==='Actif').length,failed:nodes.filter(n=>n.state==='Échec').length};}
