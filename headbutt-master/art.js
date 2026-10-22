/* Canvas artwork: party-office hero, hinged backbend, ring and forehead projectile. */
(function(){'use strict';
const C=['#f4e8dd','#8e79ed','#5f9ed4','#d95f83','#a45ee9','#416ee0','#d24069','#343244','#efbc47'];
function path(c,pts,fill,stroke='#171222',width=2){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function oval(c,x,y,rx,ry,fill,stroke){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
function line(c,pts,color,w){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.stroke();}
function man(c,x,y,scale=1,o={}){const tier=o.tier||0,enemy=o.enemy,dir=o.dir||1,t=o.time||0,body=tier/8;const shirt=enemy?['#5e85ac','#db6c69','#6b9b88','#a871b7'][o.variant%4||0]:C[Math.min(8,tier)],skin=enemy?'#dcaa87':'#f4c3a1';const bend=o.bend||0;c.save();c.translate(x,y);c.scale(scale*dir,scale);c.globalAlpha=o.ghost?.5:1;oval(c,0,0,43,9,'#08061355');
 // Grounded legs and dress shoes remain still as the upper body bends.
 const spread=o.stance?9:0;line(c,[[-17,-50],[-21-spread,-21],[-24-spread,-6]],'#292437',21+body*4);line(c,[[15,-50],[22+spread,-25],[26+spread,-6]],'#40384b',21+body*4);path(c,[[-34-spread,-11],[-18-spread,-12],[-9-spread,-2],[-9-spread,3],[-38-spread,3]],'#201b26');path(c,[[17+spread,-11],[33+spread,-12],[43+spread,-3],[43+spread,3],[16+spread,3]],'#201b26');line(c,[[-33-spread,1],[-11-spread,1]],'#7b6c7c',2);line(c,[[20+spread,1],[39+spread,1]],'#8e7a87',2);
 // Hip hinge makes the arch-back and forehead snap visible.
 c.translate(0,-50);c.rotate(bend);const belly=31-body*9,shoulder=29+body*8;
 line(c,[[-shoulder,-55],[-40,-27],[-33,-9]],'#171222',18);line(c,[[-shoulder,-55],[-40,-27],[-33,-9]],shirt,13);oval(c,-33,-7,8,9,skin,'#372132');
 c.beginPath();c.moveTo(-shoulder,-65);c.quadraticCurveTo(-belly-12,-24,-belly,-4);c.quadraticCurveTo(4,10,belly+6,-5);c.quadraticCurveTo(belly+12,-30,shoulder,-63);c.closePath();c.fillStyle=shirt;c.fill();c.strokeStyle='#211a2d';c.lineWidth=2.8;c.stroke();
 if(tier===0&&!enemy){path(c,[[-19,-63],[-5,-72],[2,-59],[-3,-43]],'#fff7ef');path(c,[[1,-59],[11,-72],[24,-61],[15,-42]],'#fff7ef');path(c,[[1,-57],[8,-58],[10,-48],[20,-24],[13,-18],[5,-44]],'#a74372');line(c,[[-22,-5],[29,-5]],'#3b3349',5);path(c,[[0,-9],[10,-9],[10,-1],[0,-1]],'#dfb67b');line(c,[[-20,-21],[-7,-18]],'#beacaf',1.5);line(c,[[16,-12],[29,-16]],'#beacaf',1.5);
 }else{line(c,[[-19,-60],[-15,-14]],'#ffde66',4);line(c,[[21,-60],[18,-14]],'#ffde66',4);c.font='900 16px sans-serif';c.textAlign='center';c.fillStyle='#fff2bc';c.save();if(dir<0)c.scale(-1,1);c.fillText(tier>=7?'★':'HM',2*dir,-30);c.restore();line(c,[[-24,-5],[28,-5]],'#251d34',6);}
 // Front arm: extended palms lock around the rival in the grab technique.
 const ax=o.grab?73:39,ay=o.grab?-72:-22;line(c,[[shoulder-2,-53],[ax-8,ay-12],[ax,ay]],'#201827',19);line(c,[[shoulder-2,-53],[ax-8,ay-12],[ax,ay]],shirt,14);oval(c,ax,ay,9,10,skin,'#44293a');if(o.grab){line(c,[[ax+3,ay-7],[ax+8,ay-4]],'#8b5755',1.5);}else if(o.bag&&tier===0){path(c,[[ax-14,ay+20],[ax+19,ay+20],[ax+19,ay+51],[ax-14,ay+51]],'#70482e');line(c,[[ax-4,ay+20],[ax-4,ay+13],[ax+8,ay+13],[ax+8,ay+20]],'#34222a',3);path(c,[[ax-14,ay+26],[ax+19,ay+26],[ax+19,ay+34],[ax-14,ay+34]],'#a17845');}
 // Oversized comic forehead, temple hair, heavy brows and a receding hairline.
 oval(c,3,-70,11,13,skin,'#452c39');c.save();c.translate(5,-102);c.rotate(.04);oval(c,0,0,31,34,skin,'#372236');oval(c,-30,6,6,10,skin,'#372236');oval(c,30,6,5,9,skin,'#372236');
 path(c,[[-31,0],[-33,-21],[-24,-33],[-9,-38],[8,-35],[23,-30],[31,-15],[29,-2],[23,-11],[20,-23],[4,-27],[-6,-23],[-18,-22],[-23,-7]],enemy?'#2b2532':'#3c3541');line(c,[[-27,-22],[-18,-29],[-8,-29]],'#8d7b80',3);line(c,[[-27,-9],[-25,0]],'#8d7b80',3);
 oval(c,7,-18,13,5,'#ffe8cd');line(c,[[-16,-3],[-6,-7]],'#362332',4);line(c,[[7,-7],[20,-3]],'#362332',4);oval(c,-9,2,3,4,'#261e2a');oval(c,16,2,3,4,'#261e2a');oval(c,5,12,8,5,'#de8a72');oval(c,-18,16,7,3,'#df8b86');oval(c,23,15,6,3,'#df8b86');line(c,[[-6,23],[4,26],[17,22]],'#653842',2.5);line(c,[[-9,20],[-5,18]],'#6c4951',1.2);line(c,[[16,18],[20,20]],'#6c4951',1.2);
 if(tier>=7||o.crown){path(c,[[-28,-31],[-29,-48],[-16,-39],[-4,-55],[8,-39],[25,-49],[27,-30]],'#ffcf48','#55362e',2);oval(c,-3,-36,3,3,'#a84ce4');}
 c.restore();c.restore();}
function stadium(c,w,h,t=0,stage=0){c.clearRect(0,0,w,h);let g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#181026');g.addColorStop(.55,'#472b66');g.addColorStop(1,'#221c35');c.fillStyle=g;c.fillRect(0,0,w,h);
 // Truss and floodlights.
 for(const side of [0,1]){const x=side?w-15:15;path(c,[[x,-10],[w*.42+(side?30:-30),h*.81],[w*.75-(side?w*.5:0),h*.81]],'#ffe8a314',null);for(let n=0;n<6;n++)oval(c,x+(side?-1:1)*n*8,15+n*2,4,3,'#fff1ac');}
 line(c,[[0,28],[w,28]],'#837093',2);
 c.textAlign='center';c.fillStyle='#d2bdf6';c.font='900 10px sans-serif';c.fillText('HEADBUTT CHAMPIONSHIP',w/2,26);
 // Seated crowd silhouette rows, deterministic positions.
 for(let row=0;row<3;row++){for(let n=0;n<Math.ceil(w/14);n++){const x=n*14+(row%2?6:0),y=h*.28+row*15,hop=Math.sin(t*3+n)*1.3;oval(c,x,y+hop,4.5,5,['#67557f','#99828b','#635579'][(n+row)%3]);c.fillStyle=['#3b284f','#594263','#342c51'][n%3];c.fillRect(x-5,y+5,10,9);}}
 c.fillStyle='#140f2399';c.fillRect(0,h*.44,w,h*.17);
 const floor=h*.79;path(c,[[12,h*.5],[w-12,h*.5],[w+35,h*.9],[-35,h*.9]],'#9071ca','#e7d3fa',2);path(c,[[27,h*.54],[w-27,h*.54],[w+7,h*.85],[-7,h*.85]],'#ae86e2','#f2d4a8',2);
 c.save();c.translate(w/2,floor-8);c.scale(1,.3);c.font='900 58px sans-serif';c.textAlign='center';c.fillStyle='#f4d96680';c.fillText('HM',0,0);c.restore();
 for(let n=0;n<3;n++){let yy=h*.50+n*14;line(c,[[15,yy],[w-15,yy]],n===1?'#ffda76':'#e5cbef',3);}for(const x of [15,w-15]){line(c,[[x,h*.43],[x,h*.82]],'#241a31',8);line(c,[[x,h*.43],[x,h*.82]],'#f8b84b',4);}c.fillStyle='#271738';c.fillRect(0,h*.90,w,h*.10);c.fillStyle='#bc86ee';c.font='900 11px sans-serif';c.fillText('1 vs 1  /  HEADS ONLY',w/2,h*.967);
 return floor;}
function hero(canvas,tier){const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;c.clearRect(0,0,w,h);let g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#7b36e7');g.addColorStop(1,'#be59e4');c.fillStyle=g;c.fillRect(0,0,w,h);for(let i=0;i<16;i++){const a=i*Math.PI/8;path(c,[[w*.73,h*.52],[w*.73+Math.cos(a)*w,h*.52+Math.sin(a)*w],[w*.73+Math.cos(a+.08)*w,h*.52+Math.sin(a+.08)*w]],'#ffdb6325',null);}for(let y=5;y<h;y+=12)for(let x=w*.55;x<w;x+=12)oval(c,x,y,1.1,1.1,'#3f126c22');path(c,[[w*.54,h],[w*.65,h*.61],[w*.73,h*.8],[w*.85,h*.45],[w,h*.76],[w,h]],'#ffe367',null);man(c,w*.77,h*.97,h/207,{tier,dir:-1,bag:true,bend:-.05});}
function portrait(canvas,tier){const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;c.clearRect(0,0,w,h);man(c,w/2,h-12,(h-20)/190,{tier,dir:1,bag:true});}
window.HMArt={man,stadium,hero,portrait,oval,line,path};
})();
