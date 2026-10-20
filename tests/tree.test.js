import test from 'node:test';
import assert from 'node:assert/strict';
import {getTasks} from '../dist/model.js';
import {agentTree,visibleTree,treeTotals} from '../dist/tree.js';
test('The live tree represents nested delegation, and collapse only hides descendants',()=>{
 const nodes=agentTree(getTasks(0)[0]);assert.equal(nodes.length,7);
 assert.equal(nodes.find(n=>n.id==='test').parent,'dev');
 assert.equal(visibleTree(nodes,new Set(['root'])).length,1);
 assert.equal(visibleTree(nodes,new Set(['dev'])).length,6);
 assert.equal(treeTotals(nodes).failed,1);
});
test('Retries preserve the failed execution and its immutable commit',()=>{
 const before=agentTree(getTasks(25)[0]),after=agentTree(getTasks(40)[0]);
 assert.equal(before.find(n=>n.id==='test').state,'Échec');
 assert.ok(after.find(n=>n.id==='retry'));
 assert.equal(after.find(n=>n.id==='retry').state,'Terminé');
 assert.equal(before.find(n=>n.id==='test').commit,after.find(n=>n.id==='test').commit);
 const retry1=agentTree(getTasks(0)[5]).find(n=>n.id==='retry');
 const final=agentTree(getTasks(30)[5]);
 assert.equal(final.find(n=>n.id==='retry').commit,retry1.commit);
 assert.equal(final.find(n=>n.id==='retry3').state,'Échec');
 assert.equal(treeTotals(final).active,0);
});
test('All child agents have a previously launched parent and totals match the nodes',()=>{
 for(let sec=0;sec<312;sec++)for(const t of getTasks(sec)){
  const nodes=agentTree(t),ids=new Set(nodes.map(n=>n.id));assert.equal(nodes.length,ids.size);
  for(const n of nodes){if(n.parent){assert.ok(ids.has(n.parent));assert.ok(nodes.find(p=>p.id===n.parent).start<=n.start);}assert.ok(n.duration>=0);if(t.local<n.end)assert.equal(n.commit,t.head);}
  const totals=treeTotals(nodes);assert.equal(totals.count,nodes.length);assert.equal(totals.active,nodes.filter(n=>n.state==='Actif').length);
  if(t.terminal)assert.equal(totals.active,0);
  if(t.stage===3)assert.equal(t.agents[3].state,nodes.find(n=>n.id==='retry').state);
 }
});
