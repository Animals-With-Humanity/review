// ============================================================
// Core Team Member of the Month — Firebase starter
// 1) Create a Firebase project.
// 2) Enable Firestore and Authentication -> Anonymous.
// 3) Paste your Firebase web config below.
// 4) Publish the Firestore rules from firestore.rules.
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyC12OPjLTGUErYmHRA3V5XKLI-Ly3I6f_U",
  authDomain: "awh-main.firebaseapp.com",
  projectId: "awh-main",
  storageBucket: "awh-main.firebasestorage.app",
  messagingSenderId: "433114509867",
  appId: "1:433114509867:web:3c00b206a1e74f58c0f06e",
  measurementId: "G-K2QTK83ZVM"
};
// Only these emails can close voting, read reviewer names, and pick a winner.
// In demo mode the password below is checked in this file. Change it before sharing the page.
// When Firebase is connected, create the same email under Authentication -> Email/Password.
// The password in this file is then ignored; Firebase checks the password.
const ADMIN_ACCOUNTS = [
  { email: "sagar.arora198@gmail.com", password: "MemberMonth#2026" }
];
let isAdmin = false;
let adminEmail = "";

const DEMO_MEMBERS = [
  {id:"demo-1", name:"Add your first member", role:"Core Team"},
  {id:"demo-2", name:"Another team member", role:"Core Team"}
];

const ratings = [
  ["🎯","Responsibility"],["🛡️","Reliability"],["💬","Communication"],["❤️","Nature / Kindness"],
  ["💡","Creativity"],["🚀","Initiative"],["🧠","Problem solving"],["⭐","Goes beyond responsibility"],["👥","Teamwork"]
];
const ratingLevels = [["😕","Needs work"],["😐","Getting there"],["🙂","Good"],["😄","Great"],["🤩","Exceptional"]];
const traitOptions = ["💡 Ideas","😂 Energy","🧘 Calmness","🔥 Motivation","🤝 Support","🎨 Creativity","🧠 Problem solving","📋 Organization","❤️ Empathy","⚡ Action"];
const futureOptions = ["👑 Leader","💡 Idea generator","🎤 Public speaker","🧠 Problem solver","🎨 Creative head","🤝 People person","🛠️ Builder / Doer","📋 Organizer","🌎 Impact creator"];
const overallOptions = ["😕 Needs work","🙂 Good","😄 Great","🤩 Amazing"];
const colors = ["#173d29","#e63946","#f08c00","#f4c20d","#2a9d8f","#277da1","#7b2cbf","#ef5da8","#000000","#ffffff"];
const REACTION_EMOJIS = ["👍","❤️","😂","🔥","👏","🎉","💡","🙏","😮","😢","😡","⭐","💯","👎"];

let db=null, auth=null, firebaseReady=false;
let settings={reviewOpen:true};
let members=[];
let reviewer={name:"",email:""};
let currentMemberIndex=0,currentPage=0;
let answers={};
let canvas,ctx,drawing=false,eraseMode=false,color="#173d29";

function configured(){ return firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("PASTE_") && firebaseConfig.projectId && !firebaseConfig.projectId.startsWith("YOUR_"); }

window.addEventListener("load", async ()=>{
  buildRatings(); buildChips("traitChips",traitOptions); buildChips("futureChips",futureOptions); buildChips("overall",overallOptions); buildColors();
  setupCanvas();
  bindNavigation();
  document.getElementById("startBtn").onclick=startReviewing;
  document.getElementById("chooseAnother").onclick=()=>showView("pickView");
  document.getElementById("backBtn").onclick=()=>changePage(-1);
  document.getElementById("nextBtn").onclick=()=>changePage(1);
  document.getElementById("communityBtn").onclick=openCommunity;
  document.getElementById("addMember").onclick=addMember;
  document.getElementById("toggleStatus").onclick=toggleReviewStatus;
  document.getElementById("adminLogin").onclick=adminLogin;
  document.getElementById("adminLogout").onclick=adminLogout;
  if(configured()){
    try{
      firebase.initializeApp(firebaseConfig); auth=firebase.auth(); db=firebase.firestore();
      await new Promise(resolve=>{const unsub=auth.onAuthStateChanged(()=>{unsub();resolve()})});
      const signedInEmail=auth.currentUser&&auth.currentUser.email;
      if(signedInEmail&&adminEmailOk(signedInEmail)){isAdmin=true;adminEmail=signedInEmail.toLowerCase()}
      else if(!auth.currentUser) await auth.signInAnonymously();
      firebaseReady=true;
      await loadSettings(); await loadMembers();
    }catch(e){ console.error(e); toast("Firebase setup needs attention. Running in local demo mode."); loadLocalMembers(); loadLocalSettings(); restoreDemoAdmin(); }
  }else{
    loadLocalMembers();
    loadLocalSettings();
    restoreDemoAdmin();
    toast("Demo mode: reviews stay in this browser until Firebase web config is added.");
  }
  renderStatus();
});

function buildRatings(){
  const box=document.getElementById("ratings");
  ratings.forEach((r,i)=>{
    const row=document.createElement("div"); row.className="rating-row";
    row.innerHTML=`<div class="rating-label">${r[0]} ${r[1]}</div>`;
    ratingLevels.forEach((x,j)=>{
      const c=document.createElement("button"); c.type="button"; c.className="rating-choice"; c.innerHTML=`<b>${x[0]}</b><small>${x[1]}</small>`;
      c.onclick=()=>{row.querySelectorAll(".rating-choice").forEach(a=>a.classList.remove("selected"));c.classList.add("selected"); row.dataset.value=j};
      row.appendChild(c);
    });
    const skip=document.createElement("label"); skip.className="skip"; skip.innerHTML=`<input type="checkbox"> Don't know<br>them well`;
    skip.querySelector("input").onchange=e=>{row.dataset.skip=e.target.checked?"true":"false"; if(e.target.checked)row.querySelectorAll(".rating-choice").forEach(a=>a.classList.remove("selected"));};
    row.appendChild(skip); box.appendChild(row);
  });
}
function buildChips(id,items){
  const box=document.getElementById(id); items.forEach(t=>{const b=document.createElement("button");b.type="button";b.className="chip";b.textContent=t;b.onclick=()=>b.classList.toggle("selected");box.appendChild(b)});
}
function buildColors(){
  const box=document.getElementById("colors");
  colors.forEach(c=>{const b=document.createElement("button");b.className="color";b.style.background=c;b.title=c;b.onclick=()=>{color=c;eraseMode=false;document.querySelectorAll(".tool").forEach(x=>x.classList.remove("active"));document.querySelector('[data-tool="pen"]').classList.add("active");document.querySelectorAll(".color").forEach(x=>x.classList.remove("active"));b.classList.add("active")};box.appendChild(b)});
  box.firstChild.classList.add("active");
  document.querySelectorAll(".tool[data-tool]").forEach(b=>b.onclick=()=>{eraseMode=b.dataset.tool==="eraser";document.querySelectorAll(".tool[data-tool]").forEach(x=>x.classList.remove("active"));b.classList.add("active")});
  document.getElementById("clearCanvas").onclick=clearCanvas;
}
function setupCanvas(){
  canvas=document.getElementById("drawingCanvas"); ctx=canvas.getContext("2d"); resizeCanvas();
  ["mousedown","touchstart","pointerdown"].forEach(ev=>canvas.addEventListener(ev,startDraw,{passive:false}));
  ["mousemove","touchmove","pointermove"].forEach(ev=>canvas.addEventListener(ev,draw,{passive:false}));
  ["mouseup","mouseleave","touchend","pointerup"].forEach(ev=>canvas.addEventListener(ev,endDraw,{passive:false}));
  window.addEventListener("resize",()=>resizeCanvas());
}
function resizeCanvas(){
  if(!canvas)return; const rect=canvas.getBoundingClientRect(),ratio=window.devicePixelRatio||1;
  const old=canvas.width?ctx.getImageData(0,0,canvas.width,canvas.height):null;
  canvas.width=Math.floor(rect.width*ratio);canvas.height=Math.floor(rect.height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
  if(old){/* Canvas is cleared on resize intentionally for a simple starter. */} ctx.lineCap="round";ctx.lineJoin="round";
}
function point(e){const r=canvas.getBoundingClientRect();const p=e.touches?e.touches[0]:e;return{x:p.clientX-r.left,y:p.clientY-r.top}}
function startDraw(e){e.preventDefault();drawing=true;const p=point(e);ctx.beginPath();ctx.moveTo(p.x,p.y)}
function draw(e){if(!drawing)return;e.preventDefault();const p=point(e);ctx.strokeStyle=eraseMode?"#ffffff":color;ctx.lineWidth=+document.getElementById("brushSize").value;ctx.lineTo(p.x,p.y);ctx.stroke()}
function endDraw(){drawing=false}
function clearCanvas(){ctx.clearRect(0,0,canvas.width,canvas.height)}

let pendingView="";
function bindNavigation(){
  document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=()=>{
    if(b.dataset.view==="reviewView") openReviews();
    else if(b.dataset.view==="resultsView") openCommunity();
    else showView(b.dataset.view);
  });
}
function votingClosed(){return settings.reviewOpen===false}
async function refreshSettings(){
  if(!firebaseReady)return;
  try{await loadSettings()}catch(e){console.error(e)}
}
async function openReviews(){
  await refreshSettings();
  if(votingClosed()){showView("pickView");return}
  showView(reviewer.email?"pickView":"setupView");
}
function openCommunity(){
  if(!reviewer.email){
    pendingView="resultsView";
    document.getElementById("setupMessage").textContent="Enter your name and email to open the community. Each person can react once per answer.";
    showView("setupView");
    return;
  }
  showView("resultsView");
}
function showView(id){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));document.getElementById(id).classList.add("active");
  const navId=(id==="setupView"||id==="pickView"||id==="reviewView")?"reviewView":id;
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.view===navId));
  if(id==="pickView")renderPickList();
  if(id==="resultsView")loadResults(); if(id==="adminView")renderAdminAccess();
}
function startReviewing(){
  const name=document.getElementById("reviewerName").value.trim(),email=document.getElementById("reviewerEmail").value.trim(),consent=document.getElementById("consent").checked;
  if(!name||!email||!email.includes("@")||!consent){document.getElementById("setupMessage").textContent="Please enter your name, a valid email and accept the respectful-review note.";return}
  reviewer={name,email:email.toLowerCase()};document.getElementById("reviewerBadge").textContent=name;
  document.getElementById("setupMessage").textContent="";
  const next=pendingView||"pickView";
  pendingView="";
  showView(next);
}
function reviewKey(email,memberId){
  return btoa(unescape(encodeURIComponent(email+"|"+memberId))).replace(/[^a-zA-Z0-9]/g,"").slice(0,120);
}
async function reviewedMemberIds(){
  const ids=new Set();
  if(!reviewer.email)return ids;
  if(firebaseReady){
    await Promise.all(members.map(async m=>{
      const snap=await db.collection("reviews").doc(reviewKey(reviewer.email,m.id)).get();
      if(snap.exists)ids.add(m.id);
    }));
  }else{
    members.forEach(m=>{if(localStorage.getItem("review:"+reviewer.email+"|"+m.id))ids.add(m.id)});
  }
  return ids;
}
async function renderPickList(){
  const box=document.getElementById("pickList");
  await refreshSettings();
  if(votingClosed()){box.innerHTML='<div class="empty">Voting is closed. New reviews and changes to reviews are no longer accepted.</div>';return}
  if(!members.length){box.innerHTML='<div class="empty">No core members yet. An admin can add them from the Admin tab.</div>';return}
  box.innerHTML='<div class="empty">Loading members…</div>';
  const done=await reviewedMemberIds();
  box.innerHTML="";
  members.forEach(m=>{
    const btn=document.createElement("button");
    btn.type="button";
    btn.className="pick-card"+(done.has(m.id)?" done":"");
    btn.innerHTML=`<span><b>${escapeHtml(m.name)}</b><br><small>${escapeHtml(m.role||"Core Team")}${done.has(m.id)?" · Already reviewed":""}</small></span><span class="pick-go">${done.has(m.id)?"View":"Review →"}</span>`;
    btn.onclick=()=>startMemberReview(m.id);
    box.appendChild(btn);
  });
}
function startMemberReview(id){
  if(votingClosed()){toast("Voting is closed. You can’t submit or change a review.");showView("pickView");return}
  const index=members.findIndex(m=>m.id===id);
  if(index<0){toast("That member is no longer on the list.");return}
  currentMemberIndex=index;
  showView("reviewView");
  loadMember();
}
function loadMember(){
  const m=members[currentMemberIndex];if(!m)return;
  document.getElementById("memberName").textContent=m.name;
  document.getElementById("memberCounter").textContent=m.role||"Core Team";
  currentPage=0;resetForm();renderPage();clearCanvas();
}
function resetForm(){
  document.querySelectorAll(".rating-row").forEach(r=>{delete r.dataset.value;delete r.dataset.skip;r.querySelectorAll(".rating-choice").forEach(c=>c.classList.remove("selected"));r.querySelector("input").checked=false});
  document.querySelectorAll(".chip").forEach(c=>c.classList.remove("selected"));
  ["impressed","beyond","animalWhy","skills","explore","memory","suggestion","message"].forEach(id=>document.getElementById(id).value="");
}
function renderPage(){
  document.querySelectorAll(".form-page").forEach(p=>p.classList.toggle("active",+p.dataset.page===currentPage));
  document.querySelectorAll(".step").forEach((s,i)=>s.classList.toggle("active",i===currentPage));
  document.getElementById("backBtn").disabled=currentPage===0;
  document.getElementById("nextBtn").textContent=currentPage===4?"Submit review ✓":"Next →";
}
async function changePage(delta){
  if(delta>0){
    if(currentPage<4){currentPage++;renderPage();if(currentPage===2)setTimeout(resizeCanvas,50);return}
    await saveCurrentReview();
  }else if(currentPage>0){currentPage--;renderPage()}
}
function selected(id){return [...document.querySelectorAll(`#${id} .chip.selected`)].map(x=>x.textContent)}
function collectReview(){
  const ratingData={};document.querySelectorAll(".rating-row").forEach((r,i)=>ratingData[ratings[i][1]]={value:r.dataset.value===undefined?null:+r.dataset.value,skip:r.dataset.skip==="true"});
  return {
    memberId:members[currentMemberIndex].id,memberName:members[currentMemberIndex].name,
    reviewerName:reviewer.name,reviewerEmail:reviewer.email,
    ratings:ratingData,traits:selected("traitChips"),
    impressed:document.getElementById("impressed").value.trim(),beyond:document.getElementById("beyond").value.trim(),
    animalDrawing:canvas.toDataURL("image/png"),animalWhy:document.getElementById("animalWhy").value.trim(),
    future:selected("futureChips"),skills:document.getElementById("skills").value.trim(),explore:document.getElementById("explore").value.trim(),
    memory:document.getElementById("memory").value.trim(),suggestion:document.getElementById("suggestion").value.trim(),
    overall:selected("overall")[0]||"",message:document.getElementById("message").value.trim(),createdAt:firebase.firestore?.FieldValue.serverTimestamp?.()||new Date().toISOString()
  };
}
async function saveCurrentReview(){
  if(!reviewer.email){toast("Enter your name and email first.");return}
  await refreshSettings();
  // Closed voting must reject both a new review and a second submit of an existing one.
  if(votingClosed()){toast("Voting is closed. This review was not saved.");showView("pickView");return}
  const review=collectReview();
  let saved=false;
  if(firebaseReady){
    try{
      // The deterministic review key makes one review per email/member in the UI/data model.
      const key=reviewKey(reviewer.email,review.memberId);
      const ref=db.collection("reviews").doc(key);
      const exists=await ref.get();
      if(exists.exists){toast("You have already reviewed this member. It can’t be changed.");}
      else{
        const {reviewerName,reviewerEmail,...publicReview}=review;
        await ref.set({...publicReview,reviewerKey:key});
        await db.collection("review_private").doc(key).set({reviewerName,reviewerEmail,memberId:review.memberId,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
        saved=true;
      }
    }catch(e){console.error(e);toast("Could not save this review. Check Firebase configuration/rules.");return}
  }else{
    const key="review:"+reviewer.email+"|"+review.memberId;
    if(localStorage.getItem(key)){toast("You have already reviewed this member. It can’t be changed.");}
    else{localStorage.setItem(key,JSON.stringify(review));saved=true}
  }
  if(saved)toast("Review saved. Choose another person, or stop here.");
  showView("pickView");
}
async function loadSettings(){
  const s=await db.collection("settings").doc("review").get();if(s.exists)settings={reviewOpen:true,...s.data()};
}
async function loadMembers(){
  const snap=await db.collection("members").orderBy("name").get();members=snap.docs.map(d=>({id:d.id,...d.data()}));
}
function renderStatus(){
  const open=settings.reviewOpen!==false;document.getElementById("statusText").innerHTML=open?`<span class="status-open">● Review is OPEN</span>`:`<span class="status-closed">● Review is CLOSED — community reactions are enabled</span>`;
  document.getElementById("toggleStatus").textContent=open?"Close voting":"Open voting";
}
async function toggleReviewStatus(){
  if(!requireAdmin())return;
  settings.reviewOpen=!(settings.reviewOpen!==false);renderStatus();
  try{await persistSettings()}catch(e){console.error(e);toast("Could not save the voting status.");return}
  toast(settings.reviewOpen?"Voting opened":"Voting closed. Community answers are now visible.");
}
async function addMember(){
  if(!requireAdmin())return;
  const name=document.getElementById("newMemberName").value.trim(),role=document.getElementById("newMemberRole").value.trim()||"Core Team";
  if(!name){toast("Enter a member name.");return}
  const member={name,role,createdAt:new Date().toISOString()};
  if(firebaseReady){const ref=await db.collection("members").add(member);member.id=ref.id}else member.id="local-"+Date.now();
  members.push(member);members.sort((a,b)=>a.name.localeCompare(b.name));saveLocalMembers();renderMembers();
  document.getElementById("newMemberName").value="";document.getElementById("newMemberRole").value="";toast("Member added.");
}
function renderMembers(){
  const box=document.getElementById("memberList");if(!box)return;box.innerHTML="";
  members.forEach(m=>{const row=document.createElement("div");row.className="member-item";row.innerHTML=`<div><b>${escapeHtml(m.name)}</b><br><small>${escapeHtml(m.role||"Core Team")}</small></div><button class="btn" data-id="${m.id}">Remove</button>`;row.querySelector("button").onclick=()=>removeMember(m.id);box.appendChild(row)})
}
async function removeMember(id){
  if(!requireAdmin())return;
  const m=members.find(x=>x.id===id);if(!m||!confirm(`Remove ${m.name}?`))return;
  if(firebaseReady&& !id.startsWith("demo-")&&!id.startsWith("local-"))await db.collection("members").doc(id).delete();
  members=members.filter(x=>x.id!==id);saveLocalMembers();renderMembers();toast("Member removed.");
}
async function loadResults(){
  const box=document.getElementById("resultsContainer");
  if(!reviewer.email){openCommunity();return}
  if(settings.reviewOpen!==false){box.innerHTML='<div class="empty">🔒 Community review is locked until an admin closes voting.<br><br>Once closed, answers are shown without reviewer names.</div>';return}
  const all=await loadReviews(false);
  if(!all.length){box.innerHTML='<div class="empty">No reviews yet.</div>';return}
  const tally=await reactionTally();
  const byMember={};all.forEach(r=>(byMember[r.memberId]??=[]).push(r));
  box.innerHTML="";
  if(settings.winnerMemberName){
    const banner=document.createElement("div");banner.className="winner-banner";
    banner.innerHTML=`<span class="eyebrow">MEMBER OF THE MONTH</span><h2>${escapeHtml(settings.winnerMemberName)}</h2><p class="muted">Chosen by the admin from the team’s reviews.</p>`;
    box.appendChild(banner);
  }
  Object.entries(byMember).forEach(([mid,reviews])=>{
    const member=members.find(m=>m.id===mid);if(!member)return;
    const group=document.createElement("div");group.className="card";group.innerHTML=`<h2>${escapeHtml(member.name)}</h2><p class="muted">${reviews.length} anonymous review${reviews.length>1?"s":""}. Open one review at a time.</p>`;
    reviews.forEach(r=>group.appendChild(foldReview(r,tally)));
    box.appendChild(group);
  });
}
function foldReview(r,tally){
  const fold=document.createElement("div");fold.className="review-fold";
  const score=overallScore(r);
  const totals=formatEmojiCounts(reviewReactionTotals(r,tally));
  const btn=document.createElement("button");btn.type="button";btn.className="fold-toggle";
  btn.innerHTML=`<span><b>Anonymous review</b><br><small>Score ${score||"—"}/5 · ${escapeHtml(totals)}</small></span><span class="fold-mark">Open</span>`;
  const body=document.createElement("div");body.className="fold-body";
  body.appendChild(reviewCard(r,false,tally));
  btn.onclick=()=>{
    const opening=!fold.classList.contains("open");
    document.querySelectorAll(".review-fold.open").forEach(el=>{el.classList.remove("open");const mark=el.querySelector(".fold-mark");if(mark)mark.textContent="Open"});
    if(opening){fold.classList.add("open");btn.querySelector(".fold-mark").textContent="Close"}
  };
  fold.append(btn,body);
  return fold;
}
function answerParts(r){
  const parts=[];
  ratings.forEach(([icon,label])=>{
    const row=(r.ratings||{})[label];
    let body="Not answered";
    if(row&&row.skip)body="Don't know them well";
    else if(row&&Number.isInteger(Number(row.value))&&ratingLevels[Number(row.value)])body=ratingLevels[Number(row.value)][0]+" "+ratingLevels[Number(row.value)][1];
    parts.push({id:"rating:"+label,title:icon+" "+label,body});
  });
  const text=(id,title,value)=>parts.push({id,title,body:value&&String(value).trim()?String(value).trim():"Not answered"});
  text("traits","💡 Team vibe",(r.traits||[]).join(" · "));
  text("impressed","✨ What impressed them",r.impressed);
  text("beyond","🚀 Beyond responsibility",r.beyond);
  const drawing=typeof r.animalDrawing==="string"&&r.animalDrawing.startsWith("data:image/")?r.animalDrawing:"";
  parts.push({id:"animalDrawing",title:"🎨 Animal drawing",body:drawing?"":"Not answered",image:drawing});
  text("animalWhy","🐾 Why this animal",r.animalWhy);
  text("future","🔮 Future potential",(r.future||[]).join(" · "));
  text("skills","📚 Skills to explore",r.skills);
  text("explore","🌱 Could explore",r.explore);
  text("memory","❤️ Favorite moment",r.memory);
  text("suggestion","💬 One thing to grow",r.suggestion);
  text("overall","⭐ Overall rating",r.overall);
  text("message","💌 Message",r.message);
  return parts;
}
function mergeEmojiCounts(target,source){Object.entries(source||{}).forEach(([emoji,n])=>{target[emoji]=(target[emoji]||0)+n});return target}
function formatEmojiCounts(counts){
  const entries=Object.entries(counts||{}).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]);
  return entries.length?entries.map(([emoji,n])=>emoji+" "+n).join(" · "):"No reactions yet";
}
function isEmoji(value){
  const v=String(value||"").trim();
  if(!v||v.length>16)return false;
  return /\p{Extended_Pictographic}/u.test(v);
}
function reviewReactionTotals(r,tally){
  return answerParts(r).reduce((sum,p)=>mergeEmojiCounts(sum,((tally[r.id+"|"+p.id]||{}).counts)),{});
}
function reviewCard(r,forAdmin,tally){
  const card=document.createElement("article");card.className="review-card";
  const score=overallScore(r);
  const totals=reviewReactionTotals(r,tally||{});
  const who=forAdmin?`${r.reviewerName||"Unknown reviewer"} · ${r.reviewerEmail||""}`:"Anonymous teammate";
  const meta=document.createElement("div");meta.className="review-meta";
  meta.textContent=`${who} · Score ${score||"—"}/5 · ${formatEmojiCounts(totals)}`;
  card.appendChild(meta);
  answerParts(r).forEach(part=>{
    const block=document.createElement("div");block.className="answer-block";
    const title=document.createElement("b");title.textContent=part.title;block.appendChild(title);
    if(part.image){const img=document.createElement("img");img.className="animal-img";img.alt="Animal drawing";img.src=part.image;block.appendChild(img)}
    else{const body=document.createElement("div");body.textContent=part.body;if(part.body==="Not answered")body.className="answer-empty";block.appendChild(body)}
    const counts=(tally||{})[r.id+"|"+part.id]||{counts:{},mine:null};
    if(forAdmin){
      const row=document.createElement("div");row.className="reaction-counts";
      row.textContent=formatEmojiCounts(counts.counts);
      block.appendChild(row);
    }else{
      const bar=document.createElement("div");bar.className="reaction-bar";bar.dataset.mine=counts.mine||"";
      paintReactionBar(bar,r.id,part.id,counts);
      block.appendChild(bar);
    }
    card.appendChild(block);
  });
  return card;
}
function paintReactionBar(bar,reviewId,partId,counts){
  const mine=bar.dataset.mine||counts.mine||"";
  const extras=Object.keys(counts.counts||{}).filter(emoji=>!REACTION_EMOJIS.includes(emoji));
  bar.querySelectorAll(".react").forEach(b=>b.remove());
  [...REACTION_EMOJIS,...extras].forEach(emoji=>{
    const n=(counts.counts&&counts.counts[emoji])||0;
    const b=document.createElement("button");b.type="button";b.className="react"+(mine===emoji?" active":"");b.dataset.emoji=emoji;
    b.innerHTML=`${emoji} <span>${n}</span>`;
    b.onclick=()=>react(reviewId,partId,emoji,b);
    bar.insertBefore(b,bar.querySelector(".emoji-any"));
  });
  if(!bar.querySelector(".emoji-any")){
    const form=document.createElement("form");form.className="emoji-any";
    form.innerHTML=`<input type="text" maxlength="8" placeholder="Any emoji" aria-label="Type any emoji"><button type="submit" class="btn">Add</button>`;
    form.onsubmit=e=>{e.preventDefault();const input=form.querySelector("input");const emoji=input.value.trim();if(!isEmoji(emoji)){toast("Type an emoji, such as 🌟 or 😎.");return}react(reviewId,partId,emoji,form);input.value=""};
    bar.appendChild(form);
  }
}
function overallScore(r){
  const vals=Object.values(r.ratings||{}).filter(x=>x&&!x.skip&&Number.isInteger(x.value)).map(x=>x.value+1);if(!vals.length)return null;return (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1);
}
function reactorId(){
  return reviewer.email?"email:"+reviewer.email:"";
}
function reactionDocId(actor,reviewId,partId){
  // Do not shorten this id. The answer id is at the end, and cutting it off
  // made the same emoji count as already used on a different answer.
  return btoa(unescape(encodeURIComponent(actor+"|"+reviewId+"|"+partId))).replace(/[^a-zA-Z0-9]/g,"");
}
async function loadReactions(){
  if(!firebaseReady)return Object.keys(localStorage).filter(k=>k.startsWith("reaction:")).map(k=>JSON.parse(localStorage.getItem(k)));
  const snap=await db.collection("reactions").get();
  return snap.docs.map(d=>d.data());
}
async function reactionTally(){
  const tally={};
  const mine=reactorId();
  (await loadReactions()).forEach(row=>{
    const emoji=row.emoji||(row.polarity==="up"?"👍":row.polarity==="down"?"👎":"");
    if(!row.reviewId||!row.partId||!emoji)return;
    const key=row.reviewId+"|"+row.partId;
    if(!tally[key])tally[key]={counts:{},mine:null};
    tally[key].counts[emoji]=(tally[key].counts[emoji]||0)+1;
    if(mine&&row.reactorId===mine)tally[key].mine=emoji;
  });
  return tally;
}
async function react(reviewId,partId,emoji,button){
  const actor=reactorId();
  if(!actor){toast("Enter your name on the Reviews tab before reacting.");return}
  if(!isEmoji(emoji)){toast("Type an emoji, such as 🌟 or 😎.");return}
  const payload={reviewId,partId,emoji,reactorId:actor};
  try{
    if(firebaseReady){
      const ref=db.collection("reactions").doc(reactionDocId(actor,reviewId,partId));
      const existing=await ref.get();
      const previous=existing.exists?(existing.data().emoji||(existing.data().polarity==="up"?"👍":existing.data().polarity==="down"?"👎":"")):"";
      if(previous===emoji){toast("You already used this emoji here.");return}
      await ref.set({...payload,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    }else{
      const key="reaction:"+actor+"|"+reviewId+"|"+partId;
      const prev=localStorage.getItem(key);
      const previous=prev?(JSON.parse(prev).emoji||""):"";
      if(previous===emoji){toast("You already used this emoji here.");return}
      localStorage.setItem(key,JSON.stringify({...payload,createdAt:new Date().toISOString()}));
    }
  }catch(e){console.error(e);toast("Could not save this reaction.");return}
  const bar=button.closest(".reaction-bar");
  if(bar){
    const previous=bar.dataset.mine||"";
    const counts={};
    bar.querySelectorAll(".react").forEach(b=>{counts[b.dataset.emoji]=+b.querySelector("span").textContent});
    if(previous&&previous!==emoji)counts[previous]=Math.max(0,(counts[previous]||0)-1);
    if(previous!==emoji)counts[emoji]=(counts[emoji]||0)+1;
    bar.dataset.mine=emoji;
    paintReactionBar(bar,reviewId,partId,{counts,mine:emoji});
  }
  toast("Reaction saved.");
}
function adminEmailOk(email){return ADMIN_ACCOUNTS.some(a=>a.email.toLowerCase()===String(email||"").toLowerCase())}
function requireAdmin(){if(isAdmin)return true;toast("Admin sign-in required.");showView("adminView");return false}
function loadLocalSettings(){try{const raw=localStorage.getItem("ctm-settings");if(raw)settings={reviewOpen:true,...JSON.parse(raw)}}catch(e){}}
function loadLocalMembers(){try{const raw=localStorage.getItem("ctm-members");const parsed=raw?JSON.parse(raw):null;members=(Array.isArray(parsed)&&parsed.length)?parsed:DEMO_MEMBERS.slice()}catch(e){members=DEMO_MEMBERS.slice()}}
function saveLocalMembers(){if(!firebaseReady)localStorage.setItem("ctm-members",JSON.stringify(members))}
function restoreDemoAdmin(){const saved=sessionStorage.getItem("ctmAdmin");if(saved&&adminEmailOk(saved)){isAdmin=true;adminEmail=saved.toLowerCase()}}
async function persistSettings(){
  const payload={reviewOpen:settings.reviewOpen!==false,winnerMemberId:settings.winnerMemberId||null,winnerMemberName:settings.winnerMemberName||null,winnerPickedAt:settings.winnerPickedAt||null};
  settings={...settings,...payload};
  if(firebaseReady)await db.collection("settings").doc("review").set(payload,{merge:true});
  else localStorage.setItem("ctm-settings",JSON.stringify(settings));
}
function renderAdminAccess(){
  document.getElementById("adminGate").hidden=isAdmin;
  document.getElementById("adminPanel").hidden=!isAdmin;
  if(!isAdmin)return;
  document.getElementById("adminWho").textContent=adminEmail;
  renderMembers();renderStatus();loadEvaluation();
}
async function adminLogin(){
  const email=document.getElementById("adminEmail").value.trim().toLowerCase();
  const password=document.getElementById("adminPassword").value;
  const msg=document.getElementById("adminLoginMessage");
  if(!adminEmailOk(email)){msg.textContent="This email is not an admin. Add it to ADMIN_ACCOUNTS in app.js.";return}
  if(firebaseReady){
    try{
      await auth.signInWithEmailAndPassword(email,password);
      isAdmin=true;adminEmail=email;msg.textContent="";
      document.getElementById("adminPassword").value="";
      renderAdminAccess();
    }catch(e){console.error(e);msg.textContent="Sign-in failed. In Firebase, enable Email/Password and create this admin user."}
    return;
  }
  const account=ADMIN_ACCOUNTS.find(a=>a.email.toLowerCase()===email);
  if(!account||account.password!==password){msg.textContent="Wrong email or password.";return}
  isAdmin=true;adminEmail=email;sessionStorage.setItem("ctmAdmin",email);msg.textContent="";
  document.getElementById("adminPassword").value="";
  renderAdminAccess();
}
async function adminLogout(){
  isAdmin=false;adminEmail="";sessionStorage.removeItem("ctmAdmin");
  if(firebaseReady){await auth.signOut();await auth.signInAnonymously()}
  renderAdminAccess();
  toast("Signed out of admin.");
}
async function loadReviews(includeIdentity){
  if(firebaseReady){
    const snap=await db.collection("reviews").get();
    const reviews=snap.docs.map(d=>{const r={id:d.id,...d.data()};if(!includeIdentity){delete r.reviewerName;delete r.reviewerEmail}return r});
    if(includeIdentity){
      try{
        const priv=await db.collection("review_private").get();
        const byId={};priv.docs.forEach(d=>{byId[d.id]=d.data()});
        reviews.forEach(r=>{const p=byId[r.id];if(p){r.reviewerName=p.reviewerName;r.reviewerEmail=p.reviewerEmail}});
      }catch(e){console.error(e)}
    }
    return reviews;
  }
  return Object.keys(localStorage).filter(k=>k.startsWith("review:")).map(k=>{
    const r=JSON.parse(localStorage.getItem(k));r.id=k;
    if(!includeIdentity){delete r.reviewerName;delete r.reviewerEmail}
    return r;
  });
}
async function loadEvaluation(){
  if(!isAdmin)return;
  const box=document.getElementById("evalList");
  const all=await loadReviews(true);
  if(!all.length){box.innerHTML='<div class="empty">No reviews yet. They appear here after people submit.</div>';return}
  const tally=await reactionTally();
  const byMember={};all.forEach(r=>(byMember[r.memberId]??=[]).push(r));
  const rows=Object.entries(byMember).map(([mid,reviews])=>{
    const member=members.find(m=>m.id===mid);
    const scores=reviews.map(overallScore).filter(Boolean).map(Number);
    const avg=scores.length?(scores.reduce((a,b)=>a+b,0)/scores.length):null;
    const reactions=reviews.reduce((sum,r)=>mergeEmojiCounts(sum,reviewReactionTotals(r,tally)),{});
    return {mid,name:member?member.name:(reviews[0].memberName||"Unknown"),reviews,avg,reactions};
  }).sort((a,b)=>Object.values(b.reactions).reduce((s,n)=>s+n,0)-Object.values(a.reactions).reduce((s,n)=>s+n,0)||((b.avg??-1)-(a.avg??-1)));
  box.innerHTML="";
  rows.forEach(row=>{
    const card=document.createElement("div");card.className="eval-item"+(settings.winnerMemberId===row.mid?" is-winner":"");
    card.innerHTML=`<div class="eval-head"><div><b>${escapeHtml(row.name)}</b><br><small>${row.reviews.length} review${row.reviews.length>1?"s":""}${row.avg!=null?` · average ${row.avg.toFixed(1)}/5`:""} · ${escapeHtml(formatEmojiCounts(row.reactions))}</small></div><button class="btn primary" type="button">${settings.winnerMemberId===row.mid?"Winner":"Choose as winner"}</button></div>`;
    card.querySelector("button").onclick=()=>pickWinner(row.mid,row.name);
    row.reviews.forEach(r=>card.appendChild(reviewCard(r,true,tally)));
    box.appendChild(card);
  });
}
async function pickWinner(memberId,name){
  if(!requireAdmin())return;
  settings.winnerMemberId=memberId;settings.winnerMemberName=name;settings.winnerPickedAt=new Date().toISOString();
  try{await persistSettings()}catch(e){console.error(e);toast("Could not save the winner.");return}
  toast(name+" is the winner.");
  loadEvaluation();
}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove("show"),3000)}
