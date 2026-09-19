'use strict';

const systems = [
  { id: 'dreamcast', name: 'Dreamcast', maker: 'SEGA', year: '1998', color: [255, 119, 76] },
  { id: 'snes', name: 'Super Nintendo', maker: 'NINTENDO', year: '1990', color: [163, 149, 255] },
  { id: 'megadrive', name: 'Mega Drive', maker: 'SEGA', year: '1988', color: [67, 172, 255] }
];
const devices = {
  '480,320': ['RG351P / M', '3:2'],
  '640,480': ['RG351V / MP', '4:3'],
  '1920,1152': ['RG552', '5:3']
};
const $ = id => document.getElementById(id);
const canvas = $('screen'), ctx = canvas.getContext('2d');
const group = document.createElement('canvas'), g = group.getContext('2d');
const reflectionLayer = document.createElement('canvas'), reflectionContext = reflectionLayer.getContext('2d');
const background = document.createElement('canvas'), bg = background.getContext('2d');
const defaults = { float: 2.5, wave: 1, reflection: 55, light: 65 };
const settings = { ...defaults };
let current = 0, time = 0, previousTime = null, ready = false;
let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
let transition = null, rippleStart = -10000, automatic = false, nextAutoTime = 0;
let backgroundKey = '', accent = [...systems[0].color];
const idleStates = index => systems.map((_, i) => ({ alpha: i === index ? 1 : 0, x: 0, scale: 1 }));
let restingStates = idleStates(0);
const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
const mix = (a, b, t) => a + (b - a) * t;
const ease = t => 1 - Math.pow(1 - clamp(t), 3);
const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const rgba = (color, alpha) => `rgba(${color.map(Math.round).join(',')},${clamp(alpha)})`;

function loadLogo(id) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Impossibile caricare il logo ' + id));
    image.src = ASSETS[id + '.svg'];
  });
}

function presentation() {
  if (!transition) return restingStates;
  const progress = clamp((time - transition.start) / 460);
  const movement = ease(progress), dissolve = smooth(progress);
  const states = transition.from.map((state, i) => ({
    alpha: mix(state.alpha, i === current ? 1 : 0, dissolve),
    x: mix(state.x, i === current ? 0 : -.065 * transition.direction, movement),
    scale: mix(state.scale, i === current ? 1 : .975, movement)
  }));
  const lightProgress = smooth((time - transition.start) / 760);
  accent = transition.color.map((v, i) => mix(v, systems[current].color[i], lightProgress));
  if (lightProgress === 1) { restingStates = idleStates(current); transition = null; }
  return states;
}

function glow(context, x, y, rx, ry, color, strength) {
  context.save();
  context.translate(x, y); context.scale(rx, ry);
  const gradient = context.createRadialGradient(0, 0, 0, 0, 0, 1);
  gradient.addColorStop(0, rgba(color, strength));
  gradient.addColorStop(.35, rgba(color, strength * .55));
  gradient.addColorStop(1, rgba(color, 0));
  context.fillStyle = gradient; context.fillRect(-1, -1, 2, 2);
  context.restore();
}

function drawBackground(w, h, waterline) {
  // Cache the atmosphere when it is still; only the interaction changes its color.
  const key = [w, h, settings.light, ...accent.map(Math.round)].join(',');
  if (key !== backgroundKey) {
    backgroundKey = key;
    const light = settings.light / 100;
    bg.fillStyle = '#0b0e16'; bg.fillRect(0, 0, w, h);
    const sky = bg.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#070a10'); sky.addColorStop(.54, '#11151f'); sky.addColorStop(1, '#070b12');
    bg.fillStyle = sky; bg.fillRect(0, 0, w, h);
    glow(bg, w * .5, waterline - h * .035, w * .47, h * .40, accent, .13 * light);
    const water = bg.createLinearGradient(0, waterline, 0, h);
    water.addColorStop(0, '#0c1018'); water.addColorStop(1, '#080c13');
    bg.fillStyle = water; bg.fillRect(0, waterline, w, h - waterline);
    glow(bg, w * .5, waterline, w * .45, h * .25, accent, .11 * light);
    glow(bg, w * .5, waterline, w * .38, h * .035, accent, .14 * light);
    const edge = bg.createLinearGradient(w * .08, 0, w * .92, 0);
    edge.addColorStop(0, rgba(accent, 0)); edge.addColorStop(.3, rgba(accent, .06 * light));
    edge.addColorStop(.5, rgba(accent, .36 * light)); edge.addColorStop(.7, rgba(accent, .06 * light)); edge.addColorStop(1, rgba(accent, 0));
    bg.fillStyle = edge; bg.fillRect(w * .08, waterline, w * .84, Math.max(.65, h / 600));
  }
  ctx.drawImage(background, 0, 0);
}

function trackedText(text, x, y, size, color, spacing = 0, align = 'left', weight = 500) {
  ctx.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.fillStyle = color; ctx.textAlign = 'left';
  const width = [...text].reduce((sum, c) => sum + ctx.measureText(c).width, 0) + spacing * Math.max(0, text.length - 1);
  let at = x - (align === 'center' ? width / 2 : align === 'right' ? width : 0);
  for (const c of text) { ctx.fillText(c, at, y); at += ctx.measureText(c).width + spacing; }
}

function draw() {
  if (!ready) return;
  const w = canvas.width, h = canvas.height, unit = h / 320, waterline = h * .555;
  const states = presentation();
  drawBackground(w, h, waterline);
  g.clearRect(0, 0, w, h);
  const bob = Math.sin(time * Math.PI * 2 / 4800) * settings.float * unit;
  states.forEach((state, i) => {
    if (state.alpha < .002) return;
    const logo = systems[i].logo;
    const height = Math.min(h * .17, w * .63 * logo.naturalHeight / logo.naturalWidth) * state.scale;
    const width = height * logo.naturalWidth / logo.naturalHeight;
    g.save(); g.globalAlpha = state.alpha;
    g.shadowColor = rgba(accent, .12 * settings.light / 100); g.shadowBlur = 13 * unit;
    g.drawImage(logo, (w - width) / 2 + state.x * w, h * .40 - height / 2 + bob, width, height);
    g.restore();
  });
  ctx.drawImage(group, 0, 0);

  // Reflect only the transparent logo composition across the fixed waterline.
  const age = (time - rippleStart) / 1000, depth = h * .285, compression = .88;
  const burst = age >= 0 && age < 1.7 ? Math.sin(Math.PI * clamp(age / 1.7)) * Math.exp(-age * .65) : 0;
  // Flip and resample once before distorting rows, so high-resolution screens
  // retain smooth edges instead of reversing the order of unflipped bands.
  reflectionContext.clearRect(0, 0, w, h);
  reflectionContext.save();
  reflectionContext.translate(0, waterline * (1 + compression));
  reflectionContext.scale(1, -compression);
  reflectionContext.drawImage(group, 0, 0);
  reflectionContext.restore();
  for (let y = 0; y < depth; y++) {
    const p = y / depth;
    const fade = Math.exp(-p * 1.7) * (1 - smooth((p - .68) / .32));
    const wavefront = Math.exp(-Math.pow((p - age * .65) * 6, 2));
    const idleWave = Math.sin(y / unit * .15 - time / 850) + .28 * Math.sin(y / unit * .39 + time / 1100);
    const interactionWave = Math.sin(p * 30 - age * 15) * burst * wavefront * 5;
    const dx = (idleWave * (.25 + p) + interactionWave) * settings.wave * unit;
    ctx.globalAlpha = settings.reflection / 100 * fade;
    ctx.drawImage(reflectionLayer, 0, waterline + y, w, 1, dx, waterline + y, w, 1);
  }
  ctx.globalAlpha = 1;
  if (burst > 0 && settings.wave > 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, waterline + unit, w, h - waterline); ctx.clip();
    for (let ring = 0; ring < 3; ring++) {
      const progress = clamp((age - ring * .13) / 1.55);
      if (!progress || progress >= 1) continue;
      const radius = w * (.04 + progress * .61);
      ctx.beginPath();
      ctx.ellipse(w * .5, waterline + h * .024, radius, radius * .19, 0, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(accent, Math.sin(progress * Math.PI) * (1 - progress) * .21 * settings.light / 100 * Math.min(settings.wave, 1.5));
      ctx.lineWidth = Math.max(.65, unit * .65); ctx.stroke();
    }
    ctx.restore();
  }

  // Calm, readable navigation stays outside the reflected composition.
  trackedText('AMBERELEC', w * .052, h * .093, h * .031, '#c0c5cf', .6 * unit, 'left', 600);
  trackedText(String(current + 1).padStart(2, '0') + ' / 03', w * .948, h * .093, h * .029, '#8791a2', .2 * unit, 'right');
  states.forEach((state, i) => {
    if (state.alpha < .002) return;
    const system = systems[i];
    trackedText(system.maker + '  /  ' + system.year, w * .5 + state.x * w * .35, h * .245, h * .029, `rgba(172,182,201,${state.alpha * .85})`, 1.4 * unit, 'center');
  });
  trackedText('‹', w * .065, h * .418, h * .066, '#6f798b', 0, 'center', 300);
  trackedText('›', w * .935, h * .418, h * .066, '#6f798b', 0, 'center', 300);
  systems.forEach((_, i) => {
    const active = states[i].alpha, width = mix(3.5, 15, active) * unit;
    ctx.fillStyle = active > .02 ? rgba(accent, .35 + active * .55) : '#455061';
    ctx.beginPath(); ctx.roundRect(w * .5 + (i - 1) * 24 * unit - width / 2, h * .873, width, 3 * unit, 1.5 * unit); ctx.fill();
  });
  trackedText('← →  SISTEMI', w * .052, h * .952, h * .0275, '#9aa4b6', .2 * unit);
  trackedText('A  GIOCHI', w * .948, h * .952, h * .0275, '#9aa4b6', .2 * unit, 'right');
}

function resize() {
  const [w, h] = $('device').value.split(',').map(Number);
  canvas.width = group.width = background.width = reflectionLayer.width = w;
  canvas.height = group.height = background.height = reflectionLayer.height = h;
  $('screen-caption').textContent = devices[$('device').value][0];
  $('resolution').textContent = `${w} × ${h} · ${devices[$('device').value][1]}`;
  backgroundKey = ''; draw();
}

function updateSelection() {
  $('system-name').textContent = systems[current].name;
  canvas.setAttribute('aria-label', `Logo ${systems[current].name} fluttuante e riflesso sull’acqua. Usa le frecce per cambiare console.`);
  document.documentElement.style.setProperty('--accent', rgba(systems[current].color, 1));
}

function select(direction, fromDemo = false) {
  if (!ready) return;
  if (!fromDemo) stopDemo();
  const states = presentation().map(state => ({ ...state }));
  current = (current + direction + systems.length) % systems.length;
  if (paused) {
    restingStates = idleStates(current); transition = null;
    accent = [...systems[current].color]; rippleStart = -10000;
  } else {
    if (states[current].alpha < .002) states[current] = { alpha: 0, x: direction * .065, scale: .975 };
    transition = { start: time, direction, from: states, color: [...accent] };
    rippleStart = time;
  }
  updateSelection(); draw();
}

function stopDemo() {
  automatic = false;
  $('demo').innerHTML = '<span class="play-icon" aria-hidden="true">▷</span> Demo automatica';
  $('demo').setAttribute('aria-pressed', 'false');
}

function updatePause() {
  $('pause').textContent = paused ? 'Riprendi' : 'Pausa';
  $('pause').setAttribute('aria-pressed', String(paused));
}

function togglePause() {
  paused = !paused;
  if (paused) stopDemo();
  updatePause(); draw();
}

function updateSetting(id) {
  settings[id] = Number($(id).value);
  $(id + '-value').value = id === 'float' ? settings[id] + ' px'
    : id === 'wave' ? (settings[id] === 0 ? 'Ferma' : settings[id] <= 1.5 ? 'Delicata' : 'Vivace')
    : settings[id] + '%';
  draw();
}

$('previous').onclick = () => select(-1);
$('next').onclick = () => select(1);
$('device').onchange = resize;
$('pause').onclick = togglePause;
$('demo').onclick = () => {
  if (automatic) { stopDemo(); return; }
  if (paused) { paused = false; updatePause(); }
  automatic = true; nextAutoTime = time + 3200;
  $('demo').innerHTML = '<span class="play-icon" aria-hidden="true">□</span> Ferma demo';
  $('demo').setAttribute('aria-pressed', 'true');
  select(1, true);
};
for (const id of Object.keys(defaults)) $(id).oninput = () => updateSetting(id);
$('reset').onclick = () => {
  for (const [id, value] of Object.entries(defaults)) { $(id).value = value; updateSetting(id); }
};
document.addEventListener('keydown', event => {
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName) || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault(); select(event.key === 'ArrowLeft' ? -1 : 1);
  }
  if (event.code === 'Space' && event.target === canvas) { event.preventDefault(); togglePause(); }
});
let pointerStart = null;
canvas.addEventListener('pointerdown', event => { pointerStart = { x: event.clientX, y: event.clientY }; });
canvas.addEventListener('pointercancel', () => { pointerStart = null; });
canvas.addEventListener('pointerleave', () => { pointerStart = null; });
canvas.addEventListener('pointerup', event => {
  if (!pointerStart) return;
  const dx = event.clientX - pointerStart.x, dy = event.clientY - pointerStart.y;
  pointerStart = null;
  if (Math.abs(dy) > Math.max(25, Math.abs(dx))) return;
  const rect = canvas.getBoundingClientRect();
  select(Math.abs(dx) > 25 ? (dx < 0 ? 1 : -1) : (event.clientX - rect.left < rect.width / 2 ? -1 : 1));
});

function tick(now) {
  if (previousTime !== null && !paused && !document.hidden) time += Math.min(now - previousTime, 100);
  previousTime = now;
  if (automatic && time >= nextAutoTime) { select(1, true); nextAutoTime = time + 3200; }
  if (!paused && !document.hidden) draw();
  requestAnimationFrame(tick);
}

Promise.all(systems.map(async system => { system.logo = await loadLogo(system.id); }))
  .then(() => {
    ready = true; updateSelection(); resize(); updatePause();
    $('status').textContent = 'Tre console da esplorare · frecce, clic o scorrimento sullo schermo';
    document.documentElement.dataset.ready = 'true';
    requestAnimationFrame(tick);
  })
  .catch(error => {
    $('status').textContent = error.message;
    document.documentElement.dataset.ready = 'error';
  });
