<?php
require __DIR__ . '/config.php';

if (empty($_SESSION['id_usuario'])) {
    responder(['ok' => true, 'logueado' => false, 'rol' => null]);
}

try {
    $st = db()->prepare('SELECT rol FROM Usuarios WHERE id_usuario = ?');
    $st->execute([(int) $_SESSION['id_usuario']]);
    $rol = $st->fetchColumn();

    $st = db()->prepare('SELECT 1 FROM Socio WHERE id_usuario = ?');
    $st->execute([(int) $_SESSION['id_usuario']]);
    $esSocio = (bool) $st->fetchColumn();
} catch (PDOException $e) {
    error_servidor($e);
}

responder([
    'ok'       => true,
    'logueado' => true,
    'rol'      => $rol === 'admin' ? 'admin' : 'cliente',
    'es_socio' => $esSocio,
]);