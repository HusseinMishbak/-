const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const p=JSON.parse(fs.readFileSync(path.join(root,'weekly-curriculum.json'),'utf8'));
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'weekly-curriculum.js'),'utf8'),sandbox);
assert.equal(JSON.stringify(sandbox.window.UR_WEEKLY_CURRICULUM),JSON.stringify(p));
assert.equal(p.weeks.length,80);assert.equal(p.weeks.reduce((n,w)=>n+w.minutes,0),640*60);
const expected={A1:12,A2:14,B1:22,B2:24,'DELF B2':8};
for(const [level,count] of Object.entries(expected))assert.equal(p.weeks.filter(w=>w.level===level).length,count);
for(const [i,w] of p.weeks.entries()){
 assert.equal(w.number,i+1);assert.equal(w.minutes,480);assert(w.lessons.length>0);assert(w.quiz.length>0);
 for(const key of ['title','objective','task','grammar','previous','next','production'])assert(w[key],`${i+1}: ${key}`);
 for(const q of w.quiz){if(q.options)assert(q.answer>=0&&q.answer<q.options.length);else assert(q.accepted.length>0);}
 for(const r of w.resources)assert(/^https:\/\//.test(r.url));
}
console.log('PASS: 80 sequential weeks, 640 hours, level allocation, paired data, lesson content and quiz keys.');
