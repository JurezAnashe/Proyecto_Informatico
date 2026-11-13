// Agrega al sitio normal lo que solo puede ver el administrador.
// Se incluye en todas las páginas; para clientes y visitantes no hace nada.
(function () {
    fetch('php/rol.php', { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (d) {
            if (!d || d.rol !== 'admin' || document.getElementById('enlaceAdmin')) return;

            var enlace = document.createElement('a');
            enlace.id = 'enlaceAdmin';
            enlace.href = 'admin_productos.html';
            enlace.textContent = 'ADMINISTRAR PRODUCTOS';

            var nav = document.querySelector('.enlaces-nav');
            if (nav) {
                nav.appendChild(enlace);
            } else {
                var acciones = document.querySelector('.acciones-usuario');
                if (acciones) {
                    enlace.className = 'acciones-usuario__texto';
                    acciones.insertBefore(enlace, acciones.firstChild);
                }
            }
        })
        .catch(function () { /* sin sesión o sin servidor: no se muestra nada */ });
})();
