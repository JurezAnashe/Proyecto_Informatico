const CLAVE_SESION = 'popiteam_sesion';
const CLAVE_CARRITO = 'popiteam_carrito';

function obtenerSesion() {
    try {
        return JSON.parse(localStorage.getItem(CLAVE_SESION));
    } catch (error) {
        return null;
    }
}

function guardarSesionLocal(correo, nombre) {
    localStorage.setItem(CLAVE_SESION, JSON.stringify({ correo: correo, nombre: nombre }));
    actualizarBarraSuperior();
}

function enviarPHP(url, datos) {
    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(datos)
    }).then(function (respuesta) {
        return respuesta.json().catch(function () { return { ok: false, mensaje: 'Respuesta inválida del servidor.' }; })
            .then(function (json) { return { status: respuesta.status, datos: json }; });
    }).catch(function () {
        return { status: 0, datos: { ok: false, mensaje: 'No se pudo conectar con el servidor. ¿Está corriendo Apache/XAMPP?' } };
    }).then(function (res) {
        if (res.status === 401 && obtenerSesion()) {
            localStorage.removeItem(CLAVE_SESION);
            const pagina = window.location.pathname.split('/').pop();
            window.location.href = 'login.html?volver=' + encodeURIComponent(pagina);
        }
        return res;
    });
}

function iniciarSesion(correo, contrasena) {
    return enviarPHP('php/login.php', { email: correo.trim(), contrasena: contrasena }).then(function (res) {
        if (res.datos.ok) {
            guardarSesionLocal(res.datos.correo, res.datos.nombre);
        }
        return res.datos;
    });
}

function cerrarSesion() {
    localStorage.removeItem(CLAVE_SESION);
    actualizarBarraSuperior();
    return enviarPHP('php/logout.php', {});
}

function requiereSesion(volverA) {
    if (!obtenerSesion()) {
        const pagina = volverA || window.location.pathname.split('/').pop();
        window.location.href = 'login.html?volver=' + encodeURIComponent(pagina);
        return false;
    }
    return true;
}

function obtenerCarrito() {
    try {
        return JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || [];
    } catch (error) {
        return [];
    }
}

function guardarCarrito(carrito) {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
    actualizarBarraSuperior();
}

function agregarAlCarrito(producto) {
    const carrito = obtenerCarrito();
    const existente = carrito.find(function (p) { return String(p.id) === String(producto.id); });
    if (existente) {
        existente.cantidad += 1;
    } else {
        producto.cantidad = 1;
        carrito.push(producto);
    }
    guardarCarrito(carrito);
    mostrarAvisoCarrito(producto.nombre);
    if (typeof renderizarCarrito === 'function') renderizarCarrito();
}

function cambiarCantidadCarrito(id, cantidad) {
    cantidad = parseInt(cantidad, 10);
    if (isNaN(cantidad) || cantidad < 1) cantidad = 1;
    const carrito = obtenerCarrito().map(function (p) {
        if (String(p.id) === String(id)) p.cantidad = cantidad;
        return p;
    });
    guardarCarrito(carrito);
    if (typeof renderizarCarrito === 'function') renderizarCarrito();
}

function quitarDelCarrito(id) {
    const carrito = obtenerCarrito().filter(function (p) { return String(p.id) !== String(id); });
    guardarCarrito(carrito);
    if (typeof renderizarCarrito === 'function') renderizarCarrito();
}

function vaciarCarrito() {
    guardarCarrito([]);
    if (typeof renderizarCarrito === 'function') renderizarCarrito();
}

function calcularTotalCarrito() {
    return obtenerCarrito().reduce(function (total, p) { return total + p.precio * p.cantidad; }, 0);
}

function calcularCantidadCarrito() {
    return obtenerCarrito().reduce(function (total, p) { return total + p.cantidad; }, 0);
}

function actualizarBarraSuperior() {
    document.querySelectorAll('.icono.carrito span').forEach(function (span) {
        span.textContent = calcularCantidadCarrito();
    });

    const sesion = obtenerSesion();
    document.querySelectorAll('.acciones-usuario__texto').forEach(function (enlace) {
        if (sesion) {
            enlace.textContent = 'Hola, ' + sesion.nombre + ' — Cerrar sesión';
            enlace.href = '#';
            enlace.onclick = function (e) {
                e.preventDefault();
                cerrarSesion().then(function () { window.location.reload(); });
            };
        } else {
            enlace.textContent = 'Iniciar sesión o registrarse';
            enlace.href = 'login.html';
            enlace.onclick = null;
        }
    });
}

function mostrarAvisoCarrito(nombreProducto) {
    let aviso = document.getElementById('avisoCarrito');
    if (!aviso) {
        aviso = document.createElement('div');
        aviso.id = 'avisoCarrito';
        aviso.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#241609;color:#ffd200;padding:14px 22px;border-radius:10px;font-weight:700;font-size:.9rem;z-index:5000;box-shadow:0 12px 30px rgba(0,0,0,.35);transition:opacity .3s ease;opacity:0;';
        document.body.appendChild(aviso);
    }
    aviso.textContent = nombreProducto + ' se agregó al carrito 🛒';
    aviso.style.opacity = '1';
    clearTimeout(aviso._temporizador);
    aviso._temporizador = setTimeout(function () { aviso.style.opacity = '0'; }, 2200);
}

document.addEventListener('DOMContentLoaded', actualizarBarraSuperior);
