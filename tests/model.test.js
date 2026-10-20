import test from 'node:test';
import assert from 'node:assert/strict';
import {getTasks,getMetrics,getProofs,cycleLength} from '../dist/model.js';
test('Six independent tasks start at different stages, with parallel agents',()=>{
 const tasks=getTasks(0);assert.equal(tasks.length,6);assert.ok(new Set(tasks.map(t=>t.stage)).size>=4);
 const subscription=tasks[0];assert.equal(subscription.stage,2);assert.equal(subscription.active,3);assert.equal(subscription.waiting,1);assert.equal(subscription.agents[3].dependency,'Développeur');
});
test('A new commit unlocks tests, and successful evidence is tied to that commit',()=>{
 const initial=getTasks(0)[0],testing=getTasks(22)[0],integrated=getTasks(60)[0];
 assert.equal(initial.head,initial.base);assert.notEqual(testing.head,testing.base);assert.equal(testing.agents[3].state,'Actif');
 assert.equal(integrated.stage,5);assert.equal(integrated.active,0);assert.equal(integrated.waiting,0);
 for(const p of getProofs(integrated).slice(1)){assert.equal(p.commit,integrated.head);assert.ok(['Réussi','Validée'].includes(p.status));}
});
test('Failed migration exhausts three attempts and never integrates',()=>{
 for(let time=0;time<156;time++){const t=getTasks(time)[5];assert.notEqual(t.stage,4);assert.notEqual(t.stage,5);}
 const stopped=getTasks(30)[5];assert.equal(stopped.stage,7);assert.equal(stopped.attempt,3);assert.equal(stopped.active,0);assert.equal(getProofs(stopped)[1].status,'Échec');
});
test('Counters remain derived, event ordering valid and terminal tasks inactive across cycles',()=>{
 for(let time=0;time<cycleLength*3;time++){
  const tasks=getTasks(time),m=getMetrics(tasks);
  assert.equal(m.running+m.integrated+m.stopped,6);
  assert.equal(m.active,tasks.flatMap(t=>t.agents).filter(a=>a.state==='Actif').length);
  for(const t of tasks){assert.ok(t.events.every(e=>e.at<=time));assert.ok(t.recent.some(e=>e.at===t.decisionAt));assert.ok(t.events.every((e,i,a)=>i===0||e.at>=a[i-1].at));if(t.terminal)assert.equal(t.active+t.waiting,0);}
 }
});
test('New demonstration cycles use distinct run and commit identifiers',()=>{
 const a=getTasks(0)[0],b=getTasks(cycleLength)[0];assert.equal(b.run,a.run+1);assert.notEqual(a.head,b.head);assert.ok(b.recent.every(e=>e.run===b.run));
 const commits=new Set();for(let r=0;r<25;r++){const t=getTasks(cycleLength*r+22)[0];commits.add(t.base);commits.add(t.head);}
 assert.equal(commits.size,50);
});
