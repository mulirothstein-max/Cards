const http=require('http'),fs=require('fs'),path=require('path');
const {WebSocketServer}=require('ws');
const html=fs.readFileSync(path.join(__dirname,'index.html'));
const server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});
const wss=new WebSocketServer({server});
const SZ=[6,5,4,3,2,1],POSN=['ST','LW','RW','CM','LB','RB','CB','GK'];
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
const DB="Messi:1987:F,Cristiano Ronaldo:1985:F,Neymar:1992:F,Mbappé:1998:F,Haaland:2000:F,Salah:1992:F,Modrić:1985:M,De Bruyne:1991:M,Lewandowski:1988:F,Benzema:1987:F,Kane:1993:F,Vinícius Júnior:2000:F,Bellingham:2003:M,Lamine Yamal:2007:F,Pedri:2002:M,Rodri:1996:M,Griezmann:1991:F,Son:1992:F,Mané:1992:F,Kroos:1990:M,Iniesta:1984:M,Xavi:1980:M,Zidane:1972:M,Ronaldinho:1980:F,Ronaldo Nazário:1976:F,Henry:1977:F,Rooney:1985:F,Ibrahimović:1981:F,Buffon:1978:G,Pirlo:1979:M,Maldini:1968:D,Cantona:1966:F,Beckham:1975:M,Totti:1976:F,Raúl:1977:F,Casillas:1981:G,Neuer:1986:G,Courtois:1992:G,Alisson:1992:G,Van Dijk:1991:D,Sergio Ramos:1986:D,Piqué:1987:D,Suárez:1987:F,Agüero:1988:F,Di María:1988:F,Lautaro Martínez:1997:F,Saka:2001:F,Foden:2000:M,Rashford:1997:F,Müller:1989:F,Özil:1988:M,Hazard:1991:F,Pogba:1993:M,Kanté:1991:M,Dybala:1993:F,Chiesa:1997:F,Osimhen:1998:F".split(',').map(s=>{const[n,y,p]=s.split(':');return{n,y:+y,p,k:norm(n)}});
const canon=k=>{const m=DB.filter(d=>d.k===k||d.k.split(' ').includes(k));return m.length===1?m[0]:null};
const REG=[['pos','CB','CENTRE BACK',6],['pos','GK','GOALKEEPER',6],['pos','ST','STRIKER',6],['pos','MID','MIDFIELDER CM/AM/DM',6],['pos','WING','WINGER RW/LW',6],
['ach','UCL','UCL WINNER',6],['ach','BDO',"BALLON D'OR WINNER",4],['ach','GB','GOLDEN BOOT WINNER',4],['ach','WC','WORLD CUP WINNER',5],['ach','LT','LEAGUE TITLES 2+',6],['ach','TR','WON TREBLE',5],['ach','EU3','WON 3+ EUROPEAN TROPHIES',5],
['eur','E5',"PLAYED IN 3+ EUROPE'S BEST 5",6],['foot','R','RIGHT FOOTED',5],['foot','L','LEFT FOOTED',5],
['age','30P','AT LEAST 30+ YEARS OLD',6],['age','U30','UNDER 30 YEARS OLD',6],
['league','PL','PLAYED IN PREMIER LEAGUE',5],['league','L1','PLAYED IN LIGUE 1',5],['league','SA','PLAYED IN SERIE A',5],['league','BL','PLAYED IN BUNDESLIGA',5],['league','LL','PLAYED IN LA LIGA',5],
['with','RON','PLAYED WITH RONALDO',2],['with','MES','PLAYED WITH MESSI',2],
['goals','G200','SCORED 200+ GOALS',5],['final','FIN','SCORED IN AN IMPORTANT FINAL',4],['ret','RET','RETIRED',5]];
[['ES','SPAIN'],['EN','ENGLAND'],['FR','FRANCE'],['AR','ARGENTINA'],['PT','PORTUGAL'],['IT','ITALY'],['DE','GERMANY']].forEach(([v,n])=>REG.push(['born',v,'BORN IN '+n,3]));
['REAL MADRID','MAN CITY','JUVENTUS','AC MILAN','PSG','LIVERPOOL','MAN UTD','BARCELONA'].forEach(n=>REG.push(['club',n,'PLAYED IN '+n,3]));
const PUN=[['בדיקת כשירות רפואית פתאומית','אם לקח לך יותר מ-10 שניות להגיד שחקן שמתאים לקלפים על השולחן, שלוף 2 קלפי עונש מהקופה.','medical'],
['וואן דייק עשה עליך גליץ׳','קרעת את הצולבת ואתה לא כשיר לשחק במחזור הקרוב (התור הבא שלך מבוטל).','skip1'],
['סקאוטים טעו','אמרת שחקן שלא באמת עונה על אחת הקטגוריות? אתה פוסל את עצמך, מקבל צהוב ושולף קלף נוסף.','scouts'],
['חילוף דקה 90','תפסו אותך לא מוכן. עליך לזרוק תוך 5 שניות שם של שחקן עבר אגדי מלפני שנת 2000. נתקעת? שלוף קלף.','m90'],
['שחקן בית של המועדון','אם אחד הקלפים הוא קבוצה, אסור לך להגיד שחקן רכש יקר. עליך למצוא שחקן שגדל במחלקת הנוער של אותה קבוצה, אחרת שלוף קלף.','youth'],
['סרחיו ראמוס נכנס בך מאחורה','קרעת את הצולבת, ולכן שני התורים הבאים שלך מבוטלים.','skip2'],
['פפ גווארדיולה עשה רוטציה מוגזמת','כל השחקנים בשולחן מעבירים את כל הקלפים שבידם לשחקן שיושב משמאלם.','rot'],
['השופט שלף אדום ישיר','זרוק את הקלף שהכי קרוב לריאל מדריד שיש לך ביד, והסבר איך הוא מתקשר אליה.','redcard'],
['זלאטן איברהימוביץ׳ חושב שאתה שחקן חלש','אסור לך לדבר או להעיר הערות במשך סיבוב שלם (בתור הבא אינך יכול להגיד שם של שחקן).','zlatan'],
['אנצ׳לוטי שלף את הגבה המפורסמת','בחר שחקן אחר בשולחן שידבר במקומך בתור הזה.','ancelotti'],
['הצעה ערבית הזויה מחוץ לחלון ההעברות','החלף את כל הקלפים שלך עם השחקן שיש לו הכי הרבה קלפים ביד, בלי להסתכל על הקלפים שלו.','arab'],
['חדר ההלבשה','כל השחקנים מעבירים לך קלף אחד לבחירתם מידם.','locker'],
['מוריניו מחנה את האוטובוס','בתור הבא אסור לך לומר שם של חלוץ או קשר, רק מגנים ושוערים.','mourinho'],
['יובנטוס החלה לשחק התקפי','בתור הבא אסור לך לומר שחקן הגנה או שוער, רק קשרים וחלוצים.','juve'],
['רונאלדו גנב לך גול','תגנוב לשחקן שאחריך קלף.','ronaldo'],
['קפטן עם סרט','אתה הקפטן עד שמישהו אחר מקבל כרטיס. כל מחלוקת בין שחקנים מוכרעת על ידך, ומי שמערער על החלטתך שולף קלף.','captain'],
['קונטה עובר לשלוש בלמים','בתור הבא אתה חייב לומר שחקן שיכול לשחק גם בהגנה וגם בהתקפה (כמו מגן שמבקיע). לא הצלחת? שלוף קלף.','conte'],
['הנדסת פרוטוקול של פיפ״א','בחר כלל חדש שיחול על כולם בסיבוב הבא (למשל: אסור לומר שם פרטי). מי שהפר, שולף קלף.','fifa'],
['ונגר מסתכל על השעון','כל השחקנים עוצמים עיניים. אתה אומר שחקן, והם צריכים לנחש את הקבוצה שלו. כל מי שטעה שולף קלף, ואתה שולף קלף על כל טועה.','wenger'],
['בקשת מחילה ממשפחה של שחקן','שחקן לבחירתך אומר שם של שחקן, ואתה חייב לומר שתי קבוצות שהוא שיחק בהן. לא הצלחת? שלוף קלף.','family'],
['מסי מתנדב לבעוט פנדל','מי שיש לו הכי פחות קלפים ביד נבחר לשחק מולך בסיבוב אבן-נייר-ומספריים. המפסיד שולף 2.','messi']];

let cid=0,G;
const sh=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function mk(){const d=[];REG.forEach(([cat,v,l,n])=>{for(let i=0;i<n;i++)d.push({id:'c'+(++cid),k:'reg',cat,v,l})});
 for(let i=0;i<6;i++)d.push({id:'c'+(++cid),k:'red',l:'RED CARD'});for(let i=0;i<5;i++)d.push({id:'c'+(++cid),k:'var',l:'VAR'});return sh(d)}
function fresh(){G={phase:'lobby',pl:G?G.pl:[],deck:[],pun:[],disc:[],pdisc:[],piles:[[],[],[]],turn:0,left:45000,choose:false,vote:null,modal:null,mq:[],said:[],rank:[],msg:'',last:null,ref:'',ev:[],ann:null,pending:'',spec:null,after:null,captain:null,mute:null,rule:null,fast:false};G.pl.forEach(p=>{p.ready=false;p.hand=[];p.out=false;p.skip=0;p.ri=0;p.mega=true;p.yellow=0;delete p.pen})}
fresh();
const pm=m=>{G.mq.push(m);if(!G.modal)G.modal=G.mq.shift()};
const CATHE={pos:'עמדה',ach:'הישג',eur:'ליגות אירופה',foot:'רגל',age:'גיל',league:'ליגה',with:'שיחק עם',club:'קבוצה',born:'מדינת לידה',goals:'שערים',final:'גמר',ret:'פרש'};
let evs=0;function evp(o){G.ev.push(Object.assign({s:++evs},o));if(G.ev.length>8)G.ev.shift()}
const top=i=>G.piles[i][G.piles[i].length-1];
function clash(c,pi){for(let j=0;j<3;j++){if(j===pi)continue;const t=top(j);if(!t||t.cat!==c.cat)continue;if((c.cat==='league'||c.cat==='club')&&t.v!==c.v)continue;return true}return false}
function refresh(){G.piles.forEach(p=>{while(p.length>1)G.deck.push(p.shift())});sh(G.deck);G.ref+='הקופה התרוקנה: הקלפים שנצברו מתחת לערימות הערבבו וחזרו לקופה. '}
function draw(){if(!G.deck.length)refresh();if(!G.deck.length){G.deck=sh(G.disc.filter(c=>c.k!=='pun'));G.disc=G.disc.filter(c=>c.k==='pun')}return G.deck.pop()}
function drawPun(){if(!G.pun.length){G.pun=sh(G.pdisc);G.pdisc=[];G.ref+='קופת העונשים התרוקנה וחודשה מקלפי העונש ששימשו. '}return G.pun.pop()}
function give(p,n,from){for(let i=0;i<n;i++)p.hand.push(draw());if(G.phase==='play'&&n>0)evp({k:'draw',to:p.id,n,from:from||'deck'})}
function penDraw(p,n){for(let i=0;i<n;i++){const c=drawPun();pm({kind:'pun',title:c.t,text:c.d,by:p.id,card:c,turn:false})}}
function fillPile(i){const aside=[];for(let n=0;n<90;n++){const c=draw();if(!c)break;if(c.k==='reg'&&!clash(c,i)){G.piles[i].push(c);break}aside.push(c)}G.deck.push(...aside);sh(G.deck)}
function start(){G.phase='play';G.deck=mk();G.pun=sh(PUN.map(([t,d,fx])=>({id:'c'+(++cid),k:'pun',t,d,fx})));G.disc=[];G.pdisc=[];G.piles=[[],[],[]];G.said=[];G.rank=[];G.msg='';G.vote=null;G.modal=null;G.mq=[];G.last=null;G.ref='';G.ev=[];G.spec=null;G.after=null;G.captain=null;G.mute=null;G.rule=null;G.fast=false;
 G.pl.forEach(p=>{p.ri=0;p.out=false;p.skip=0;p.mega=true;p.yellow=0;delete p.pen;p.hand=[];for(let i=0;i<6;i++)p.hand.push(draw())});for(let i=0;i<3;i++)fillPile(i);G.turn=0;G.left=45000;G.choose=false;G.ref='';G.ann={t:'המשחק התחיל! תורו של '+G.pl[0].name+'.',until:Date.now()+3000};G.pending=''}
const cur=()=>G.pl[G.turn],act=()=>G.pl.filter(x=>!x.out);
const nextOf=p=>{const a=act();return a[(a.indexOf(p)+1)%a.length]};
function next(){if(G.phase!=='play')return;const lp=cur();if(lp&&lp.pen&&--lp.pen.turns<=0)delete lp.pen;const n=G.pl.length,sk=[];let i=G.turn;for(let k=0;k<n*3;k++){i=(i+1)%n;const x=G.pl[i];if(x.out)continue;if(x.skip>0){x.skip--;sk.push(x.name);continue}break}
 G.turn=i;G.left=45000;G.choose=false;const np=G.pl[i];G.fast=!!(np.pen&&np.pen.fast);if(G.fast)G.left=np.pen.fast;
 if(G.mute&&G.mute.id===np.id)G.mute=null;if(G.rule&&G.rule.owner===np.id)G.rule=null;
 G.ann={t:(G.pending||'')+(sk.length?' ('+sk.join(', ')+' מדלג/ת)':'')+' עכשיו תורו של '+np.name+'!'+(G.fast?' יש לך 10 שניות בלבד!':''),until:Date.now()+3000};G.pending=''}
function checkEmpty(p){if(p.hand.length)return;p.ri++;if(p.ri>=6){p.out=true;G.rank.push(p.name);pm({kind:'info',title:'ניצחון!',text:p.name+' רוקן/ה את כל הקלפים ויוצא/ת מהמשחק כמנצח/ת.'});const a=act();if(a.length<=1){if(a[0]){a[0].out=true;G.rank.push(a[0].name)}G.phase='over'}}else give(p,SZ[p.ri])}
function settle(){if(G.after&&!G.spec&&!G.vote&&!G.modal&&G.phase==='play'){const f=G.after;G.after=null;f()}}
let sidc=0;function spec(o){G.spec=Object.assign({sid:++sidc,done:[],ans:{},ui:'text',prompt:'',opts:null},o)}
function ask(text,p,cb){G.vote={type:'q',by:p.id,byName:p.name,text,v:{},cb,target:p.id}}
function yellow(p){p.yellow=(p.yellow||0)+1;if(G.captain&&G.captain!==p.id)G.captain=p.id}
const RN={r:'אבן',p:'נייר',s:'מספריים'},sv=x=>String(x==null?'':x).slice(0,60);
const setPen=(p,own,o,c)=>{p.pen=Object.assign({turns:own?2:1,txt:c.t+': '+c.d},o)};
function fx(p,c,own){const O=act().filter(x=>x!==p),info=t=>pm({kind:'info',title:c.t,text:t});
 switch(c.fx){
 case 'skip1':p.skip+=1;break;
 case 'skip2':p.skip+=2;break;
 case 'rot':{const a=act(),h=a.map(x=>x.hand);a.forEach((x,i)=>x.hand=h[(i-1+a.length)%a.length]);info('כל השחקנים העבירו את כל הקלפים לשחקן שיושב משמאלם.');break}
 case 'medical':setPen(p,own,{fast:10000},c);break;
 case 'mourinho':setPen(p,own,{ban:'FM'},c);break;
 case 'juve':setPen(p,own,{ban:'DG',juve:1},c);break;
 case 'conte':setPen(p,own,{both:1},c);break;
 case 'youth':setPen(p,own,{youth:1},c);break;
 case 'zlatan':G.mute={id:p.id,used:false};info(p.name+' מושתק/ת עד תורו הבא. מי ששמע אותו/ה מדבר/ת לוחץ "הוא דיבר!".');break;
 case 'scouts':yellow(p);give(p,1);info(p.name+' מקבל/ת כרטיס צהוב ושולף/ת קלף נוסף.');break;
 case 'ronaldo':{const n=nextOf(p);give(n,1);info(n.name+' שולף/ת קלף.');break}
 case 'captain':G.captain=p.id;info(p.name+' הוא/היא הקפטן/ית. בהצבעות רק הקפטן מכריע/ה, עד שמישהו אחר מקבל כרטיס.');break;
 case 'ancelotti':if(O.length)spec({who:[p.id],ui:'pick',prompt:'בחר שחקן שידבר במקומך בתור הבא',opts:O.map(x=>[x.id,x.name]),cb:a=>{setPen(p,own,{sub:a[p.id]},c);info('בתור הבא של '+p.name+' ידבר במקומו/ה '+((G.pl.find(x=>x.id===a[p.id])||{}).name||'?')+'.')}});break;
 case 'm90':spec({who:[p.id],ui:'text',prompt:'שם של שחקן עבר אגדי מלפני שנת 2000. יש לך 5 שניות!',until:Date.now()+5000,
  cb:a=>ask('האם "'+sv(a[p.id])+'" שחקן עבר אגדי שפרש לפני שנת 2000?',p,ok=>{if(!ok){give(p,2);info('ההצבעה: לא מתאים. '+p.name+' שולף/ת 2 קלפים.')}}),
  timeout:()=>{give(p,2);info('נגמר הזמן! '+p.name+' שולף/ת 2 קלפים.')}});break;
 case 'redcard':if(p.hand.length)spec({who:[p.id],ui:'card',prompt:'בחר את הקלף שהכי קרוב לריאל מדריד',cb:a=>{const cc=p.hand.find(x=>x.id===a[p.id])||p.hand[0];
  spec({who:[p.id],ui:'text',prompt:'הסבר איך "'+(cc.l||cc.t)+'" מתקשר לריאל מדריד',cb:b=>ask('האם ההסבר סביר? "'+sv(b[p.id])+'"',p,ok=>{if(ok){p.hand=p.hand.filter(x=>x!==cc);G.disc.push(cc);info(p.name+' זרק/ה את "'+(cc.l||cc.t)+'".');checkEmpty(p)}else{info('ההסבר נדחה. בוחרים קלף שוב.');fx(p,c,own)}})})}});break;
 case 'arab':{const mx=Math.max(0,...O.map(x=>x.hand.length)),T=O.filter(x=>x.hand.length===mx);
  const sw=t=>{const h=p.hand;p.hand=t.hand;t.hand=h;info(p.name+' החליף/ה את כל הקלפים עם '+t.name+'.')};
  if(!mx)info('לאף שחקן אחר אין קלפים. לא בוצעה החלפה.');else if(T.length===1)sw(T[0]);else spec({who:[p.id],ui:'pick',prompt:'שוויון! בחר עם מי להחליף',opts:T.map(x=>[x.id,x.name]),cb:a=>sw(G.pl.find(x=>x.id===a[p.id])||T[0])});break}
 case 'locker':{const W=O.filter(x=>x.hand.length);if(W.length)spec({who:W.map(x=>x.id),ui:'card',prompt:'בחר קלף להעביר ל'+p.name,cb:a=>{for(const id in a){const o=G.pl.find(x=>x.id===id),cc=o.hand.find(x=>x.id===a[id])||o.hand[0];if(cc){o.hand=o.hand.filter(x=>x!==cc);p.hand.push(cc)}}info('כל השחקנים העבירו ל'+p.name+' קלף אחד.')}});break}
 case 'messi':{const m=Math.min(...O.map(x=>x.hand.length)),T=sh(O.filter(x=>x.hand.length===m))[0];
  if(T){const rps=()=>spec({who:[p.id,T.id],ui:'rps',prompt:'אבן-נייר-ומספריים: '+p.name+' נגד '+T.name,cb:a=>{const x=a[p.id],y=a[T.id];if(x===y){info('תיקו! משחקים שוב.');rps();return}
   const w=(x==='r'&&y==='s')||(x==='p'&&y==='r')||(x==='s'&&y==='p'),L=w?T:p;give(L,2);info(p.name+' ('+RN[x]+') מול '+T.name+' ('+RN[y]+'). '+L.name+' מפסיד/ה ושולף/ת 2 קלפים.')}});rps()}break}
 case 'family':if(O.length)spec({who:[p.id],ui:'pick',prompt:'בחר שחקן שיגיד שם של שחקן כדורגל',opts:O.map(x=>[x.id,x.name]),cb:a=>{const T=G.pl.find(x=>x.id===a[p.id])||O[0];
  spec({who:[T.id],ui:'text',prompt:'אמור שם של שחקן כדורגל עבור '+p.name,cb:b=>{const nm=sv(b[T.id]);spec({who:[p.id],ui:'text',prompt:'כתוב שתי קבוצות ש-'+nm+' שיחק בהן',cb:d=>ask('האם '+nm+' שיחק בשתי הקבוצות: '+sv(d[p.id])+'?',p,ok=>{if(!ok){give(p,1);info('ההצבעה: לא נכון. '+p.name+' שולף/ת קלף.')}})})}})}});break;
 case 'wenger':if(O.length)spec({who:[p.id],ui:'text',prompt:'כתוב שם של שחקן (רק אתה רואה)',cb:a=>{const nm=sv(a[p.id]);spec({who:[p.id],ui:'text',prompt:'מה הקבוצה של '+nm+'? (סודי)',cb:b=>{const tm=sv(b[p.id]),k=norm(tm);
  spec({who:O.map(x=>x.id),ui:'text',prompt:'נחשו את הקבוצה של השחקן ש-'+p.name+' בחר/ה',cb:d=>{const bad=O.filter(x=>{const g=norm(sv(d[x.id]));return !g||!(g===k||k.includes(g)||g.includes(k))});bad.forEach(x=>give(x,1));give(p,bad.length);
   info('השחקן: '+nm+', הקבוצה: '+tm+'. טעו: '+(bad.map(x=>x.name).join(', ')||'אף אחד')+'. '+p.name+' שולף/ת '+bad.length+' קלפים.')}})}})}});break;
 case 'fifa':spec({who:[p.id],ui:'text',prompt:'כתוב כלל חדש שיחול על כולם בסיבוב הבא',cb:a=>{G.rule={text:sv(a[p.id]),owner:p.id};info('כלל חדש מ'+p.name+': '+G.rule.text+'. מי שמפר, מדווחים עליו בכפתור "דווח". הכלל פג בסוף הסיבוב.')}});break;
 }}
function doPlay(p,c,pi,raw){
 const key=norm(raw);if(!key)return'כתוב שם של שחקן';
 if(clash(c,pi))return'אסור להניח קלף מקטגוריה שכבר על השולחן';
 const cn=canon(key),k2=cn?cn.k:key;
 if(G.said.includes(k2))return'השחקן הזה כבר נאמר במשחק!';
 const pen=p.pen;
 if(pen&&pen.ban&&cn&&pen.ban.includes(cn.p)){give(p,2);delete p.pen;pm({kind:'info',title:'הפרת עונש',text:p.name+' אמר/ה את '+raw.slice(0,30)+' בניגוד לעונש ("'+pen.txt+'"), ושולף/ת 2 קלפים.'});G.pending=p.name+' הפר/ה עונש.';G.after=()=>next();return null}
 G.said.push(k2);G.piles[pi].push(c);p.hand=p.hand.filter(x=>x!==c);G.last={by:p.id,bn:p.name,name:raw.slice(0,30)};evp({k:'play',by:p.id,pile:pi,card:c});
 G.pending=p.name+' שם קלף '+(CATHE[c.cat]||'')+' ואמר '+raw.slice(0,30)+'.';
 const clubOn=G.piles.some(a=>a.length&&a[a.length-1].cat==='club'),nm=raw.slice(0,30);
 checkEmpty(p);
 if(pen&&G.phase==='play'){
  if(pen.youth&&clubOn)ask('האם '+nm+' גדל/ה במחלקת הנוער של הקבוצה שעל השולחן?',p,ok=>{if(!ok){give(p,1);pm({kind:'info',title:'הצבעה',text:'לא גדל במחלקת הנוער. '+p.name+' שולף/ת קלף.'})}});
  else if(pen.both)ask('האם '+nm+' יכול/ה לשחק גם בהגנה וגם בהתקפה?',p,ok=>{if(!ok){give(p,1);pm({kind:'info',title:'הצבעה',text:'לא מתאים. '+p.name+' שולף/ת קלף.'})}});
  else if(pen.juve)ask('האם '+nm+' שיחק/ה או משחק/ת ביובנטוס?',p,ok=>{if(ok){const O=act().filter(x=>x!==p);if(O.length&&p.hand.length)spec({who:[p.id],ui:'pick',prompt:'בחר למי להעביר קלף',opts:O.map(x=>[x.id,x.name]),cb:a=>{const t=G.pl.find(x=>x.id===a[p.id])||O[0],cc=p.hand.splice(Math.floor(Math.random()*p.hand.length),1)[0];if(cc){t.hand.push(cc);pm({kind:'info',title:'העברת קלף',text:p.name+' העביר/ה קלף ל'+t.name+'.'})}}})}});
 }
 G.after=()=>next();return null}
function resolveVote(){const v=G.vote;let a=act();const cap=G.pl.find(x=>x.id===G.captain&&!x.out);
 if(cap&&(v.type==='chal'||v.type==='q')&&v.by!==cap.id&&v.target!==cap.id)a=[cap];
 if(!a.every(x=>x.id in v.v))return;const y=a.filter(x=>v.v[x.id]).length;G.vote=null;
 if(v.type==='q'){v.cb(y/a.length>=0.6);return}
 if(v.type==='cat'){if(y/a.length>=0.6){for(let i=0;i<3;i++)fillPile(i);pm({kind:'info',title:'החלפת קטגוריות',text:'רוב השחקנים הסכימו. הקטגוריות הוחלפו.'})}else pm({kind:'info',title:'החלפת קטגוריות',text:'ההצבעה נדחתה. הקטגוריות לא הוחלפו.'});return}
 if(v.type==='end'){if(y/a.length>=0.6){act().sort((x,z)=>x.hand.length-z.hand.length).forEach(x=>G.rank.push(x.name));G.phase='over'}else pm({kind:'info',title:'סיום מוקדם',text:'ההצבעה נדחתה. המשחק נמשך.'});return}
 const ch=G.pl.find(x=>x.id===v.by),t=G.pl.find(x=>x.id===v.target);
 if((a.length-y)/a.length>=0.6){pm({kind:'info',title:'הערעור התקבל',text:`"${v.name}" של ${t.name} לא מתאים. ${t.name} שולף/ת 2 קלפים רגילים או קלף עונש אחד. המגפון של ${ch.name} נשאר זמין.`});if(!t.out)pm({kind:'chalpick',title:'בחר/י עונש',text:'שלוף 2 קלפים רגילים או קלף עונש אחד',by:t.id})}
 else{ch.mega=false;give(ch,2);pm({kind:'info',title:'הערעור נדחה',text:`"${v.name}" אושר. ${ch.name} שולף/ת 2 קלפים והמגפון שלו/ה נחסם.`})}}
function view(p){const v=G.vote,c=cur(),s=G.spec,cap=G.pl.find(x=>x.id===G.captain&&!x.out);return{me:p.id,phase:G.phase,pl:G.pl.map(x=>({id:x.id,name:x.name,ready:x.ready,av:x.av,pos:x.pos,n:x.hand.length,out:x.out,cap:x.id===G.captain,y:x.yellow||0})),hand:p.hand,
 piles:G.piles.map(a=>({top:a[a.length-1]||null,n:a.length})),deck:G.deck.length,pun:G.pun.length,disc:G.disc[G.disc.length-1]||null,
 turn:G.phase==='play'&&c?c.id:null,ev:G.ev,ann:(G.ann&&Date.now()<G.ann.until)?{t:G.ann.t,ms:G.ann.until-Date.now()}:null,left:G.left,choose:G.choose,
 vote:v?{type:v.type,byName:v.byName,name:v.name,text:v.text,reason:v.reason,tn:v.tn,mine:p.id in v.v,capOnly:(cap&&(v.type==='chal'||v.type==='q')&&v.by!==cap.id&&v.target!==cap.id)?cap.name:null}:null,
 spec:s?{sid:s.sid,who:s.who,done:s.done,ui:s.ui,prompt:s.prompt,opts:s.opts,ms:s.until?Math.max(0,s.until-Date.now()):0}:null,
 modal:G.modal?{kind:G.modal.kind,title:G.modal.title,text:G.modal.text,by:G.modal.by||null}:null,rank:G.rank,msg:G.msg,mute:G.mute?G.mute.id:null,rule:G.rule?G.rule.text:null,
 pen:p.pen?p.pen.txt:null,mega:!!p.mega,canChal:!!(p.mega&&G.last&&G.last.by!==p.id&&!G.last.ch&&!G.vote&&!G.modal&&!G.spec&&G.phase==='play'),last:G.last?G.last.bn+': '+G.last.name:''}}
function bcast(){if(G.ref&&G.phase!=='lobby'){pm({kind:'info',title:'חידוש קופה',text:G.ref});G.ref=''}
 wss.clients.forEach(c=>{if(c.readyState!==1||!c.pid)return;const p=G.pl.find(x=>x.id===c.pid)||{id:c.pid,hand:[]};c.send(JSON.stringify(view(p)))})}
const err=(ws,e)=>ws.readyState===1&&ws.send(JSON.stringify({err:e}));
wss.on('connection',ws=>{
 ws.on('message',d=>{let m;try{m=JSON.parse(d)}catch(e){return}
  if(m.pid)ws.pid=String(m.pid).slice(0,20);
  if(m.t==='hi')ws.send(JSON.stringify({ply:DB.map(x=>[x.n,2026-x.y])}));
  let p=G.pl.find(x=>x.id===ws.pid);
  if(p)p.ws=ws;
  if(m.t==='join'&&!p&&G.phase==='lobby'&&G.pl.length<8&&String(m.name||'').trim()){p={id:ws.pid,name:String(m.name).trim().slice(0,12),ready:false,av:Math.floor(Math.random()*1e6),pos:POSN[G.pl.length],hand:[],ri:0,out:false,skip:0,mega:true,yellow:0,ws};G.pl.push(p);G.pl.forEach((x,i)=>x.pos=POSN[i])}
  else if(!p){}
  else if(m.t==='ready'&&G.phase==='lobby'){p.ready=!p.ready;if(G.pl.length>=2&&G.pl.every(x=>x.ready))start()}
  else if(m.t==='again'&&G.phase==='over')fresh();
  else if(G.phase==='play'){
   const md=G.modal,my=cur()===p&&!md&&!G.vote&&!G.spec&&!G.after,free=!G.vote&&!md&&!G.spec&&!G.after;
   if(m.t==='spec'&&G.spec&&G.spec.who.includes(p.id)&&!G.spec.done.includes(p.id)){const s=G.spec;s.ans[p.id]=m.v;s.done.push(p.id);if(s.who.every(x=>s.done.includes(x))){G.spec=null;s.cb(s.ans)}}
   else if(m.t==='cat'&&free){G.vote={type:'cat',by:p.id,byName:p.name,v:{}}}
   else if(m.t==='endv'&&free){G.vote={type:'end',by:p.id,byName:p.name,v:{}}}
   else if(m.t==='chal'&&p.mega&&G.last&&G.last.by!==p.id&&!G.last.ch&&!G.vote&&!md&&!G.spec){G.last.ch=true;G.vote={type:'chal',by:p.id,byName:p.name,reason:String(m.reason||'').slice(0,80),target:G.last.by,tn:G.last.bn,name:G.last.name,v:{}}}
   else if(m.t==='vote'&&G.vote&&!(p.id in G.vote.v)){G.vote.v[p.id]=!!m.y;resolveVote()}
   else if(m.t==='spoke'&&G.mute&&!G.mute.used&&G.mute.id!==p.id){const t=G.pl.find(x=>x.id===G.mute.id);G.mute.used=true;if(t){give(t,2);pm({kind:'info',title:'הוא דיבר!',text:p.name+' דיווח/ה ש-'+t.name+' דיבר/ה. '+t.name+' שולף/ת 2 קלפים.'})}}
   else if(m.t==='report'&&G.rule&&G.last&&!G.last.rep&&G.last.by!==p.id){G.last.rep=true;const t=G.pl.find(x=>x.id===G.last.by);if(t){give(t,1);pm({kind:'info',title:'הפרת כלל',text:p.name+' דיווח/ה ש-'+t.name+' הפר/ה את הכלל: '+G.rule.text+'. '+t.name+' שולף/ת קלף.'})}}
   else if(m.t==='ok'&&md&&md.kind!=='chalpick'&&(md.by==null||md.by===p.id)){G.modal=G.mq.shift()||null;
    if(md.kind==='pun'){const w=G.pl.find(x=>x.id===md.by);G.pdisc.push(md.card);G.disc.push(md.card);fx(w,md.card,md.turn);if(md.turn)G.after=()=>{G.pending=w.name+' שלף/ה קלף עונש: '+md.title+'.';next()}}}
   else if(m.t==='cpick'&&md&&md.kind==='chalpick'&&md.by===p.id){G.modal=G.mq.shift()||null;
    if(m.k==='pun'){const c=drawPun();pm({kind:'pun',title:c.t,text:c.d,by:p.id,card:c,turn:false})}else give(p,2)}
   else if(my&&m.t==='pass'&&!G.choose){G.choose=true;G.fast=false}
   else if(my&&m.t==='pen'&&G.choose){if(m.kind==='pun'){const c=drawPun();pm({kind:'pun',title:c.t,text:c.d,by:p.id,card:c,turn:true})}else{give(p,1);G.pending=p.name+' שלף/ה קלף.';next()}}
   else if(my&&!G.choose&&(m.t==='play'||m.t==='red')){
    const c=p.hand.find(x=>x.id===m.card);if(!c)return;
    if(m.t==='red'){if(c.k!=='red')return;p.hand=p.hand.filter(x=>x!==c);G.disc.push(c);evp({k:'red',by:p.id,card:c});let j=G.turn;do{j=(j+1)%G.pl.length}while(G.pl[j].out);const t=G.pl[j];G.pending=p.name+' שלף/ה אדום ל'+t.name+'.';
     const v=t.hand.find(x=>x.k==='var');
     if(v){t.hand=t.hand.filter(x=>x!==v);G.disc.push(v);pm({kind:'info',title:'קלף אדום + VAR',text:`${p.name} שלף/ה אדום ל${t.name}, אבל ${t.name} השתמש/ה ב-VAR וממשיך/ה במשחק.`})}
     else{t.skip++;if(G.captain&&G.captain!==t.id)G.captain=t.id;pm({kind:'info',title:'קלף אדום!',text:`${p.name} שלף/ה אדום ל${t.name}. התור של ${t.name} מדולג.`})}
     checkEmpty(p);G.after=()=>next()}
    else{const pi=+m.pile,raw=String(m.name||'').trim();if(c.k!=='reg'||!(pi>=0&&pi<3))return;
     if(p.pen&&p.pen.sub){const sub=G.pl.find(x=>x.id===p.pen.sub);if(sub&&!sub.out){spec({who:[sub.id],ui:'text',prompt:p.name+' מבקש/ת שתגיד שם של שחקן במקומו/ה',cb:a=>{delete p.pen;const e=doPlay(p,c,pi,sv(a[sub.id]));if(e)pm({kind:'info',title:'אנצ׳לוטי',text:e+'. '+p.name+' ינסה/תנסה שוב.'})}});return}}
     const e=doPlay(p,c,pi,raw);if(e)return err(ws,e)}}
  }
  settle();bcast()});
 ws.on('close',()=>{const p=G.pl.find(x=>x.ws===ws);if(p&&G.phase==='lobby'){G.pl=G.pl.filter(x=>x!==p);G.pl.forEach((x,i)=>x.pos=POSN[i]);if(G.pl.length>=2&&G.pl.every(x=>x.ready))start();bcast()}});
});
let tk=0;
setInterval(()=>{if(G.phase==='play'){const p=cur(),now=Date.now();
 if(G.spec&&G.spec.until&&now>G.spec.until){const s=G.spec;G.spec=null;s.timeout&&s.timeout()}
 if(!G.choose&&!G.modal&&!G.vote&&!G.spec&&!G.after&&!(G.ann&&now<G.ann.until)){G.left-=500;if(G.left<=0){G.left=0;
  if(G.fast){G.fast=false;delete p.pen;pm({kind:'info',title:'נפסלת!',text:p.name+' לא הספיק/ה תוך 10 שניות. שולף/ת 2 קלפי עונש.'});penDraw(p,2);G.after=()=>{G.pending=p.name+' נפסל/ה בבדיקת הכשירות.';next()}}
  else{G.choose=true;G.msg='נגמר הזמן ל'+p.name}}}
 if(G.choose&&!G.modal&&!G.vote&&!G.spec&&(!p.ws||p.ws.readyState!==1)){give(p,1);next()}
 settle();
 if(++tk%2===0||(G.ann&&now<G.ann.until+600)||G.spec)bcast()}},500);
server.listen(process.env.PORT||3000);
