<?php
require __DIR__ . '/config.php';

requerir_admin();
$d = leer_json();

$id = filter_var($d['id_producto'] ?? null, FILTER_VALIDATE_INT);
if ($id === false || $id < 1) {
    error_json('Producto inválido.');
}

try {
    $st = db()->prepare('UPDATE Producto SET activo = 0 WHERE id_producto = ? AND activo = 1');
    $st->execute([$id]);
    if ($st->rowCount() === 0) {
        error_json('El producto no existe o ya estaba dado de baja.', 404);
    }
} catch (PDOException $e) {
    error_servidor($e);
}

responder(['ok' => true]);