/* copied and adjusted from 030 */
;(function(window){
  const Fireworks = {}
  let overlay, trailsCanvas, mainCanvas, trailsCtx, mainCtx
  let width = 0, height = 0, dpr = 1
  let stars = [], sparks = []
  const GRAVITY = 0.9
  const PI2 = Math.PI * 2
  const COLORS = ['#ff0043','#14fc56','#1e7fff','#e60aff','#ffbf36','#ffffff']
  const soundBase = 'audio/'
  const Sound = {
    enabled: false,
    play(type, volume){
      if (!this.enabled) return
      const map = { lift: ['lift1.mp3','lift2.mp3','lift3.mp3'], burst: ['burst1.mp3','burst2.mp3'] }
      const list = map[type]
      if (!list) return
      const src = soundBase + list[(Math.random()*list.length)|0]
      const audio = new Audio(src)
      audio.volume = Math.max(0, Math.min(1, volume == null ? 1 : volume))
      audio.play().catch(()=>{})
    }
  }
  function rand(min, max){ return Math.random() * (max - min) + min }
  function resize(){
    width = Math.max(300, window.innerWidth)
    height = Math.max(200, window.innerHeight)
    dpr = window.devicePixelRatio || 1
    trailsCanvas.width = width * dpr
    trailsCanvas.height = height * dpr
    trailsCanvas.style.width = width + 'px'
    trailsCanvas.style.height = height + 'px'
    mainCanvas.width = width * dpr
    mainCanvas.height = height * dpr
    mainCanvas.style.width = width + 'px'
    mainCanvas.style.height = height + 'px'
    trailsCtx.setTransform(dpr,0,0,dpr,0,0)
    mainCtx.setTransform(dpr,0,0,dpr,0,0)
  }
  function loop(){ update(); render(); requestAnimationFrame(loop) }
  function update(){
    const timeStep = 16.6667
    const gAcc = (timeStep/1000)*GRAVITY
    for (let i = stars.length - 1; i >=0; i--){
      const s = stars[i]
      s.life -= timeStep
      if (s.life <= 0){ stars.splice(i,1); continue }
      s.prevX = s.x; s.prevY = s.y
      s.x += s.vx; s.y += s.vy
      s.vx *= 0.98; s.vy *= 0.98; s.vy += gAcc
    }
    for (let i = sparks.length - 1; i >=0; i--){
      const p = sparks[i]
      p.life -= timeStep
      if (p.life <= 0){ sparks.splice(i,1); continue }
      p.prevX = p.x; p.prevY = p.y
      p.x += p.vx; p.y += p.vy
      p.vx *= 0.9; p.vy *= 0.9; p.vy += gAcc
    }
  }
  function render(){
    trailsCtx.globalCompositeOperation = 'destination-out'
    trailsCtx.fillStyle = 'rgba(0,0,0,0.08)'
    trailsCtx.fillRect(0,0,width,height)
    trailsCtx.globalCompositeOperation = 'lighter'
    mainCtx.clearRect(0,0,width,height)
    trailsCtx.lineCap = 'round'
    trailsCtx.lineWidth = 2
    for (let i=0;i<stars.length;i++){
      const s = stars[i]
      trailsCtx.strokeStyle = s.color
      trailsCtx.beginPath(); trailsCtx.moveTo(s.x, s.y); trailsCtx.lineTo(s.prevX, s.prevY); trailsCtx.stroke()
    }
    trailsCtx.lineWidth = 1
    for (let i=0;i<sparks.length;i++){
      const p = sparks[i]
      trailsCtx.strokeStyle = p.color
      trailsCtx.beginPath(); trailsCtx.moveTo(p.x, p.y); trailsCtx.lineTo(p.prevX, p.prevY); trailsCtx.stroke()
    }
  }
  function addSpark(x,y,color,angle,speed,life){
    sparks.push({x,y,prevX:x,prevY:y,color,vx:Math.sin(angle)*speed,vy:Math.cos(angle)*speed,life})
  }
  function burst(x,y,spread){
    const count = Math.max(60, (spread/96)*80)
    const color = ['#ff0043','#14fc56','#1e7fff','#e60aff','#ffbf36','#ffffff'][(Math.random()*6)|0]
    for(let i=0;i<count;i++){
      const angle = Math.random()*PI2
      const speed = Math.pow(Math.random(), 0.35) * (spread/48)
      const life = 900 + Math.random()*400
      const star = { x, y, prevX:x, prevY:y, color, vx: Math.sin(angle)*speed, vy: Math.cos(angle)*speed - spread/1800, life }
      stars.push(star)
      addSpark(x,y,color,angle,speed*0.6,400)
    }
  }
  function cometLaunch(ncx, ncy){
    const launchX = ncx, launchY = height, burstY = ncy
    const v = Math.pow((launchY - burstY) * 0.04, 0.64)
    const comet = { x:launchX, y:launchY, prevX:launchX, prevY:launchY, color:'#ffffff', vx:0, vy:-v, life:v*400 }
    stars.push(comet)
    Sound.play('lift', 0.9)
    setTimeout(()=> { burst(launchX, burstY, 300); Sound.play('burst', 1) }, 600)
  }
  function launchAtCanvas(cx, cy){ cometLaunch(cx, cy) }
  Fireworks.init = function(root){
    overlay = root
    trailsCanvas = document.createElement('canvas')
    mainCanvas = document.createElement('canvas')
    trailsCtx = trailsCanvas.getContext('2d')
    mainCtx = mainCanvas.getContext('2d')
    trailsCanvas.style.position = 'fixed'; trailsCanvas.style.inset = '0'; trailsCanvas.style.mixBlendMode = 'screen'; trailsCanvas.style.pointerEvents = 'none'
    mainCanvas.style.position = 'fixed'; mainCanvas.style.inset = '0'; mainCanvas.style.mixBlendMode = 'screen'; mainCanvas.style.pointerEvents = 'none'
    overlay.appendChild(trailsCanvas); overlay.appendChild(mainCanvas)
    resize(); window.addEventListener('resize', resize); requestAnimationFrame(loop)
  }
  Fireworks.launchAtClient = function(clientX, clientY){
    const rect = overlay.getBoundingClientRect()
    const x = (clientX - rect.left), y = (clientY - rect.top)
    launchAtCanvas(x, y)
  }
  Fireworks.attachClick = function(){
    document.addEventListener('click', function(e){ Sound.enabled = true; Fireworks.launchAtClient(e.clientX, e.clientY) }, false)
  }
  window.Fireworks = Fireworks
})(window)
