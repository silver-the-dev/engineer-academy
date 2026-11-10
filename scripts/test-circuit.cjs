#!/usr/bin/env node
/**
 * Analytical circuit engine regression tests.
 *
 *   node scripts/test-circuit.cjs
 *
 * Uses the same TS/native-stub require hook as qa-content.cjs.
 * Prints measured values against analytical references; exits 1 on failure.
 */
const Module = require('module');
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const STUB_RE = /^(react-native(-svg|-gesture-handler|-reanimated|-safe-area-context|-worklets)?|expo(-.+)?|@expo\/.+|@react-native-async-storage\/.+)$/;

function stub() {
  const fn = function () {
    return null;
  };
  return new Proxy(fn, {
    get: (_t, k) => (k === '__esModule' ? true : k === 'default' ? stub() : k === Symbol.toPrimitive ? () => '' : stub()),
    apply: () => null,
    construct: () => ({}),
  });
}

const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (STUB_RE.test(request) || /\.(wav|mp3|png|jpe?g|ttf|otf)$/i.test(request)) return stub();
  return origLoad.call(this, request, parent, isMain);
};

const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  try {
    return origResolve.call(this, request, parent, ...rest);
  } catch (e) {
    if (request.startsWith('.') && parent && parent.filename) {
      const base = path.resolve(path.dirname(parent.filename), request);
      for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) if (fs.existsSync(base + ext)) return base + ext;
    }
    throw e;
  }
};

for (const ext of ['.ts', '.tsx']) {
  Module._extensions[ext] = function (module, filename) {
    const src = fs.readFileSync(filename, 'utf8');
    const out = ts.transpileModule(src, {
      fileName: filename,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, esModuleInterop: true },
    });
    module._compile(out.outputText, filename);
  };
}

const { solveDC, Sim, makeValue, applyEdit, defaults } = require('../src/lib/circuit');
const { circuit, wires, R, LAMP, SW, V, VAC, I, CLK, C, L, D, LED, Z, GND, VM, AM, IN, OUT, NPN, PNP, NMOS, OPAMP, GATE, DFF, P, circuitEx, circuitVisual } = require('../src/content/circuits');
const { checkCircuitExercise, runContentQA } = require('../src/lib/qa');
const { normalizeSection } = require('../src/content/types');
let failed = 0, assertions = 0;
function near(label, got, expected, tol = 1e-6) {
  assertions++;
  const ok = Number.isFinite(got) && Math.abs(got - expected) <= tol;
  console.log(`  ${ok ? 'ok' : 'FALHOU'} ${label}: ${got} (expected ${expected}, tol ${tol})`);
  if (!ok) failed++;
}
function yes(label, got) { near(label, Number(got), 1, 0); }
function group(n, name, fn) {
  console.log(`\n${n}. ${name}`);
  try { fn(); } catch (e) { failed++; console.log(`  FALHOU ${e.stack}`); }
}
const g = [0, 4], a = [0, 0], b = [3, 0];
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const divider = () => circuit(V('v', a, g, 12), R('r1', a, b, 1000), R('r2', b, g, 2000));
const healthy = (s) => yes(`convergence (${s.error ?? 'ok'})`, s.ok);

group(1, 'Divider, signs, node lookup and wires', () => {
  const cs = divider(), s = solveDC(cs), v = makeValue(cs);
  healthy(s); near('R1 V', s.comp.r1.v, 4); near('R2 V', s.comp.r2.v, 8);
  near('current', v.i('r1'), .004); near('source delivered', v.i('v'), .004);
  near('source + pin', v.pin('v', 0), -.004); near('source power', v.p('v'), .048);
  near('R1 power', v.p('r1'), .016); near('pin voltage', v.vpin('r1', 1), 8);
  near('node voltage', v.node(b), 8); yes('unknown node NaN', Number.isNaN(v.node([99,99])));
  near('missing id', v.v('none') + v.i('none') + v.p('none') + v.pin('none', 2) + v.vpin('none', 0), 0);
  yes('has/count/val/joined', v.has('r1') && !v.has('none') && v.count('resistor') === 2 && v.val('r1') === 1000 && v.joined(a,a) && !v.joined(a,b) && !v.joined([99,99],[99,99]));
  const csw = circuit(V('v', a,g,12), wires(a,b), wires(b,[4,0]), wires(b,[3,1]), R('r1',[4,0],g,1000), R('r2',[3,1],g,2000));
  const w = solveDC(csw); healthy(w);
  const ws = csw.filter(c => c.type === 'wire');
  near('three-wire KCL', w.comp[ws[0].id].i - w.comp[ws[1].id].i - w.comp[ws[2].id].i, 0, 3e-9);
  near('wire total', w.comp[ws[0].id].i, .018, 1e-8);
  const midpoint = solveDC(circuit(V('v',a,g,5), wires(a,[4,0]), R('r',[2,0],g,1000)));
  healthy(midpoint); near('wire midpoint does not connect', midpoint.comp.r.i,0);
});
group(2, '127 V parallel resistors', () => {
  const s = solveDC(circuit(V('v',a,g,127), ...[10,15,30].map((r,k)=>R(`r${k}`,a,g,r))));
  healthy(s); near('total A',s.comp.v.i,25.4);
});
group(3, 'Balanced Wheatstone bridge', () => {
  const l=[2,1], r=[4,1];
  const s=solveDC(circuit(V('v',a,g,10), R('al',a,l,100),R('lg',l,g,200),R('ar',a,r,300),R('rg',r,g,600),AM('galv',l,r)));
  healthy(s); near('galvanometer A',s.comp.galv.i,0,1e-9);
});
group(4, 'Two meshes and two sources (center = 90/11 V)', () => {
  const s=solveDC(circuit(V('v1',a,g,12),V('v2',[5,0],g,6),R('r1',a,b,1000),R('r2',[5,0],b,2000),R('r3',b,g,3000)));
  healthy(s); near('center V',s.comp.r3.v,90/11);
  near('mesh 1 A',s.comp.v1.i,(12-90/11)/1000);
  near('mesh 2 A (source absorbs)',s.comp.v2.i,(6-90/11)/2000);
  near('KCL',s.comp.r1.i+s.comp.r2.i-s.comp.r3.i,0,1e-10);
});
group(5, 'Current source and parallel load; disconnected islands', () => {
  const s=solveDC(circuit(I('i',a,g,.03),R('r1',a,g,100),R('r2',a,g,200),GND(g)));
  healthy(s); near('voltage',s.comp.r1.v,2); near('source power',s.comp.i.p,.06);
  const floating=solveDC(circuit(...divider(), wires([8,0],[9,0]), R('float',[9,0],[8,0],100),SW('open',b,[7,3]),wires([7,3],[9,3])));
  healthy(floating); near('island resistor',floating.comp.float.i,0); near('open switch',floating.comp.open.i,0);
  const noSource=solveDC(circuit(wires(a,b),R('r',b,g,100))); healthy(noSource); near('no source',noSource.comp.r.i,0);
  const island=solveDC(circuit(...divider(),V('v2',[8,0],[8,2],5),R('r2i',[8,0],[8,2],1000)));
  healthy(island); near('powered island current',island.comp.r2i.i,.005); near('island common mode',island.nodeV[island.nodeAt([8,0])]+island.nodeV[island.nodeAt([8,2])],0,1e-8);
});
group(6, 'Red LED and direct-source overcurrent', () => {
  const s=solveDC(circuit(V('v',a,g,9),R('r',a,b,360),LED('led',b,g)));
  healthy(s); near('LED current',s.comp.led.i,.02,.0001); yes('LED lit',s.comp.led.on);
  near('diode law',s.comp.led.v,1.8+.01*Math.log(s.comp.led.i/.01),1e-8);
  const direct=solveDC(circuit(V('v',a,g,9),LED('led',a,g)));
  yes('direct LED burnt',direct.comp.led.burnt); yes('finite huge current',Number.isFinite(direct.comp.led.i)&&direct.comp.led.i>500);
  yes('direct LED converged to short',direct.error==='short');
  near('direct LED/source KCL',direct.comp.v.i,direct.comp.led.i,direct.comp.led.i*1e-10);
  for (const [color,vf] of Object.entries({red:1.8,yellow:2,green:2.1,blue:3,white:3})) {
    const s=solveDC(circuit(I('i',a,g,.01),LED('led',a,g,color),GND(g)));
    healthy(s); near(`${color} 10mA drop`,s.comp.led.v,vf,1e-7);
  }
});
group(7, 'Reverse diode and zener breakdown', () => {
  const reverse=solveDC(circuit(V('v',a,g,12),D('d',g,a))); healthy(reverse); near('reverse A',reverse.comp.d.i,0,1e-12);
  const s=solveDC(circuit(V('v',a,g,12),R('r',a,b,470),Z('z',g,b,5.1)));
  healthy(s); near('zener V',-s.comp.z.v,5.1,.01); near('zener A',s.comp.z.i,-(12-5.1)/470,.00005);
  near('zener junction law',-s.comp.z.v,5.1+.01*Math.log(-s.comp.z.i/.01),1e-8);
});
function bjt(pnp=false, rb=470000, bias=true) {
  const q=P.bjt([2,2]);
  return circuit(pnp?PNP('q',[2,2]):NPN('q',[2,2]),V('v',pnp?q.e:a,pnp?a:q.e,12),
    R('rb',bias?a:q.e,q.b,rb), R('rc',a,q.c,2200));
}
group(8, 'BJT active, saturation, cutoff and PNP signs', () => {
  const s=solveDC(bjt()); healthy(s);
  near('Ib',s.comp.q.pins[0],(12-.7)/470000,2e-7); near('Ic',s.comp.q.i,100*(12-.7)/470000,2e-5); near('Vce',s.comp.q.v,6.7,.04);
  near('pin KCL',sum(s.comp.q.pins),0,1e-12);
  const sat=solveDC(bjt(false,10000)); healthy(sat);
  const ibSat=(12-.7)/10000, icSat=(12-.22)/2200, jc=(ibSat-icSat/100)/102;
  const vceSat=.2+.01*Math.log((icSat/100+2*jc)/jc);
  near('Ebers-Moll saturation Vce',sat.comp.q.v,vceSat,.001);
  near('saturation collector current',sat.comp.q.i,(12-vceSat)/2200,.00002);
  yes('saturation Vce < .3',sat.comp.q.v>0&&sat.comp.q.v<.3);
  const off=solveDC(bjt(false,470000,false)); healthy(off); near('cutoff',off.comp.q.i,0,1e-10);
  const p=solveDC(bjt(true)); healthy(p); near('PNP Ic',p.comp.q.i,-s.comp.q.i,1e-8); near('PNP Vce',p.comp.q.v,-s.comp.q.v,5e-6);
  near('PNP base sign',p.comp.q.pins[0],-s.comp.q.pins[0],1e-9); near('PNP KCL',sum(p.comp.q.pins),0,1e-12);
  const ps=solveDC(bjt(true,10000)); healthy(ps); yes('PNP saturation',ps.comp.q.v<0&&ps.comp.q.v>-.3);
});
group(9, 'NMOS lamp switch and reverse channel', () => {
  const p=P.mos([2,2]);
  const cs=circuit(NMOS('m',[2,2]),V('v',a,p.s,6),IN('in',p.g,true),LAMP('lamp',a,p.d,60));
  const s=solveDC(cs); healthy(s); yes('lamp on',s.comp.lamp.on); near('gate current',s.comp.m.pins[0],0);
  // In the triode region: (6-v)/60 = .5*(6v-v²).
  const vd=(181-Math.sqrt(181**2-720))/60;
  near('triode Vds',s.comp.m.v,vd,1e-6);
  const off=solveDC(applyEdit(cs,{on:{in:false}})); healthy(off); yes('lamp off',!off.comp.lamp.on); near('off current',off.comp.m.i,0);
  const rev=solveDC(circuit(NMOS('m',[2,2]),V('v',p.s,p.d,1),V('gate',p.g,p.d,5)));
  healthy(rev); near('reverse Id',rev.comp.m.i,-2.5,1e-6);
});
group(10, 'Opamp feedback and rail saturation', () => {
  const p=P.opamp([2,0]);
  const inv=circuit(OPAMP('op',[2,0]),GND(p.pos),V('v',a,p.pos,1),R('rin',a,p.neg,1000),R('rf',p.out,p.neg,10000));
  const s=solveDC(inv); healthy(s); near('gain -10',s.comp.op.v,-10,0.002); near('ideal input current',s.comp.op.pins[0],0);
  const non=circuit(OPAMP('op',[2,0]),GND(g),V('v',p.pos,g,1),R('r',p.neg,g,1000),R('rf',p.out,p.neg,10000));
  const n=solveDC(non); healthy(n); near('gain 11',n.comp.op.v,11,.002);
  const cmp=circuit(OPAMP('op',[2,0],{rails:[-9,9]}),GND(p.neg),V('v',p.pos,p.neg,1));
  near('positive rail',solveDC(cmp).comp.op.v,9); near('negative rail',solveDC(applyEdit(cmp,{set:{v:-1}})).comp.op.v,-9);
});
group(11, 'Backward Euler RC/RL, initial conditions, exact caller dt', () => {
  const rc=circuit(V('v',a,g,5),R('r',a,b,10000),C('c',b,g,.0001));
  const v=makeValue(rc); near('RC at tau',v.at('c',1),5*(1-Math.exp(-1)),.005);
  near('DC capacitor open',v.i('c'),0); near('DC capacitor voltage',v.v('c'),5);
  const sim=new Sim(rc); near('initial capacitor',sim.solution.comp.c.v,0); sim.step(.1);
  near('fixed dt BE voltage',sim.solution.comp.c.v,5/11,1e-7); near('fixed dt time',sim.t,.1,0);
  sim.reset(); near('reset time',sim.t,0,0); near('reset voltage',sim.solution.comp.c.v,0);
  const charged=new Sim(applyEdit(rc,{add:[C('c2',[8,0],[8,2],1e-4,{ic:2})]})); near('nonzero isolated ic',charged.solution.comp.c2.v,2);
  const rl=circuit(V('v',a,g,5),R('r',a,b,10),L('l',b,g,10));
  near('RL at tau',makeValue(rl).at('l',1,'i'),.5*(1-Math.exp(-1)),.0005);
  const li=new Sim(circuit(R('r',a,g,10),L('l',a,g,1,{ic:.1}),GND(g))); near('inductor ic',li.solution.comp.l.i,.1); near('inductor discharge',li.step(.01).comp.l.i,.1/1.1,1e-8);
  yes('reject bad dt',(()=>{try {sim.step(0);return false;}catch{return true;}})());
});
group(12, 'Half-wave rectifier, filter ripple, AC offset/phase, wave statistics', () => {
  const cs=circuit(VAC('v',a,g,10,60),D('d',a,b),R('r',b,g,1000));
  const v=makeValue(cs), w=v.wave('r');
  near('rectifier min',w.min,0,.001); near('rectifier max',w.max,9.3,.01); yes('rectifier finite stats',Number.isFinite(w.rms)&&w.avg>0&&w.rms>=w.avg);
  const smooth=makeValue(applyEdit(cs,{add:[C('c',b,g,.001)]})).wave('r',{t:.15,from:.1});
  yes(`capacitor ripple ${smooth.pp} < ${w.pp}`,smooth.pp<w.pp/5);
  const ac=makeValue(circuit(VAC('v',a,g,10,60,{offset:2,phase:90}),R('r',a,g,1000)));
  near('AC DC offset',ac.v('v'),2); near('AC initial phase',ac.at('v',0),12);
  const sine=ac.wave('v',{t:1/60,from:0}); near('sine average',sine.avg,2,1e-8); near('sine rms',sine.rms,Math.sqrt(54),.001);
  near('at current',ac.at('r',0,'i'),.012);
});
group(13, 'All gates, composed logic, SR latch memory and DFF frequency divider', () => {
  const expected={and:[0,0,0,1],or:[0,1,1,1],nand:[1,1,1,0],nor:[1,0,0,0],xor:[0,1,1,0],xnor:[1,0,0,1],not:[1,0]};
  for(const [type,table] of Object.entries(expected)) {
    const p=P.gate([2,0],type==='not'?1:2);
    const cs=circuit(GATE(type,'gate',[2,0]),...p.ins.map((pt,k)=>IN(`i${k}`,pt)),OUT('out',p.out));
    const got=makeValue(cs).truth(p.ins.map((_,k)=>`i${k}`),'out');
    yes(`${type} truth ${got}`,JSON.stringify(got)===JSON.stringify(table));
  }
  const and=P.gate([2,0]),not=P.gate([2,5],1),or=P.gate([7,1]);
  const cs=circuit(GATE('and','and',[2,0]),GATE('not','not',[2,5]),GATE('or','or',[7,1]),IN('a',and.ins[0]),IN('b',and.ins[1]),IN('c',not.ins[0]),wires(and.out,or.ins[0]),wires(not.out,or.ins[1]),OUT('out',or.out));
  yes('AB + not C truth',JSON.stringify(makeValue(cs).truth(['a','b','c'],'out'))===JSON.stringify([1,0,1,0,1,0,1,1]));
  // Switches driven by external ideal time waveforms let a single Sim see SR pulses.
  const n1=P.gate([2,0]),n2=P.gate([7,4]);
  const latch=circuit(GATE('nor','q',[2,0]),GATE('nor','qb',[7,4]),CLK('set',n2.ins[0],g,1,5),CLK('reset',n1.ins[0],g,1,5,{phase:0}),wires(n1.out,n2.ins[1]),wires(n2.out,n1.ins[1]),GND(g));
  // Independent AC controls: positive half cycles cross the 2.5 V threshold at different times.
  const controlled=applyEdit(latch,{remove:['set','reset'],add:[VAC('set',n2.ins[0],g,5,1,{offset:-2,phase:0}),VAC('reset',n1.ins[0],g,5,1,{offset:-2,phase:180})]});
  const sim=new Sim(controlled);
  for(let k=0;k<30;k++)sim.step(.01);
  yes('latch set Q',sim.solution.comp.q.on);
  for(let k=0;k<20;k++)sim.step(.01);
  yes('latch holds Q',sim.solution.comp.q.on);
  for(let k=0;k<30;k++)sim.step(.01);
  yes('latch reset Q',!sim.solution.comp.q.on);
  for(let k=0;k<20;k++)sim.step(.01);
  yes('latch holds reset',!sim.solution.comp.q.on);
  const p=P.dff([2,0]);
  const d=new Sim(circuit(DFF('ff',[2,0]),CLK('clk',p.clk,g,1),wires(p.qn,p.d),GND(g)));
  const highs=[];
  for(let k=0;k<32;k++){const s=d.step(.125);healthy(s);if(k%4===3)highs.push(s.comp.ff.on?1:0);near('DFF input currents',s.comp.ff.pins[0]+s.comp.ff.pins[1],0);}
  yes(`divide by two ${highs}`,JSON.stringify(highs)===JSON.stringify([1,1,0,0,1,1,0,0]));
  d.reset(); yes('DFF reset Q',!d.solution.comp.ff.on);
  const ffDC=makeValue(circuit(DFF('ff',[2,0]),IN('d',p.d),IN('clk',p.clk)));
  yes('truth resets DFF for every row',JSON.stringify(ffDC.truth(['d','clk'],'ff'))===JSON.stringify([0,0,0,0]));
  const oscillator=solveDC(circuit(GATE('not','osc',[2,0]),wires(P.gate([2,0],1).out,P.gate([2,0],1).ins[0])));
  yes('oscillating logic reports noconv',oscillator.error==='noconv');
});
group(14, 'Short circuit, open circuit, empty and singular', () => {
  const s=solveDC(circuit(V('v',a,g,5),wires(a,g))); yes('short error',s.error==='short'); near('short A',s.comp.v.i,500000,.001);
  const open=solveDC(circuit(V('v',a,g,5),SW('sw',a,b),R('r',b,g,1000))); healthy(open); near('open A',open.comp.v.i,0,1e-10);
  yes('empty error',solveDC([]).error==='empty');
  yes('inconsistent ideal sources singular',solveDC(circuit(V('v1',a,g,5),V('v2',a,g,6))).error==='singular');
  const cap=solveDC(circuit(V('v',a,g,5),C('c',a,[8,0],1e-6),wires([8,0],[9,0])));healthy(cap);near('floating capacitor open',cap.comp.c.i,0);
});
group(15, 'Equivalent resistance, immutable edits, defaults, QA and performance', () => {
  const cs=circuit(R('r1',a,b,100),R('r2',a,b,100),R('r3',b,g,50)); near('Req',makeValue(cs).req(a,g),100,1e-6);
  near('voltage sources off',makeValue(circuit(V('v',a,b,5),R('r',b,g,100))).req(a,g),100.00001,1e-6);
  near('current sources off',makeValue(circuit(I('i',a,g,1),R('r',a,g,100))).req(a,g),100,1e-6);
  yes('open Req infinity',makeValue(circuit(VM('vm',a,g))).req(a,g)===Infinity);
  near('high resistance stays finite (with 1 pS shunt)',makeValue(circuit(R('r',a,g,1e12))).req(a,g),5e11,1);
  const initial=circuit(R('r',a,b,100,{rails:[-1,1],values:[100,200],show:['v']}),SW('sw',b,g)); const before=JSON.stringify(initial);
  const edited=applyEdit(initial,{set:{r:200},on:{sw:true},add:[R('new',a,g,10)],remove:['missing']});
  near('edit set',edited[0].value,200); yes('edit on/add',edited[1].on&&edited.some(c=>c.id==='new')); yes('edit remove',applyEdit(edited,{remove:['r']}).length===2);
  edited[0].pts[0][0]=99;edited[0].rails[0]=-2;edited[0].values[0]=1;edited[0].show[0]='p'; yes('input immutable',JSON.stringify(initial)===before);
  near('resistor default',defaults('resistor').value,1000); near('default green LED drop',solveDC(circuit(I('i',a,g,.01),{...LED('l',a,g,'green'),...defaults('led'),color:'green'},GND(g))).comp.l.v,2.1,1e-6);
  const ex=circuitEx('Adjust', {comps:circuit(V('v',a,g,5),R('r',a,g,1000))},v=>Math.abs(v.i('r')-.01)<1e-7,'10 mA','Ohm law',{set:{r:500}});
  const good=checkCircuitExercise(ex), missing=checkCircuitExercise({...ex,solution:undefined}),bad=checkCircuitExercise({...ex,solution:{set:{r:2000}}});
  near('QA good errors',good.errors.length,0,0);near('QA good warnings',good.warnings.length,0,0);yes('QA missing solution',missing.errors.some(s=>s.includes('sem solution')));yes('QA wrong solution',bad.errors.some(s=>s.includes('não satisfaz')));
  yes('QA already solved',checkCircuitExercise({...ex,solution:{},check:v=>v.i('r')>.001}).warnings.some(s=>s.includes('já começa resolvido')));
  yes('QA thrown check',checkCircuitExercise({...ex,check:()=>{throw Error('fixture');}}).errors.some(s=>s.includes('exceção')));
  yes('QA duplicate ids',checkCircuitExercise({...ex,props:{comps:[...ex.props.comps,R('r',a,b,3)]}}).errors.some(s=>s.includes('id repetido')));
  yes('QA solution short warning',checkCircuitExercise({...ex,solution:{add:wires(a,g)},check:()=>true}).warnings.some(s=>s.includes('short')));
  const section=normalizeSection({id:'test',title:'',subtitle:'',color:'',emoji:'',units:[{id:'unit',title:'',subtitle:'',icon:'',lessons:[{id:'lesson',title:'',parts:[{card:{body:'',visual:circuitVisual({comps:circuit(V('v',a,g,5),wires(a,g))})},exercises:[ex]},{card:{body:''},exercises:[{...ex,visual:circuitVisual({comps:[R('dup',a,g,1),R('dup',a,g,2)]})}]}]}]}]});
  const report=runContentQA([section]);yes('QA integrated exercise/card visuals',report.errors.some(s=>s.includes('id repetido'))&&report.warnings.some(s=>s.includes('circuit visual: short')));
  const sixty=circuit(V('v',a,g,12),...Array.from({length:59},(_,k)=>R(`r${k}`,k===0?a:[k,1],k===58?g:[k+1,1],100)));
  for(let k=0;k<10;k++)solveDC(sixty);
  const start=performance.now();let s;for(let k=0;k<100;k++)s=solveDC(sixty);const ms=(performance.now()-start)/100;
  healthy(s);near('60-part current',s.comp.v.i,12/5900,1e-8);yes(`linear DC ${ms.toFixed(3)} ms < 5 ms`,ms<5);
});
group(16, 'Full-wave bridges with extended leads, references, filter and center tap', () => {
  const left = [2, 4], right = [6, 4], pos = [4, 2], neg = [4, 6];
  for (const [name, grounded, filtered] of [['grounded bridge', true, false], ['bridge without ground', false, false], ['filtered bridge', true, true]]) {
    const cs = circuit(
      VAC('ac', [1, 10], [7, 10], 10, 60),
      wires([1, 10], [1, 4], left), wires([7, 10], [7, 4], right),
      D('d1', left, pos), D('d2', right, pos), D('d3', neg, left), D('d4', neg, right),
      wires(pos, [8, 2]), R('load', [8, 2], [8, 8], 1000), wires([8, 8], [4, 8], neg),
      ...(grounded ? [GND(neg)] : []), ...(filtered ? [C('filter', pos, neg, .001)] : []),
    );
    const sim = new Sim(cs); healthy(sim.solution);
    let valid = true, inRange = true, peak = 0, min = Infinity, max = -Infinity;
    const halves = [0, 0];
    for (let k = 0; k < 1440; k++) {
      const s = sim.step(1 / 7200), v = s.comp.load.v;
      valid &&= s.ok; inRange &&= Number.isFinite(v) && v >= -1e-8 && v <= 10 - 2 * .7 + .01;
      peak = Math.max(peak, v);
      if (k >= 1320) { min = Math.min(min, v); max = Math.max(max, v); halves[k % 120 < 60 ? 0 : 1] = Math.max(halves[k % 120 < 60 ? 0 : 1], v); }
    }
    yes(`${name}: every step converges`, valid); yes(`${name}: load stays between 0 and peak minus two drops`, inRange);
    // Charging pulses increase the exponential diodes' drop above 0.7 V.
    near(`${name}: peak`, peak, filtered ? 8.55 : 8.6, .02);
    yes(`${name}: both half cycles rectify`, halves.every(v => v > 8.5));
    if (filtered) yes(`${name}: ripple < 0.1 V (${max - min})`, max - min < .1);
    else near(`${name}: zero crossing`, min, 0, 1e-6);
  }
  // Equal series windings: the center tap is 0 V, the ends have opposite phases.
  const ct = [4, 10], end1 = [1, 10], end2 = [7, 10];
  const cs = circuit(VAC('upper', end1, ct, 10, 60), VAC('lower', ct, end2, 10, 60),
    wires(end1, [1, 4], left), wires(end2, [7, 4], right),
    D('d1', left, pos), D('d2', right, pos), wires(pos, [8, 2]),
    R('load', [8, 2], [8, 8], 1000), wires([8, 8], [4, 8], ct), GND(ct));
  const sim = new Sim(cs); healthy(sim.solution);
  let valid = true, inRange = true, peak = 0;
  const halves = [0, 0];
  for (let k = 0; k < 480; k++) {
    const s = sim.step(1 / 7200), v = s.comp.load.v;
    valid &&= s.ok; inRange &&= Number.isFinite(v) && v >= -1e-8 && v <= 10 - .7 + .01;
    peak = Math.max(peak, v); halves[k % 120 < 60 ? 0 : 1] = Math.max(halves[k % 120 < 60 ? 0 : 1], v);
    if (k === 29) near('series winding end-to-end peak', s.comp.upper.v + s.comp.lower.v, 20, 1e-8);
  }
  yes('center tap: every step converges', valid); yes('center tap: load range', inRange);
  near('center tap: peak with one diode drop', peak, 9.3, .01);
  yes('center tap: both half cycles rectify', halves.every(v => v > 9.2));
});
console.log(`\n${assertions} checks; ${failed ? `${failed} FALHOU` : 'all ok'}`);
process.exit(failed ? 1 : 0);
