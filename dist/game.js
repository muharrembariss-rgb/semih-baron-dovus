"use strict";
const canvas=document.getElementById("game"),ctx=canvas.getContext("2d"),startButton=document.getElementById("startButton"),fullscreenButton=document.getElementById("fullscreenButton"),gameShell=document.querySelector(".game-shell");
const W=canvas.width,H=canvas.height,GROUND=505,ROUND_SECONDS=60,MAX_HEALTH=140;
const OYUNCU1_ADI="BEN ARTIK KİMSEDEN YEMEM SEMİH",MUHARREM_ADI="MUHARREM",OYUNCU2_ADI="BARON ÖZCAN";
const files={stage:"assets/arcade-sokak.png",p1:"assets/oyuncu1.png",p1Punch:"assets/oyuncu1_yumruk.png",p1Block:"assets/semih_savun.png",p1Special:"assets/semih_ozel.png",muharrem:"assets/muharrem.png",muharremPunch:"assets/muharrem_yumruk.png",muharremBlock:"assets/muharrem_savun.png",muharremSpecial:"assets/muharrem_ozel.png",p2:"assets/oyuncu2.png",p2Punch:"assets/oyuncu2_yumruk.png",p2Block:"assets/baron_savun.png",p2Special:"assets/baron_ozel.png"},images={};
const loadImage=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});
const controls={left:false,right:false};
let state="loading",countdownStart=0,roundEnd=0,round=1,semihWins=0,baronWins=0,roundMessage="",roundWinner=null,particles=[],shake=0,selectedPlayerKey=null,fighterDefs={};

class Fighter{
  constructor(x,facing,normal,punch,block,special,name,artFacing=1){this.startX=x;this.facing=facing;this.normal=normal;this.punch=punch;this.block=block;this.special=special;this.name=name;this.artFacing=artFacing;this.reset();}
  reset(){this.x=this.startX;this.y=GROUND-210;this.vy=0;this.health=MAX_HEALTH;this.energy=0;this.attack=0;this.attackCooldown=0;this.attackKind="light";this.damage=5;this.hitDone=false;this.flash=0;this.aiCooldown=0;this.blocking=false;}
  jump(){if(this.y>=GROUND-211&&!this.blocking)this.vy=-17;}
  strike(kind="light"){
    if(this.attack>0||this.attackCooldown>0||this.blocking||(kind==="special"&&this.energy<100))return false;
    this.attackKind=kind;this.attack=kind==="special"?32:18;this.attackCooldown=kind==="special"?70:38;this.damage=kind==="special"?18:5;
    if(kind==="special")this.energy=0;this.hitDone=false;return true;
  }
  setBlock(value){if(this.attack<=0)this.blocking=value;}
  update(){
    this.y+=this.vy;this.vy+=1;if(this.y>GROUND-210){this.y=GROUND-210;this.vy=0;}
    if(this.attack>0){this.attack--;if(this.attack===0)this.hitDone=false;}if(this.attackCooldown>0)this.attackCooldown--;if(this.flash>0)this.flash--;if(this.aiCooldown>0)this.aiCooldown--;
    this.x=Math.max(8,Math.min(W-148,this.x));
  }
  body(){return{x:this.x+30,y:this.y+28,w:82,h:178};}
  fist(){const reach=this.attackKind==="special"?125:92;return this.facing>0?{x:this.x+92,y:this.y+28,w:reach,h:82}:{x:this.x+48-reach,y:this.y+28,w:reach,h:82};}
  draw(){
    ctx.save();ctx.globalAlpha=.38;ctx.fillStyle="#05020d";ctx.beginPath();ctx.ellipse(this.x+70,GROUND+2,this.vy===0?58:42,10,0,0,Math.PI*2);ctx.fill();ctx.restore();
    if(this.attackKind==="special"&&this.attack>0){ctx.save();ctx.strokeStyle="#b7ff63";ctx.lineWidth=5;ctx.shadowColor="#82ff30";ctx.shadowBlur=25;ctx.beginPath();ctx.arc(this.x+70,this.y+105,85+Math.sin(this.attack)*6,0,Math.PI*2);ctx.stroke();ctx.restore();}
    if(this.blocking){ctx.save();ctx.strokeStyle="#8fb1ff";ctx.lineWidth=6;ctx.shadowColor="#7397ff";ctx.shadowBlur=22;ctx.beginPath();ctx.arc(this.x+70,this.y+105,77,-1.35,1.35,this.facing<0);ctx.stroke();ctx.restore();}
    const img=this.attackKind==="special"&&this.attack>0?this.special:this.attack>0?this.punch:this.blocking?this.block:this.normal;
    const flip=this.facing!==this.artFacing,drawX=this.x+(this.attackKind==="special"&&this.attack>0?this.facing*8:0);ctx.save();if(this.flash>0){ctx.globalAlpha=.65;ctx.shadowColor="#fff";ctx.shadowBlur=32;}ctx.translate(drawX+(flip?140:0),this.y);ctx.scale(flip?-1:1,1);ctx.drawImage(img,0,0,140,210);ctx.restore();
  }
}

let semih,baron;
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y+a.h>b.y&&a.y<b.y+b.h;
function burst(x,y,color,count=25){for(let i=0;i<count;i++)particles.push({x,y,vx:(Math.random()-.5)*16,vy:(Math.random()-.7)*13,r:3+Math.random()*6,life:22+Math.random()*14,color});}
function updateParticles(){particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.35;p.life--;p.r*=.96;});particles=particles.filter(p=>p.life>0);}
function drawParticles(){particles.forEach(p=>{ctx.globalAlpha=Math.min(1,p.life/12);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;}

function gradient(){
  ctx.drawImage(images.stage,0,0,W,H);
  const shade=ctx.createLinearGradient(0,0,0,180);shade.addColorStop(0,"#08040dcc");shade.addColorStop(1,"#08040d00");ctx.fillStyle=shade;ctx.fillRect(0,0,W,190);
  ctx.fillStyle="#0a061144";ctx.fillRect(0,GROUND,W,H-GROUND);
  ctx.strokeStyle="#ffbd45";ctx.lineWidth=3;ctx.shadowColor="#ff7138";ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(0,GROUND);ctx.lineTo(W,GROUND);ctx.stroke();ctx.shadowBlur=0;
  return;
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#17063f");g.addColorStop(.58,"#40115d");g.addColorStop(1,"#120522");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  for(let i=0;i<48;i++){const x=(i*83)%W,y=(i*47)%250;ctx.fillStyle=`rgba(220,235,255,${.25+(i%4)*.16})`;ctx.fillRect(x,y,2+(i%2),2+(i%2));}
  ctx.fillStyle="#f4e8ff";ctx.shadowColor="#a95cff";ctx.shadowBlur=25;ctx.beginPath();ctx.arc(830,105,53,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  const buildings=[[20,300,130,205],[165,235,155,270],[335,320,125,185],[475,265,170,240],[660,305,125,200],[800,245,170,260]];
  buildings.forEach((b,bi)=>{ctx.fillStyle="#111329";ctx.fillRect(...b);for(let x=b[0]+18;x<b[0]+b[2]-10;x+=30)for(let y=b[1]+22;y<b[1]+b[3]-20;y+=36)if((x+y+bi)%4){ctx.fillStyle=["#ffe45c","#41ddff","#ff3fa4","#9f6cff"][(bi+x+y)%4];ctx.fillRect(x,y,9,14);}});
  ctx.shadowBlur=12;ctx.shadowColor="#ff3fa4";ctx.strokeStyle="#ff3fa4";ctx.lineWidth=3;ctx.strokeRect(190,275,110,42);ctx.fillStyle="#ff74bd";ctx.font="bold 20px Arial";ctx.textAlign="center";ctx.fillText("FIGHT",245,303);ctx.shadowBlur=0;
  ctx.fillStyle="#21183e";ctx.fillRect(0,GROUND,W,H-GROUND);ctx.strokeStyle="#36e7ff";ctx.lineWidth=4;ctx.shadowColor="#36e7ff";ctx.shadowBlur=14;ctx.beginPath();ctx.moveTo(0,GROUND);ctx.lineTo(W,GROUND);ctx.stroke();ctx.shadowBlur=0;
  ctx.strokeStyle="#6d2f8a";ctx.lineWidth=1;for(let x=-300;x<1300;x+=100){ctx.beginPath();ctx.moveTo(W/2,GROUND);ctx.lineTo(x,H);ctx.stroke();}for(let y=530;y<H;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
}
function meter(x,y,value,color,w=350,right=false){const filled=w*Math.max(0,value)/100;ctx.fillStyle="#160d28";ctx.fillRect(x,y,w,28);ctx.shadowColor=color;ctx.shadowBlur=12;ctx.strokeStyle=color;ctx.lineWidth=3;ctx.strokeRect(x-3,y-3,w+6,34);ctx.fillStyle=color;ctx.fillRect(right?x+w-filled:x,y,filled,28);ctx.shadowBlur=0;}
function winDots(x,y,wins,right=false){for(let i=0;i<2;i++){ctx.beginPath();ctx.fillStyle=i<wins?"#ffe55c":"#302548";ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.arc(x+(right?-i:i)*22,y,7,0,Math.PI*2);ctx.fill();ctx.stroke();}}
function hud(now=performance.now()){
  meter(38,38,semih.health/MAX_HEALTH*100,"#38e8ff");meter(612,38,baron.health/MAX_HEALTH*100,"#ff3f9f",350,true);meter(38,78,semih.energy,"#9aff55",250);meter(712,78,baron.energy,"#9aff55",250,true);
  ctx.font="bold 16px Arial";ctx.textAlign="left";ctx.fillStyle="#68ecff";ctx.fillText(semih.name,38,125);ctx.textAlign="right";ctx.fillStyle="#ff6ab7";ctx.fillText(baron.name,962,125);
  const time=state==="fight"?Math.max(0,Math.ceil((roundEnd-now)/1000)):ROUND_SECONDS;ctx.textAlign="center";ctx.font="900 43px Arial";ctx.fillStyle=time<=10?"#ff405f":"#fff36a";ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=15;ctx.fillText(String(time).padStart(2,"0"),500,71);ctx.shadowBlur=0;ctx.font="bold 16px Arial";ctx.fillStyle="#fff";ctx.fillText(`RAUND ${round}`,500,98);winDots(45,145,semihWins);winDots(955,145,baronWins,true);
  if(semih.energy>=100){ctx.textAlign="left";ctx.fillStyle="#b5ff68";ctx.font="900 17px Arial";ctx.fillText("ÖZEL HAZIR!",38,104);}
}
function title(text,size,y,color){ctx.save();ctx.textAlign="center";ctx.font=`900 ${size}px Arial`;ctx.shadowColor=color;ctx.shadowBlur=25;ctx.fillStyle=color;ctx.fillText(text,W/2,y);ctx.restore();}
function resetRound(){semih.reset();baron.reset();particles=[];controls.left=false;controls.right=false;}
function beginRound(){resetRound();state="countdown";countdownStart=performance.now();startButton.classList.add("hidden");}
function startMatch(){round=1;semihWins=0;baronWins=0;roundWinner=null;beginRound();}
function intro(){gradient();drawPortrait(semih,100,145,220,330);drawPortrait(baron,680,145,220,330);title("NEON DÖVÜŞ",52,68,"#ffe75d");title("VS",105,315,"#ffe75d");ctx.font="bold 21px Arial";ctx.textAlign="center";ctx.fillStyle="#fff";ctx.fillText(semih.name,225,510);ctx.font="bold 24px Arial";ctx.fillText(baron.name,785,510);}

function drawPortrait(fighter,x,y,w,h){ctx.save();if(fighter.artFacing<0){ctx.translate(x+w,y);ctx.scale(-1,1);ctx.drawImage(fighter.normal,0,0,w,h);}else ctx.drawImage(fighter.normal,x,y,w,h);ctx.restore();}

function selectScene(){
  gradient();ctx.fillStyle="#07030bc9";ctx.fillRect(0,0,W,H);title(state==="selectPlayer"?"DÖVÜŞÇÜNÜ SEÇ":"RAKİBİNİ SEÇ",46,67,"#ffe75d");
  const cards=[{key:"semih",x:60,color:"#38e8ff"},{key:"muharrem",x:365,color:"#ffb347"},{key:"baron",x:670,color:"#ff4f9d"}];
  cards.forEach(card=>{const def=fighterDefs[card.key],disabled=state==="selectOpponent"&&card.key===selectedPlayerKey;ctx.save();ctx.globalAlpha=disabled?0.35:1;ctx.fillStyle="#12091ddd";ctx.strokeStyle=card.color;ctx.lineWidth=4;ctx.shadowColor=card.color;ctx.shadowBlur=18;ctx.fillRect(card.x,105,270,420);ctx.strokeRect(card.x,105,270,420);ctx.shadowBlur=0;if(def.artFacing<0){ctx.translate(card.x+225,125);ctx.scale(-1,1);ctx.drawImage(def.normal,0,0,180,300);}else ctx.drawImage(def.normal,card.x+45,125,180,300);ctx.fillStyle=card.color;ctx.font="900 27px Arial";ctx.textAlign="center";ctx.fillText(def.shortName,card.x+135,470);ctx.font="bold 15px Arial";ctx.fillStyle="#fff";ctx.fillText(disabled?"SEÇİLDİ":"SEÇMEK İÇİN DOKUN",card.x+135,505);ctx.restore();});
}
function makeFighter(key,x,facing){const d=fighterDefs[key];return new Fighter(x,facing,d.normal,d.punch,d.block,d.special,d.name,d.artFacing);}
function chooseFighter(key){if(state==="selectPlayer"){selectedPlayerKey=key;state="selectOpponent";return;}if(key===selectedPlayerKey)return;semih=makeFighter(selectedPlayerKey,130,1);baron=makeFighter(key,730,-1);state="intro";startButton.classList.remove("hidden");}
async function enterFullscreen(){try{if(!document.fullscreenElement){if(gameShell.requestFullscreen)await gameShell.requestFullscreen();else if(gameShell.webkitRequestFullscreen)gameShell.webkitRequestFullscreen();}if(screen.orientation?.lock)await screen.orientation.lock("landscape");}catch(_error){/* Bazı mobil tarayıcılar yön kilidini desteklemez. */}}

function ai(){
  const delta=semih.x-baron.x,distance=Math.abs(delta);baron.blocking=false;
  if(semih.attack>0&&distance<190&&Math.random()<.16){baron.setBlock(true);return;}
  if(distance>190)baron.x+=Math.sign(delta)*2.45;else if(distance<105)baron.x-=Math.sign(delta)*2.1;
  if(distance<185&&baron.aiCooldown<=0){const special=baron.energy>=100&&Math.random()<.55;baron.strike(special?"special":"light");baron.aiCooldown=special?85:38+Math.random()*40;}
  if(distance<225&&Math.random()<.0045)baron.jump();
}
function faceEachOther(){if(semih.x+70<baron.x+70){semih.facing=1;baron.facing=-1;}else{semih.facing=-1;baron.facing=1;}}
function hit(attacker,target,color,push){
  if(attacker.attack<=0||attacker.hitDone||!overlap(attacker.fist(),target.body()))return;
  const blocked=target.blocking&&target.vy===0,damage=blocked?Math.ceil(attacker.damage*.25):attacker.damage;
  target.health=Math.max(0,target.health-damage);target.energy=Math.min(100,target.energy+(blocked?4:10));attacker.energy=Math.min(100,attacker.energy+(blocked?5:16));target.x+=blocked?push*.18:push;target.flash=blocked?4:9;attacker.hitDone=true;shake=blocked?3:attacker.attackKind==="special"?15:8;
  burst(target.x+70,target.y+70,blocked?"#93adff":color,blocked?10:attacker.attackKind==="special"?45:25);if(navigator.vibrate)navigator.vibrate(blocked?18:attacker.attackKind==="special"?70:35);
}
function finishRound(message,winner){if(state!=="fight")return;roundMessage=message;roundWinner=winner;if(winner==="semih")semihWins++;if(winner==="baron")baronWins++;state=(semihWins>=2||baronWins>=2)?"matchover":"roundover";}
function update(now){
  if(state!=="fight")return;if(controls.left&&!semih.blocking)semih.x-=6;if(controls.right&&!semih.blocking)semih.x+=6;ai();semih.update();baron.update();faceEachOther();hit(semih,baron,"#5deaff",semih.facing*30);hit(baron,semih,"#ff4fa5",baron.facing*30);updateParticles();
  if(semih.health<=0||baron.health<=0)finishRound("K.O.!",semih.health<=0?"baron":"semih");else if(now>=roundEnd){if(semih.health===baron.health)finishRound("BERABERE",null);else finishRound("SÜRE BİTTİ",semih.health>baron.health?"semih":"baron");}
}
function fightScene(now){
  ctx.save();if(shake>0){ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake*=.7;}gradient();hud(now);semih.draw();baron.draw();drawParticles();ctx.restore();
  if(state==="roundover"||state==="matchover"){ctx.fillStyle="#080313c7";ctx.fillRect(0,0,W,H);title(roundMessage,82,235,"#fff15d");const name=roundWinner==="semih"?semih.name:roundWinner==="baron"?baron.name:"KAZANAN YOK";title(state==="matchover"?`${name} MAÇI KAZANDI!`:`${name} RAUNDU KAZANDI`,40,300,roundWinner==="baron"?"#ff4fa5":"#4cecff");ctx.font="bold 23px Arial";ctx.textAlign="center";ctx.fillStyle="#fff";ctx.fillText(state==="matchover"?"Yeni eşleşme için ekrana dokun":"Sonraki raund için ekrana dokun",W/2,355);}
}
function frame(t){
  if(state==="selectPlayer"||state==="selectOpponent")selectScene();else if(state==="intro")intro();else if(state==="countdown"){gradient();hud(t);faceEachOther();semih.draw();baron.draw();const n=t-countdownStart,text=n<800?"3":n<1600?"2":n<2400?"1":"DÖVÜŞ!";title(text,text==="DÖVÜŞ!"?95:135,315,text==="DÖVÜŞ!"?"#ffdd4d":"#fff");if(n>3100){state="fight";roundEnd=t+ROUND_SECONDS*1000;}}else{update(t);fightScene(t);}requestAnimationFrame(frame);
}
document.querySelectorAll("[data-control]").forEach(button=>{
  const action=button.dataset.control;
  const down=e=>{e.preventDefault();button.setPointerCapture?.(e.pointerId);button.classList.add("active");if(action==="left"||action==="right")controls[action]=true;if(state!=="fight")return;if(action==="jump")semih.jump();if(action==="punch")semih.strike("light");if(action==="special")semih.strike("special");if(action==="block")semih.setBlock(true);};
  const up=e=>{e.preventDefault();button.classList.remove("active");if(action==="left"||action==="right")controls[action]=false;if(action==="block")semih?.setBlock(false);};
  button.addEventListener("pointerdown",down);button.addEventListener("pointerup",up);button.addEventListener("pointercancel",up);button.addEventListener("pointerleave",up);button.addEventListener("contextmenu",e=>e.preventDefault());
});
startButton.addEventListener("click",()=>{enterFullscreen();startMatch();});fullscreenButton.addEventListener("click",enterFullscreen);canvas.addEventListener("pointerdown",e=>{const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)*W/rect.width,y=(e.clientY-rect.top)*H/rect.height;if((state==="selectPlayer"||state==="selectOpponent")&&y>105&&y<540){if(x>60&&x<330)chooseFighter("semih");else if(x>365&&x<635)chooseFighter("muharrem");else if(x>670&&x<940)chooseFighter("baron");}else if(state==="roundover"){round++;beginRound();}else if(state==="matchover"){selectedPlayerKey=null;state="selectPlayer";startButton.classList.add("hidden");}});
window.addEventListener("keydown",e=>{if(e.code==="ArrowLeft"||e.code==="KeyA")controls.left=true;if(e.code==="ArrowRight"||e.code==="KeyD")controls.right=true;if(e.code==="KeyW"||e.code==="ArrowUp")semih?.jump();if(e.code==="KeyS")semih?.setBlock(true);if(e.code==="KeyF"||e.code==="Space"){e.preventDefault();if(state==="intro")startMatch();else if(state==="fight")semih?.strike("light");}if(e.code==="KeyG"&&state==="fight")semih?.strike("special");});
window.addEventListener("keyup",e=>{if(e.code==="ArrowLeft"||e.code==="KeyA")controls.left=false;if(e.code==="ArrowRight"||e.code==="KeyD")controls.right=false;if(e.code==="KeyS")semih?.setBlock(false);});window.addEventListener("blur",()=>{controls.left=false;controls.right=false;semih?.setBlock(false);});
Promise.all(Object.entries(files).map(async([key,src])=>images[key]=await loadImage(src))).then(()=>{
  fighterDefs={semih:{name:OYUNCU1_ADI,shortName:"SEMİH",normal:images.p1,punch:images.p1Punch,block:images.p1Block,special:images.p1Special,artFacing:1},muharrem:{name:MUHARREM_ADI,shortName:"MUHARREM",normal:images.muharrem,punch:images.muharremPunch,block:images.muharremBlock,special:images.muharremSpecial,artFacing:1},baron:{name:OYUNCU2_ADI,shortName:"BARON ÖZCAN",normal:images.p2,punch:images.p2Punch,block:images.p2Block,special:images.p2Special,artFacing:-1}};
  semih=makeFighter("semih",130,1);baron=makeFighter("baron",730,-1);state="selectPlayer";requestAnimationFrame(frame);
}).catch(()=>{ctx.fillStyle="#130923";ctx.fillRect(0,0,W,H);title("Görseller yüklenemedi",42,300,"#ff5c9d");});
