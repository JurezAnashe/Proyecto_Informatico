/* Popicasino: programa único (sesión, saldo, menús y vistas de cada sección).
   BASE: los datos viven en localStorage; luego se reemplaza por un backend. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => new Intl.NumberFormat('es-AR', {style:'currency', currency:'ARS', maximumFractionDigits:0}).format(n);
const rd = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } };
const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

/* ---------- Cuenta y sesión ---------- */
const usuarios = () => rd('popi_users', []);
const sesion = () => { const m = rd('popi_sesion', null); return usuarios().find(u => u.mail === m) || null; };
const guardar = u => wr('popi_users', usuarios().map(x => x.mail === u.mail ? u : x));
const mover = (u, txt, monto) => { u.saldo += monto; u.mov.unshift({txt, monto, f: new Date().toISOString()}); u.mov = u.mov.slice(0, 40); guardar(u); };
window.Popi = {
  registrar(d) {
    const l = usuarios();
    if (l.some(u => u.mail === d.mail.toLowerCase())) return false;
    l.push({...d, mail: d.mail.toLowerCase(), saldo: 0, mov: []});
    wr('popi_users', l); wr('popi_sesion', d.mail.toLowerCase()); return true;
  },
  entrar(mail, pass) {
    const u = usuarios().find(x => x.mail === mail.toLowerCase() && x.pass === pass);
    if (u) wr('popi_sesion', u.mail); return !!u;
  },
  salir() { localStorage.removeItem('popi_sesion'); location.href = 'Popicasino.html'; }
};

/* ---------- Catálogo de ejemplo (sin juegos todavía) ---------- */
const g = (n, c, desc, min, max, info, h) => ({n, c, desc, min, max, info, h});
const JUEGOS = {
  slots: {titulo:'Slots', desc:'Tragamonedas con rodillos, bonus y jackpots.', filtros:['Todos','Clásicas','Video slots','Jackpot'], items:[
    g('Gallo de Oro','Clásicas','Cinco rodillos, símbolos de campo y giros gratis.',50,5000,[['Retorno (RTP)','96,2%'],['Volatilidad','Media'],['Rodillos','5 x 3'],['Premio máximo','x5.000']],42),
    g('Pampa Fortune','Video slots','Bonus de caballos con multiplicadores crecientes.',50,5000,[['Retorno (RTP)','95,8%'],['Volatilidad','Alta'],['Rodillos','5 x 4'],['Premio máximo','x10.000']],95),
    g('Tango Reels','Clásicas','Tres rodillos con símbolos de la vieja confitería.',20,2000,[['Retorno (RTP)','96,5%'],['Volatilidad','Baja'],['Rodillos','3 x 3'],['Premio máximo','x800']],8),
    g('Mega Popi','Jackpot','Jackpot progresivo compartido entre todos los jugadores.',100,10000,[['Retorno (RTP)','94,9%'],['Volatilidad','Alta'],['Jackpot actual',fmt(8450000)],['Premio máximo','Jackpot']],350),
    g('Sierra Gold','Video slots','Minas, vagonetas y cascadas de símbolos.',50,5000,[['Retorno (RTP)','96,0%'],['Volatilidad','Media'],['Rodillos','6 x 5'],['Premio máximo','x6.500']],28),
    g('Noche de Tréboles','Clásicas','Frutas, tréboles y un comodín que se expande.',20,2000,[['Retorno (RTP)','96,8%'],['Volatilidad','Baja'],['Rodillos','3 x 3'],['Premio máximo','x1.000']],140),
    g('Cóndor Real','Jackpot','Cuatro jackpots fijos que se activan al azar.',100,8000,[['Retorno (RTP)','95,1%'],['Volatilidad','Alta'],['Jackpots','4 niveles'],['Premio máximo','x25.000']],200),
    g('Malbec Wilds','Video slots','Barriles de comodines y giros con multiplicador.',50,5000,[['Retorno (RTP)','96,3%'],['Volatilidad','Media'],['Rodillos','5 x 3'],['Premio máximo','x4.200']],330)]},
  arcade: {titulo:'Arcade', desc:'Partidas rápidas de habilidad y reflejos con premios en dinero.', filtros:['Todos','Reflejos','Puntería','Estrategia'], items:[
    g('Crash Rocket','Reflejos','Retirá antes de que el cohete explote.',100,20000,[['Duración','10 a 40 s'],['Tipo','Reflejos'],['Premio máximo','x100'],['Jugadores','Hasta 500']],12),
    g('Tiro al Blanco','Puntería','Acertá los blancos que aparecen y sumá multiplicadores.',100,5000,[['Duración','60 s'],['Tipo','Puntería'],['Premio máximo','x20'],['Jugadores','1']],170),
    g('Torre Popi','Estrategia','Apilá bloques y decidí cuándo cobrar.',100,5000,[['Duración','Variable'],['Tipo','Estrategia'],['Premio máximo','x50'],['Jugadores','1']],60),
    g('Mina Segura','Estrategia','Descubrí casillas sin pisar una mina.',50,10000,[['Duración','Variable'],['Tipo','Estrategia'],['Premio máximo','x1.000'],['Jugadores','1']],300),
    g('Plinko','Reflejos','Soltá la bola y esperá el multiplicador.',50,10000,[['Duración','10 s'],['Tipo','Azar y reflejos'],['Premio máximo','x500'],['Jugadores','1']],220),
    g('Duelo 1 contra 1','Puntería','Desafiá a otro jugador por un pozo compartido.',200,20000,[['Duración','90 s'],['Tipo','Versus'],['Premio','Pozo x1,9'],['Jugadores','2']],0)]},
  casino: {titulo:'Casino', desc:'Mesas clásicas con crupier y reglas de siempre.', filtros:['Todos','Ruletas','Cartas','Dados'], items:[
    g('Ruleta Europea','Ruletas','Un solo cero, 37 números y apuestas externas.',50,50000,[['Tipo','Ruleta'],['Cero','Uno solo'],['Pago pleno','35 a 1'],['Mesa','Abierta']],0),
    g('Ruleta Americana','Ruletas','Cero y doble cero, 38 números.',50,50000,[['Tipo','Ruleta'],['Cero','Doble'],['Pago pleno','35 a 1'],['Mesa','Abierta']],120),
    g('Blackjack','Cartas','Llegá a 21 sin pasarte contra la banca.',100,30000,[['Tipo','Cartas'],['Mazos','6'],['Pago BJ','3 a 2'],['Mesa','Abierta']],220),
    g('Baccarat','Cartas','Jugador, banca o empate.',100,40000,[['Tipo','Cartas'],['Mazos','8'],['Pago banca','0,95 a 1'],['Mesa','Abierta']],280),
    g('Póker Caribeño','Cartas','Mano contra el crupier con jackpot opcional.',100,20000,[['Tipo','Cartas'],['Mazos','1'],['Jackpot','Opcional'],['Mesa','Abierta']],20),
    g('Dados Sic Bo','Dados','Tres dados y decenas de combinaciones.',50,20000,[['Tipo','Dados'],['Dados','3'],['Pago máximo','180 a 1'],['Mesa','Abierta']],160)]}
};
const DEPORTES = [
  {cat:'Fútbol', liga:'Liga Profesional', l:'Boca Juniors', v:'River Plate', hora:'Hoy 21:30', q:[2.45,3.1,2.9]},
  {cat:'Fútbol', liga:'Liga Profesional', l:'Racing', v:'Independiente', hora:'Mañana 19:00', q:[2.1,3.2,3.5]},
  {cat:'Fútbol', liga:'Copa Libertadores', l:'Palmeiras', v:'Estudiantes', hora:'Mañana 21:30', q:[1.9,3.3,4.2]},
  {cat:'Básquet', liga:'Liga Nacional', l:'Quimsa', v:'Instituto', hora:'Hoy 20:00', q:[1.55,2.4]},
  {cat:'Básquet', liga:'Liga Nacional', l:'Obras', v:'San Lorenzo', hora:'Sáb 18:00', q:[1.8,2.0]},
  {cat:'Tenis', liga:'ATP 500', l:'Etcheverry', v:'Báez', hora:'Hoy 15:00', q:[1.7,2.15]},
  {cat:'Tenis', liga:'WTA 250', l:'Podoroska', v:'Cocciaretto', hora:'Mañana 12:00', q:[2.3,1.6]}
];
const POSTS0 = [
  {u:'Marcos P.', t:'hace 2 h', txt:'Boca gana + Quimsa gana', q:5.8, m:500, likes:14},
  {u:'Lucía R.', t:'hace 5 h', txt:'Etcheverry gana en 2 sets', q:1.7, m:1000, likes:6},
  {u:'Nico D.', t:'ayer', txt:'Racing o empate', q:1.45, m:2000, likes:22}
];

/* ---------- Estructura común ---------- */
const NAV = [['inicio','Inicio'],['deportes','Apuestas deportivas'],['slots','Slots'],['arcade','Arcade'],['casino','Casino'],['social','Social'],['cuenta','Mi cuenta']];
const page = document.body.dataset.page;
let user = sesion();
if (page && page !== 'login' && !user) { location.replace('Popicasino.html'); return; }
if (!page || page === 'login') return;

function toast(m) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.append(t); setTimeout(() => t.remove(), 2400); }
function modal(html) {
  const m = document.createElement('div'); m.className = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
  m.innerHTML = `<div class="mbox">${html}</div>`;
  const cerrar = () => { m.remove(); document.removeEventListener('keydown', esc2); };
  const esc2 = e => e.key === 'Escape' && cerrar();
  m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-x]')) cerrar(); });
  document.addEventListener('keydown', esc2); document.body.append(m);
  const f = $('input,button:not([data-x])', m); if (f) f.focus();
  return {el: m, cerrar};
}
function shell() {
  document.body.innerHTML = `<div class="app">
  <nav class="side" aria-label="Principal"><a class="brand" href="inicio.html">Popicasino</a>
    ${NAV.map(([id, n]) => `<a class="nav" href="${id}.html" ${id === page ? 'aria-current="page"' : ''}>${n}</a>`).join('')}
    <span class="sp"></span></nav>
  <div><div class="top"><a class="brand" href="inicio.html">Popicasino</a>
    <span class="who">${esc(user.nombre)} ${esc(user.apellido)}</span>
    <div class="saldo"><small>Saldo</small><b id="saldo">${fmt(user.saldo)}</b></div>
    <button class="btn sm" id="dep">Depositar</button></div>
    <main class="main" id="app"></main></div></div>`;
  $('#dep').onclick = () => cajero('Depositar');
}
const refrescarSaldo = () => { user = sesion(); const s = $('#saldo'); if (s) s.textContent = fmt(user.saldo); };

/* ---------- Depositar / retirar (simulado) ---------- */
function cajero(tipo) {
  const dep = tipo === 'Depositar';
  const m = modal(`<div class="mbody"><h2>${tipo}</h2><p>${dep ? 'Elegí cuánto querés sumar a tu saldo.' : `Disponible para retirar: ${fmt(user.saldo)}`}</p>
    <div class="chips">${[1000, 5000, 10000, 20000].map(v => `<button class="chip" data-v="${v}">${fmt(v)}</button>`).join('')}</div>
    <input type="number" id="monto" min="500" step="100" placeholder="Otro monto (mínimo $500)" aria-label="Monto">
    <p class="err" id="merr"></p>
    <div class="mact"><button class="btn ghost sm" data-x>Cancelar</button><button class="btn sm" id="ok">${tipo}</button></div></div>`);
  $$('.chip', m.el).forEach(c => c.onclick = () => $('#monto', m.el).value = c.dataset.v);
  $('#ok', m.el).onclick = () => {
    const v = Math.floor(+$('#monto', m.el).value);
    const e = !(v >= 500) ? 'Ingresá un monto de $500 o más.' : (!dep && v > user.saldo ? 'No tenés saldo suficiente.' : '');
    $('#merr', m.el).textContent = e; if (e) return;
    mover(user, dep ? 'Depósito' : 'Retiro', dep ? v : -v); refrescarSaldo();
    m.cerrar(); toast(dep ? 'Depósito acreditado' : 'Retiro solicitado'); if (page === 'cuenta') VISTAS.cuenta();
  };
}

/* ---------- Vistas ---------- */
const root = () => $('#app');
const card = (cat, i, j) => `<button class="game" data-cat="${cat}" data-i="${i}" style="--h:${j.h}"><span class="cover"><i>Próximamente</i><b>${esc(j.n[0])}</b></span><span class="gname">${esc(j.n)}</span><span class="gmeta">Desde ${fmt(j.min)}</span></button>`;

function vistaPrevia(cat, i) {
  const j = JUEGOS[cat].items[i];
  modal(`<div class="cover" style="--h:${j.h}"><b>${esc(j.n)}</b></div><div class="mbody"><h2>${esc(j.n)}</h2><p>${esc(j.desc)}</p>
    <div class="info">${j.info.map(([a, b]) => `<div><small>${a}</small>${esc(b)}</div>`).join('')}
      <div><small>Apuesta mínima</small>${fmt(j.min)}</div><div><small>Apuesta máxima</small>${fmt(j.max)}</div></div>
    <div class="mact"><button class="btn ghost sm" data-x>Volver</button><button class="btn sm" disabled>Jugar (próximamente)</button></div></div>`);
}
function lobbyJuegos(cat) {
  const c = JUEGOS[cat];
  root().innerHTML = `<header><h1>${c.titulo}</h1><p class="sub">${c.desc}</p></header>
    <div class="chips">${c.filtros.map((f, k) => `<button class="chip" aria-pressed="${k === 0}">${f}</button>`).join('')}</div>
    <div class="grid" id="grid"></div>`;
  const pintar = f => $('#grid').innerHTML = c.items.map((j, i) => (f === 'Todos' || j.c === f) ? card(cat, i, j) : '').join('');
  pintar('Todos');
  $$('.chip').forEach(b => b.onclick = () => { $$('.chip').forEach(x => x.setAttribute('aria-pressed', x === b)); pintar(b.textContent); });
  root().onclick = e => { const b = e.target.closest('.game'); if (b) vistaPrevia(b.dataset.cat, +b.dataset.i); };
}

const boleto = [];
function vistaDeportes() {
  const cats = ['Todos', ...new Set(DEPORTES.map(d => d.cat))];
  root().innerHTML = `<header><h1>Apuestas deportivas</h1><p class="sub">Elegí una cuota, armá tu boleto y apostá. Podés compartirlo en Social.</p></header>
    <div class="chips">${cats.map((f, k) => `<button class="chip" aria-pressed="${k === 0}">${f}</button>`).join('')}</div>
    <div class="dep"><div id="evs"></div><aside class="panel boleto" id="bol"></aside></div>`;
  let filtro = 'Todos';
  const lab = d => d.q.length === 3 ? ['Local', 'Empate', 'Visitante'] : ['Local', 'Visitante'];
  const pintar = () => {
    $('#evs').innerHTML = DEPORTES.map((d, i) => d.cat !== filtro && filtro !== 'Todos' ? '' : `<div class="ev"><div><small>${d.liga}</small><strong>${esc(d.l)} vs ${esc(d.v)}</strong></div><small>${d.hora}</small>
      <div class="odds">${d.q.map((q, k) => `<button class="odd" data-i="${i}" data-k="${k}" aria-pressed="${boleto.some(b => b.i === i && b.k === k)}"><span>${lab(d)[k]}</span><b>${q.toFixed(2)}</b></button>`).join('')}</div></div>`).join('');
  };
  const pintarBol = () => {
    const q = boleto.reduce((a, b) => a * b.q, 1);
    $('#bol').innerHTML = `<h3>Mi boleto</h3>${boleto.length ? boleto.map(b => `<div class="pick"><span>${esc(b.txt)}</span><b>${b.q.toFixed(2)}</b></div>`).join('') : '<p class="vacio">Tocá una cuota para sumarla.</p>'}
      <div class="row"><span>Cuota total</span><b>${boleto.length ? q.toFixed(2) : '0,00'}</b></div>
      <input type="number" id="stake" min="100" step="100" placeholder="Monto (mínimo $100)" aria-label="Monto a apostar">
      <div class="row"><span>Ganancia posible</span><b id="gan">${fmt(0)}</b></div>
      <label class="chk"><input type="checkbox" id="share"><span>Compartir en Social</span></label>
      <p class="err" id="berr"></p><button class="btn full" id="apostar" style="width:100%" ${boleto.length ? '' : 'disabled'}>Apostar</button>`;
    $('#stake').oninput = e => $('#gan').textContent = fmt((+e.target.value || 0) * q);
    $('#apostar').onclick = () => {
      const m = Math.floor(+$('#stake').value);
      const e = !(m >= 100) ? 'El monto mínimo es $100.' : m > user.saldo ? 'No tenés saldo. Depositá para apostar.' : '';
      $('#berr').textContent = e; if (e) return;
      const txt = boleto.map(b => b.txt).join(' + ');
      mover(user, 'Apuesta: ' + txt, -m); refrescarSaldo();
      if ($('#share').checked) { const p = rd('popi_posts', POSTS0); p.unshift({u: user.nombre + ' ' + user.apellido[0] + '.', t: 'recién', txt, q: +q.toFixed(2), m, likes: 0}); wr('popi_posts', p); }
      boleto.length = 0; pintar(); pintarBol(); toast('Apuesta registrada');
    };
  };
  $$('.chip').forEach(b => b.onclick = () => { filtro = b.textContent; $$('.chip').forEach(x => x.setAttribute('aria-pressed', x === b)); pintar(); });
  $('#evs').onclick = e => {
    const o = e.target.closest('.odd'); if (!o) return;
    const i = +o.dataset.i, k = +o.dataset.k, d = DEPORTES[i], pos = boleto.findIndex(b => b.i === i);
    const was = pos >= 0 && boleto[pos].k === k;
    if (pos >= 0) boleto.splice(pos, 1);
    if (!was) boleto.push({i, k, q: d.q[k], txt: (k === 0 ? d.l : k === d.q.length - 1 ? d.v : 'Empate ' + d.l + '-' + d.v)});
    pintar(); pintarBol();
  };
  pintar(); pintarBol();
}

function vistaSocial() {
  const posts = rd('popi_posts', POSTS0), liked = rd('popi_likes', {});
  root().innerHTML = `<header><h1>Social</h1><p class="sub">Apuestas que comparte la comunidad. Para publicar la tuya, marcá “Compartir en Social” al apostar.</p></header>
  <div class="feed">${posts.map((p, i) => `<article class="post"><header><span class="av">${esc(p.u[0])}</span><div><strong>${esc(p.u)}</strong><small>${esc(p.t)}</small></div></header>
    <div class="slip"><span>${esc(p.txt)}</span><b>x${p.q}</b></div><div class="row"><span>Apostó ${fmt(p.m)}</span><span>Ganancia posible ${fmt(p.m * p.q)}</span></div>
    <div class="acts"><button class="btn ghost sm" data-like="${i}">${liked[i] ? 'Te gusta' : 'Me gusta'} (${p.likes + (liked[i] ? 1 : 0)})</button><a class="btn ghost sm" style="text-decoration:none" href="deportes.html">Ver partidos</a></div></article>`).join('')}</div>`;
  root().onclick = e => { const b = e.target.closest('[data-like]'); if (!b) return; liked[b.dataset.like] = !liked[b.dataset.like]; wr('popi_likes', liked); vistaSocial(); };
}

function vistaInicio() {
  const dest = ['slots', 'arcade', 'casino'].map(c => `<h2>${JUEGOS[c].titulo} destacados</h2><div class="rowh">${JUEGOS[c].items.slice(0, 5).map((j, i) => card(c, i, j)).join('')}</div>`).join('');
  root().innerHTML = `<header><h1>Hola, ${esc(user.nombre)}</h1><p class="sub">Elegí dónde jugar. Tu saldo está siempre arriba a la derecha.</p></header>
    <div class="cats">${[['deportes','Apuestas deportivas','Fútbol, básquet y tenis con cuotas en vivo.'],['slots','Slots','Rodillos, bonus y jackpots.'],['arcade','Arcade','Partidas rápidas de habilidad.'],['casino','Casino','Ruleta, blackjack, baccarat y más.'],['social','Social','Compartí y mirá apuestas de otros.']].map(([id, n, d]) => `<a class="cat" href="${id}.html"><h3>${n}</h3><p>${d}</p></a>`).join('')}</div>${dest}`;
  root().onclick = e => { const b = e.target.closest('.game'); if (b) vistaPrevia(b.dataset.cat, +b.dataset.i); };
}

function vistaCuenta() {
  user = sesion();
  root().innerHTML = `<header><h1>Mi cuenta</h1></header>
  <section class="panel"><div class="bal"><div><small>Saldo disponible</small><b>${fmt(user.saldo)}</b></div>
    <div class="btns"><button class="btn" id="d">Depositar</button><button class="btn ghost" id="r">Retirar</button></div></div></section>
  <h2>Movimientos</h2>
  ${user.mov.length ? `<ul class="mov">${user.mov.map(m => `<li><span>${esc(m.txt)}<small>${new Date(m.f).toLocaleString('es-AR')}</small></span><b class="${m.monto > 0 ? 'pos' : 'neg'}">${m.monto > 0 ? '+' : ''}${fmt(m.monto)}</b></li>`).join('')}</ul>` : '<p class="sub">Todavía no hay movimientos. Depositá para empezar.</p>'}
  <h2>Datos</h2><p class="sub">${esc(user.nombre)} ${esc(user.apellido)}, ${esc(user.mail)}</p>
  <p><button class="btn ghost sm" id="out">Cerrar sesión</button></p>`;
  $('#d').onclick = () => cajero('Depositar'); $('#r').onclick = () => cajero('Retirar'); $('#out').onclick = Popi.salir;
}

const VISTAS = {inicio: vistaInicio, deportes: vistaDeportes, social: vistaSocial, cuenta: vistaCuenta,
  slots: () => lobbyJuegos('slots'), arcade: () => lobbyJuegos('arcade'), casino: () => lobbyJuegos('casino')};

shell();
(VISTAS[page] || VISTAS.inicio)();
const pie = document.createElement('footer'); pie.className = 'foot';
pie.textContent = 'Juego de entretenimiento, si el juego deja de ser un juego, pedí ayuda. Solo mayores de 18 años.';
root().append(pie);
})();
