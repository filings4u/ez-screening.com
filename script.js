(()=>{
'use strict';
const API='https://afnftjozrtxenojziwew.supabase.co/rest/v1/store_products?select=id,name,category,description,price_cents,active,sort_order,details&active=eq.true&order=sort_order.asc';
const KEY='ez_screening_cart_v1', PUB='sb_publishable_KxHg_xyUt9vszOePTvYdjA_Jn60tbDQ';
const fallback=window.EZ_PRODUCTS||[];
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dollars=c=>c==null?'Price on request':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(c/100);
let products=[],byId={},loaded=false;
const read=()=>{try{let c=JSON.parse(localStorage.getItem(KEY)||'{}');return Object.fromEntries(Object.entries(c).filter(([id,n])=>/^[a-z0-9-]{1,80}$/.test(id)&&Number.isInteger(n)&&n>=1&&n<=99))}catch{return {}}};
const write=v=>{localStorage.setItem(KEY,JSON.stringify(v));counts()};
const counts=()=>{let n=Object.values(read()).reduce((s,v)=>s+v,0);document.querySelectorAll('.cart-count').forEach(e=>e.textContent=n)};
const toast=message=>{let t=document.getElementById('toast');if(t){t.textContent=message;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3200)}};
const label={urine:'Urine',hair:'Hair',oral:'Oral Fluid',alcohol:'Alcohol',dot:'DOT',workplace:'Workplace',postaccident:'Post-Accident'};
async function fetchCatalog(){
 const response=await fetch(API,{headers:{apikey:PUB,Accept:'application/json'}});
 if(!response.ok)throw Error('Product catalog not available ('+response.status+').');
 let data=await response.json();
 if(!Array.isArray(data))throw Error('Invalid product catalog response.');
 products=data;byId=Object.fromEntries(products.map(p=>[p.id,p]));loaded=true;
}
function productCard(p){
 let category=label[p.category]||p.category;
 return '<article class="product-card shop-card"><div class="product-top"><span class="tag">'+safe(category)+'</span><span class="product-glyph">✳</span></div><h3>'+safe(p.name)+'</h3><p>'+safe(p.description)+'</p><div class="product-bottom"><div><span class="price-label">PRICE</span><strong>'+dollars(p.price_cents)+'</strong></div><button class="btn btn-small" type="button" data-add="'+safe(p.id)+'" '+(p.price_cents==null?'disabled title="Contact us for a quote"':'')+'>Add to Cart +</button></div></article>';
}
function shop(){
 const grid=document.getElementById('store-products');
 if(!grid)return;
 const category=document.getElementById('store-category'),search=document.getElementById('store-search'),sort=document.getElementById('store-sort'),count=document.getElementById('store-count');
 const query=new URLSearchParams(location.search);
 if(category&&query.has('category')){let c=query.get('category').toLowerCase();const aliases={instant:'urine','oral fluid':'oral','dot testing':'dot','hair tests':'hair'};category.value=aliases[c]||c;}
 function render(){
  let c=category?category.value:'',q=search?search.value.trim().toLowerCase():'';
  let list=products.filter(p=>(!c||p.category===c)&&(!q||(p.name+' '+p.description+' '+p.category).toLowerCase().includes(q)));
  if(sort?.value==='price-low')list.sort((a,b)=>(a.price_cents??Infinity)-(b.price_cents??Infinity));
  if(sort?.value==='price-high')list.sort((a,b)=>(b.price_cents??-1)-(a.price_cents??-1));
  if(count)count.textContent=list.length+' tests found';
  grid.innerHTML=list.length?list.map(productCard).join(''):'<p class="store-empty">No tests match your filters. <a href="contact.html">Contact support</a> for assistance.</p>';
 }
 [category,search,sort].forEach(el=>el&&el.addEventListener(el===search?'input':'change',render));render();
}
function updateLegacyCards(){
 document.querySelectorAll('button[data-add]').forEach(button=>{
  let p=byId[button.dataset.add]; if(!p){button.disabled=true;return}
  const card=button.closest('.product-card');
  if(card){const price=card.querySelector('.product-bottom strong');if(price)price.textContent=dollars(p.price_cents);}
  if(p.price_cents==null){button.disabled=true;button.title='Contact support for a quote'}
 });
}
function add(id){
 const p=byId[id];if(!p||p.price_cents==null){toast('This test is not available for online ordering.');return}
 let cart=read();cart[id]=Math.min(99,(cart[id]||0)+1);write(cart);toast('Added to cart: '+p.name);
}
function attachAdd(){
 document.addEventListener('click',e=>{const b=e.target.closest('[data-add]');if(!b)return;e.preventDefault();add(b.dataset.add)});
}
function lineItem(id,n){
 const p=byId[id];if(!p)return '';
 return '<div class="cart-row"><div><h3>'+safe(p.name)+'</h3><p>'+safe(label[p.category]||'')+' · '+dollars(p.price_cents)+' each</p></div><div class="qty"><button data-qty="'+safe(id)+'" data-change="-1" aria-label="Decrease quantity">−</button><strong>'+n+'</strong><button data-qty="'+safe(id)+'" data-change="1" aria-label="Increase quantity">+</button><button class="remove" data-remove="'+safe(id)+'">Remove</button></div></div>';
}
function items(){return Object.entries(read()).filter(([id])=>byId[id])}
function sum(){return items().reduce((s,[id,n])=>s+(byId[id].price_cents||0)*n,0)}
function renderCart(){
 const root=document.getElementById('cart-items'),side=document.getElementById('cart-summary');if(!root||!side)return;
 if(!loaded){root.innerHTML='<p class="notice">Could not load current prices. Please refresh to try again.</p>';side.innerHTML='';return}
 const lines=items();
 root.innerHTML=lines.length?lines.map(([id,n])=>lineItem(id,n)).join(''):'<div class="notice"><strong>Your cart is empty.</strong><p><a href="services.html">Browse available tests →</a></p></div>';
 side.innerHTML='<div class="summary-line"><span>Selected tests</span><strong>'+lines.reduce((s,[id,n])=>s+n,0)+'</strong></div>'+lines.map(([id,n])=>'<div class="summary-line"><span>'+n+' × '+safe(byId[id].name)+'</span><strong>'+dollars(byId[id].price_cents*n)+'</strong></div>').join('')+'<div class="summary-line store-total"><span>Subtotal</span><strong>'+dollars(sum())+'</strong></div><p class="small-note">Shipping, service availability, and any applicable fees must be confirmed at checkout.</p>';
 const next=document.querySelector('.order-summary .btn-full');if(next){next.setAttribute('aria-disabled',String(!lines.length));next.style.pointerEvents=lines.length?'':'none';next.style.opacity=lines.length?'':'0.5'}
}
function renderCheckout(){
 let root=document.getElementById('checkout-items');if(!root)return;
 if(!loaded){root.innerHTML='<p>Current prices could not be loaded. Please retry later.</p>';return}
 let lines=items();
 root.innerHTML=lines.length?lines.map(([id,n])=>'<div class="summary-line"><span>'+n+' × '+safe(byId[id].name)+'</span><strong>'+dollars(byId[id].price_cents*n)+'</strong></div>').join('')+'<div class="summary-line store-total"><span>Subtotal</span><strong>'+dollars(sum())+'</strong></div>':'<p>Your cart is empty. <a href="services.html">Browse tests →</a></p>';
 const btn=document.getElementById('checkout-pay');if(btn)btn.disabled=true;
}
function initialize(){
 const menu=document.getElementById('menu-toggle'),nav=document.getElementById('site-nav');
 if(menu&&nav){menu.addEventListener('click',()=>{let open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'×':'☰'})}
 let year=document.getElementById('year');if(year)year.textContent=new Date().getFullYear();
 document.addEventListener('click',e=>{
  const b=e.target.closest('[data-qty],[data-remove]');if(!b)return;
  const id=b.dataset.qty||b.dataset.remove;const cart=read();
  if(b.dataset.remove){delete cart[id]}else{let n=(cart[id]||0)+Number(b.dataset.change);if(n<1)delete cart[id];else cart[id]=Math.min(99,n)}
  write(cart);renderCart();renderCheckout();
 });
 const noSubmit=(id,msg)=>{let f=document.getElementById(id);if(f)f.addEventListener('submit',e=>{e.preventDefault();let feedback=f.querySelector('.form-feedback');if(feedback)feedback.textContent=msg})};
 noSubmit('contact-form','Contact submission is not active. Your message has not been sent.');
 noSubmit('accident-form','Secure incident submission is not active. Follow your workplace emergency procedures.');
 noSubmit('login-form','Account authentication is not yet active.');
 noSubmit('checkout-form','Secure payment has not been activated yet. No order was submitted or charged.');
 const tabs=document.querySelectorAll('[data-role]'),intro=document.getElementById('auth-intro');
 if(tabs.length){let setRole=role=>{tabs.forEach(t=>t.classList.toggle('active',t.dataset.role===role));if(intro)intro.innerHTML=role==='admin'?'<span class="eyebrow">ADMINISTRATOR ACCESS</span><h2>Admin login.</h2><p>Secure staff access is not yet connected.</p>':'<span class="eyebrow">CUSTOMER ACCESS</span><h2>Welcome back.</h2><p>Customer sign-in is not yet connected.</p>'};tabs.forEach(b=>b.addEventListener('click',()=>setRole(b.dataset.role)));setRole(new URLSearchParams(location.search).get('role')==='admin'?'admin':'customer')}
 counts();attachAdd();
}
initialize();
fetchCatalog().then(()=>{shop();updateLegacyCards();renderCart();renderCheckout()}).catch(e=>{
 console.error('EZ Screening catalog:',e);
 const grid=document.getElementById('store-products');if(grid)grid.innerHTML='<div class="notice">Products cannot be loaded right now. Please refresh or contact support.</div>';
 renderCart();renderCheckout();
});
})();