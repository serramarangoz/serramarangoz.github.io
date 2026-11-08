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
