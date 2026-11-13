<?php
// Registro inicial de usuario admin.
// Si todavía no existe ningún admin, cualquiera puede crear el primero.
// Una vez que existe uno, solo un admin logueado puede crear otros.
require __DIR__ . '/config.php';

$d = leer_json();

try {
    $hayAdmin = (int) db()->query("SELECT COUNT(*) FROM Usuarios WHERE rol = 'admin'")->fetchColumn() > 0;
} catch (PDOException $e) {
    error_servidor($e);
}
if ($hayAdmin) {
    requerir_admin();
}

$nombre   = texto($d, 'nombre', 50);
$apellido = texto($d, 'apellido', 50);
$email    = mb_strtolower(texto($d, 'email', 100));
$dni      = preg_replace('/\D/', '', texto($d, 'dni', 12));
$fecha    = texto($d, 'fecha_nacimiento', 10);
$telefono = texto($d, 'telefono', 20);
$clave    = is_string($d['contrasena'] ?? null) ? $d['contrasena'] : '';

if ($nombre === '' || $apellido === '')             error_json('Ingresa nombre y apellido.');
if (!filter_var($email, FILTER_VALIDATE_EMAIL))     error_json('El correo no es valido.');
if (!preg_match('/^\d{7,8}$/', $dni))               error_json('El DNI debe tener 7 u 8 números.');
if (!preg_match('/^[\d\s+()-]{6,20}$/', $telefono)) error_json('El teléfono no es valido.');
if (strlen($clave) < 8 || strlen($clave) > 14)      error_json('La contraseña debe tener entre 8 y 14 caracteres.');

$f = DateTime::createFromFormat('!Y-m-d', $fecha);
if (!$f || $f->format('Y-m-d') !== $fecha || $f > new DateTime('today') || $f < new DateTime('1900-01-01')) {
    error_json('La fecha de nacimiento no es valida.');
}

try {
    $st = db()->prepare(
        "INSERT INTO Usuarios (Nombre, Apellido, Email, Dni, Fecha_nacimiento, Telefono, contrasena, rol)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'admin')"
    );
    $st->execute([$nombre, $apellido, $email, $dni, $fecha, $telefono, password_hash($clave, PASSWORD_DEFAULT)]);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        error_json('Ya existe una cuenta con ese correo o DNI.', 409);
    }
    error_servidor($e);
}

responder(['ok' => true, 'mensaje' => 'Administrador creado.'], 201);
