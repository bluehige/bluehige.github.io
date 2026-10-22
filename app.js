(function(){
'use strict';
var projects=window.BH_PROJECTS||[];
var labels={game:'게임',app:'앱 · 웹',tool:'제작 도구',lab:'AI 스킬 · 연구'};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function art(p){return '<div class="card-art art-'+esc(p.art)+'">'+(p.cover?'<img src="'+esc(p.cover)+'" alt="'+esc(p.short)+' 프로젝트 이미지" loading="lazy">':'<span class="art-symbol" aria-hidden="true">'+esc(p.mark)+'</span><span class="art-secondary">'+esc(p.kicker.split(' · ')[0])+'</span>')+'</div>'}
function card(p){return '<article class="project-card"><a class="card-link" href="./project.html?id='+encodeURIComponent(p.id)+'" aria-label="'+esc(p.title)+' 상세 소개 보기">'+art(p)+'<div class="card-body"><div class="card-top"><span class="category-chip">'+esc(labels[p.category])+'</span><span class="status-chip '+(p.status==='개발 중'?'dev':'')+'">'+esc(p.status)+'</span></div><h3>'+esc(p.title)+'</h3><p class="card-desc">'+esc(p.desc)+'</p><div class="card-footer"><span>'+esc(p.kicker)+'</span><strong>살펴보기 ↗</strong></div></div></a></article>'}
window.BH_RENDER={art:art,card:card,esc:esc,labels:labels};
var grid=document.getElementById('projects-grid');
if(!grid)return;
var category='all',search='';
var counts=document.getElementById('project-count'),allcount=document.getElementById('filter-all-count');if(counts)counts.textContent=projects.length+'+';if(allcount)allcount.textContent=projects.length;
function render(){var list=projects.filter(function(p){return(category==='all'||p.category===category)&&(!search||(p.title+' '+p.short+' '+p.desc+' '+p.kicker).toLocaleLowerCase().includes(search))});grid.innerHTML=list.map(card).join('');document.getElementById('empty').classList.toggle('hidden',!!list.length)}
document.querySelectorAll('.filter').forEach(function(b){b.addEventListener('click',function(){category=b.dataset.category;document.querySelectorAll('.filter').forEach(function(x){var on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-pressed',on?'true':'false')});render()})});
var searchBox=document.getElementById('search');if(searchBox)searchBox.addEventListener('input',function(){search=this.value.trim().toLocaleLowerCase();render()});
render();
var ids=['mawang','pano-maker','type'],i=0;
var pos=document.getElementById('feature-position');
function feature(){var p=projects.find(function(x){return x.id===ids[i]});if(!p)return;var image=document.getElementById('feature-img');if(p.hero||p.cover){image.src=p.hero||p.cover;image.alt=p.short+' 소개 이미지';image.style.opacity='.8'}else{image.removeAttribute('src');image.alt='';image.style.opacity='0'}
var root=document.getElementById('feature');root.style.background=({'mawang':'linear-gradient(115deg,#07122e,#34336b)','pano-maker':'linear-gradient(115deg,#04385e,#227bb5)','type':'linear-gradient(115deg,#0d3c8c,#428cf1)'})[p.id];
document.getElementById('feature-title').textContent=p.title;document.getElementById('feature-desc').textContent=p.desc;document.getElementById('feature-kicker').textContent=p.kicker+' · '+p.status;document.getElementById('feature-link').href='./project.html?id='+encodeURIComponent(p.id);pos.textContent=String(i+1).padStart(2,'0')+' / '+String(ids.length).padStart(2,'0')}
var prev=document.getElementById('feature-prev'),next=document.getElementById('feature-next');
if(prev&&next){prev.addEventListener('click',function(){i=(i+ids.length-1)%ids.length;feature()});next.addEventListener('click',function(){i=(i+1)%ids.length;feature()});feature()}
})();