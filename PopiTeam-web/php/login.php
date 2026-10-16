<?php
require __DIR__ . '/config.php';

$d = leer_json();
$email = mb_strtolower(texto($d, 'email', 100));
$clave = is_string($d['contrasena'] ?? null) ? $d['contrasena'] : '';

try {
    $st = db()->prepare('SELECT id_usuario, Nombre, Email, contrasena FROM Usuarios WHERE Email = ?');
    $st->execute([$email]);
    $u = $st->fetch();
} catch (PDOException $e) {
    error_servidor($e);
}

if (!$u || !password_verify($clave, $u['contrasena'])) {
    error_json('Correo o contraseña incorrectos.', 401);
}

session_regenerate_id(true);
$_SESSION['id_usuario'] = (int) $u['id_usuario'];
responder(['ok' => true, 'nombre' => $u['Nombre'], 'correo' => $u['Email']]);
