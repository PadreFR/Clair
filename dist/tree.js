// A deterministic, simulated parent/child execution trace.
export function agentTree(t){
 const l=t.local;
 const status=t.stage===7?'Arrêté':t.stage===5?'Terminé':'Actif';
 const nodes=[];
 function add(id,parent,name,model,action,start,end,phase,x,y,icon,tools){
  if(l<start)return;
  const duration=Math.max(0,Math.min(l,end)-start);
  nodes.push({id,parent,name,model,action,start,end,state:phase,x,y,icon,tools,duration:Math.floor(duration),key:`${t.id}-${t.run}-${id}`,commit:start>=56?`b${t.id}e4${id==='retry3'?3:id==='retry2'?2:1}${t.run%10}`:t.base});
 }
 add('root',null,'Orchestrateur','Clair · coordination',t.title,0,t.fails?110:90,status,337,25,'network',['Plan','Git']);
 const dev=t.agents[0],review=t.agents[1],security=t.agents[2];
 add('dev','root','Développeur','Agent de développement',dev.action,2,t.fails?110:56,dev.state,45,225,'code',['Git','Éditeur']);
 add('review','root','Reviewer','Agent de revue de code',review.action,10,t.fails?110:78,review.state,337,225,'search',['Git','Analyse']);
 add('security','root','Sécurité','Agent de sécurité',security.action,16,78,security.state,629,225,'shield',['Scan','Règles']);
 add('test','dev','Testeur','Scénario de reproduction',l>=28?t.problem:'Reproduit les cas limites',20,28,l>=28?'Échec':'Actif',67,415,'test',['Tests']);
 add('lint','review','Analyse statique','Sous-agent du reviewer','Vérifie les types et les conventions',22,43,l>=43?'Terminé':'Actif',359,415,'code',['Types','Lint']);
 add('audit','security','Audit des dépendances','Sous-agent de sécurité','Analyse les dépendances du projet',24,48,l>=48?'Terminé':'Actif',651,415,'shield',['Packages']);
 if(l>=56)add('retry','dev','Testeur · reprise 1','Nouveau commit',t.fails?'Vérifie les données historiques':'Valide le correctif et les cas limites',56,65,l>=65?(t.fails?'Échec':'Terminé'):'Actif',67,585,'test',['Tests','Git']);
 if(t.fails&&l>=78)add('retry2','dev','Testeur · reprise 2','Stratégie alternative','Vérifie l’adaptateur de compatibilité',78,94,l>=94?'Échec':'Actif',67,755,'test',['Tests']);
 if(t.fails&&l>=94)add('retry3','dev','Testeur · reprise 3','Dernier essai automatique','Valide la conversion des données',94,110,l>=110?'Échec':'Actif',67,925,'test',['Tests']);
 return nodes;
}
export function visibleTree(nodes,collapsed){
 const byId=new Map(nodes.map(n=>[n.id,n]));
 return nodes.filter(n=>{let parent=n.parent;while(parent){if(collapsed.has(parent))return false;parent=byId.get(parent)?.parent;}return true;});
}
export function treeTotals(nodes){return {count:nodes.length,active:nodes.filter(n=>n.state==='Actif').length,failed:nodes.filter(n=>n.state==='Échec').length};}
