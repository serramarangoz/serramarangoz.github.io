(function(){
  document.documentElement.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // header border + rail progress
  var top = document.querySelector('.top');
  var prog = document.querySelector('.rail .prog');
  function onScroll(){
    var y = window.scrollY;
    if (top) top.classList.toggle('scrolled', y > 8);
    if (prog){
      var h = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.height = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  // prototype players: load the Figma embed only when asked
  document.querySelectorAll('.player .poster').forEach(function(btn){
    btn.addEventListener('click', function(){
      var player = btn.closest('.player');
      var f = document.createElement('iframe');
      f.src = player.dataset.embed;
      f.title = player.dataset.title || 'Figma prototype';
      f.allowFullscreen = true;
      f.setAttribute('allow', 'fullscreen');
      btn.replaceWith(f);
      f.focus();
    });
  });

  // copy email
  document.querySelectorAll('[data-copy]').forEach(function(b){
    b.addEventListener('click', function(){
      var text = b.dataset.copy, out = document.getElementById(b.dataset.out);
      var done = function(ok){ if(out) out.textContent = ok ? 'Copied: ' + text : text; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function(){done(true);}, function(){done(false);});
      else done(false);
    });
  });

  // cursor preview on the work index
  var peek = document.querySelector('.peek');
  if (peek && window.matchMedia('(hover:hover) and (pointer:fine)').matches){
    var imgs = peek.querySelectorAll('img'), x=0, y=0, cx=0, cy=0, raf=null;
    function loop(){ cx += (x-cx)*0.18; cy += (y-cy)*0.18; peek.style.left = cx+'px'; peek.style.top = cy+'px'; raf = requestAnimationFrame(loop); }
    document.querySelectorAll('.index a').forEach(function(a, i){
      a.addEventListener('mouseenter', function(e){ x=cx=e.clientX; y=cy=e.clientY;
        imgs.forEach(function(im, j){ im.classList.toggle('on', j===i); });
        peek.classList.add('on'); if(!raf && !reduce) loop(); });
      a.addEventListener('mousemove', function(e){ x=e.clientX+190; y=e.clientY; if(reduce){peek.style.left=x+'px';peek.style.top=y+'px';} });
      a.addEventListener('mouseleave', function(){ peek.classList.remove('on'); if(raf){cancelAnimationFrame(raf); raf=null;} });
    });
  }

  // gentle reveal for blocks that start below the fold
  if (!reduce && 'IntersectionObserver' in window){
    var els = Array.prototype.slice.call(document.querySelectorAll('.rv'));
    els.forEach(function(el){ if (el.getBoundingClientRect().top > window.innerHeight) el.classList.add('pre'); });
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.remove('pre'); io.unobserve(e.target); } }); }, {rootMargin:'0px 0px -8% 0px'});
    els.forEach(function(el){ io.observe(el); });
  }

  var yr = document.getElementById('year'); if (yr) yr.textContent = new Date().getFullYear();
})();

// back to top
(function(){
  var b = document.querySelector('.totop'); if (!b) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function t(){ b.classList.toggle('on', window.scrollY > 700); }
  window.addEventListener('scroll', t, {passive:true}); t();
  b.addEventListener('click', function(){ window.scrollTo({top:0, behavior: reduce ? 'auto' : 'smooth'}); var h=document.querySelector('.brand'); if(h) h.focus({preventScroll:true}); });
})();

// daily ui viewer
(function(){
  var sets = window.DAILY_SETS, lb = document.getElementById('lb'); if (!sets || !lb) return;
  var tabs = document.getElementById('lbTabs'), stage = document.getElementById('lbStage'), title = document.getElementById('lbTitle');
  var cur = null, idx = 0, opener = null;
  function render(){
    var s = sets[cur], it = s.items[idx];
    title.textContent = s.title;
    tabs.innerHTML = '';
    s.items.forEach(function(x, i){ var b=document.createElement('button'); b.type='button'; b.textContent=x.label; b.setAttribute('aria-pressed', i===idx); b.onclick=function(){ idx=i; render(); }; tabs.appendChild(b); });
    stage.innerHTML = '';
    var im = new Image(); im.src = it.src; im.alt = s.title + ', ' + it.label; im.width = it.w; im.height = it.h;
    im.style.width = Math.min(it.w, stage.clientWidth - 40) + 'px';
    stage.appendChild(im); stage.scrollTop = 0;
  }
  function open(set, btn){ cur=set; idx=0; opener=btn; lb.hidden=false; document.body.style.overflow='hidden'; render(); document.getElementById('lbClose').focus(); }
  function close(){ lb.hidden=true; document.body.style.overflow=''; if(opener) opener.focus(); }
  function step(d){ var n=sets[cur].items.length; idx=(idx+d+n)%n; render(); }
  document.querySelectorAll('.zoom').forEach(function(b){ b.addEventListener('click', function(){ open(b.dataset.set, b); }); });
  document.getElementById('lbClose').onclick = close;
  document.getElementById('lbPrev').onclick = function(){ step(-1); };
  document.getElementById('lbNext').onclick = function(){ step(1); };
  lb.addEventListener('click', function(e){ if (e.target === lb || e.target === stage) close(); });
  document.addEventListener('keydown', function(e){ if (lb.hidden) return; if (e.key==='Escape') close(); if (e.key==='ArrowRight') step(1); if (e.key==='ArrowLeft') step(-1); });
  window.addEventListener('resize', function(){ if(!lb.hidden) render(); });
})();

// scrollspy: highlight the section in view (home page)
(function(){
  var ids = ['about','work','contact'], secs = ids.map(function(id){ return document.getElementById(id); }).filter(Boolean);
  if (!secs.length) return;
  var links = {}; document.querySelectorAll('.menu a:not(.open)').forEach(function(a){ var h=a.getAttribute('href')||''; var i=h.indexOf('#'); if(i>-1){ var id=h.slice(i+1); if(ids.indexOf(id)>-1) links[id]=a; } });
  var label = document.querySelector('.rail .label'), names = {about:'About', work:'Work', contact:'Contact'}, current = null;
  function update(){
    var line = window.innerHeight * 0.35, now = null;
    secs.forEach(function(s){ if (s.getBoundingClientRect().top <= line) now = s.id; });
    if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 4) now = 'contact';
    if (now === current) return; current = now;
    Object.keys(links).forEach(function(id){ links[id].classList.toggle('active', id === now); });
    if (label){ label.classList.add('swap'); setTimeout(function(){ label.textContent = now ? names[now] : 'Portfolio'; label.classList.remove('swap'); }, 180); }
  }
  window.addEventListener('scroll', update, {passive:true}); window.addEventListener('resize', update); update();
})();
