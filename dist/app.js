const DOMAINS=["Vie, longévité et protection","Santé, maladie et rétablissement","Argent, prospérité et dettes","Travail, emploi et carrière","Activité, commerce, entreprise et projet","Études, examen et formation","Mariage, couple et relation","Enfant, grossesse et descendance","Famille, proches et ancêtres","Logement, terrain et lieu de vie","Voyage, déplacement et migration","Conflit, ennemis et rivalité","Justice, litige et démarches administratives","Perte, vol, fraude et trahison","Réussite, fonction, honneur et reconnaissance","Choix, décision et changement important","Paix, stabilité et équilibre personnel","Vie spirituelle, destinée et obligations traditionnelles","Situation générale ou autre préoccupation"];
const labels={prepare:"Préparation",mode:"Mode de lancer",digital:"Lancer numérique",physical:"Lancer physique",general:"Interprétation générale",domain:"Domaine",personalized:"Lecture personnalisée",question:"Question",answer:"Réponse à la question"};
const API_URL=window.IFAWA_CONFIG?.supabaseUrl;
const API_KEY=window.IFAWA_CONFIG?.supabasePublishableKey;
const state={stage:"prepare",mode:null,questionRound:false,questionCount:0,questionText:"",audioUrl:"",audioDuration:0,choices:[],grid:[],revealed:null,seconds:3,physical:8,domain:"",domains:[],sign:null,answerSign:null,reading:null,generalExpanded:false,personalizedExpanded:false,loading:false,loadError:"",timer:null};
let recorder=null,recordChunks=[],recordStartedAt=0,recordTick=null,mediaStream=null;
const screen=document.querySelector("#screen"),step=document.querySelector("#step-label");
function randomInt(max){const limit=0x100000000-(0x100000000%max),a=new Uint32Array(1);do{crypto.getRandomValues(a)}while(a[0]>=limit);return a[0]%max}
function shuffle(input){const a=[...input];for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function newGrid(){const faces=shuffle([...Array(8).fill("open"),...Array(8).fill("closed")]),nums=shuffle(Array.from({length:16},(_,i)=>i+1));return nums.map((number,i)=>({number,face:faces[i]}))}
function setStage(name){clearInterval(state.timer);state.timer=null;state.stage=name;step.textContent=labels[name];render()}
function reset(){clearInterval(state.timer);clearQuestion();Object.assign(state,{stage:"prepare",mode:null,questionRound:false,questionCount:0,questionText:"",audioUrl:"",audioDuration:0,choices:[],grid:newGrid(),revealed:null,seconds:3,physical:8,domain:"",sign:null,answerSign:null,reading:null,generalExpanded:false,personalizedExpanded:false,loading:false,loadError:"",timer:null});render()}
function openCount(){return state.choices.filter(x=>x==="open").length}
function cauri(face){return `<span class="cauri ${face}"><img src="./assets/cowrie-${face}.png" alt=""></span>`}
async function apiSelect(table,params){
  if(!API_URL||!API_KEY)throw new Error("Configuration Supabase absente");
  const response=await fetch(`${API_URL}/rest/v1/${table}?${params}`,{headers:{apikey:API_KEY,Accept:"application/json"}});
  if(!response.ok)throw new Error(`Supabase ${response.status}`);
  return response.json();
}
async function loadDomains(){
  try{state.domains=await apiSelect("domains","select=code,display_order,name,description&order=display_order.asc");if(state.stage==="domain")render()}catch(error){state.domains=[]}
}
async function loadSign(count,target){
  state.loading=true;state.loadError="";if(target==="general"){state.sign=null;state.generalExpanded=false}else state.answerSign=null;setStage(target);
  try{
    const rows=await apiSelect("signs",`select=id,slug,name,opened_count,general_interpretation,decision_type,decision_label,decision_note,requires_recast&opened_count=eq.${count}&limit=1`);
    if(!rows.length)throw new Error("Signe introuvable");
    if(target==="general")state.sign=rows[0];else state.answerSign=rows[0];
  }catch(error){state.loadError="Les données de cette consultation n’ont pas pu être chargées. Vérifiez la connexion puis réessayez."}
  state.loading=false;render();
}
async function loadReading(code,name){
  state.domain=name;state.reading=null;state.personalizedExpanded=false;state.loading=true;state.loadError="";setStage("personalized");
  try{
    const rows=await apiSelect("sign_domain_readings",`select=id,domain_code,personalized_interpretation,indicated_conduct,traditional_orientation,requires_practitioner,content_version&sign_id=eq.${state.sign.id}&domain_code=eq.${encodeURIComponent(code)}&limit=1`);
    if(!rows.length)throw new Error("Lecture introuvable");state.reading=rows[0];
  }catch(error){state.loadError="La lecture de ce domaine n’a pas pu être chargée. Vérifiez la connexion puis réessayez."}
  state.loading=false;render();
}
function loadingView(title){return `<section class="stage centered enter"><p class="eyebrow">Consultation</p><h1>${title}</h1><p class="lead">Chargement de la lecture…</p><div class="loading-mark" aria-label="Chargement"></div></section>`}
function errorView(title,retry){return `<section class="stage centered enter"><p class="eyebrow">Connexion</p><h1>${title}</h1><p class="lead">${state.loadError}</p><button class="primary" id="retry-data" data-retry="${retry}">Réessayer</button></section>`}
function render(){clearInterval(state.timer);state.timer=null;step.textContent=labels[state.stage];screen.innerHTML=views[state.stage]();bind();if(state.stage==="digital"&&!state.revealed)startTimer()}
const views={
prepare:()=>`<section class="stage centered enter"><p class="eyebrow">Avant de commencer</p><h1>Placez votre préoccupation au centre de votre pensée.</h1><p class="lead">Choisissez un endroit calme. Vous pouvez écrire votre préoccupation sur un papier ou la garder clairement dans votre esprit.</p><div class="options"><article><span>01</span><div><b>Sur un papier</b><p>Écrivez votre préoccupation sans la saisir dans l’application.</p></div></article><article><span>02</span><div><b>Dans votre esprit</b><p>Concentrez-vous uniquement sur ce qui vous conduit à consulter.</p></div></article></div><button class="primary" data-go="mode">Je suis prêt</button></section>`,
mode:()=>`<section class="stage enter"><button class="back" data-go="prepare">‹ Retour</button><p class="eyebrow">Le lancer</p><h1>Choisissez votre manière de lancer.</h1><div class="mode-buttons"><button class="mode-choice" data-mode="digital"><span class="choice-icon number-choice-icon" aria-hidden="true"><i>1</i><i>6</i><i>11</i><i>16</i></span><b>Sans cauris physiques</b><span>›</span></button><button class="mode-choice" data-mode="physical"><span class="choice-icon physical-choice-icon" aria-hidden="true"><img src="./assets/cowrie-open.png" alt=""><img src="./assets/cowrie-closed.png" alt=""></span><b>Avec vos propres cauris</b><span>›</span></button></div></section>`,
digital:()=>`<section class="stage enter"><div class="heading"><div><p class="eyebrow">Choix ${Math.min(state.choices.length+1,16)} sur 16</p><h1>Choisissez successivement 16 cases numérotées.</h1></div><div class="timer"><b>${state.seconds}</b><small>secondes</small></div></div><div class="progress"><i style="width:${state.choices.length/16*100}%"></i></div><div class="board">${state.grid.map(t=>`<button class="tile" aria-label="Choisir le nombre ${t.number}" data-number="${t.number}" data-face="${t.face}"><span>${t.number}</span><div aria-hidden="true">${cauri(t.face)}</div></button>`).join("")}</div><p class="sr-only reveal-live" aria-live="polite"></p><div class="summary"><span class="open-summary">${openCount()} ouverts</span><span class="closed-summary">${state.choices.length-openCount()} fermés</span><button id="restart">↻ Recommencer</button></div></section>`,
physical:()=>`<section class="stage centered enter"><button class="back left" data-go="mode">‹ Retour</button><p class="eyebrow">Lancer physique</p><h1>Lancez vos seize cauris.</h1><p class="lead">Après leur chute, comptez les faces ouvertes. Les faces fermées sont calculées automatiquement.</p><div class="counter"><button data-count="-1">−</button><div><b>${state.physical}</b><small>cauris ouverts</small></div><button data-count="1">+</button></div><p class="closed">${16-state.physical} cauris fermés · Total 16</p><button class="primary" id="validate-physical">Valider ce lancer</button></section>`,
general:()=>{if(state.loading)return loadingView("Votre interprétation arrive.");if(state.loadError)return errorView("Impossible d’afficher l’interprétation.","general");const n=openCount(),sign=state.sign,op=n===0,full=sign.general_interpretation||"",short=firstPart(full),hasMore=short!==full.trim(),shown=state.generalExpanded?full:short;return `<section class="stage reading enter"><p class="eyebrow">Interprétation générale</p><div class="sign"><span>${String(n).padStart(2,"0")}</span><div><small>Le signe obtenu est</small><h1>${escapeHtml(sign.name)}</h1></div></div><article class="reading-card ${op?"urgent":""}"><p>${formatText(shown)}</p>${hasMore?`<button class="text-toggle" id="toggle-general">${state.generalExpanded?"Voir moins":"Voir plus"}</button>`:""}${op?"<b>La suite de cette consultation doit être conduite avec un praticien.</b>":""}</article><button class="primary" ${op?"id='practitioner'":"data-go='domain'"}>${op?"Contacter un praticien":"Choisir le domaine concerné"}</button></section>`},
domain:()=>{const domains=state.domains.length?state.domains:DOMAINS.map((name,i)=>({code:`D${String(i+1).padStart(2,"0")}`,display_order:i+1,name}));return `<section class="stage enter"><p class="eyebrow">Personnaliser la consultation</p><h1>Quel domaine concerne votre préoccupation&nbsp;?</h1><p class="lead">Touchez simplement le domaine concerné pour ouvrir sa lecture.</p><div class="domains">${domains.map(d=>`<button data-domain-code="${d.code}" data-domain-name="${escapeHtml(d.name)}"><span>${String(d.display_order).padStart(2,"0")}</span>${escapeHtml(d.name)}<i>›</i></button>`).join("")}</div></section>`},
personalized:()=>{if(state.loading)return loadingView("Votre lecture personnalisée arrive.");if(state.loadError)return errorView("Impossible d’afficher cette lecture.","reading");const r=state.reading,orientation=publicText(r.traditional_orientation);return `<section class="stage reading enter"><p class="eyebrow">Lecture personnalisée</p><h1>${escapeHtml(state.sign.name)}</h1><p class="domain-label">${escapeHtml(state.domain)}</p><article class="reading-card"><div class="reading-section"><b>Interprétation</b><p>${formatText(r.personalized_interpretation)}</p></div>${state.personalizedExpanded?`<div class="reading-section"><b>Conduite indiquée</b><p>${formatText(r.indicated_conduct)}</p></div><div class="reserved"><b>Orientation traditionnelle</b><p>${formatText(orientation)}</p>${r.requires_practitioner?'<button class="secondary" id="practitioner">Contacter un praticien</button>':''}</div>`:""}<button class="text-toggle" id="toggle-personalized">${state.personalizedExpanded?"Voir moins":"Voir plus"}</button></article><div class="actions"><button class="primary" id="ask-question">Vous avez une question&nbsp;?</button><button class="secondary" id="finish">Terminer</button></div></section>`},
question:()=>`<section class="stage question-stage enter"><p class="eyebrow">Question ${state.questionCount+1}</p><h1>Posez votre question.</h1><p class="lead">Écrivez-la ou enregistrez-la avec votre voix avant le nouveau lancer.</p><div class="question-composer"><label for="question-text"><b>Écrire la question</b><textarea id="question-text" maxlength="280" placeholder="Écrivez votre question ici…">${escapeHtml(state.questionText)}</textarea><small><span id="question-length">${state.questionText.length}</span>/280</small><p class="question-help" id="question-help">Écrivez au moins deux mots pour formuler votre question.</p></label><div class="or"><span>ou</span></div><div class="audio-question"><b>Enregistrer la question</b><p>Enregistrement court, 30 secondes maximum.</p><button class="secondary record-button" id="record-question" type="button"><span class="record-dot"></span><span class="record-label">Enregistrer ma question</span></button><input class="sr-only" id="audio-file" type="file" accept="audio/*" capture><p class="audio-status" aria-live="polite"></p>${state.audioUrl?`<div class="audio-preview"><audio controls src="${state.audioUrl}"></audio><button type="button" id="remove-audio">Supprimer</button></div>`:""}</div></div><button class="primary question-ready" id="question-ready" ${questionReady()?"":"disabled"}>Je suis prêt à relancer</button></section>`,
answer:()=>{if(state.loading)return loadingView("La réponse arrive.");if(state.loadError)return errorView("Impossible d’afficher la réponse.","answer");const d=state.answerSign,retry=d.requires_recast,critical=d.decision_type==="no",count=openCount(),signBadge=`<div class="answer-sign"><b>${count} cauri${count===1?"":"s"} ouvert${count===1?"":"s"}</b><span>Signe ${escapeHtml(d.name)}</span></div>`;if(retry)return `<section class="stage reading answer-stage enter"><p class="eyebrow">Réponse à votre question</p>${signBadge}<h1>Relancez les cauris.</h1><article class="reading-card"><p>Un nouveau lancer est nécessaire pour préciser la réponse à votre question.</p></article><div class="actions"><button class="primary" id="answer-next">Relancer les cauris</button><button class="secondary" id="finish">Terminer</button></div></section>`;return `<section class="stage reading answer-stage enter"><p class="eyebrow">Réponse à votre question</p>${signBadge}<h1>${escapeHtml(d.decision_label)}</h1><article class="reading-card ${critical?"urgent":""}"><p>${formatText(d.decision_note)}</p>${critical?"<b>La situation demande l’orientation d’un praticien.</b>":""}</article><div class="actions"><button class="primary" id="answer-next">Poser une autre question</button><button class="secondary" id="finish">Terminer</button></div></section>`}
};
function beginCast(){state.choices=[];state.revealed=null;state.physical=8;state.seconds=3;state.grid=newGrid();setStage(state.mode)}
function escapeHtml(value){return value.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]))}
function formatText(value){return escapeHtml(value||"").replace(/\n{2,}/g,"<br><br>").replace(/\n/g,"<br>")}
function firstPart(value){return (value||"").trim().split(/\n\s*\n/)[0]||""}
function publicText(value){return (value||"").replace(/\b(?:Ce|Le) vers indique\b/gi,"Ceci indique").replace(/\s*L[’']application propose de contacter un praticien\.?/gi,"").trim()}
function meaningfulQuestion(value){
  const words=(value||"").trim().split(/\s+/).map(word=>word.replace(/[^\p{L}\p{N}'’\-]/gu,"")).filter(Boolean);
  const meaningful=words.filter(word=>{const compact=word.toLocaleLowerCase("fr").replace(/[^\p{L}\p{N}]/gu,"");return compact.length>0&&!/^(.)\1{2,}$/u.test(compact)});
  return meaningful.length>=2&&meaningful.join("").length>=4;
}
function questionReady(){return Boolean(state.audioUrl||meaningfulQuestion(state.questionText))}
function clearQuestion(){
  clearInterval(recordTick);recordTick=null;
  if(recorder&&recorder.state==="recording"){recorder.onstop=null;recorder.stop()}
  if(mediaStream)mediaStream.getTracks().forEach(track=>track.stop());
  mediaStream=null;recorder=null;recordChunks=[];
  if(state.audioUrl)URL.revokeObjectURL(state.audioUrl);
  state.questionText="";state.audioUrl="";state.audioDuration=0;
}
function newQuestion(){clearQuestion();setStage("question")}
function syncQuestionReady(){
  const ready=document.querySelector("#question-ready"),length=document.querySelector("#question-length"),help=document.querySelector("#question-help");
  if(length)length.textContent=state.questionText.length;
  const valid=questionReady();
  if(ready)ready.disabled=!valid||(recorder&&recorder.state==="recording");
  if(help){const attempted=state.questionText.trim().length>0&&!valid&&!state.audioUrl;help.classList.toggle("invalid",attempted);help.textContent=attempted?"Formulez votre question avec au moins deux mots lisibles.":"Écrivez au moins deux mots pour formuler votre question."}
}
async function toggleRecording(){
  const button=document.querySelector("#record-question"),status=document.querySelector(".audio-status");
  if(recorder&&recorder.state==="recording"){recorder.stop();return}
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){document.querySelector("#audio-file")?.click();return}
  try{
    mediaStream=await navigator.mediaDevices.getUserMedia({audio:true});recordChunks=[];
    recorder=new MediaRecorder(mediaStream);const activeRecorder=recorder;recordStartedAt=Date.now();
    activeRecorder.ondataavailable=event=>{if(event.data.size)recordChunks.push(event.data)};
    activeRecorder.onstop=()=>{
      clearInterval(recordTick);recordTick=null;
      state.audioDuration=Math.max(1,Math.min(30,Math.round((Date.now()-recordStartedAt)/1000)));
      if(state.audioUrl)URL.revokeObjectURL(state.audioUrl);
      state.audioUrl=URL.createObjectURL(new Blob(recordChunks,{type:activeRecorder.mimeType||"audio/webm"}));
      if(mediaStream)mediaStream.getTracks().forEach(track=>track.stop());mediaStream=null;recorder=null;
      if(state.stage==="question")render();
    };
    activeRecorder.start();button.classList.add("recording");button.querySelector(".record-label").textContent="Arrêter l’enregistrement";status.textContent="Enregistrement… 0 s";syncQuestionReady();
    recordTick=setInterval(()=>{const seconds=Math.min(30,Math.floor((Date.now()-recordStartedAt)/1000));const current=document.querySelector(".audio-status");if(current)current.textContent=`Enregistrement… ${seconds} s`;if(seconds>=30&&recorder?.state==="recording")recorder.stop()},500);
  }catch(error){if(status)status.textContent="Le microphone n’a pas pu être utilisé. Vous pouvez écrire votre question."}
}
function bind(){
  document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>setStage(b.dataset.go));
  document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;state.questionRound=false;beginCast()});
  document.querySelectorAll(".tile").forEach(b=>b.onclick=()=>choose(b,+b.dataset.number,b.dataset.face));
  document.querySelectorAll("[data-count]").forEach(b=>b.onclick=()=>{state.physical=Math.max(0,Math.min(16,state.physical+(+b.dataset.count)));render()});
  document.querySelectorAll("[data-domain-code]").forEach(b=>b.onclick=()=>loadReading(b.dataset.domainCode,b.dataset.domainName));
  const restart=document.querySelector("#restart");if(restart)restart.onclick=beginCast;
  const physical=document.querySelector("#validate-physical");if(physical)physical.onclick=()=>{state.choices=[...Array(state.physical).fill("open"),...Array(16-state.physical).fill("closed")];loadSign(openCount(),state.questionRound?"answer":"general")};
  const ask=document.querySelector("#ask-question");if(ask)ask.onclick=newQuestion;
  const toggleGeneral=document.querySelector("#toggle-general");if(toggleGeneral)toggleGeneral.onclick=()=>{state.generalExpanded=!state.generalExpanded;render()};
  const togglePersonalized=document.querySelector("#toggle-personalized");if(togglePersonalized)togglePersonalized.onclick=()=>{state.personalizedExpanded=!state.personalizedExpanded;render()};
  const text=document.querySelector("#question-text");if(text)text.oninput=()=>{state.questionText=text.value;syncQuestionReady()};
  const record=document.querySelector("#record-question");if(record)record.onclick=toggleRecording;
  const audioFile=document.querySelector("#audio-file");if(audioFile)audioFile.onchange=()=>{const file=audioFile.files?.[0];if(!file)return;if(state.audioUrl)URL.revokeObjectURL(state.audioUrl);state.audioUrl=URL.createObjectURL(file);state.audioDuration=0;render()};
  const removeAudio=document.querySelector("#remove-audio");if(removeAudio)removeAudio.onclick=()=>{if(state.audioUrl)URL.revokeObjectURL(state.audioUrl);state.audioUrl="";state.audioDuration=0;render()};
  const ready=document.querySelector("#question-ready");if(ready)ready.onclick=()=>{if(!questionReady()){syncQuestionReady();return}state.questionRound=true;state.questionCount++;beginCast()};
  const next=document.querySelector("#answer-next");if(next)next.onclick=()=>{if(state.answerSign.requires_recast)beginCast();else newQuestion()};
  const retry=document.querySelector("#retry-data");if(retry)retry.onclick=()=>{const kind=retry.dataset.retry;if(kind==="reading"){const domains=state.domains.length?state.domains:DOMAINS.map((name,i)=>({code:`D${String(i+1).padStart(2,"0")}`,name}));const selected=domains.find(d=>d.name===state.domain);if(selected)loadReading(selected.code,selected.name)}else loadSign(openCount(),kind)};
  const finish=document.querySelector("#finish");if(finish)finish.onclick=reset;
}
function refreshBoard(){
  const tiles=[...document.querySelectorAll(".tile")];
  tiles.forEach((button,index)=>{const tile=state.grid[index];button.dataset.number=tile.number;button.dataset.face=tile.face;button.setAttribute("aria-label",`Choisir le nombre ${tile.number}`);button.disabled=false;button.classList.remove("flipped");button.querySelector(":scope > span").textContent=tile.number;button.querySelector(":scope > div").innerHTML=cauri(tile.face)});
  const timer=document.querySelector(".timer b");if(timer)timer.textContent=state.seconds;
  const eyebrow=document.querySelector(".heading .eyebrow");if(eyebrow)eyebrow.textContent=`Choix ${Math.min(state.choices.length+1,16)} sur 16`;
  const progress=document.querySelector(".progress i");if(progress)progress.style.width=`${state.choices.length/16*100}%`;
  const opened=document.querySelector(".open-summary");if(opened)opened.textContent=`${openCount()} ouverts`;
  const closed=document.querySelector(".closed-summary");if(closed)closed.textContent=`${state.choices.length-openCount()} fermés`;
}
function choose(button,number,face){
  if(state.revealed)return;clearInterval(state.timer);state.timer=null;state.revealed=number;
  document.querySelectorAll(".tile").forEach(tile=>tile.disabled=true);button.classList.add("flipped");
  const live=document.querySelector(".reveal-live");if(live)live.textContent=`Le cauri choisi est ${face==="open"?"ouvert":"fermé"}.`;
  setTimeout(()=>{state.choices.push(face);state.revealed=null;if(state.choices.length===16){loadSign(openCount(),state.questionRound?"answer":"general");return}state.grid=newGrid();state.seconds=3;refreshBoard();startTimer()},1000)
}
function startTimer(){
  clearInterval(state.timer);state.timer=setInterval(()=>{state.seconds-=1;if(state.seconds<=0){state.grid=newGrid();state.seconds=3;refreshBoard()}else{const timer=document.querySelector(".timer b");if(timer)timer.textContent=state.seconds}},1000)
}
document.querySelector("#home").onclick=reset;reset();loadDomains();
