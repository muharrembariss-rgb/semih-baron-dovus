"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");
const W = canvas.width, H = canvas.height, GROUND = 505;
const OYUNCU1_ADI = "BEN ARTIK KİMSEDEN YEMEM SEMİH";
const OYUNCU2_ADI = "BARON ÖZCAN";

const files = {
  p1: "assets/oyuncu1.png", p1Punch: "assets/oyuncu1_yumruk.png",
  p2: "assets/oyuncu2.png", p2Punch: "assets/oyuncu2_yumruk.png"
};
const images = {};
const loadImage = src => new Promise((resolve, reject) => {
  const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src;
});

const controls = { left: false, right: false };
let state = "loading", countdownStart = 0, particles = [], shake = 0, last = 0;

class Fighter {
  constructor(x, facing, normal, punch, name) {
    this.startX=x; this.x=x; this.y=GROUND-210; this.vy=0; this.facing=facing;
    this.normal=normal; this.punch=punch; this.name=name; this.health=100;
    this.attack=0; this.hitDone=false; this.flash=0; this.aiCooldown=0;
  }
  reset(){ this.x=this.startX; this.y=GROUND-210; this.vy=0; this.health=100; this.attack=0; this.hitDone=false; this.flash=0; this.aiCooldown=0; }
  jump(){ if(this.y>=GROUND-211) this.vy=-17; }
  strike(){ if(this.attack<=0){ this.attack=15; this.hitDone=false; } }
  update(){
    this.y+=this.vy; this.vy+=1;
    if(this.y>GROUND-210){ this.y=GROUND-210; this.vy=0; }
    if(this.attack>0){ this.attack--; if(this.attack===0) this.hitDone=false; }
    if(this.flash>0) this.flash--; if(this.aiCooldown>0) this.aiCooldown--;
    this.x=Math.max(8,Math.min(W-148,this.x));
  }
  body(){ return {x:this.x+30,y:this.y+28,w:82,h:178}; }
  fist(){ return this.facing>0 ? {x:this.x+92,y:this.y+28,w:92,h:82} : {x:this.x-43,y:this.y+28,w:92,h:82}; }
  draw(){
    ctx.save(); ctx.globalAlpha=.38; ctx.fillStyle="#05020d"; ctx.beginPath();
    ctx.ellipse(this.x+70,GROUND+2,this.vy===0?58:42,10,0,0,Math.PI*2); ctx.fill(); ctx.restore();
    const img=this.attack>0?this.punch:this.normal;
    if(this.flash>0){ ctx.save(); ctx.shadowColor="#ff315f"; ctx.shadowBlur=28; ctx.drawImage(img,this.x,this.y,140,210); ctx.restore(); }
    else ctx.drawImage(img,this.x,this.y,140,210);
  }
}

let semih, baron;
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y+a.h>b.y&&a.y<b.y+b.h;

function burst(x,y,color){
  for(let i=0;i<25;i++) particles.push({x,y,vx:(Math.random()-.5)*14,vy:(Math.random()-.7)*12,r:3+Math.random()*6,life:22+Math.random()*14,color});
}
function updateParticles(){ particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.35;p.life--;p.r*=.96;}); particles=particles.filter(p=>p.life>0); }
function drawParticles(){ particles.forEach(p=>{ctx.globalAlpha=Math.min(1,p.life/12);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1; }

function gradient(){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#17063f");g.addColorStop(.58,"#40115d");g.addColorStop(1,"#120522");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  for(let i=0;i<48;i++){const x=(i*83)%W,y=(i*47)%250;ctx.fillStyle=`rgba(220,235,255,${.25+(i%4)*.16})`;ctx.fillRect(x,y,2+(i%2),2+(i%2));}
  ctx.fillStyle="#f4e8ff";ctx.shadowColor="#a95cff";ctx.shadowBlur=25;ctx.beginPath();ctx.arc(830,105,53,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  const buildings=[[20,300,130,205],[165,235,155,270],[335,320,125,185],[475,265,170,240],[660,305,125,200],[800,245,170,260]];
  buildings.forEach((b,bi)=>{ctx.fillStyle="#111329";ctx.fillRect(...b);for(let x=b[0]+18;x<b[0]+b[2]-10;x+=30)for(let y=b[1]+22;y<b[1]+b[3]-20;y+=36){if((x+y+bi)%4){ctx.fillStyle=["#ffe45c","#41ddff","#ff3fa4","#9f6cff"][(bi+x+y)%4];ctx.fillRect(x,y,9,14);}}});
  ctx.shadowBlur=12;ctx.shadowColor="#ff3fa4";ctx.strokeStyle="#ff3fa4";ctx.lineWidth=3;ctx.strokeRect(190,275,110,42);ctx.fillStyle="#ff74bd";ctx.font="bold 20px Arial";ctx.textAlign="center";ctx.fillText("FIGHT",245,303);ctx.shadowBlur=0;
  ctx.fillStyle="#21183e";ctx.fillRect(0,GROUND,W,H-GROUND);ctx.strokeStyle="#36e7ff";ctx.lineWidth=4;ctx.shadowColor="#36e7ff";ctx.shadowBlur=14;ctx.beginPath();ctx.moveTo(0,GROUND);ctx.lineTo(W,GROUND);ctx.stroke();ctx.shadowBlur=0;
  ctx.strokeStyle="#6d2f8a";ctx.lineWidth=1;for(let x=-300;x<1300;x+=100){ctx.beginPath();ctx.moveTo(W/2,GROUND);ctx.lineTo(x,H);ctx.stroke();}for(let y=530;y<H;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
}

function healthBar(x,y,value,color,right=false){
  const w=350,filled=w*Math.max(0,value)/100;ctx.fillStyle="#160d28";ctx.fillRect(x,y,w,28);ctx.shadowColor=color;ctx.shadowBlur=12;ctx.strokeStyle=color;ctx.lineWidth=3;ctx.strokeRect(x-3,y-3,w+6,34);ctx.fillStyle=color;ctx.fillRect(right?x+w-filled:x,y,filled,28);ctx.shadowBlur=0;
}
function hud(){
  healthBar(38,40,semih.health,"#38e8ff");healthBar(612,40,baron.health,"#ff3f9f",true);
  ctx.font="bold 18px Arial";ctx.textAlign="left";ctx.fillStyle="#68ecff";ctx.fillText("BEN ARTIK KİMSEDEN YEMEM SEMİH",38,94);ctx.textAlign="right";ctx.fillStyle="#ff6ab7";ctx.fillText("BARON ÖZCAN",962,94);
}
function title(text,size,y,color){ctx.save();ctx.textAlign="center";ctx.font=`900 ${size}px Arial`;ctx.shadowColor=color;ctx.shadowBlur=25;ctx.fillStyle=color;ctx.fillText(text,W/2,y);ctx.restore();}

function reset(){ semih.reset();baron.reset();particles=[]; }
function start(){ reset();state="countdown";countdownStart=performance.now();startButton.classList.add("hidden"); }

function intro(){gradient();ctx.drawImage(images.p1,100,145,220,330);ctx.drawImage(images.p2,680,145,220,330);title("NEON DÖVÜŞ",52,68,"#ffe75d");title("VS",105,315,"#ffe75d");ctx.font="bold 21px Arial";ctx.textAlign="center";ctx.fillStyle="#fff";ctx.fillText("BEN ARTIK KİMSEDEN YEMEM SEMİH",225,510);ctx.font="bold 31px Arial";ctx.fillText("BARON ÖZCAN",785,510);}

function ai(){
  const distance=baron.x-semih.x;
  if(distance>145) baron.x-=3.15; else if(distance<86) baron.x+=2.3;
  if(distance<170&&baron.aiCooldown<=0){baron.strike();baron.aiCooldown=45+Math.random()*45;}
  if(distance<220&&Math.random()<.004) baron.jump();
}
function hit(attacker,target,color,push){
  if(attacker.attack>0&&!attacker.hitDone&&overlap(attacker.fist(),target.body())){target.health=Math.max(0,target.health-10);target.x+=push;target.flash=9;attacker.hitDone=true;shake=8;burst(target.x+70,target.y+70,color);}
}
function update(){
  if(state!=="fight")return;
  if(semih.health<=0||baron.health<=0)return;
  if(controls.left)semih.x-=6;if(controls.right)semih.x+=6;ai();semih.update();baron.update();hit(semih,baron,"#5deaff",30);hit(baron,semih,"#ff4fa5",-30);updateParticles();
}
function fightScene(){
  ctx.save();if(shake>0){ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake*=.7;}gradient();hud();semih.draw();baron.draw();drawParticles();ctx.restore();
  if(semih.health<=0||baron.health<=0){ctx.fillStyle="#080313bb";ctx.fillRect(0,0,W,H);title(semih.health<=0?"BARON ÖZCAN KAZANDI!":"SEMİH KAZANDI!",55,260,semih.health<=0?"#ff4fa5":"#4cecff");ctx.font="bold 24px Arial";ctx.textAlign="center";ctx.fillStyle="#fff";ctx.fillText("Tekrar oynamak için ekrana dokun",W/2,325);state="over";}
}
function frame(t){
  if(state==="intro")intro();
  else if(state==="countdown"){
    gradient();hud();semih.draw();baron.draw();const n=t-countdownStart;const text=n<900?"3":n<1800?"2":n<2700?"1":"DÖVÜŞ!";title(text,text==="DÖVÜŞ!"?95:135,315,text==="DÖVÜŞ!"?"#ffdd4d":"#fff");if(n>3500)state="fight";
  } else {update();fightScene();}
  last=t;requestAnimationFrame(frame);
}

document.querySelectorAll("[data-control]").forEach(button=>{
  const action=button.dataset.control;
  const down=e=>{e.preventDefault();button.classList.add("active");if(action==="left"||action==="right")controls[action]=true;if(state==="fight"&&action==="jump")semih.jump();if(state==="fight"&&action==="punch")semih.strike();};
  const up=e=>{e.preventDefault();button.classList.remove("active");if(action==="left"||action==="right")controls[action]=false;};
  button.addEventListener("pointerdown",down);button.addEventListener("pointerup",up);button.addEventListener("pointercancel",up);button.addEventListener("pointerleave",up);
});
startButton.addEventListener("click",start);
canvas.addEventListener("pointerdown",()=>{if(state==="over")start();});
window.addEventListener("keydown",e=>{if(e.code==="ArrowLeft"||e.code==="KeyA")controls.left=true;if(e.code==="ArrowRight"||e.code==="KeyD")controls.right=true;if(e.code==="KeyW"||e.code==="ArrowUp")semih?.jump();if(e.code==="KeyF"||e.code==="Space"){e.preventDefault();if(state==="intro")start();else semih?.strike();}});
window.addEventListener("keyup",e=>{if(e.code==="ArrowLeft"||e.code==="KeyA")controls.left=false;if(e.code==="ArrowRight"||e.code==="KeyD")controls.right=false;});

Promise.all(Object.entries(files).map(async([key,src])=>images[key]=await loadImage(src))).then(()=>{
  semih=new Fighter(130,1,images.p1,images.p1Punch,OYUNCU1_ADI);
  baron=new Fighter(730,-1,images.p2,images.p2Punch,OYUNCU2_ADI);
  state="intro";requestAnimationFrame(frame);
}).catch(()=>{ctx.fillStyle="#130923";ctx.fillRect(0,0,W,H);title("Görseller yüklenemedi",42,300,"#ff5c9d");});
