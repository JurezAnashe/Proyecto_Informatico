<?php
require __DIR__ . '/config.php';

$idUsuario = requerir_sesion();
$d = leer_json();
validar_tarjeta($d); 

try {
    $pdo = db();
    $pdo->beginTransaction();

    $st = $pdo->prepare('SELECT 1 FROM Usuarios WHERE id_usuario = ? FOR UPDATE');
    $st->execute([$idUsuario]);
    if (!$st->fetch()) {
        $pdo->rollBack();
        error_json('Usuario no encontrado.', 401);
    }

    $st = $pdo->prepare('SELECT 1 FROM Socio WHERE id_usuario = ?');
    $st->execute([$idUsuario]);
    if ($st->fetch()) {
        $pdo->rollBack();
        error_json('Ya sos socio de PopiTeam.', 409);
    }

    $st = $pdo->prepare(
        'INSERT INTO Socio (id_usuario, Tipo_socio, Estado, Fecha_asociamiento)
         VALUES (?, ?, \'Activo\', CURDATE())'
    );
    $st->execute([$idUsuario, TIPO_SOCIO]);
    $pdo->commit();
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    if ($e->getCode() === '23000') error_json('Ya sos socio de PopiTeam.', 409);
    error_servidor($e);
}

responder(['ok' => true, 'total' => CUOTA_SOCIO]);
