/* Boba Crave Co. — shared shell + Three.js scenes (Three r152 loaded globally) */
const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
let isPlunged = false;
let videoOK = !!document.querySelector('.hero-video-banner');   // true while the hero video banner is in use (the 3D cup then stays hidden)   // binary page state: false = State A (hero view, camera z 9.5), true = State B (plunged view, camera z -1.5)
const lin = h => { const c = new THREE.Color(h); return THREE.ColorManagement && THREE.ColorManagement.enabled ? c : c.convertSRGBToLinear(); };

/* ---------- Shared header / footer (identical on every page) ---------- */
const LOGO = 'images/logo.png';   // emblem embedded so it always loads, even if the .png isn't uploaded beside the pages
const IMG_FB = {};   // (embedded photo copies removed: the images/ folder is the single source)
const IMG_FB_P = {};
const POSTER_FB = 'video/banner-poster.jpg';
const AD_POSTER_FB = 'video/ad-poster.jpg';
$('.burger').onclick = e => { const o = $('.nav').classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', o); };

/* ---------- Drink data ---------- */
const DRINKS = {
  brownsugar: { n: 'Brown Sugar Milk Tea', images: [{ src: 'images/brown-sugar-milk-tea.jpg' }], cat: 'Classic Milk Teas', p: 6.8, tags: ['Bestseller', 'Syrup-streaked'], d: 'Black tea and fresh milk over pearls simmered in dark brown sugar syrup.', top: '#dcb688', bot: '#6a3412', streak: '#6a3412', sss: '#ff9a3c', s: 1 },
  classic: { n: 'Classic Milk Tea', images: [{ src: 'images/classic-milk-tea.jpg' }], cat: 'Classic Milk Teas', p: 5.5, tags: ['Timeless', 'Roasty'], d: 'Our house black tea blend, shaken with fresh milk until silky.', top: '#d3a676', bot: '#ad7843' },
  taro: { n: 'Taro Cloud', images: [{ src: 'images/taro-cloud.jpg' }], cat: 'Specialty Series', p: 6.9, tags: ['Creamy', 'Coconut foam'], d: 'Taro milk tea under a velvety coconut cream cloud.', top: '#cdb6e6', bot: '#8e68b8', sss: '#b48ad8', foam: 1, vel: 1 },
  jasmine: { n: 'Jasmine Green Tea', images: [{ src: 'images/jasmine-green-tea.jpg' }], cat: 'Fruit Teas', p: 5.2, tags: ['Light', 'Floral'], pb: 1, d: 'Jasmine-scented green tea, cold-steeped and served clear and bright.', top: '#f1df8a', bot: '#d4a93a', gloss: .85, clear: 1 },
  mango: { n: 'Mango Passionfruit', images: [{ src: 'images/mango-passionfruit.jpg' }], cat: 'Fruit Teas', p: 6.4, tags: ['Fruity', 'Bright'], pb: 1, d: 'Ripe mango and tart passionfruit shaken over green tea and ice.', top: '#ffd870', bot: '#f2a022', gloss: .85, clear: 1 },
  hojicha: { n: 'Hojicha Oat Milk Tea', images: [{ src: 'images/hojicha-oat-milk-tea.jpg' }], cat: 'Specialty Series', p: 6.6, tags: ['Toasty', 'Nutty'], pb: 1, d: 'Roasted hojicha green tea shaken with oat milk for a deep, nutty cup.', top: '#b98a5e', bot: '#6b4021' },
  peach: { n: 'Iced Peach Oolong Milk Tea', images: [{ src: 'images/peach-boba-tea.jpg' }], cat: 'Fruit Teas', p: 6.5, tags: ['Fruity', 'Silky swirl'], d: 'Black tea and fresh milk swirled with ripe peach, over chewy tapioca pearls.', top: '#f0b878', bot: '#c9772e' },
  strawberry: { n: 'Iced Strawberry Matcha Latte', images: [{ src: 'images/strawberry-matcha-boba-delight.jpg' }], cat: 'Specialty Series', p: 7.2, tags: ['Layered', 'Matcha'], d: 'Strawberry compote, fresh milk and whisked matcha in three layers, with tapioca pearls.', top: '#9cc23c', bot: '#d8363f' },
  matcha: { n: 'Iced Matcha Latte', images: [{ src: 'images/iced-matcha-latte.jpg' }], cat: 'Specialty Series', p: 6.6, tags: ['Earthy', 'Creamy'], d: 'Whisked matcha poured over cold fresh milk and crystal ice.', top: '#8fb83a', bot: '#f4f0e0' }
};
const ALT = {"brownsugar": "Brown Sugar Milk Tea in a branded cup with dark syrup streaks, creamy brown-sugar foam and tapioca pearls", "classic": "Classic Milk Tea in a glass cup with tapioca pearls and a dark bamboo straw", "taro": "Taro Cloud in a glass: creamy lavender taro tea topped with white coconut foam", "jasmine": "Jasmine Green Tea, clear pale golden-green, with ice cubes in a tall glass", "mango": "Mango Passionfruit tea, bright yellow-orange, with ice and fresh mango pulp", "hojicha": "Hojicha Oat Milk Tea in a glass, roasted tan-brown with tapioca pearls", "peach": "Iced Peach Oolong Milk Tea with a slice of fresh peach and tapioca pearls in a tall glass", "strawberry": "Iced Strawberry Matcha Latte with layers of strawberry, milk and green matcha foam", "matcha": "Iced Matcha Latte in a tall glass with green matcha poured over milk and ice"};   // descriptive alt text for each drink photo
Object.keys(ALT).forEach(k => { DRINKS[k].images[0].alt = ALT[k]; });
const DISPLAY = ['brownsugar', 'classic', 'taro', 'peach', 'strawberry', 'matcha', 'jasmine', 'mango', 'hojicha'];   // "Our Boba Display" shows all nine drinks, in this order
DISPLAY.forEach(k => { DRINKS[k].portrait = 'images/portrait/' + DRINKS[k].images[0].src.split('/').pop(); });   // 9:16 picture for the display card
const cover = d => d.images[0];                                                          // first photo = the card / display picture
const drinkAlt = (d, i) => `${d.n}: iced drink in a tall glass${d.images.length > 1 ? ` (photo ${i + 1} of ${d.images.length})` : ''}`;
const fallbackFor = src => IMG_FB[String(src).split('/').pop().replace(/\.\w+$/, '')];   // embedded copy by file name
/* Adding a photo to a menu item APPENDS to its image list (spread into a fresh array): photos already on the item are kept in order, a photo already there is not added twice. */
const addDrinkImage = (key, src, alt) => {
  const d = DRINKS[key]; if (!d || !src || d.images.some(m => m.src === src)) return false;
  DRINKS[key] = { ...d, images: [...d.images, { src, alt: alt || '' }] };
  refreshCards(key); return true;
};


/* ---------- 3D: studio environment + stage ---------- */
function makeEnv(r) {                                  // HDR softbox studio baked through PMREMGenerator
  const g = new THREE.PMREMGenerator(r), s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.SphereGeometry(30, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: 'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec3 p;void main(){float h=normalize(p).y*.5+.5;gl_FragColor=vec4(mix(vec3(.2,.1,.06),vec3(.6,.42,.3),h),1.);}'
  })));
  [[0, 9, 5, 0xfff1dc, 9, 5], [-10, 3, 3, 0xffe2c4, 4, 6], [10, 2, -5, 0xff9a3c, 3, 7], [0, -6, 6, 0xffd9a8, 5, 2], [0, 4, -10, 0xffffff, 5, 3]].forEach(([x, y, z, c, w, i]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.5, w * .6), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(i), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);       // warm key, fill, orange rim, floor bounce, back light
  });
  const t = g.fromScene(s, .03).texture; g.dispose(); return t;
}
let _noise;
const noiseTex = () => _noise || (_noise = (() => {    // micro-variation map for glass / pearl roughness dispersion
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), im = x.createImageData(64, 64);
  for (let i = 0; i < 4096; i++) { const v = 90 + Math.random() * 120; im.data.set([v, v, v, 255], i * 4); }
  x.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 4); return t;
})());
function pageGradient() {                              // same milk tea gradient as the page, so transmissive glass refracts the right colours
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const lg = x.createLinearGradient(0, 0, 0, 256); lg.addColorStop(0, '#F4E8D8'); lg.addColorStop(1, '#EBD4B9'); x.fillStyle = lg; x.fillRect(0, 0, 256, 256);
  [[230, -10, 170, 'rgba(200,122,40,.26)'], [-10, 150, 150, 'rgba(156,81,22,.16)']].forEach(([cx, cy, r, col]) => {
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  });
  const t = new THREE.CanvasTexture(c); if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace; else t.encoding = THREE.sRGBEncoding; return t;
}
function stage(canvas, build, o = {}) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  r.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  if ('outputColorSpace' in r) r.outputColorSpace = THREE.SRGBColorSpace; else r.outputEncoding = THREE.sRGBEncoding;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1;
  const sc = new THREE.Scene(); sc.environment = makeEnv(r);
  if (o.bg) { sc.background = pageGradient(); r.setClearColor(0xEFDCC2, 1); sc.fog = new THREE.Fog(0xEFDCC2, 14, 42); }   // fog fades the far pearls into the page colour   // opaque clear colour = what transmissive glass refracts behind the cup
  const cam = new THREE.PerspectiveCamera(30, 1, .1, 100);
  cam.position.set(0, o.cy ?? 1.5, o.cz ?? 9.5); cam.lookAt(0, o.ly ?? 1.4, 0);
  sc.add(new THREE.AmbientLight(0xfff2e0, .35));
  const key = new THREE.DirectionalLight(0xfff0dc, 1.5); key.position.set(3, 5, 4); sc.add(key);                 // warm key
  const fill = new THREE.DirectionalLight(0xffe2c0, .5); fill.position.set(-4, 2, 3); sc.add(fill);              // fill
  const rim = new THREE.PointLight(0xff8a2a, 2.4, 22); rim.position.set(-4, 2, -2); sc.add(rim);                 // orange rim
  const rim2 = new THREE.PointLight(0xffb060, 1.6, 22); rim2.position.set(4, 1, -3); sc.add(rim2);
  const obj = build(); sc.add(obj);
  const S = { r, sc, cam, obj, px: 0, vis: true, yaw: 0, vel: 0, drag: false, hov: 0, hovS: 0 };
  if (o.host) { o.host.addEventListener('pointerenter', () => S.hov = 1); o.host.addEventListener('pointerleave', () => S.hov = 0); }
  new ResizeObserver(() => { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); S.resize && S.resize(cam.aspect); }).observe(canvas);
  new IntersectionObserver(e => S.vis = e[0].isIntersecting).observe(canvas);
  if (!o.fixed) { let lx = 0;                                       // drag to orbit
    canvas.addEventListener('pointerdown', e => { S.drag = true; lx = e.clientX; canvas.setPointerCapture(e.pointerId); }, { passive: true });
    canvas.addEventListener('pointermove', e => { if (!S.drag) return; S.vel = (e.clientX - lx) * .012; S.yaw += S.vel; lx = e.clientX; }, { passive: true });
    ['pointerup', 'pointercancel'].forEach(n => canvas.addEventListener(n, () => S.drag = false)); }
  (function loop(ms) { requestAnimationFrame(loop); if (!S.vis) { S.pms = ms; return; } const t = ms / 1000, dt = Math.min(.05, Math.max(0, (ms - (S.pms ?? ms)) / 1000)); S.pms = ms;
    S.hovS += (S.hov - S.hovS) * (1 - Math.exp(-dt * 6));
    if (!S.drag) { S.yaw += S.vel + (o.spin ?? .36) * dt * (1 + (o.hoverBoost || 0) * S.hovS); S.vel *= .94; } (o.tick || (() => { }))(t, obj, S); if (o.render) o.render(r, sc, cam, S); else r.render(sc, cam); })(0);
  return S;
}

/* ---------- 3D: bubble tea cup ---------- */
const H = 2.4, Rout = y => .56 + .3 * y / H, LIQ = 2.05;
const TILT = .12, strawX = y => .2 + (y - 1.62) * Math.tan(TILT);          // straw centre-line x at height y
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const rib = (th, y) => .03 * ss(.15, .5, y) * (1 - ss(H - .5, H - .15, y)) * (.5 + .5 * Math.cos(24 * th));   // 24 vertical flutes, fading out at base and rim
const pearlGeo = new THREE.SphereGeometry(1, 24, 16);
const pearlMat = () => new THREE.MeshPhysicalMaterial({ color: lin('#080302'), roughness: .16, roughnessMap: noiseTex(), metalness: .05, clearcoat: 1, clearcoatRoughness: .04, envMapIntensity: 2.2 });
function bevelBox(s, r, seg = 12) {                    // beveled cube: corners pushed onto spheres, normals rebuilt for smooth edges
  const g = new THREE.BoxGeometry(s, s, s, seg, seg, seg), P = g.attributes.position, N = g.attributes.normal, h = s / 2 - r;
  const v = new THREE.Vector3(), c = new THREE.Vector3(), d = new THREE.Vector3();
  for (let i = 0; i < P.count; i++) {
    v.fromBufferAttribute(P, i); c.set(Math.max(-h, Math.min(h, v.x)), Math.max(-h, Math.min(h, v.y)), Math.max(-h, Math.min(h, v.z)));
    d.copy(v).sub(c);
    if (d.lengthSq() > 1e-8) { d.normalize(); N.setXYZ(i, d.x, d.y, d.z); v.copy(c).addScaledVector(d, r); P.setXYZ(i, v.x, v.y, v.z); }
  }
  return g;
}
function packPearls(rad) {                             // dense ring-packing in the bottom half; outer ring rests on the inner glass wall
  const P = [], top = H * .5;
  for (let L = 0, y = .16 + rad; y < top - rad * .4; L++, y += rad * 1.85) {
    const rr = Rout(y) - .05 - rad, ds = [];
    for (let d = rr; d > rad * 1.3; d -= rad * 2.05) ds.push(d);
    ds.push(0);
    ds.forEach((d, ring) => {
      const n = d ? Math.floor(6.283 * d / (rad * 2.04)) : 1, j = ring ? .02 : 0;
      for (let i = 0; i < n; i++) {
        const a = L * .7 + ring * .4 + i / n * 6.283, x = Math.cos(a) * d + (Math.random() - .5) * j, z = Math.sin(a) * d + (Math.random() - .5) * j;
        if (Math.hypot(x - strawX(y), z) < .27) continue;           // keep clear of the straw
        P.push([x, y + (Math.random() - .5) * .02, z, L * 10 + ring, .6 + .6 * d / rr]);
      }
    });
  }
  return P;
}
const VERT = `varying vec2 vUv;varying float vY;varying vec3 vN;varying vec3 vV;
void main(){vUv=uv;vY=position.y;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=-mv.xyz;gl_Position=projectionMatrix*mv;}`;
const FRAG = `uniform vec3 cTop,cBot,cStreak,cFoam,cSss;uniform float uT,uStreak,uFoam,uTop,uVel,uGloss,uClear,uSss;
varying vec2 vUv;varying float vY;varying vec3 vN;varying vec3 vV;
float hash(float n){return fract(sin(n)*43758.5453);}
void main(){
  float h=clamp(vY/uTop,0.,1.), cap=step(uTop-.002,vY);
  float layer=smoothstep(0.,.55,h)*.6+smoothstep(.45,1.,h)*.4;       // dense base fading into the milky body
  vec3 col=mix(cBot,cTop,layer);
  col=mix(col,col*vec3(1.08,.92,.78),smoothstep(.2,.55,h)*(1.-smoothstep(.55,.85,h))*.5);   // warm caramel mid-band
  float ci=floor(vUv.x*18.), cyc=fract(uT*.07+hash(ci*3.1));          // each streak runs its own slow drip cycle
  float len=.1+.3*(1.-pow(1.-cyc,2.)), tp=clamp(1.-(1.-h)/max(len,.01),0.,1.);
  float cx=abs(fract(vUv.x*18.)-.5)*2., thr=(.2+.2*hash(ci+7.))*(.45+.55*tp);   // streak is thick at the rim and tapers to a thin tail
  float w=(1.-smoothstep(thr,thr+.28,cx))*step(.4,hash(ci+3.));                  // only ~60% of columns carry a drip
  float fade=smoothstep(0.,.1,cyc)*(1.-smoothstep(.85,1.,cyc));
  float body=smoothstep(1.-len,1.-len+.04,h);
  col=mix(col,cStreak,uStreak*(1.-cap)*body*w*fade*.6);
  col=mix(col,cFoam,uFoam*smoothstep(.84,.9,h));
  vec3 N=normalize(vN),V=normalize(vV);
  col*=.78+.4*(dot(N,normalize(vec3(.45,.65,.6)))*.5+.5);                                   // key-light shading through the milk
  float f=pow(1.-abs(dot(N,V)),2.);
  float sp=pow(max(0.,dot(N,normalize(vec3(.45,.65,.6)))),22.), men=smoothstep(.93,1.,h);
  col+=cSss*f*uSss*(.6+.4*dot(N,normalize(vec3(-.4,.5,.3))))+f*(.1+uVel*.3)+sp*(uGloss+men*.3)+men*.08;   // SSS glow + specular + meniscus gloss
  gl_FragColor=vec4(pow(max(col,0.),vec3(1./2.2)),mix(.3,.88,smoothstep(.08,.42,h))-uClear*.32+f*.1);}   // clearer around the pearls, denser milk above`;
function buildDrink(d, o = {}) {
  const g = new THREE.Group(), u = {
    cTop: { value: new THREE.Color(d.top) }, cBot: { value: new THREE.Color(d.bot) }, cStreak: { value: new THREE.Color(d.streak || d.bot) },
    cFoam: { value: new THREE.Color('#f8f4ee') }, cSss: { value: new THREE.Color(d.sss || d.top) }, uT: { value: 0 }, uStreak: { value: d.s || 0 },
    uFoam: { value: d.foam || 0 }, uTop: { value: LIQ }, uVel: { value: d.vel || 0 }, uGloss: { value: d.gloss ?? .15 }, uClear: { value: d.clear || 0 }, uSss: { value: .55 }
  };
  const liqMat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, transparent: true });
  const pts = [], core = [];
  for (let i = 0; i <= 14; i++) { const y = .12 + (LIQ - .12) * i / 14; pts.push(new THREE.Vector2(Rout(y) - .045, y)); }
  for (let i = 0; i <= 8; i++) { const y = .25 + (LIQ - .5) * i / 8; core.push(new THREE.Vector2((Rout(y) - .045) * .7, y)); }
  g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 48), liqMat));                                               // liquid shell
  g.add(new THREE.Mesh(new THREE.LatheGeometry(core, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(d.bot), transparent: true, opacity: .26, depthWrite: false })));   // denser inner layer
  const cap = new THREE.Mesh(new THREE.CircleGeometry(Rout(LIQ) - .045, 48), liqMat); cap.rotation.x = -Math.PI / 2; cap.position.y = LIQ; g.add(cap);
  const men = new THREE.Mesh(new THREE.TorusGeometry(Rout(LIQ) - .05, .03, 10, 64), new THREE.MeshPhysicalMaterial({ color: new THREE.Color(d.top), transparent: true, opacity: .7, roughness: .05, clearcoat: 1, envMapIntensity: 2 }));
  men.rotation.x = Math.PI / 2; men.position.y = LIQ; g.add(men);
  const gloss = new THREE.Mesh(new THREE.CircleGeometry(Rout(LIQ) - .05, 48), new THREE.MeshPhysicalMaterial({ color: new THREE.Color(d.top), transparent: true, opacity: .22, roughness: .03, clearcoat: 1, envMapIntensity: 3, depthWrite: false }));
  gloss.rotation.x = -Math.PI / 2; gloss.position.y = LIQ + .004; g.add(gloss);                                  // glossy surface reflections                                                // glossy meniscus
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: .92, opacity: .85, transparent: true, roughness: .08, ior: 1.46, thickness: .12, clearcoat: 1, clearcoatRoughness: .05, side: THREE.FrontSide, depthWrite: false, envMapIntensity: 1.2 });   // clear ribbed plastic
  const wall = [];                                                                                               // lathe with real wall + rolled-rim thickness
  for (let i = 0; i <= 16; i++) { const y = .1 + (H - .1) * i / 16; wall.push(new THREE.Vector2(Rout(y), y)); }
  for (let i = 1; i <= 8; i++) { const a = i / 8 * Math.PI; wall.push(new THREE.Vector2(Rout(H) - .02 + Math.cos(a) * .02, H + Math.sin(a) * .02)); }
  for (let i = 1; i <= 16; i++) { const y = H - (H - .16) * i / 16; wall.push(new THREE.Vector2(Rout(y) - .04, y)); }
  const lg = new THREE.LatheGeometry(wall, 144), LP = lg.attributes.position;
  for (let i = 0; i < LP.count; i++) {                                           // vertical ribs / flutes on the outer wall only
    if (i % wall.length > 16) continue;
    const x = LP.getX(i), y = LP.getY(i), z = LP.getZ(i), th = Math.atan2(z, x), nr = Math.hypot(x, z) + rib(th, y);
    LP.setXYZ(i, Math.cos(th) * nr, y, Math.sin(th) * nr);
  }
  lg.computeVertexNormals(); g.add(new THREE.Mesh(lg, glassMat));
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.55, .57, .12, 48), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .25, roughness: .05, clearcoat: 1, envMapIntensity: 1.8, depthWrite: false })); base.position.y = .06; g.add(base);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(Rout(H) + .06, Rout(H) + .06, .07, 48), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .3, roughness: .1, clearcoat: 1, envMapIntensity: 1.6, depthWrite: false }));
  lid.position.y = H + .06; g.add(lid);                                                                          // flat clear lid
  const strawMat = new THREE.MeshPhysicalMaterial({ color: lin('#2B1208'), roughness: .38, clearcoat: .7, clearcoatRoughness: .1, envMapIntensity: 1.4 });
  const sg = new THREE.CylinderGeometry(.07, .07, 3.1, 24, 240), SP = sg.attributes.position;
  for (let i = 0; i < SP.count; i++) { const k = 1 + .03 * Math.sin(SP.getY(i) * 95); SP.setX(i, SP.getX(i) * k); SP.setZ(i, SP.getZ(i) * k); }   // fine horizontal ribbing
  sg.computeVertexNormals();
  const straw = new THREE.Mesh(sg, strawMat);
  straw.position.set(.2, 1.62, 0); straw.rotation.z = -TILT; g.add(straw);                       // dark brown ribbed straw, angled through the lid
  const seal = new THREE.Mesh(new THREE.TorusGeometry(.105, .026, 12, 40), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .5, roughness: .1, clearcoat: 1, depthWrite: false }));
  seal.rotation.x = Math.PI / 2; seal.position.set(strawX(H + .06), H + .1, 0); g.add(seal);        // lid seal ring
  const rad = .09, pm = pearlMat(), pearls = [];
  packPearls(rad).slice(0, o.n || 999).forEach(p => {
    const m = new THREE.Mesh(pearlGeo, pm); m.scale.setScalar(rad); m.position.set(p[0], p[1], p[2]);
    m.userData = { r0: Math.hypot(p[0], p[2]), a0: Math.atan2(p[2], p[0]), y0: p[1], g: p[3], f: p[4], h: Math.random(), rx: Math.random() * 6.28, rz: Math.random() * 6.28 };
    m.rotation.set(m.userData.rx, 0, m.userData.rz); g.add(m); pearls.push(m);
  });
  const ice = [], tint = new THREE.Color(0xe6f6ff).lerp(new THREE.Color(d.top), .5);
  const im = o.hero ? new THREE.MeshPhysicalMaterial({ color: tint, transmission: .85, roughness: .1, thickness: .55, ior: 1.31, envMapIntensity: 1.6, clearcoat: .5, attenuationColor: tint, attenuationDistance: 1.5, bumpMap: noiseTex(), bumpScale: .4 })
    : new THREE.MeshPhysicalMaterial({ color: tint, transparent: true, opacity: .38, roughness: .06, clearcoat: 1, envMapIntensity: 2, depthWrite: false });
  const coreM = new THREE.MeshPhysicalMaterial({ color: tint, transparent: true, opacity: .24, roughness: .3, depthWrite: false });   // double-layered internal cores
  const iceG = bevelBox(.4, .07), coreG = bevelBox(.25, .05), core2G = bevelBox(.13, .03);
  [[-.3, .1], [-.02, -.32], [.02, .38], [-.34, -.24]].forEach(([x, z], i) => {
    const m = new THREE.Mesh(iceG, im), c = new THREE.Mesh(coreG, coreM), c2 = new THREE.Mesh(core2G, coreM);
    c.rotation.set(.5, .8, .2); c2.rotation.set(1, .3, .9); c.add(c2); m.add(c);
    m.position.set(x, LIQ - .03, z); m.rotation.set(i, i * 1.7, i * .6); m.userData.b = i; g.add(m); ice.push(m);
  });
  const ghostM = new THREE.MeshBasicMaterial({ color: 0xfff0dc, transparent: true, opacity: .16, depthWrite: false }), ghostG = bevelBox(.4, .07);   // same edge as the real cubes
  [[-.2, 1.72, .22], [.05, 1.55, -.3], [-.32, 1.38, -.05]].forEach(([x, y, z], i) => { const m = new THREE.Mesh(ghostG, ghostM); m.position.set(x, y, z); m.rotation.set(i * 1.3, i * .9, i * .5); g.add(m); });   // soft submerged ice silhouettes
  if (o.hero) {                                                                  // condensation droplets on the outer wall: one instanced draw call
    const N = 900, dm = new THREE.Object3D(), drops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .34, roughness: .02, clearcoat: 1, envMapIntensity: 2, depthWrite: false }), N);
    for (let i = 0; i < N; i++) {
      const y = .3 + Math.random() * (H - .65), th = Math.random() * 6.283, big = Math.random() < .08, sz = (big ? .013 : .004) + Math.random() * (big ? .01 : .007), rr = Rout(y) + rib(th, y) + .002;
      dm.position.set(Math.cos(th) * rr, y, Math.sin(th) * rr); dm.lookAt(Math.cos(th) * (rr + 1), y, Math.sin(th) * (rr + 1));
      dm.scale.set(sz, sz * (big ? 2.4 : 1.2), sz * .45); dm.updateMatrix(); drops.setMatrixAt(i, dm.matrix);
    }
    g.add(drops);
  }
  const grp = {};
  pearls.forEach(m => grp[m.userData.g] = grp[m.userData.g] || { th: 0, v: 0, f: m.userData.f });
  g.userData = { liq: u, ice, pearls,
    stir(dt, drive, energy) {                  // spring-physics stirring: each pearl ring swirls, then a spring unwinds it so the packing settles back
      Object.values(grp).forEach(G => {
        G.v = Math.max(-12, Math.min(12, G.v + drive * G.f));
        const w = (((G.th + Math.PI) % 6.2832) + 6.2832) % 6.2832 - Math.PI;
        G.v = (G.v - .9 * w * dt) * Math.exp(-1.1 * dt); G.th += G.v * dt;
      });
      const lift = Math.min(.5, energy * .1);
      pearls.forEach(m => {
        const u = m.userData, G = grp[u.g], a = u.a0 + G.th;
        let y = Math.min(u.y0 + lift * (.35 + .65 * u.h) * (.6 + .4 * Math.sin(a * 2 + u.h * 6)), LIQ - .25);
        const r = Math.min(u.r0 * (1 + .16 * lift), Rout(y) - .05 - .09);
        let x = Math.cos(a) * r, z = Math.sin(a) * r; const sx = strawX(y), dx = x - sx, dd = Math.hypot(dx, z);
        if (dd < .17) { x = sx + dx / dd * .17; z = z / dd * .17; }      // keep pearls off the straw
        m.position.set(x, y, z); m.rotation.set(u.rx, -G.th * 2, u.rz);
      });
    },
    update(t) { u.uT.value = t; ice.forEach(m => m.position.y = LIQ - .01 + Math.sin(t * 1.3 + m.userData.b * 2) * .035); } };
  return g;
}

/* ---------- Card factory (index favorites + products grid) ---------- */
let popObserver = null;                               // set on the pages that reveal cards on scroll (refreshed cards must be watched too)
function card(k, i) {                                 // static photo card (no WebGL canvas); shows every photo of the item, with a thumbnail strip when there is more than one
  const d = DRINKS[k], a = document.createElement('article'), imgs = d.images;
  a.className = 'card product-card pop'; a.dataset.cat = d.cat; a.dataset.key = k; a.style.setProperty('--i', i);
  const thumbs = imgs.length > 1 ? `<div class="thumbs" role="group" aria-label="${d.n} photos">${imgs.map((m, j) => `<button type="button" class="thumb" data-i="${j}" aria-pressed="${j === 0}" aria-label="Photo ${j + 1} of ${imgs.length}"><img src="${m.src}" alt="" width="64" height="64" loading="lazy" decoding="async"></button>`).join('')}</div>` : '';
  a.innerHTML = `<div class="pic"><img class="cover" src="${cover(d).src}" alt="${cover(d).alt || drinkAlt(d, 0)}" width="1254" height="1254" loading="lazy" decoding="async">${thumbs}</div>
  <div class="tags">${d.pb ? '<span class="pb">Plant-based</span>' : ''}${d.tags.map(t => `<span>${t}</span>`).join('')}</div><h3>${d.n}</h3><p>${d.d}</p>
  <div class="buy"><b>S$${d.p.toFixed(2)}</b><a class="btn sm" href="contactus.html?drink=${encodeURIComponent(d.n)}">Order</a></div>`;
  $$('img', a).forEach(im => im.addEventListener('error', () => { const f = fallbackFor(im.getAttribute('src')); if (f) im.src = f; }, { once: true }));   // if images/ can't load, use the embedded copy
  const strip = $('.thumbs', a);
  if (strip) strip.addEventListener('click', e => {
    const b = e.target.closest('.thumb'); if (!b) return;
    const j = +b.dataset.i, m = DRINKS[k].images[j], cv = $('.cover', a);
    cv.src = m.src; cv.alt = m.alt || drinkAlt(DRINKS[k], j); $$('.thumb', a).forEach(t => t.setAttribute('aria-pressed', t === b));
  });
  return a;
}
function refreshCards(key) {                          // re-render a drink's cards after its photo list grew (keeps position, filter state and reveal state)
  $$(`.card[data-key="${key}"]`).forEach(old => {
    const n = card(key, +old.style.getPropertyValue('--i') || 0); n.hidden = old.hidden; n.classList.toggle('in', old.classList.contains('in')); old.replaceWith(n); if (popObserver && !n.classList.contains('in')) popObserver.observe(n);
  });
}
window.BobaMenu = { drinks: DRINKS, display: DISPLAY, addImage: addDrinkImage };   // e.g. BobaMenu.addImage('peach', 'images/peach-2.jpg', 'Iced Peach Oolong Milk Tea, side view')
const fav = $('#fav'), grid = $('#grid');
/* the 3 Crowd Favorites cards are written in index.html */
if (grid) {
  Object.keys(DRINKS).forEach((k, i) => grid.append(card(k, i)));
  $$('.filters button').forEach(b => b.onclick = () => {
    $$('.filters button').forEach(x => x.setAttribute('aria-pressed', x === b));
    $$('.card', grid).forEach(c => c.hidden = b.dataset.f !== 'All' && c.dataset.cat !== b.dataset.f);
  });
}

/* ---------- Hero: scroll-impact plunge (index only) ---------- */
const bez = (x1, y1, x2, y2) => t => {                    // cubic-bezier easing (overshoots for the spring bounce)
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx; let a = t;
  for (let i = 0; i < 8; i++) { const x = ((ax * a + bx) * a + cx) * a - t, dx = (3 * ax * a + 2 * bx) * a + cx; if (Math.abs(x) < 1e-5 || !dx) break; a -= x / dx; }
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by; return ((ay * a + by) * a + cy) * a;
};
const dive = bez(.45, 0, .15, 1), launch = bez(.16, 1, .3, 1), hero = $('#hero3d');
if (hero) {
  let e = 0, from = 0, to = 0, t0 = 0, asp = 1, prevY = 0;
  const stir = { drive: 0, energy: 0, cup: null }, tmp = new THREE.Vector3();
  const holder = new THREE.Group(), floats = new THREE.Group();
  holder.add(buildDrink(DRINKS.brownsugar, { hero: true }));
  /* --- floating field: brown-sugar pearls + crystal ice in three depth layers (instanced) --- */
  const addAO = (m, floor, key) => {                                        // soft ambient-occlusion shading: undersides fall into shadow
    m.customProgramCacheKey = () => key;
    m.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vAO;').replace('#include <begin_vertex>', `#include <begin_vertex>\nvAO = mix(${floor.toFixed(2)}, 1.0, smoothstep(-0.95, 0.35, normal.y));`);
      sh.fragmentShader = 'varying float vAO;\n' + sh.fragmentShader.replace('#include <output_fragment>', '#include <output_fragment>\ngl_FragColor.rgb *= vAO;');
    };
  };
  const PEARL_ALPHA = .5;                                                   // background pearls are semi-translucent: 50% opaque overall
  const PEARL_LAYER = 1 - Math.sqrt(1 - PEARL_ALPHA);                       // a pearl is two stacked layers (glossy shell over a glowing core); each layer's opacity is chosen so the two combine to exactly PEARL_ALPHA where they overlap, so the whole pearl reads 50%, not just its rim
  const pearlShell = new THREE.MeshPhysicalMaterial({ color: lin('#1d0e06'), roughness: .1, clearcoat: 1, clearcoatRoughness: .035, sheen: .6, sheenColor: new THREE.Color('#d9822b'), sheenRoughness: .4, envMapIntensity: 2.2, transparent: true, opacity: PEARL_LAYER, depthWrite: false, bumpMap: noiseTex(), bumpScale: .005 });
  addAO(pearlShell, .45, 'pearlShellAO');
  const pearlCore = new THREE.MeshStandardMaterial({ color: lin('#2a1208'), emissive: new THREE.Color('#a85a1a'), emissiveIntensity: .6, roughness: .5, transparent: true, opacity: PEARL_LAYER, depthWrite: false });   // warm glow inside = radial translucency
  /* --- ice cube = the About-page "Crystal Ice" model (ING.ice), instanced: frosted bevel shell, tilted core, trapped air, fractures, crisp edge frame, soft contact shadow --- */
  const iceShell = new THREE.MeshPhysicalMaterial({ color: 0xbfdcee, transparent: true, opacity: .26, roughness: .3, clearcoat: 1, clearcoatRoughness: .15, ior: 1.31, envMapIntensity: 2.2, bumpMap: noiseTex(), bumpScale: .5, depthWrite: false });   // frosted, semi-transparent faces
  const iceInner = new THREE.MeshPhysicalMaterial({ vertexColors: true, transparent: true, side: THREE.DoubleSide, roughness: .04, clearcoat: 1, envMapIntensity: 2.6, depthWrite: false });   // glossy core + air bubbles
  const iceFlat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, side: THREE.DoubleSide, depthWrite: false });   // unlit: depth tint, fractures and the crisp edge frame
  const mergeColored = parts => {                                           // merge refraction core + air bubbles + fractures into one geometry with RGBA vertex colours
    const pos = [], nor = [], col = [];
    parts.forEach(({ geo, color }) => { const g = geo.index ? geo.toNonIndexed() : geo, p = g.attributes.position, n = g.attributes.normal; for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); col.push(...color); } });
    const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); out.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); return out;
  };
  const tilt = g => { g.rotateX(.5); g.rotateZ(.28); return g; };               // built-in tilt so the cube shows facets while spinning about the vertical axis
  const rgba = (hex, a) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b, a]; };     // linear RGBA for vertex colours
  const coreXf = g => g.rotateX(.35).rotateY(.5).rotateZ(.2).translate(.055, -.028, .034);     // the core sits tilted and off-centre inside the shell
  const beams = (s, t, color, xf) => {                                                         // 12 thin bars = a cube wireframe that stays crisp at any size (LineSegments can't be instanced)
    const h = s / 2, out = [], add = (a, b, c, x, y, z) => { const g = new THREE.BoxGeometry(a, b, c).translate(x, y, z); out.push({ geo: xf ? xf(g) : g, color }); };
    for (const p of [-h, h]) for (const q of [-h, h]) { add(s + t, t, t, 0, p, q); add(t, s + t, t, p, 0, q); add(t, t, s + t, p, q, 0); }
    return out;
  };
  const iceShellGeo = tilt(bevelBox(1, .117, 8));                                              // outer cube: tight bevel, so the faces read as flat panes
  const innerParts = [{ geo: coreXf(bevelBox(.655, .083, 8)), color: rgba(0x8fb6d0, .3) }];   // frosted core
  for (let i = 0; i < 12; i++) { const rr = .012 + Math.random() * .026; innerParts.push({ geo: new THREE.SphereGeometry(rr, 8, 6).translate((Math.random() - .5) * .76, (Math.random() - .5) * .76, (Math.random() - .5) * .76), color: rgba(0xffffff, .8) }); }   // trapped air bubbles
  const iceInnerGeo = tilt(mergeColored(innerParts));
  const iceFlatGeo = tilt(mergeColored([
    { geo: bevelBox(.83, .1, 6), color: rgba(0x7ea3bd, .14) },                                  // faint blue depth tint inside the shell
    ...[0, 1, 2].map(i => ({ geo: new THREE.PlaneGeometry(.55, .41).rotateX(i * 1.1).rotateY(i * .7 + .4).rotateZ(i * .5).translate((i - 1) * .15, (1 - i) * .083, (i - 1) * .069), color: rgba(0xffffff, .1) })),   // internal fractures catch the light
    ...beams(.932, .016, rgba(0xffffff, .9)),                                                   // crisp outer edges
    ...beams(.606, .011, rgba(0xffffff, .3), coreXf)                                            // soft inner-core edges
  ]));
  const shadowTex = (() => {                                                                    // soft contact shadow, same gradient as the About-page ground shadow
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
    g.addColorStop(0, 'rgba(26,12,6,.4)'); g.addColorStop(1, 'rgba(26,12,6,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace; else t.encoding = THREE.sRGBEncoding; return t;
  })();
  const iceShadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: .6, depthWrite: false }), iceShadowGeo = new THREE.PlaneGeometry(1, 1);
  const coreGeo = new THREE.SphereGeometry(1, 16, 12);
  const FIELD_TOP = -8, FIELD_BOT = -44, TANH = Math.tan(Math.PI / 12);
  /* Every floating pearl is the same size and every floating ice cube is the same size (no random scaling, no near/far size tiers, no blurred foreground layer).
     The cup's real proportions are the reference: a pearl is ~1cm, a cube ~2.5cm, so a cube edge is about twice a pearl's diameter. Perspective is the only thing that makes any of them look bigger or smaller. */
  const GF = { period: 4, liftPx: 4, tiltDeg: 0 }, GF_W = 2 * Math.PI / GF.period, GF_TILT = GF.tiltDeg * Math.PI / 180;   // same numbers as the CSS @keyframes gentleFloat: +-4px, no tilt, there and back every 4s
  const PEARL_SIZE = .14, ICE_SIZE = .52;                                   // world units: pearl radius, ice-cube edge
  const LAY = [{ id: 'mid', z0: -4.5, z1: -.5, sway: .25, spd: .5, boost: .06, nP: 84, nI: 26 }];   // one shallow depth band (about 1.4x between nearest and farthest). Far fewer items than before (was 344 pearls + 136 cubes) so the page behind the text and cards stays calm
  const mkInst = (geo, mat, n, order) => { const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; m.renderOrder = order; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); return m; };
  LAY.forEach(L => {
    L.pS = mkInst(pearlGeo, pearlShell, L.nP, 2); L.pC = mkInst(coreGeo, pearlCore, L.nP, 1); L.iS = mkInst(iceShellGeo, iceShell, L.nI, 4); L.iI = mkInst(iceInnerGeo, iceInner, L.nI, 3);
    L.iF = mkInst(iceFlatGeo, iceFlat, L.nI, 5); L.iH = mkInst(iceShadowGeo, iceShadowMat, L.nI, 0);   // edge frame on top, contact shadow underneath everything
    floats.add(L.pC, L.pS, L.iI, L.iS, L.iF, L.iH); L.items = [];
    for (let i = 0; i < L.nP + L.nI; i++) {
      const ice = i >= L.nP, k = ice ? (i - L.nP) / L.nI : i / L.nP, z = L.z0 + Math.random() * (L.z1 - L.z0);
      L.items.push({ ice, i: ice ? i - L.nP : i, x: (Math.random() - .5) * 2 * TANH * (9.5 - z) * 2.1, y: FIELD_TOP + (FIELD_BOT - FIELD_TOP) * k + (Math.random() - .5) * 2.6, z, ph: Math.random() * 6, s: ice ? ICE_SIZE : PEARL_SIZE });
    }
  });
  const dm = new THREE.Object3D(), ZT = { v: 0, from: 0, to: 0, t0: 0, dur: 1800 }, zoomEase = bez(.16, 1, .3, 1), sm = x => x * x * (3 - 2 * x);   // scroll zoom: extended ease-out so velocity decelerates smoothly
  const Z0 = 9.5, Y1 = -26, TAN = Math.tan(Math.PI / 12);                   // camera falls straight down the shaft from y 0 to y -26
  const fit = { hs: .55, hy: -2.4 };
  const layout = () => {                                                    // narrow screens: size the cup to the free space below the hero text
    const c = $('.hero-copy'); if (!c) return;
    const ppu = innerHeight / (2 * TAN * Z0), bottom = c.getBoundingClientRect().bottom + scrollY, free = innerHeight - bottom - 16;
    fit.hs = Math.max(.3, Math.min(.8, free / (3.3 * ppu))); fit.hy = -TAN * Z0 + 10 / ppu;
  };
  const S = stage(hero, () => { const g = new THREE.Group(); g.add(holder, floats); return g; }, {
    fixed: true, bg: true, cy: 0, cz: Z0, ly: 0,
    tick(t, _, S) {
      const dt = Math.min(.05, Math.max(.001, t - (S.lt ?? t))); S.lt = t;
      const k = Math.min(1, (performance.now() - t0) / (RM ? 1 : to ? 1500 : 1000));
      e = from + (to - from) * (to ? dive(k) : launch(k));                   // slow start, long fall, soft landing / quick snap back up
      const f = Math.max(0, Math.min(1, e)), hw = TAN * Z0 * asp, narrow = asp < .9;
      const hx = narrow ? 0 : hw * .5, hy = narrow ? fit.hy : -1.75, hs = narrow ? fit.hs : Math.min(1, .55 + asp * .3), cc = hy + 1.6 * hs;
      holder.position.set(hx, cc - 1.6 * hs, 0); holder.scale.setScalar(hs);
      holder.rotation.y = Math.sin(t * .5) * .22;                           // stays upright; pointer never turns the cup
      holder.visible = !videoOK && f < .98;
      const par = isPlunged ? Math.min(scrollY, 2400) / 2400 : 0;            // scrolling on toward the next section keeps drifting down the shaft
      const camY = (Y1 - par * 8) * f;
      const diveY = Y1 * f, vy = (diveY - prevY) / dt; prevY = diveY;          // speed comes from the dive between the banner and the stops ONLY. The slow parallax drift while you scroll (par) used to count too, which streaked the pearls and ice into tall ovals through "Our Boba Display" and every section below it
      S.spd = (S.spd || 0) + (Math.min(1, Math.abs(vy) / 50) - (S.spd || 0)) * (1 - Math.exp(-dt * 10));
      const zt = sm(Math.min(scrollY, 3200) / 3200);                          // scroll-triggered zoom target, eased with cubic-bezier(0.16, 1, 0.3, 1)
      if (Math.abs(zt - ZT.to) > .0005) { ZT.from = ZT.v; ZT.to = zt; ZT.t0 = performance.now(); }
      ZT.v = ZT.from + (ZT.to - ZT.from) * zoomEase(Math.min(1, (performance.now() - ZT.t0) / ZT.dur));
      S.cam.position.set(Math.sin(t * .4) * .3 * f, camY, Z0 - ZT.v * 2.2);   // dolly in: near layers grow fastest, distant ones barely move
      S.cam.fov = 30 + 20 * S.spd * S.spd; S.cam.rotation.z = (to ? 1 : -1) * .035 * S.spd; S.cam.updateProjectionMatrix();   // FOV punch + a touch of roll sell the speed
      const cup = holder.children[0];
      if (!videoOK) { cup.userData.update(t); stir.energy *= Math.exp(-1.6 * dt); cup.userData.stir(dt, stir.drive, stir.energy); stir.drive = 0; }
      if (!videoOK && e < .1) {                                                         // screen-space hit area for stirring (hero stage only)
        tmp.set(hx, cc, 0).project(S.cam); const ppu = innerHeight / (2 * TAN * S.cam.position.z);
        stir.cup = { sx: (tmp.x * .5 + .5) * innerWidth, sy: (-tmp.y * .5 + .5) * innerHeight, rx: .85 * hs * ppu, ry: 1.7 * hs * ppu };
      } else stir.cup = null;
      const stretch = 1 + S.spd * 2.4;                                       // pearls and ice streak vertically while falling
      const GF_LIFT = GF.liftPx * 2 * TAN * (Z0 + 2.5) / innerHeight;       // 4 screen px expressed in world units at the field's mid depth
      LAY.forEach(L => {
        const boost = 1 + ZT.v * L.boost;                                    // the whole field swells together on scroll, so sizes stay uniform
        L.items.forEach(u => {
          const fl = (1 - Math.cos(t * GF_W + u.ph * 1.7)) / 2;                // 0 -> 1 -> 0, each item on its own phase
          const sc = Math.abs(u.y - camY) < 26 ? u.s * boost : 0, px = u.x + Math.sin(t * L.spd + u.ph) * GF_LIFT, py = u.y + (fl * 2 - 1) * GF_LIFT;   // both axes drift only +-4px
          dm.position.set(px, py, u.z); dm.rotation.set(0, t * .08 + u.ph, fl * GF_TILT); dm.scale.set(sc, sc * stretch, sc); dm.updateMatrix();
          if (u.ice) {
            L.iS.setMatrixAt(u.i, dm.matrix); L.iI.setMatrixAt(u.i, dm.matrix); L.iF.setMatrixAt(u.i, dm.matrix);
            dm.position.set(px, py - sc * (.68 * stretch + .35), u.z - .02); dm.rotation.set(0, 0, 0); dm.scale.set(sc * 1.9, sc * .38, 1); dm.updateMatrix();   // contact shadow: flat ellipse hovering below the cube's lowest corner
            L.iH.setMatrixAt(u.i, dm.matrix);
          }
          else { L.pS.setMatrixAt(u.i, dm.matrix); dm.position.set(px + sc * .07, py - sc * .08, u.z); dm.scale.set(sc * .58, sc * .58 * stretch, sc * .58); dm.updateMatrix(); L.pC.setMatrixAt(u.i, dm.matrix); }
        });
        L.pS.instanceMatrix.needsUpdate = L.pC.instanceMatrix.needsUpdate = L.iS.instanceMatrix.needsUpdate = L.iI.instanceMatrix.needsUpdate = L.iF.instanceMatrix.needsUpdate = L.iH.instanceMatrix.needsUpdate = true;
      });
    }
  });
  S.resize = a => { asp = a; layout(); };
  addEventListener('resize', layout); if (document.fonts) document.fonts.ready.then(layout); addEventListener('load', layout);
  const setPlunged = v => {                                                 // one input flips the state immediately
    if (v === isPlunged) return;
    isPlunged = v; from = e; to = v ? 1 : 0; t0 = performance.now();
    document.body.classList.toggle('plunged', v);                           // hero text exits upward; #hero3d stays fixed behind the page
    $$('#ad .pop').forEach(c => c.classList.toggle('in', v));                // the ad block rises in State B (crowd favorites have their own scroll trigger, below)
  };
  const down = () => setPlunged(true);
  /* --- Page snapping is native CSS (html.snap-page: scroll-snap-type y mandatory, see style.css), so wheel, keys, touch and scrollbar all land exactly on a section.
         The handlers below only drive the hero <-> dive state of the 3D scene (the instant a scroll starts, not when it lands). --- */
  const adEl = $('#ad'), heroEl = $('#heroWrap'), stopEls = [heroEl, adEl, $('#showcase'), $('#story'), $('#menu'), $('#finale')].filter(Boolean);
  const adTop = () => adEl ? adEl.offsetTop : innerHeight;                  // scrollY of the first stop below the banner
  const back = () => { if (isPlunged && scrollY <= adTop() + 6) setPlunged(false); };   // scrolling up from the first stop returns to the banner (and from any stop lower down it does not)
  const snapStops = () => {                                                 // every resting place: each section's top, plus its bottom edge when it is taller than the window (short windows)
    const max = document.documentElement.scrollHeight - innerHeight, pts = [0];
    stopEls.forEach(e => { const r = e.getBoundingClientRect(), top = Math.round(r.top + scrollY), bot = Math.round(r.bottom + scrollY - innerHeight); pts.push(top); if (bot > top + 2) pts.push(bot); });
    return [...new Set(pts.map(v => Math.max(0, Math.min(max, v))))].sort((a, b) => a - b);
  };
  let lockUntil = 0, swallowUntil = 0, goal = null, goalBy = 0;
  const busy = () => { const n = performance.now(); return n < lockUntil || (goal !== null && n < goalBy); };   // a glide is under way (waits for it to land, even on a slow device, but never for more than 2.5s)
  const go = y => {                                                         // glide to a stop; the CSS snap points are the same positions, so nothing re-snaps afterwards
    goal = y; goalBy = performance.now() + 2500; lockUntil = performance.now() + (RM ? 60 : 900);
    y > scrollY ? down() : back();
    scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' });
  };
  const step = dir => {                                                     // one scroll gesture = exactly one stop, even for a tiny trackpad nudge. false = let the browser scroll (a section much taller than the window)
    const y = scrollY, pts = snapStops(), t = dir > 0 ? pts.find(v => v > y + 3) : [...pts].reverse().find(v => v < y - 3);
    if (t === undefined || Math.abs(t - y) > innerHeight * 1.02 + 4) return false;
    go(t); return true;
  };
  addEventListener('scroll', () => { if (goal !== null && Math.abs(scrollY - goal) <= 1) { goal = null; lockUntil = performance.now() + 200; swallowUntil = Math.max(swallowUntil, performance.now() + 140); } }, { passive: true });   // arrived: release shortly after
  let lastA = 0;
  addEventListener('wheel', e => {
    if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;      // pinch-zoom / sideways scroll
    const dir = Math.sign(e.deltaY); if (!dir) return;
    const now = performance.now(), a = Math.abs(e.deltaY), fresh = a > lastA * 1.8 + 8; lastA = a;
    if (busy() || (now < swallowUntil && !fresh)) { e.preventDefault(); swallowUntil = Math.max(swallowUntil, now + 140); return; }   // the rest of the gesture, trackpad momentum included
    if (step(dir)) { e.preventDefault(); swallowUntil = now + 900 + 140; }
    else dir > 0 ? down() : back();
  }, { passive: false });
  addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input,textarea,select')) return;
    const dir = e.key === ' ' ? (e.shiftKey ? -1 : 1) : /^(ArrowDown|PageDown)$/.test(e.key) ? 1 : /^(ArrowUp|PageUp)$/.test(e.key) ? -1 : 0;
    if (!dir || e.altKey || e.ctrlKey || e.metaKey || (e.key === ' ' && e.target.closest && e.target.closest('button,summary,[role=button]'))) return;   // Space clicks buttons: never steal it
    if (busy() || step(dir)) { e.preventDefault(); return; }
    dir > 0 ? down() : back();
  });
  const toAd = () => { if (adEl) go(adTop()); else down(); };              // a click on the banner: same destination as one wheel notch
  let ty = null;                                                            // swipe up = dive, swipe down from the first stop = back to the banner
  addEventListener('touchstart', e => { ty = e.touches[0].clientY; goal = null; lockUntil = 0; }, { passive: true });
  addEventListener('touchmove', e => { if (ty === null) return; const dy = ty - e.touches[0].clientY; if (Math.abs(dy) > 12) { dy > 0 ? down() : back(); ty = null; } }, { passive: true });
  addEventListener('touchend', () => { ty = null; }, { passive: true });
  const heroWrap = $('#heroWrap');                                          // a click on empty hero space dives too (links and buttons keep working)
  if (heroWrap) heroWrap.addEventListener('click', e => { if (scrollY < innerHeight * .5 && !busy() && !e.target.closest('a,button')) toAd(); });   // judged by position, not by the dive flag, so it works however you got back to the top
  let ly = scrollY;                                                         // scrollbar: down past 50px = B, back at the very top = A
  addEventListener('scroll', () => { const d = scrollY - ly; ly = scrollY; if (scrollY > 50 && d > 0) down(); else if (scrollY <= 0 && d < 0) back(); }, { passive: true });
  if (scrollY > 50) setPlunged(true);                                       // restored scroll position on reload
  let lx = null, ly2 = null, held = false;                                  // pointer stirring
  const inCup = e => { const c = stir.cup; if (!c) return false; const nx = (e.clientX - c.sx) / c.rx, ny = (e.clientY - c.sy) / c.ry; return nx * nx + ny * ny <= 1; };
  addEventListener('pointerdown', e => held = inCup(e), { passive: true });
  ['pointerup', 'pointercancel'].forEach(n => addEventListener(n, () => held = false, { passive: true }));
  addEventListener('pointermove', e => {
    const inside = inCup(e), gain = held ? 2.5 : 1;
    document.documentElement.style.cursor = inside ? (held ? 'grabbing' : 'grab') : '';
    if (inside && lx !== null) {
      const dx = e.clientX - lx, dy = e.clientY - ly2;
      stir.drive = Math.max(-1.5, Math.min(1.5, stir.drive - dx * .012 * gain));
      stir.energy = Math.min(6, stir.energy + (Math.abs(dx) + Math.abs(dy)) * .02 * gain);
    }
    lx = inside ? e.clientX : null; ly2 = e.clientY;
  }, { passive: true });
} else {                                                                    // other pages: pop cards as they enter view
  const io = popObserver = new IntersectionObserver(es => {                 // whatever enters together cascades 0, 100, 200ms...
    let k = 0;
    es.forEach(x => { if (!x.isIntersecting) return; x.target.style.setProperty('--i', k++); x.target.classList.add('in'); io.unobserve(x.target); });
  }, { threshold: .15 });
  setTimeout(() => $$('.pop').forEach(c => io.observe(c)));
}

/* ---------- Hero video banner: continuous, non-pausable loop ---------- */
const hv = $('.hero-video-banner');
if (hv) {
  const wrap = $('.hero-wrap'); let parked = false;                                        // parked = scrolled out of sight: rests there, resumes the moment the banner is back
  const go = () => { if (parked) return; const p = hv.play(); if (p && p.catch) p.catch(() => { }); };
  const fail = () => { videoOK = false; wrap && wrap.classList.remove('has-video'); };       // nothing can play: fall back to the live 3D cup
  const useEmbedded = () => fail();   // video/banner.mp4 missing: fall back to the live 3D cup
  hv.muted = true; hv.loop = true;
  hv.addEventListener('error', useEmbedded);
  const src = hv.querySelector('source'); if (src) src.addEventListener('error', useEmbedded);
  hv.addEventListener('pause', () => { if (!document.hidden && !RM && !parked) go(); });              // nothing can leave it paused
  hv.addEventListener('ended', go);
  hv.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) go(); });
  ['pointerdown', 'keydown', 'touchstart'].forEach(n => addEventListener(n, go, { passive: true }));   // retry if a browser blocked autoplay
  if ('IntersectionObserver' in window && wrap) new IntersectionObserver(([x]) => { parked = !x.isIntersecting; if (parked) hv.pause(); else if (!RM) go(); }, { threshold: .02 }).observe(wrap);
  if (RM) hv.pause(); else go();                                                              // reduced motion: show the still poster instead
}

/* ---------- Ad video section: autoplay loop with Play/Pause + Mute/Unmute ---------- */
const adv = $('.ad-video');
if (adv) {
  const box = $('.ad-player'), bPlay = $('[data-ad-play]', box), bMute = $('[data-ad-mute]', box);
  const ui = { playing: false, muted: true }, say = (b, t) => b.setAttribute('aria-label', t);
  let userPaused = RM, usedFallback = false;                                              // reduced motion: start paused, the button still works
  const paint = () => {                                                                   // one place that mirrors state into the UI
    box.dataset.playing = ui.playing; box.dataset.muted = ui.muted;
    say(bPlay, ui.playing ? 'Pause video' : 'Play video'); say(bMute, ui.muted ? 'Unmute video' : 'Mute video');
  };
  const play = () => { const p = adv.play(); if (p && p.catch) p.catch(() => { }); };
  const useEmbedded = () => { };   // video/ad.mp4 missing: the poster image simply stays
  adv.poster = AD_POSTER_FB; adv.muted = true; adv.loop = true;
  adv.addEventListener('error', useEmbedded);
  const asrc = adv.querySelector('source'); if (asrc) asrc.addEventListener('error', useEmbedded);
  adv.addEventListener('play', () => { ui.playing = true; paint(); });
  adv.addEventListener('pause', () => { ui.playing = false; paint(); });
  adv.addEventListener('volumechange', () => { ui.muted = adv.muted; paint(); });
  bPlay.addEventListener('click', () => { if (adv.paused) { userPaused = false; play(); } else { userPaused = true; adv.pause(); } });
  bMute.addEventListener('click', () => { adv.muted = !adv.muted; });
  new IntersectionObserver(es => {                                                        // rest while off-screen, never override the viewer's own pause
    if (es[0].isIntersecting) { if (!userPaused) play(); } else adv.pause();
  }, { threshold: .25 }).observe(box);
  if (RM) adv.pause();
  paint();
}

/* ---------- Our Boba Display: phase 1, the nine cards start small in their own places, spin through one 360deg turn (upside down at 180deg) and land on a spring; phase 2, a calm left-to-right drift ---------- */
const showEl = $('#showcase'), showTrack = $('#showTrack');
if (showEl && showTrack) {
  const keys = DISPLAY, SETS = 3;                                 // three identical sets: drifting by exactly one set (33.33%) loops with no seam
  const setHTML = (clone) => `<div class="show-set"${clone ? ' aria-hidden="true"' : ''}>${keys.map((k, i) => {
    const d = DRINKS[k];
    return `<div class="slot" style="--k:${i}"><a class="show-card boba-display-card" href="contactus.html?drink=${encodeURIComponent(d.n)}"${clone ? ' tabindex="-1"' : ''} aria-label="${d.n}, S$${d.p.toFixed(2)}. Order it">`
      + `<span class="frame"><img src="${d.portrait}" alt="${clone ? '' : cover(d).alt || d.n + ': iced drink in a tall glass'}" width="705" height="1254" loading="eager" fetchpriority="low" decoding="async" draggable="false"></span>`
      + `<span class="cap"><b><span>${d.n}</span></b><small>S$${d.p.toFixed(2)}</small></span></a></div>`;
  }).join('')}</div>`;
  showTrack.innerHTML = Array.from({ length: SETS }, (_, n) => setHTML(n > 0)).join('');
  $$('img', showTrack).forEach(im => im.addEventListener('error', () => { const f = IMG_FB_P[String(im.getAttribute('src')).split('/').pop().replace(/\.\w+$/, '')]; if (f) im.src = f; }, { once: true }));
  const stage = $('#showStage'), liveSlots = $$('.show-set:nth-child(2) .slot', showTrack);   // the middle set is the one on screen
  const SPIN_MS = 700, LAND_MS = 800, SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)', LAP_S = 38;   // spin up to the upside-down point, spring landing, seconds per drift loop
  showTrack.style.setProperty('--drift', LAP_S + 's');

  /* --- the drift: one loop (one set of nine cards) every 38s; a Web Animation whose speed eases up on start and release, and stops the instant the pointer or keyboard focus is on a card --- */
  const CAN_ANIMATE = typeof showTrack.animate === 'function' && !RM;
  const hold = { hover: false, focus: false }, held = () => hold.hover || hold.focus;
  let drift = null, rate = 0, rateRaf = 0, inView = true;
  const inOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const rampTo = (target, ms) => {                                // glide the speed instead of switching it
    cancelAnimationFrame(rateRaf); if (!drift) return;
    const from = rate, t0 = performance.now();
    const f = now => { const k = Math.min(1, (now - t0) / ms); rate = from + (target - from) * inOut(k); drift.playbackRate = rate; if (k < 1) rateRaf = requestAnimationFrame(f); };
    rateRaf = requestAnimationFrame(f);
  };
  const stopDrift = () => { cancelAnimationFrame(rateRaf); if (drift) { drift.cancel(); drift = null; } showEl.classList.remove('js-drift'); };
  const startDrift = () => {
    stopDrift(); showEl.classList.add('js-drift');
    drift = showTrack.animate([{ transform: 'translateX(-33.3333%)' }, { transform: 'translateX(0%)' }], { duration: LAP_S * 1000, iterations: Infinity, easing: 'linear' });
    drift.playbackRate = rate = 0; if (!inView) drift.pause(); if (!held()) rampTo(1, 1000);   // starts from the resting offset, so the hand-over from the fan-out is seamless
  };
  const sync = () => {                                           // pausing is instant; the drift eases back up when released
    if (held()) { cancelAnimationFrame(rateRaf); rate = 0; if (drift) drift.playbackRate = 0; } else rampTo(1, 600);
  };
  stage.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') { hold.hover = true; sync(); } });
  stage.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch') { hold.hover = false; sync(); } });
  stage.addEventListener('focusin', () => { hold.focus = true; sync(); });
  stage.addEventListener('focusout', () => { hold.focus = false; sync(); });

  /* --- the entrance. The photos are decoded while the page is idle, so the first frame never shows a blank card --- */
  const liveImgs = $$('.show-set:nth-child(2) img', showTrack);
  let readyP = null, initialised = false;
  const decodeAll = () => Promise.all(liveImgs.map(im => (im.decode ? im.decode() : Promise.resolve()).catch(() => { })));
  const ensureReady = () => readyP || (readyP = decodeAll());
  const idle = cb => 'requestIdleCallback' in window ? requestIdleCallback(cb, { timeout: 2500 }) : setTimeout(cb, 500);
  idle(ensureReady);
  const settle = () => { if (!showEl.classList.contains('in') || showEl.classList.contains('settled')) return; if (CAN_ANIMATE) startDrift(); showEl.classList.add('settled'); };
  const enter = async () => {
    if (initialised) return; initialised = true;                  // one-time safeguard: nothing below can ever run twice
    if (RM) { showEl.classList.add('in'); settle(); return; }       // reduced motion: no entrance, the row simply appears
    await Promise.race([ensureReady(), new Promise(res => setTimeout(res, 700))]);   // photos decoded first (never waits more than 0.7s)
    const total = SPIN_MS + LAND_MS, at = SPIN_MS / total;
    showEl.classList.add('in');
    const anims = liveSlots.map(el => el.animate([                  // every card turns in place, around its own centre
      { transform: 'scale(0.65) rotate(0deg)', opacity: .2, easing: 'cubic-bezier(0.5, 0, 1, 1)' },                // starts small and faint, then accelerates and zooms in...
      { transform: 'scale(0.85) rotate(180deg)', opacity: .75, offset: at, easing: SPRING },                       // ...to the upside-down point, mid-spin...
      { transform: 'scale(1) rotate(360deg)', opacity: 1 }                                                         // ...and on round to right side up, snapping into place on the spring
    ], { duration: total, fill: 'backwards' }));
    const done = () => settle();                                  // the drift takes over from exactly here
    const guard = () => anims.some(a => a.playState === 'running') ? setTimeout(guard, 400) : done();   // safety net: only acts once the animations have really stopped, however late the frames arrive
    Promise.all(anims.map(a => a.finished)).then(done).catch(done); setTimeout(guard, total + 1500);
  };
  showEl.classList.add('armed');
  if ('IntersectionObserver' in window) {
    const trigger = new IntersectionObserver(([e]) => {            // fires once: the first time half of the section is on screen
      if (e.intersectionRatio < .5 && e.intersectionRect.height < innerHeight * .5) return;
      trigger.unobserve(showEl); trigger.disconnect(); enter();
    }, { threshold: [.1, .25, .5, .75] });
    trigger.observe(showEl);
    new IntersectionObserver(([e]) => { inView = e.intersectionRatio > 0; if (drift) inView ? drift.play() : drift.pause(); }, { threshold: [0, .01] }).observe(showEl);   // not a second trigger: it only parks the drift while the section is off screen
  } else enter();
}

/* ---------- Crowd Favorites: the cards cascade in (0, 100, 200ms) every time the section scrolls into view ---------- */
{
  const menuEl = $('#menu'), favEl = $('#fav');
  if (menuEl && favEl) {
    const favCards = () => $$('.pop', favEl);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        const on = e.intersectionRatio >= .4 || e.intersectionRect.height >= innerHeight * .5;
        if (on) favCards().forEach(c => c.classList.add('in')); else if (e.intersectionRatio < .05) favCards().forEach(c => c.classList.remove('in'));
      }, { threshold: [0, .05, .2, .4, .6, .8, 1] }).observe(menuEl);
    } else favCards().forEach(c => c.classList.add('in'));
  }
}

/* ---------- Smooth scroll to the product menu ---------- */
$$('[data-scroll]').forEach(a => a.addEventListener('click', e => {
  const t = $(a.dataset.scroll); if (!t) return;
  e.preventDefault(); t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
}));

/* ---------- Live craving counter: follows the opening hours (daily 11am to 10pm, Singapore time) ----------
   before 11am it reads 0, from 11am it climbs through the day (busier at lunch, mid-afternoon and dinner), and at 10pm it stops and holds the final count */
const cr = $('#craves');
if (cr) {
  const OPEN = 11, CLOSE = 22, COUNT_MS = 2500, fmt = v => Math.round(v).toLocaleString('en-US');
  const WEIGHTS = [5, 8, 9, 6, 5, 7, 6, 6, 8, 9, 6];               // relative demand for each opening hour, 11am to 10pm
  const WSUM = WEIGHTS.reduce((a, b) => a + b, 0);
  const NOTE = { open: 'Cups poured today, and counting.', before: 'We open at 11am, and the count starts then.', after: 'We are closed for today. This was the final count.' };
  const ticker = cr.closest('.ticker'), note = ticker && ticker.querySelector('p');
  const sg = () => { const p = {}; new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Singapore', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date()).forEach(x => { p[x.type] = x.value; }); return { day: p.year + p.month + p.day, h: +p.hour % 24, m: +p.minute, s: +p.second }; };
  const dayTotal = day => { let h = 2166136261; for (const c of day) h = Math.imul(h ^ c.charCodeAt(0), 16777619); h ^= h >>> 13; h = Math.imul(h, 2246822519); h ^= h >>> 16; return 7000 + (h >>> 0) % 700; };   // the same final count for everyone on a given day
  const state = () => {
    const t = sg(), total = dayTotal(t.day), hrs = t.h + t.m / 60 + t.s / 3600;
    if (hrs < OPEN) return { phase: 'before', count: 0 };
    if (hrs >= CLOSE) return { phase: 'after', count: total };
    const x = hrs - OPEN, i = Math.floor(x); let acc = 0; for (let k = 0; k < i; k++) acc += WEIGHTS[k];
    return { phase: 'open', count: Math.floor(total * (acc + WEIGHTS[i] * (x - i)) / WSUM) };
  };
  const easeOut = t => 1 - Math.pow(1 - t, 3);                    // quick start, soft landing on the real number
  let n = -1, raf = 0, tickT = 0, started = false, phase = '';
  const stop = () => { cancelAnimationFrame(raf); clearTimeout(tickT); };
  const setPhase = p => { if (p === phase) return; phase = p; if (note) note.textContent = NOTE[p]; if (ticker) ticker.classList.toggle('is-closed', p !== 'open'); };
  const paint = () => {                                           // show the count for this very second; bump only while the shop is open
    const s = state(); setPhase(s.phase);
    if (s.count === n) return;
    const grew = n >= 0 && s.count > n; n = s.count; cr.textContent = fmt(n);
    if (grew && s.phase === 'open' && !RM) { cr.classList.remove('bump'); void cr.offsetWidth; cr.classList.add('bump'); }
  };
  const live = () => { paint(); tickT = setTimeout(live, 1000); };
  const run = () => {
    if (started) return; started = true; stop();
    const s0 = state(); setPhase(s0.phase);
    if (RM || s0.count === 0) { n = -1; live(); return; }          // reduced motion, or not open yet: no count-up
    const t0 = performance.now();
    const frame = now => {
      const k = Math.max(0, Math.min(1, (now - t0) / COUNT_MS)); cr.textContent = fmt(s0.count * easeOut(k));   // never below 0, even if the first frame timestamp is early
      if (k < 1) raf = requestAnimationFrame(frame); else { n = -1; live(); }
    };
    raf = requestAnimationFrame(frame);
  };
  const reset = () => { stop(); started = false; n = -1; cr.textContent = '0'; cr.classList.remove('bump'); };   // fully out of sight: ready to count again on the next visit
  const box = $('.counter') || cr;
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { if (e.intersectionRatio >= .5) run(); else if (e.intersectionRatio === 0) reset(); }, { threshold: [0, .5] }).observe(box);
  else { n = -1; live(); }
}

/* ---------- About: "What goes in your cup" 3D ingredient cards (slow spin, hover boost, high-detail assets) ---------- */
const mkTex = (w, h, draw) => {                                   // procedural canvas textures: no image files needed
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace; else t.encoding = THREE.sRGBEncoding; return t;
};
const groundShadow = () => {                                      // soft contact shadow under every model, like a product render
  const t = mkTex(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(26,12,6,.4)'); g.addColorStop(1, 'rgba(26,12,6,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.8), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = -1.2; return m;
};
const ingRoot = () => { const r = new THREE.Group(), p = new THREE.Group(); r.add(groundShadow(), p); r.userData.pivot = p; return [r, p]; };
const leafTex = () => mkTex(256, 512, (x, w, h) => {              // veined tea leaf: gradient, speckle, lateral veins, midrib
  const g = x.createLinearGradient(0, h, 0, 0); g.addColorStop(0, '#2f6a2f'); g.addColorStop(.6, '#4f8f3f'); g.addColorStop(1, '#7db652'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${Math.random() < .5 ? '20,60,20' : '170,215,110'},${Math.random() * .08})`; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, Math.random() * 2.2, 0, 6.3); x.fill(); }
  x.lineCap = 'round';
  for (let k = 0; k < 14; k++) for (const s of [-1, 1]) { const y0 = h - h * (.08 + k * .062); x.strokeStyle = 'rgba(205,235,150,.55)'; x.lineWidth = Math.max(.8, 2.4 - k * .1); x.beginPath(); x.moveTo(w / 2, y0); x.quadraticCurveTo(w / 2 + s * w * .22, y0 - h * .035, w / 2 + s * w * (.46 - k * .018), y0 - h * .1); x.stroke(); }
  x.strokeStyle = 'rgba(225,245,170,.92)'; x.lineWidth = 6; x.beginPath(); x.moveTo(w / 2, h); x.lineTo(w / 2, h * .03); x.stroke();
});
const sugarTex = () => mkTex(256, 256, (x, w, h) => {             // granular brown sugar crystals
  x.fillStyle = '#9a5a26'; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 5600; i++) { x.fillStyle = Math.random() < .5 ? `rgba(255,214,150,${.15 + Math.random() * .35})` : `rgba(70,34,10,${.15 + Math.random() * .3})`; const r = .6 + Math.random() * 1.8; x.fillRect(Math.random() * w, Math.random() * h, r, r); }
});
function leafGeo(len = 2.1, wid = 1, seg = 14) {                  // ovate, pointed leaf with a V-fold along the midrib and an arch along its length
  const g = new THREE.PlaneGeometry(1, 1, seg, seg * 2), P = g.attributes.position;
  for (let i = 0; i < P.count; i++) {
    const u = P.getX(i) + .5, v = P.getY(i) + .5, half = Math.pow(Math.sin(Math.PI * Math.pow(v, .75)), .8) * .5;
    P.setXYZ(i, (u - .5) * 2 * half * wid, v * len - len / 2, Math.abs(u - .5) * 2 * half * .18 + Math.sin(v * Math.PI * .9) * .22 + v * v * .12);
  }
  g.computeVertexNormals(); return g;
}
/* Fresh Milk: a stylised gable-top milk carton. Front and back carry a label that reads "Fresh Milk" (drawn on a canvas texture), so it stays readable as it turns. */
const drawCartonFront = (x, w, h) => {
  const BLUE = '#2f6fb5', NAVY = '#1d3a64', SERIF = '"Inter Tight", "Helvetica Neue", Arial, sans-serif';
  x.fillStyle = '#fffaf0'; x.fillRect(0, 0, w, h);
  x.fillStyle = BLUE; x.fillRect(0, 0, w, 120);                                   // header band
  x.fillStyle = '#fffaf0'; x.font = '700 30px Inter, "Helvetica Neue", system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  if ('letterSpacing' in x) x.letterSpacing = '7px'; x.fillText('BOBA CRAVE CO.', w / 2 + 3, 62); if ('letterSpacing' in x) x.letterSpacing = '0px';
  x.fillStyle = BLUE; x.font = `700 150px ${SERIF}`; x.fillText('Fresh', w / 2, 270);       // the label: Fresh / Milk
  x.fillStyle = NAVY; x.font = `800 190px ${SERIF}`; x.fillText('Milk', w / 2, 438);
  const wave = (y0, amp, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(0, h); x.lineTo(0, y0); for (let i = 0; i <= w; i += 8) x.lineTo(i, y0 + Math.sin(i / w * Math.PI * 4) * amp); x.lineTo(w, h); x.closePath(); x.fill(); };
  wave(560, 18, '#a9cdf0'); wave(610, 16, BLUE);                                  // milk-wave footer
  x.fillStyle = '#fffaf0'; x.font = `600 40px ${SERIF}`; x.fillText('cold & creamy', w / 2, 690);
};
const drawCartonSide = (x, w, h) => {
  x.fillStyle = '#fffaf0'; x.fillRect(0, 0, w, h); x.fillStyle = '#2f6fb5'; x.fillRect(0, 0, w, 120);
  const wave = (y0, amp, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(0, h); x.lineTo(0, y0); for (let i = 0; i <= w; i += 8) x.lineTo(i, y0 + Math.sin(i / w * Math.PI * 4) * amp); x.lineTo(w, h); x.closePath(); x.fill(); };
  wave(560, 18, '#a9cdf0'); wave(610, 16, '#2f6fb5');
};
const cartonGeo = (W, D, rise) => {                                               // roof: a triangular prism with its ridge running left-right
  const v = [[-W / 2, 0, D / 2], [W / 2, 0, D / 2], [-W / 2, 0, -D / 2], [W / 2, 0, -D / 2], [-W / 2, rise, 0], [W / 2, rise, 0]];
  const idx = [0, 1, 5, 0, 5, 4,  3, 2, 4, 3, 4, 5,  2, 0, 4,  1, 3, 5];          // front slope, back slope, left gable, right gable
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(idx.flatMap(i => v[i]), 3)); g.computeVertexNormals(); return g;
};
const ING = {
  milk: () => {
    const [r, p] = ingRoot(), W = 1, D = .86, BH = 1.5, RISE = .5;
    const front = mkTex(512, 768, drawCartonFront), side = mkTex(512, 768, drawCartonSide);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { drawCartonFront(front.image.getContext('2d'), 512, 768); front.needsUpdate = true; });   // redraw once the web fonts are in
    const mat = (map) => new THREE.MeshPhysicalMaterial({ map, color: map ? 0xffffff : 0xfffaf0, roughness: .4, clearcoat: .55, clearcoatRoughness: .25, envMapIntensity: 1.25 });
    const plain = mat(null), body = new THREE.Mesh(new THREE.BoxGeometry(W, BH, D), [mat(side), mat(side), plain, plain, mat(front), mat(front)]);   // +x -x +y -y +z -z
    const roof = new THREE.Mesh(cartonGeo(W, D, RISE), plain); roof.position.y = BH / 2;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(W * .94, .09, .07), mat(side)); fin.position.y = BH / 2 + RISE + .03;   // the sealed top fin
    const carton = new THREE.Group(); carton.add(body, roof, fin); carton.position.y = -1.1 + BH / 2; carton.rotation.z = .05; p.add(carton);
    p.rotation.x = .1; return r;
  },
  pearl: () => {
    const [r, p] = ingRoot(), R = .44;
    const outer = new THREE.MeshPhysicalMaterial({ color: lin('#120805'), roughness: .1, clearcoat: 1, clearcoatRoughness: .03, sheen: 1, sheenColor: new THREE.Color('#d9822b'), sheenRoughness: .35, envMapIntensity: 2.2, transparent: true, opacity: .84, depthWrite: false, bumpMap: noiseTex(), bumpScale: .02 });
    const inner = new THREE.MeshStandardMaterial({ color: lin('#2a1208'), emissive: new THREE.Color('#a85a1a'), emissiveIntensity: .75, roughness: .4 });
    const syrup = new THREE.MeshPhysicalMaterial({ color: 0xd9822b, transparent: true, opacity: .75, roughness: .02, clearcoat: 1, envMapIntensity: 2.4, depthWrite: false });
    const spots = []; for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283 + .3; spots.push([Math.cos(a) * .62, -.7, Math.sin(a) * .62]); }
    for (let i = 0; i < 3; i++) { const a = i / 3 * 6.283 + .9; spots.push([Math.cos(a) * .34, -.05, Math.sin(a) * .34]); } spots.push([0, .56, 0]);
    spots.forEach(([x, y, z], i) => {
      const core = new THREE.Mesh(new THREE.SphereGeometry(R * .6, 24, 16), inner), shell = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 28), outer);
      core.position.set(x + R * .08, y - R * .08, z); shell.position.set(x, y, z); core.renderOrder = 1; shell.renderOrder = 2; core.rotation.y = shell.rotation.y = i; p.add(core, shell);
    });
    const drizzle = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), syrup); drizzle.scale.set(.32, .09, .32); drizzle.position.set(0, .56 + R * .93, 0); drizzle.renderOrder = 3; p.add(drizzle);   // caramel syrup on top
    const drip = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), syrup); drip.scale.set(.07, .16, .07); drip.position.set(.17, .56 + R * .62, .2); drip.renderOrder = 3; p.add(drip);
    p.rotation.x = .12; return r;
  },
  ice: () => {
    const [r, p] = ingRoot();
    const frost = new THREE.MeshPhysicalMaterial({ color: 0xbfdcee, transparent: true, opacity: .26, roughness: .3, clearcoat: 1, clearcoatRoughness: .15, ior: 1.31, envMapIntensity: 2.2, bumpMap: noiseTex(), bumpScale: .5, depthWrite: false });
    const clear = new THREE.MeshPhysicalMaterial({ color: 0x8fb6d0, transparent: true, opacity: .3, roughness: .04, clearcoat: 1, envMapIntensity: 2.6, depthWrite: false });
    const cube = new THREE.Mesh(bevelBox(1.45, .17, 14), frost); cube.renderOrder = 3;
    const core = new THREE.Mesh(bevelBox(.95, .12, 10), clear); core.rotation.set(.35, .5, .2); core.position.set(.08, -.04, .05); core.renderOrder = 2;
    const air = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .8, roughness: 0, clearcoat: 1, envMapIntensity: 3 }), 46), d = new THREE.Object3D();
    for (let i = 0; i < 46; i++) { const s = .014 + Math.random() * .04; d.position.set((Math.random() - .5) * 1.1, (Math.random() - .5) * 1.1, (Math.random() - .5) * 1.1); d.scale.set(s, s * (1 + Math.random() * .6), s); d.updateMatrix(); air.setMatrixAt(i, d.matrix); }   // tiny trapped air bubbles
    const fr = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .1, side: THREE.DoubleSide, depthWrite: false });
    const cracks = [0, 1, 2].map(i => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.8, .6), fr); m.position.set((i - 1) * .22, (1 - i) * .12, (i - 1) * .1); m.rotation.set(i * 1.1, i * .7 + .4, i * .5); return m; });   // internal fractures catch the light
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(bevelBox(1.452, .17, 2), 25), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .85 }));   // crisp crystal edges
    const shade = new THREE.Mesh(bevelBox(1.2, .15, 6), new THREE.MeshBasicMaterial({ color: 0x7ea3bd, transparent: true, opacity: .14, depthWrite: false })); shade.renderOrder = 1;
    p.add(shade, cube, core, air, edges, ...cracks); p.rotation.set(.45, 0, .22); p.position.y = -.05; return r;
  },
  leaf: () => {
    const [r, p] = ingRoot(), map = leafTex(), geo = leafGeo();
    const mat = new THREE.MeshPhysicalMaterial({ map, bumpMap: map, bumpScale: 1.4, roughness: .42, side: THREE.DoubleSide, sheen: .7, sheenColor: new THREE.Color('#bfe58a'), sheenRoughness: .5, envMapIntensity: 1.2 });
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * 6.283, g1 = new THREE.Group(), g2 = new THREE.Group(), m = new THREE.Mesh(geo, mat), sc = .8 + (i % 3) * .12;
      m.scale.setScalar(sc); m.position.y = 1.05 * sc; g2.rotation.set(.5 + (i % 2) * .25, 0, (i % 3 - 1) * .12); g2.add(m); g1.rotation.y = a; g1.position.y = -.85; g1.add(g2); p.add(g1);
    }
    return r;
  },
  sugar: () => {
    const [r, p] = ingRoot(), map = sugarTex(), mat = new THREE.MeshStandardMaterial({ map, bumpMap: map, bumpScale: 1.6, roughness: .85, color: 0xffffff });
    const cubes = [[-.3, -.82, 0, .1, .25], [.34, -.84, .12, -.2, -.12], [0, -.12, .02, .5, .1]];
    cubes.forEach(([x, y, z, ry, rz]) => { const c = new THREE.Mesh(bevelBox(.74, .07, 10), mat); c.position.set(x, y, z); c.rotation.set(.05, ry, rz); p.add(c); });
    const gr = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ roughness: .7 }), 300), d = new THREE.Object3D(), col = new THREE.Color();
    for (let i = 0; i < 300; i++) {                                                   // loose granules heaped at the base
      const rr = .95 * Math.sqrt(Math.random()), a = Math.random() * 6.283, s = .03 + Math.random() * .035;
      d.position.set(Math.cos(a) * rr, -1.15 + (1 - rr / .95) * .3 * Math.random() + s, Math.sin(a) * rr); d.rotation.set(Math.random() * 3, Math.random() * 3, 0); d.scale.set(s, s * .8, s); d.updateMatrix(); gr.setMatrixAt(i, d.matrix);
      gr.setColorAt(i, col.setHSL(.075 + Math.random() * .02, .55 + Math.random() * .2, .28 + Math.random() * .2));
    }
    p.add(gr); p.rotation.x = .1; return r;
  }
};
const mkIng = c => {
  if (c.stage) return;
  const S = stage(c, ING[c.dataset.ing], {
    cy: .3, cz: 5.7, ly: 0, spin: RM ? 0 : Math.PI * 2 / 8, hoverBoost: 1.3, host: c.closest('.card'),      // one full turn every 8s, ~2.3x faster on hover
    tick: (t, o, S) => { o.userData.pivot.rotation.y = S.yaw; o.position.y = Math.sin(t * 1.5) * .05 * (.5 + S.hovS) + S.hovS * .05; if (o.userData.update) o.userData.update(t); }
  });
  c.stage = S;
};
{ /* the ingredient models are built lazily, a little before they scroll into view, so the home page does not pay for five extra WebGL scenes up front */
  const cs = $$('canvas[data-ing]');
  if (cs.length) {
    const lazy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { lazy.unobserve(e.target); mkIng(e.target); } }), { rootMargin: '80% 80% 80% 80%' });
    cs.forEach(c => lazy.observe(c));
  }
}
const storyEl = $('#story');
if (storyEl) {                                                              // home "Story & Ingredients": the cards rise in whenever the section is on screen
  const cards = $$('.pop-s', storyEl);
  new IntersectionObserver(es => es.forEach(e => {
    const on = e.intersectionRatio >= .4 || e.intersectionRect.height >= innerHeight * .5;
    cards.forEach(c => c.classList.toggle('in', on));
  }), { threshold: [0, .2, .4, .6, .8, 1] }).observe(storyEl);
}

/* ---------- Contact: mailto form + social cards (Demo test mode) ---------- */
const DEMO = false;                       // test mode: nothing navigates away or opens an external app. Set to false for live mailto + links.
const DEMO_MSG = 'Demo Mode: Action simulated successfully!';   // social links / footer mail link in demo mode
const MSG = {                                                                              // what "Send Message" confirms, by form type and fulfilment
  pickup: 'Your order will be ready in 10 minutes.',
  delivery: 'Your delivery order will be arrived at your doorstep in 20-30 minutes.',
  other: 'Thank you for your message'
};
function toast(msg) {
  $$('.toast').forEach(t => t.remove());
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite');
  document.body.append(t);
  requestAnimationFrame(() => { t.textContent = msg; t.classList.add('show'); });          // text arrives after the live region exists, so screen readers announce it
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 450); }, Math.max(2800, 1500 + msg.length * 45));   // longer messages stay up long enough to read
}
$$('.social, .foot a[href^="mailto:"]').forEach(a => {
  a.addEventListener('click', e => { if (DEMO) { e.preventDefault(); toast(DEMO_MSG); } });
  a.addEventListener('auxclick', e => { if (DEMO) e.preventDefault(); });
});
const form = $('#mailform');
if (form) {
  const sel = form.topic, box = $('#orderFields'), card = $('fieldset', box), ORDER = 'Order or catering';
  const MAX_QTY = 20, FEE = 250;                                                         // per-drink cap; delivery fee in cents (S$2.50)
  const money = c => 'S$' + (c / 100).toFixed(2);
  const keys = Object.keys(DRINKS), cents = k => Math.round(DRINKS[k].p * 100);          // prices come from the same DRINKS data as the menu
  const SUGARS = $$('#sugarAll input[name="sugar"]').map(i => i.value);                  // the five sugar options stay defined in the markup; per-drink selectors reuse them verbatim
  const S = { qty: {}, sugarMode: 'each', groups: {}, fulfil: 'pickup', notesMode: 'each', notesAll: '' };              // order state: quantity per item + chosen options
  const msgBox = $('#msgBox'), sugarAll = $('#sugarAll'), sugarEach = $('#sugarEach'), addrBox = $('#addrBox'), list = $('#itemList'), err = $('#itemsErr');
  const tSub = $('#tSub'), tFeeLbl = $('#tFeeLbl'), tFee = $('#tFee'), tTotal = $('#tTotal');
  $('#feeTag').textContent = '+' + money(FEE);
  const reveal = (el, open) => {                                                         // collapse a block AND take its fields out of validation / submission
    el.classList.toggle('is-closed', !open); el.inert = !open;
    $$('input,textarea,select', el).forEach(c => c.disabled = !open);
  };

  /* --- items: one row per drink with a [-] qty [+] stepper --- */
  const rows = {};
  keys.forEach(k => {
    const n = DRINKS[k].n;
    const pic = DRINKS[k].images[0];
    list.insertAdjacentHTML('beforeend', `<li class="item" data-k="${k}"><div class="item-row"><button class="item-pic" type="button" data-view aria-label="View ${n} larger" aria-haspopup="dialog"><img src="${pic.src.replace('images/', 'images/thumb/')}" alt="" width="72" height="72" loading="lazy" decoding="async"><svg class="item-zoom" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5M10.5 8v5M8 10.5h5"/></svg></button><div class="item-info"><b>${n}</b><small>${money(cents(k))} each</small></div>
<div class="stepper" role="group" aria-label="Quantity of ${n}"><button class="step" type="button" data-d="-1" aria-label="Remove one ${n}" aria-disabled="true">&minus;</button><input class="qty" name="qty_${k}" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" role="spinbutton" aria-label="${n} quantity" aria-valuemin="0" aria-valuemax="${MAX_QTY}" aria-valuenow="0" autocomplete="off" value="0"><button class="step" type="button" data-d="1" aria-label="Add one ${n}">+</button></div><output class="line"></output></div>
<div class="item-opts reveal is-closed" inert><div class="reveal-inner"><div class="opts-body">
<div class="opt-groups"></div>
<button class="grp-add" type="button" hidden></button>
</div></div></div></li>`);
    const li = list.lastElementChild; S.qty[k] = 0;
    rows[k] = { li, qty: $('.qty', li), minus: $('[data-d="-1"]', li), plus: $('[data-d="1"]', li), line: $('.line', li),
      opts: $('.item-opts', li), groups: $('.opt-groups', li), add: $('.grp-add', li) };
  });
  /* --- click a drink's picture to view it full size (Esc, the close button or a click outside closes it) --- */
  const imgBox = document.createElement('dialog');
  imgBox.className = 'imgbox'; imgBox.setAttribute('aria-label', 'Drink photo');
  imgBox.innerHTML = '<figure class="imgbox-fig"><img class="imgbox-img" alt=""><figcaption class="imgbox-cap"></figcaption></figure><button class="imgbox-x" type="button" aria-label="Close photo"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>';
  document.body.appendChild(imgBox);
  const boxImg = $('.imgbox-img', imgBox), boxCap = $('.imgbox-cap', imgBox);
  let boxFrom = null;
  const closeBox = () => {
    if (!imgBox.open || imgBox.classList.contains('closing')) return;
    imgBox.classList.add('closing');
    const done = () => { imgBox.classList.remove('closing'); imgBox.close(); };
    const card = $('.imgbox-fig', imgBox); let fin = false;
    const once = () => { if (!fin) { fin = true; done(); } };
    card.addEventListener('animationend', once, { once: true }); setTimeout(once, 400);          // (the timeout covers reduced motion, where no animation runs)
  };
  list.addEventListener('click', e => {
    const b = e.target.closest('.item-pic'); if (!b) return;
    const k = rowKey(b), d = DRINKS[k], m = d.images[0];
    boxFrom = b; boxImg.src = m.src; boxImg.alt = m.alt || d.n;
    boxCap.innerHTML = `<b>${d.n}</b><span>${money(cents(k))} each</span>`;
    imgBox.showModal();
  });
  $('.imgbox-x', imgBox).addEventListener('click', closeBox);
  imgBox.addEventListener('click', e => { if (!e.target.closest('.imgbox-img, .imgbox-cap, .imgbox-x')) closeBox(); });   // a click on the dark area outside the photo
  imgBox.addEventListener('cancel', e => { e.preventDefault(); closeBox(); });                                              // Esc
  imgBox.addEventListener('close', () => { if (boxFrom) boxFrom.focus({ preventScroll: true }); boxFrom = null; });
  const firstQty = rows[keys[0]].qty;                                                    // carries the "add at least one drink" validation message

  /* --- cup groups: under each ordered drink, cups are split into groups that share one sugar level ("3 x 50% sugar", "1 x 75% sugar"), and every cup has its OWN Allergies / Special Instructions box (Cup 1 blank, Cup 2 "add pudding").
         The group sizes always add up to the drink's quantity, so there is never a cup without a setting. Cups are numbered 1..N across the groups of one drink; notes travel with their cup --- */
  const esc = v => String(v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const NOTE_PH = 'Leave blank if none (e.g., add pudding)';
  const notesAll = $('#notesAll'), notesEach = $('#notesEach');
  const syncGroups = k => {                                                              // keep the groups consistent with the quantity (a + / - on the drink card)
    const n = S.qty[k], g = S.groups[k] = S.groups[k] || [];
    if (!n) { S.groups[k] = []; return; }
    if (!g.length) g.push({ n, sugar: '', notes: [] });
    let sum = g.reduce((a, x) => a + x.n, 0);
    if (sum < n) g[g.length - 1].n += n - sum;                                            // extra cups join the last group
    while (sum > n) { const l = g[g.length - 1], cut = Math.min(l.n, sum - n); l.n -= cut; sum -= cut; if (!l.n) g.pop(); }
    g.forEach(x => { x.notes = x.notes || []; while (x.notes.length < x.n) x.notes.push(''); x.notes.length = x.n; });   // one note per cup: new cups start blank, removed cups take their note with them
  };
  const cupsOf = k => S.groups[k].reduce((a, x) => a.concat(x.notes), []);               // every cup's note of one drink, in cup order (Cup 1, Cup 2, ...)
  const cupAt = (k, c) => { for (const x of S.groups[k]) { if (c < x.n) return [x, c]; c -= x.n; } return []; };   // global cup index -> [its group, index inside the group]
  const sugarShort = v => (/^(\d+%)/.exec(v) || [])[1] || v;
  const sugarTile = v => { const m = /^(\d+%)\s*\((.*)\)$/.exec(v); return m ? `<b>${m[1]}</b><small>${esc(m[2])}</small>` : esc(v); };   // "50% (Half sugar)" -> big 50% + small "Half sugar"; the submitted value is unchanged
  const titleHTML = (g, sEach, nEach) => {                                               // a live one-line summary of the group: "3 cups · 50% sugar · with note"
    const bits = [g.n === 1 ? '1 cup' : g.n + ' cups'];
    if (sEach) bits.push(g.sugar ? `<span class="grp-pick">${sugarShort(g.sugar)} sugar</span>` : '<span class="grp-pick todo">choose sugar</span>');
    const nn = nEach ? g.notes.filter(t => t.trim()).length : 0;
    if (nn) bits.push(`<span class="grp-pick">${nn === 1 ? '1 note' : nn + ' notes'}</span>`);
    return bits.join('<span class="grp-sep" aria-hidden="true"> &middot; </span>');
  };
  const near = (len, i) => { const o = []; for (let d = 1; d < len; d++) { if (i + d < len) o.push(i + d); if (i - d >= 0) o.push(i - d); } return o; };   // other groups, nearest first (the next one before the previous one)
  const donorOf = (g, i) => near(g.length, i).find(j => g[j].n > 1);                    // a group that can spare a cup (it always keeps at least one)
  const groupHTML = (k, g, gi, total, sEach, nEach, base, flat) => {                    // base = how many cups come before this group; flat = sugar is "same for all", so the cups are listed as one block
    const multi = total > 1, grs = S.groups[k], many = !flat && grs.length > 1, id = `grp_${k}_${gi}`, nm = esc(DRINKS[k].n);
    const canMinus = many && g.n > 1, canPlus = many && donorOf(grs, gi) !== undefined;
    const head = multi ? `<div class="grp-head"><span class="grp-title" id="${id}">${titleHTML(g, sEach, nEach)}</span>${many ? `<div class="grp-ctl"><div class="stepper grp-step" role="group" aria-label="How many ${nm} cups use this setting"><button class="gs" type="button" data-g="${gi}" data-gd="-1" aria-label="One fewer cup in this group (it moves to the next group)" aria-disabled="${!canMinus}">&minus;</button><output class="grp-x" aria-live="polite">&times;&thinsp;${g.n}</output><button class="gs" type="button" data-g="${gi}" data-gd="1" aria-label="One more cup in this group (taken from another group)" aria-disabled="${!canPlus}">+</button></div><button class="grp-del" type="button" data-g="${gi}" aria-label="Remove this group: its ${g.n === 1 ? 'cup goes' : g.n + ' cups go'} back to another group" title="Remove this group"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>` : ''}</div>` : '';
    const sugar = sEach ? `<div class="opt-sugar"><span class="opt-lbl">Sugar Level <span class="req" aria-hidden="true">*</span></span><div class="chips tiles" role="radiogroup" ${multi ? `aria-labelledby="${id}"` : `aria-label="Sugar level for ${nm}"`}>${SUGARS.map(v => `<label class="chip"><input type="radio" name="sugar_${k}_${gi}" value="${v}" required${v === g.sugar ? ' checked' : ''}><span>${sugarTile(v)}</span></label>`).join('')}</div><p class="grp-need" role="alert">Please choose a sugar level${multi ? ' for these cups' : ''}.</p></div>` : '';
    const note = nEach ? `<div class="opt-note" role="group" aria-label="Allergies / Special Instructions for ${nm}"><span class="opt-lbl">Allergies / Special Instructions <span class="opt">(optional${multi ? ', one box per cup' : ''})</span></span><div class="cup-notes">${g.notes.map((t, ci) => { const c = base + ci; return `<label class="cup-note">${multi ? `<span class="cup-tag">Cup ${c + 1}</span>` : ''}<input name="note_${k}_${c}" data-c="${c}" maxlength="160" autocomplete="off" placeholder="${NOTE_PH}" aria-label="Allergies / Special Instructions for ${multi ? 'cup ' + (c + 1) + ' of ' : ''}${nm}" value="${esc(t)}"></label>`; }).join('')}</div></div>` : '';
    const fresh = g.fresh; delete g.fresh;
    return `<div class="grp${multi ? ' multi' : ''}${fresh ? ' fresh' : ''}">${head}${sugar}${note}</div>`;
  };
  const renderOpts = k => {
    const r = rows[k], n = S.qty[k], sEach = S.sugarMode === 'each', nEach = S.notesMode === 'each', open = n > 0 && (sEach || nEach);
    syncGroups(k);
    const g = S.groups[k];
    const flat = !sEach;                                                                  // sugar is the same for every drink: no sugar groups, just Cup 1..N note boxes
    const view = flat ? [{ n, sugar: '', notes: cupsOf(k) }] : g;
    let base = 0;
    r.groups.innerHTML = open ? view.map((x, i) => { const h = groupHTML(k, x, i, n, sEach, nEach, base, flat); base += x.n; return h; }).join('') : '';
    const more = g.some(x => x.n > 1);                                                    // a new group needs a cup to take from
    r.add.hidden = !(open && n > 1 && sEach);                                             // sugar groups only exist when sugar is chosen per drink
    r.add.textContent = '+ Different sugar level for some cups';
    r.add.setAttribute('aria-disabled', String(!more)); r.add.title = more ? '' : 'Every cup already has its own setting';
    reveal(r.opts, open);                                                                // collapses the panel AND takes its fields out of validation / submission
  };
  const refreshTitle = (k, gi) => {                                                      // keep a group's one-line summary live while the customer picks or types (no rebuild)
    const t = rows[k].groups.querySelectorAll('.grp')[gi], g = S.groups[k][gi], el = t && t.querySelector('.grp-title');
    if (el && g) el.innerHTML = titleHTML(g, S.sugarMode === 'each', S.notesMode === 'each');
  };
  const refreshTitles = k => { if (S.sugarMode === 'each') S.groups[k].forEach((_, i) => refreshTitle(k, i)); else { const t = rows[k].groups.querySelector('.grp-title'); if (t) t.innerHTML = titleHTML({ n: S.qty[k], sugar: '', notes: cupsOf(k) }, false, S.notesMode === 'each'); } };
  /* moving cups between groups: + takes a cup from the nearest group that can spare one, - gives one to the nearest group; every group always keeps at least 1 cup */
  const moveCup = (k, i, d) => {
    const g = S.groups[k]; if (g.length < 2) return;
    if (d > 0) {                                                                         // a cup (with its note) crosses the border between the two groups, so cups keep their order
      const j = donorOf(g, i); if (j === undefined) return;
      if (j > i) g[i].notes.push(g[j].notes.shift()); else g[i].notes.unshift(g[j].notes.pop());
      g[j].n--; g[i].n++;
    } else {
      if (g[i].n <= 1) return; const j = near(g.length, i)[0];
      if (j > i) g[j].notes.unshift(g[i].notes.pop()); else g[j].notes.push(g[i].notes.shift());
      g[j].n++; g[i].n--;
    }
  };
  const removeGroup = (k, i) => { const g = S.groups[k]; if (g.length < 2) return; const j = i > 0 ? i - 1 : 1; if (j < i) g[j].notes.push(...g[i].notes); else g[j].notes.unshift(...g[i].notes); g[j].n += g[i].n; g.splice(i, 1); };     // its cups go back to the group before it
  const splitOff = k => {                                                                 // "+ Different sugar level for some cups": the last cup of the biggest group starts a fresh group (its note goes with it; sugar must be chosen on purpose)
    const g = S.groups[k]; let bi = -1;
    g.forEach((x, i) => { if (x.n > 1 && (bi < 0 || x.n > g[bi].n)) bi = i; });
    if (bi < 0) return;
    g[bi].n--; g.splice(bi + 1, 0, { n: 1, sugar: '', notes: [g[bi].notes.pop()], fresh: true });
  };
  const renderAllOpts = () => keys.forEach(renderOpts);

  /* --- live total --- */
  const update = () => {
    const sub = keys.reduce((a, k) => a + S.qty[k] * cents(k), 0), cups = keys.reduce((a, k) => a + S.qty[k], 0), fee = S.fulfil === 'delivery' ? FEE : 0;
    tSub.textContent = money(sub); tFeeLbl.textContent = fee ? 'Delivery fee' : 'Self-collection'; tFee.textContent = fee ? money(fee) : 'Free';
    const t = money(sub + fee);
    if (tTotal.textContent !== t) { tTotal.textContent = t; tTotal.classList.remove('bump'); void tTotal.offsetWidth; tTotal.classList.add('bump'); }
    firstQty.setCustomValidity(cups ? '' : 'Add at least one drink to your order.'); if (cups) err.hidden = true;
  };
  const setQty = (k, v, typing) => {
    v = Math.max(0, Math.min(MAX_QTY, Number.isFinite(+v) ? Math.trunc(+v) : 0)); S.qty[k] = v;
    const r = rows[k]; if (!typing) r.qty.value = v;                                     // while typing, leave the field alone (an empty box must stay empty)
    r.qty.setAttribute('aria-valuenow', v);
    r.minus.setAttribute('aria-disabled', String(v <= 0)); r.plus.setAttribute('aria-disabled', String(v >= MAX_QTY));   // aria-disabled (not disabled) so keyboard focus survives hitting 0 or the cap
    r.li.classList.toggle('has', v > 0); r.line.textContent = v ? money(v * cents(k)) : '';
    renderOpts(k);
    update();
  };
  const rowKey = el => el.closest('.item').dataset.k;
  list.addEventListener('click', e => {                                                  // cup groups: x-multiplier steppers, remove, and "+ Different sugar level for some cups"
    const b = e.target.closest('.gs, .grp-del, .grp-add'); if (!b || b.getAttribute('aria-disabled') === 'true') return;
    const k = rowKey(b), r = rows[k], gi = +b.dataset.g;
    if (b.classList.contains('grp-add')) splitOff(k); else if (b.classList.contains('grp-del')) removeGroup(k, gi); else moveCup(k, gi, +b.dataset.gd);
    renderOpts(k);
    const again = b.classList.contains('gs') ? r.groups.querySelector(`.gs[data-g="${gi}"][data-gd="${b.dataset.gd}"]`) : r.add;   // the panel was rebuilt: put keyboard focus back where it was
    if (again && !again.hidden) again.focus({ preventScroll: true });
    const fresh = r.groups.querySelector('.grp.fresh'); if (fresh) fresh.scrollIntoView({ block: 'nearest', behavior: RM ? 'auto' : 'smooth' });   // a new group scrolls into view
  });
  list.addEventListener('input', e => {                                                  // remember each cup's note so a rebuild never loses it
    const t = e.target; if (!t.matches || !t.matches('.cup-note input')) return;
    const k = rowKey(t), [x, i] = cupAt(k, +t.dataset.c); if (x) { x.notes[i] = t.value; refreshTitles(k); }
  });
  list.addEventListener('click', e => { const b = e.target.closest('.step'); if (b && b.getAttribute('aria-disabled') !== 'true') setQty(rowKey(b), S.qty[rowKey(b)] + +b.dataset.d); });
  list.addEventListener('input', e => {                                                  // digits only, clamped as you type (99 -> 20, 007 -> 7); an empty box stays empty until blur
    const q = e.target.closest('.qty'); if (!q) return;
    let d = q.value.replace(/\D/g, ''); if (d !== '') d = String(Math.min(MAX_QTY, +d));
    if (d !== q.value) q.value = d; setQty(rowKey(q), d, true);
  });
  list.addEventListener('change', e => { const q = e.target.closest('.qty'); if (q) q.value = S.qty[rowKey(q)]; });   // tidy '' / '007' on blur
  list.addEventListener('keydown', e => { const q = e.target.closest('.qty'); if (q && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); setQty(rowKey(q), S.qty[rowKey(q)] + (e.key === 'ArrowUp' ? 1 : -1)); } });
  firstQty.addEventListener('invalid', () => { err.hidden = false; });

  /* --- option toggles --- */
  form.addEventListener('change', e => {
    const t = e.target;
    if (t.name === 'sugar_mode') {                                                       // uniform (one selector) vs separate (one per drink)
      S.sugarMode = t.value; renderAllOpts();
      reveal(sugarAll, t.value !== 'each'); reveal(sugarEach, t.value === 'each');
    } else if (t.name === 'notes_mode') {                                                // one shared note vs one labelled note per drink
      S.notesMode = t.value; renderAllOpts();
      reveal(notesAll, t.value === 'all'); reveal(notesEach, t.value === 'each');
    } else if (t.name === 'fulfilment') {                                                // pickup: free, no address / delivery: + fee, address required
      S.fulfil = t.value; reveal(addrBox, t.value === 'delivery'); update();
    } else {
      const m = /^sugar_([a-z]+)_(\d+)$/.exec(t.name); if (m && S.groups[m[1]] && S.groups[m[1]][+m[2]]) { S.groups[m[1]][+m[2]].sugar = t.value; refreshTitle(m[1], +m[2]); const grp = t.closest('.grp'); if (grp) grp.classList.remove('need'); }
    }
  });
  form.addEventListener('input', e => {                                                  // remember typed notes so a rebuild never loses them
    const t = e.target; if (t.name === 'notes') S.notesAll = t.value;
  });
  form.addEventListener('invalid', e => { const t = e.target; if (t.matches && t.matches('.grp input[type=radio]')) t.closest('.grp').classList.add('need'); }, true);   // a group with no sugar level lights up instead of only a tooltip
  const syncOptions = () => { reveal(notesAll, S.notesMode === 'all'); reveal(notesEach, S.notesMode === 'each'); reveal(sugarAll, S.sugarMode === 'all'); reveal(sugarEach, S.sugarMode === 'each'); reveal(addrBox, S.fulfil === 'delivery'); update(); };
  const syncOrder = () => {                                                              // order fields exist (and validate) only for the Order topic
    const open = sel.value === ORDER;
    box.classList.toggle('open', open); card.disabled = !open; box.inert = !open; box.setAttribute('aria-hidden', String(!open));
    reveal(msgBox, !open);                                                               // the order card replaces the free-text Message; every other topic keeps it
  };
  sel.addEventListener('change', syncOrder);
  form.addEventListener('reset', () => setTimeout(() => {                                // runs after the browser has cleared the controls
    S.sugarMode = 'each'; S.fulfil = 'pickup'; S.groups = {}; S.notesMode = 'each'; S.notesAll = ''; keys.forEach(k => setQty(k, 0)); err.hidden = true; syncOptions(); syncOrder();
  }, 0));
  const dk = new URLSearchParams(location.search).get('drink'), dkey = keys.find(k => DRINKS[k].n === dk);
  if (dk) sel.value = ORDER;                                                             // arriving from a menu "Order" button opens the order card with that drink x1
  if (dkey) setQty(dkey, 1);
  const qp = new URLSearchParams(location.search), bits = [qp.get('ice'), qp.get('top')].filter(Boolean);   // ice / toppings picked in the menu's Customise window become that drink's note
  if (dkey && bits.length) S.groups[dkey][0].notes[0] = bits.join('; ');
  renderAllOpts(); syncOptions(); syncOrder();

  /* --- map lock: the map keeps the spot it has when the form is in its base state (Message box open, order block closed),
         however tall the order form grows, so switching Order / Catering / General never makes it drop, drift or change height --- */
  const split = $('.contact-split'), mapPanel = split && split.querySelector(':scope > .panel'), col = form.parentElement;
  if (split && mapPanel) {
    const wide = matchMedia('(min-width: 861px)'), px = v => parseFloat(v) || 0;
    const share = el => { const cs = getComputedStyle(el); return el.getBoundingClientRect().height + px(cs.marginTop) + px(cs.marginBottom) + px(getComputedStyle(form).rowGap); };   // what one form row currently adds to the column's height
    const lockMap = () => {
      split.classList.toggle('map-locked', wide.matches);
      if (!wide.matches) return;                                                           // stacked on phones: the map simply follows the form
      const gap = px(getComputedStyle(form).rowGap), msgH = msgBox.querySelector('label').getBoundingClientRect().height;
      const base = col.getBoundingClientRect().height - share(box) - share(msgBox) + msgH + gap;   // column height with the order block closed and the Message box open, whatever mode it is in right now
      const off = Math.max(32, Math.round((base - mapPanel.getBoundingClientRect().height) * 10) / 10);   // map bottom == base form bottom; never closer than 2rem to the heading
      if (Math.abs(off - px(split.style.getPropertyValue('--map-lock'))) > .4) split.style.setProperty('--map-lock', off + 'px');
    };
    lockMap(); addEventListener('resize', lockMap); wide.addEventListener('change', lockMap);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(lockMap);
    addEventListener('load', lockMap);
    if ('ResizeObserver' in window) { const ro = new ResizeObserver(lockMap); ro.observe(col); ro.observe(mapPanel); }
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const msg = sel.value === ORDER ? (S.fulfil === 'delivery' ? MSG.delivery : MSG.pickup) : MSG.other;   // Order / Catering follows the chosen fulfilment; every other topic just says thanks
    if (DEMO) { toast(msg); form.reset(); return; }
    const f = new FormData(form), order = f.get('topic') === ORDER;
    let extra = '';
    if (order) {
      const each = S.sugarMode === 'each', picked = keys.filter(k => S.qty[k]);
      const sub = picked.reduce((a, k) => a + S.qty[k] * cents(k), 0), fee = S.fulfil === 'delivery' ? FEE : 0;
      const eachN = S.notesMode === 'each';
      const cupLines = k => { let c = 0; return S.groups[k].map(g => g.notes.map(t => { c++; return `\n   - Cup ${c}` + [each ? `Sugar ${g.sugar}` : '', eachN ? `Note: ${t.trim() || 'None'}` : ''].filter(Boolean).map(x => ' | ' + x).join(''); }).join('')).join(''); };   // "Cup 1 | Sugar 50% (Half sugar) | Note: None"
      const items = picked.map(k => `${S.qty[k]}x ${DRINKS[k].n} (${money(S.qty[k] * cents(k))})` + (each || eachN ? cupLines(k) : '')).join('\n');
      const notesTxt = eachN ? '' : `Allergies / special instructions (all drinks): ${f.get('notes') || 'None'}\n`;
      extra = `\nOrder details:\n${items}\n${each ? '' : `Sugar level (all drinks): ${f.get('sugar')}\n`}Fulfilment: ${fee ? 'Delivery to ' + f.get('address') : 'Self-collection (pickup)'}\nSubtotal: ${money(sub)}\n${fee ? `Delivery fee: ${money(fee)}\n` : ''}Total: ${money(sub + fee)}\n${notesTxt}`;
    }
    const body = `Hello Boba Crave Co.,\n\nName: ${f.get('name')}\nEmail: ${f.get('email')}\nTopic: ${f.get('topic')}\n${extra}${order ? '' : `\nMessage:\n${f.get('message')}\n`}\nSent from the Boba Crave Co. contact form`;
    location.href = `mailto:contact@bobacraveco.com?subject=${encodeURIComponent('Boba Crave Co. inquiry: ' + f.get('topic'))}&body=${encodeURIComponent(body)}`;
    toast(msg);
    form.reset();                                                                      // message sent: back to the default form (empty fields, Topic placeholder, order block closed)
    setTimeout(() => { const top = split ? split.getBoundingClientRect().top + scrollY - 110 : 0; if (scrollY > top) scrollTo({ top: Math.max(0, top), behavior: RM ? 'auto' : 'smooth' }); }, 80);   // bring the fresh form back into view
  });
}

/* ---------- home: words rise out of a mask (hero headline on load, section headings as they scroll into view) ---------- */
(() => {
  const els = $$('[data-words]'); if (!els.length) return;
  els.forEach(h => {
    const text = h.textContent.trim().replace(/\s+/g, ' ');
    h.setAttribute('aria-label', text);                                                  // screen readers get the whole heading at once
    h.innerHTML = text.split(' ').map((w, i) => `<span class="w" aria-hidden="true"><span style="--wi:${i}">${w}</span></span>`).join(' ');
    h.classList.add('words-ready');
  });
  const show = h => h.classList.add('words-in');
  if (RM || !('IntersectionObserver' in window)) { els.forEach(show); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }), { threshold: .35 });
  els.forEach(h => io.observe(h));
  setTimeout(() => els.forEach(show), 6000);                                            // safety net: nothing stays hidden
})();
