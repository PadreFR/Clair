export const ROLES = ['Développeur', 'Reviewer', 'Sécurité', 'Testeur'];
export const PHASES = ['Développement', 'Revues parallèles', 'Correction', 'Vérification', 'Intégration', 'Intégrée', 'Diagnostic', 'Arrêtée'];
const SPECS = [
  {id:142,title:'Ajouter les abonnements',repo:'billing-api',branch:'feat/subscriptions',file:'subscriptions.ts',offset:35,problem:'Deux abonnements créés pour un même client.',test:'concurrent_subscription',action:'Corrige la création d’abonnement',dev:'Implémente le cycle des abonnements',review:'Examine la gestion des erreurs',security:'Vérifie les autorisations',fix:'Sérialiser les créations par client',proof:'Deux appels simultanés → un seul abonnement actif.'},
  {id:143,title:'Corriger les sessions expirées',repo:'auth-service',branch:'fix/session-expiry',file:'sessions.ts',offset:65,problem:'Une session expirée reste accessible.',test:'expired_session',action:'Corrige la révocation des sessions',dev:'Implémente la révocation des sessions',review:'Vérifie les délais d’expiration',security:'Teste les accès après révocation',fix:'Contrôler l’expiration à chaque accès',proof:'Une session expirée retourne une réponse 401.'},
  {id:144,title:'Exporter les factures',repo:'billing-api',branch:'feat/invoice-export',file:'invoice-export.ts',offset:2,problem:'La dernière page de factures est omise.',test:'invoice_pagination',action:'Corrige la pagination de l’export',dev:'Implémente l’export des factures',review:'Analyse la pagination',security:'Vérifie l’isolation des comptes',fix:'Inclure la dernière page de résultats',proof:'Les 250 factures attendues sont exportées.'},
  {id:145,title:'Limiter les connexions',repo:'auth-service',branch:'fix/login-rate-limit',file:'rate-limit.ts',offset:22,problem:'La limite est contournée par des appels concurrents.',test:'concurrent_rate_limit',action:'Corrige le compteur des tentatives',dev:'Implémente la limite de connexion',review:'Examine le compteur des tentatives',security:'Teste les contournements de limite',fix:'Incrémenter le compteur de façon atomique',proof:'La sixième tentative est bloquée avec le code 429.'},
  {id:146,title:'Refondre les notifications',repo:'web-app',branch:'feat/notifications',file:'notifications.ts',offset:10,problem:'Une notification est affichée deux fois.',test:'notification_deduplication',action:'Corrige la déduplication',dev:'Construit le centre de notifications',review:'Vérifie les événements concurrents',security:'Contrôle le contenu des messages',fix:'Dédupliquer les messages par identifiant',proof:'Un événement répété produit une seule notification.'},
  {id:147,title:'Migrer les préférences',repo:'user-service',branch:'chore/preferences',file:'preferences.ts',offset:85,problem:'Des préférences historiques ne peuvent pas être converties.',test:'legacy_preferences',action:'Réessaie la conversion des données',dev:'Prépare la migration des préférences',review:'Vérifie la compatibilité du schéma',security:'Contrôle les données sensibles',fix:'Ajouter un adaptateur de compatibilité',proof:'Toutes les préférences doivent être conservées.',fails:true}
];
export const cycleLength = 156;
export function timeText(seconds){return new Date(Date.UTC(2026,9,17,14,32,0)+seconds*1000).toISOString().slice(11,19);}
export function stageAt(local,fails){if(local<18)return 0;if(local<34)return 1;if(local<56)return 2;if(local<78)return 3;if(fails)return local<110?6:7;return local<90?4:5;}
const milestones = [0,18,28,34,45,56,65,78,90,94,110];
export function attemptAt(spec,local){return spec.fails&&local>=94?3:spec.fails&&local>=78?2:1;}
// Commit visible at a local time: the initial commit, then one fix commit per attempt. The full run number keeps every run's commits distinct.
export function commitAt(spec,run,local){return local<56?`a${spec.id}f2c${run}`:`b${spec.id}e4${attemptAt(spec,local)}${run}`;}
function eventAt(spec,local,run,at){
 const common={taskId:spec.id,run,at,local};
 const events={
  0:['Orchestrateur','Tâche attribuée. Environnement isolé préparé.','decision'],
  18:['Orchestrateur','Revues de code et de sécurité lancées en parallèle.','decision'],
  28:['Testeur',spec.problem,'failure'],
  34:['Orchestrateur','Correction assignée. Les revues indépendantes continuent.','decision'],
  45:['Développeur',spec.fix+' : patch en préparation.','action'],
  56:['Développeur','Correctif enregistré. Nouveau commit disponible.','commit'],
  65:['Testeur',spec.fails?'Conversion toujours incomplète sur les données historiques.':'Scénario de non-régression réussi sur le correctif.','test'],
  78:spec.fails?['Orchestrateur','Échec confirmé. Adaptateur réaffecté à un agent de reprise.','decision']:['Orchestrateur','Tous les contrôles sont validés sur le même commit. Intégration lancée.','decision'],
  90:spec.fails?null:['Orchestrateur','Intégration terminée. Branche synchronisée.','success'],
  94:spec.fails?['Orchestrateur','Deuxième essai en échec. Dernière tentative autorisée.','decision']:null,
  110:spec.fails?['Orchestrateur','Trois tentatives échouées. Arrêt automatique, diagnostic conservé.','stopped']:null
 };
 const e=events[local];return e?{...common,role:e[0],message:e[1],kind:e[2],key:`${spec.id}-${run}-${local}`}:null;
}
export function snapshot(spec,elapsed){
 const total=elapsed+spec.offset,run=Math.floor(total/cycleLength)+1,local=total%cycleLength,stage=stageAt(local,spec.fails),terminal=stage===5||stage===7;
 const base=commitAt(spec,run,0),head=commitAt(spec,run,local),attempt=attemptAt(spec,local);
 const actions=[spec.dev,spec.review,spec.security,`Prépare ${spec.test}`],states=['Actif','En attente','En attente','Actif'];
 let decision='Développer la fonctionnalité et préparer ses tests en parallèle.',reason='Critères chargés · environnement de travail isolé.';
 if(stage===1){actions[0]='Attend les résultats des revues';actions[3]='Exécute le scénario de reproduction';states.splice(0,4,'En attente','Actif','Actif','Actif');decision='Lancer les revues indépendantes et reproduire les cas limites.';reason='Implémentation disponible · contrôles parallèles autorisés.';}
 if(stage===2){actions[0]=spec.action;actions[3]='Attend le nouveau commit';states.splice(0,4,'Actif','Actif','Actif','En attente');decision='Corriger le défaut et poursuivre les revues en parallèle.';reason=`Défaut reproduit par le test ${spec.test}.`;}
 if(stage===3){actions[0]='Correctif livré';actions[1]='Vérifie le diff du correctif';actions[2]='Revérifie les accès sur le correctif';actions[3]=local<65?'Exécute les tests de non-régression':spec.fails?'Non-régression en échec sur le correctif':'Tests de non-régression réussis';states.splice(0,4,'Terminé','Actif','Actif',local<65?'Actif':spec.fails?'Échec':'Terminé');decision='Revalider le nouveau commit avant toute intégration.';reason='Les preuves précédentes ne valident pas le nouveau commit.';}
 if(stage===4||stage===5){actions.splice(0,4,'Correctif livré','Revue de code validée','Revue de sécurité validée','Tous les tests réussis');states.fill('Terminé');decision=stage===4?'Intégrer automatiquement le commit validé.':'Intégration terminée. Tous les contrôles sont archivés.';reason='Tests, revue de code et sécurité validés sur le même commit.';}
 if(stage===6){actions.splice(0,4,'Adapte la conversion historique','Analyse le schéma historique','Contrôle les données sensibles','Vérifie la nouvelle conversion');states.splice(0,4,'Actif','Actif','Terminé','Actif');decision=`Relancer la conversion avec une autre stratégie · tentative ${attempt}/3.`;reason='Le test de migration reste en échec. Intégration bloquée.';}
 if(stage===7){actions.splice(0,4,'Adaptation sans résultat concluant','Diagnostic archivé','Contrôle terminé','Conversion en échec');states.splice(0,4,'Arrêté','Terminé','Terminé','Échec');decision='Arrêter la tâche et conserver le diagnostic.';reason='Budget de 3 tentatives épuisé. Aucune intégration effectuée.';}
 const agents=ROLES.map((name,i)=>({name,index:i,action:actions[i],state:states[i],signal:states[i]==='Actif'?Math.floor((elapsed+i*2)%6)+1:null,dependency:states[i]==='En attente'?(stage===2?'Développeur':stage===1?'Revues et tests':'Développeur'):null}));
 const events=[];
 for(let r=Math.max(1,run-1);r<=run;r++)for(const m of milestones){const at=(r-1)*cycleLength+m-spec.offset;if(at<=elapsed){const ev=eventAt(spec,m,r,at);if(ev)events.push(ev);}}
 // The current decision was taken when its stage began: that milestone's event carries the same time.
 const decisionAt=Math.round(elapsed-local)+[0,18,34,56,78,90,attempt===3?94:78,110][stage];
 const recent=events.filter(e=>e.run===run);const decisions=events.filter(e=>e.kind==='decision'||e.kind==='success'||e.kind==='stopped');
 const badges=stage===0?[['Développement','indigo']]:stage===1?[['Revue','purple'],['Sécurité','green']]:stage===2?[['Correction','indigo'],['Revue','purple'],['Sécurité','green']]:stage===3?[['Tests','indigo'],['Revalidation','purple']]:stage===4?[['Intégration','green']]:stage===5?[['Intégrée','green']]:stage===6?[['Reprise automatique','amber']]:[['Arrêtée','red']];
 return {...spec,elapsed,local,run,stage,terminal,base,head,attempt,agents,decision,reason,events,recent,decisions,badges,active:agents.filter(a=>a.state==='Actif').length,waiting:agents.filter(a=>a.state==='En attente').length,decisionAt,budget:Math.max(0,110-local)};
}
export function getTasks(elapsed){return SPECS.map(s=>snapshot(s,elapsed));}
export function getMetrics(tasks){return {running:tasks.filter(t=>!t.terminal).length,active:tasks.reduce((s,t)=>s+t.active,0),waiting:tasks.reduce((s,t)=>s+t.waiting,0),integrated:tasks.filter(t=>t.stage===5).length,stopped:tasks.filter(t=>t.stage===7).length};}
export function getProofs(t){
 const fixed=t.local>=56,validated=t.stage===4||t.stage===5;
 // The regression test runs on each fix commit: attempt 1 from 56 s, retries from 78 s and 94 s for the failing task.
 const testing=fixed&&(t.local<65||t.fails&&t.local>=78&&t.local<110),failed=t.fails&&fixed&&!testing&&t.local>=65;
 return [
 {title:'Scénario de reproduction',status:t.local<28?'À exécuter':'Défaut reproduit',tone:t.local<28?'gray':'amber',commit:t.base,description:t.problem,test:t.test,result:t.local<28?'Le scénario sera lancé pendant les revues.':'Échec confirmé sur le commit initial.'},
 {title:'Test de non-régression',status:!fixed?'En attente':testing?'En cours':failed?'Échec':'Réussi',tone:!fixed?'gray':testing?'indigo':failed?'red':'green',commit:fixed?t.head:null,description:t.proof,test:t.test,result:!fixed?'Dépend du nouveau commit.':testing?(t.attempt>1?`Tentative ${t.attempt}/3 en cours sur le nouveau commit. Les tentatives précédentes ont échoué.`:'Exécution du scénario sur le correctif.'):failed?'Données historiques non converties. Intégration interdite.':'Comportement attendu confirmé.'},
 {title:'Revue de code',status:validated?'Validée':t.stage===7?'Diagnostic conservé':fixed?'En cours':'À revalider',tone:validated?'green':'gray',commit:fixed?t.head:null,description:'Gestion des erreurs, cas limites et cohérence avec les critères.',test:'code_review',result:validated?'Aucun problème bloquant sur le commit corrigé.':'La validation finale reste liée au commit corrigé.'},
 {title:'Revue de sécurité',status:validated?'Validée':t.stage===7?'Terminée':fixed?'En cours':'À revalider',tone:validated?'green':'gray',commit:fixed?t.head:null,description:'Autorisations, isolation des comptes et accès aux données.',test:'security_review',result:validated?'Contrôles requis réussis.':'Analyse et revalidation du périmètre modifié.'}
 ];
}
