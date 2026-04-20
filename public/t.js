(function(){
var s=document.currentScript
if(!s)return
var key=s.getAttribute('data-site-id')
var endpoint=s.getAttribute('data-endpoint')
if(!key||!endpoint)return
var ignoreDnt=s.hasAttribute('data-ignore-dnt')
if(!ignoreDnt){
if(navigator.doNotTrack==='1'||window.doNotTrack==='1')return
if(navigator.globalPrivacyControl===true)return
}
var url=endpoint.replace(/\/+$/,'')+'/ingest'
var last={path:'',at:0}
var trackMoves=s.hasAttribute('data-track-moves')
var trackScroll=s.hasAttribute('data-track-scroll')
function send(payload,useBeacon){
try{
var body=JSON.stringify(payload)
if(useBeacon&&navigator.sendBeacon){
navigator.sendBeacon(url,new Blob([body],{type:'application/json'}))
}else{
fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:body,keepalive:true,credentials:'omit',mode:'cors'}).catch(function(){})
}
}catch(e){}
}
function pageview(){
var p=location.pathname+location.search
if(p===last.path&&Date.now()-last.at<500)return
last={path:p,at:Date.now()}
var ref=document.referrer||''
try{
if(ref){var u=new URL(ref);if(u.hostname===location.hostname)ref='';else ref=u.hostname}
}catch(e){}
send({k:key,p:p,r:ref,t:'pageview'})
}
function event(name){
send({k:key,p:location.pathname,n:name,t:'event'})
}
function onClick(e){
var w=window.innerWidth||1
var h=Math.max(document.documentElement.scrollHeight,window.innerHeight)||1
var x=(e.pageX||e.clientX+window.scrollX)/w
var y=(e.pageY||e.clientY+window.scrollY)/h
send({k:key,p:location.pathname,t:'event',n:'click',hk:'click',hx:x,hy:y})
}
var moveSamples=[],moveTimer=null
function onMove(e){
var w=window.innerWidth||1,h=window.innerHeight||1
moveSamples.push({x:e.clientX/w,y:e.clientY/h})
if(moveSamples.length>40)moveSamples.shift()
if(moveTimer)return
moveTimer=setTimeout(function(){
var sample=moveSamples[Math.floor(moveSamples.length/2)]
if(sample)send({k:key,p:location.pathname,t:'event',n:'move',hk:'move',hx:sample.x,hy:sample.y})
moveSamples=[];moveTimer=null
},1500)
}
var scrollMax=0
function onScroll(){
var sh=Math.max(document.documentElement.scrollHeight-window.innerHeight,1)
var r=(window.scrollY||document.documentElement.scrollTop)/sh
if(r>scrollMax)scrollMax=r
}
function flushScroll(){
if(scrollMax>0){
send({k:key,p:location.pathname,t:'event',n:'scroll',hk:'scroll',hx:0.5,hy:Math.min(1,scrollMax)})
scrollMax=0
}
}
var pushState=history.pushState
history.pushState=function(){pushState.apply(this,arguments);setTimeout(pageview,0)}
window.addEventListener('popstate',pageview)
window.addEventListener('hashchange',pageview)
document.addEventListener('click',onClick,true)
if(trackMoves)document.addEventListener('mousemove',onMove,{passive:true})
if(trackScroll){window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('beforeunload',flushScroll)}
window.nagare={event:event,pageview:pageview}
if(window!==window.top){var rh=function(){window.parent.postMessage({type:'nagare:height',height:Math.max(document.documentElement.scrollHeight,document.body.scrollHeight)},'*')};addEventListener('load',rh);setTimeout(rh,3000);addEventListener('scroll',function(){window.parent.postMessage({type:'nagare:scroll',y:window.scrollY||0},'*')},{passive:true})}
if(document.readyState==='complete')pageview()
else window.addEventListener('load',pageview)
})()