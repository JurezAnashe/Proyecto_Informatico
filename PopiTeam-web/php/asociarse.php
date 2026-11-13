<?php
// LISTAR (ABM) - solo admin. Devuelve productos activos (o todos con ?todos=1).
require __DIR__ . '/config.php';

requerir_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error_json('Método no permitido.', 405);
}

$sql = 'SELECT id_producto, nombre_producto, precio, stock, activo FROM Producto';
if (($_GET['todos'] ?? '0') !== '1') {
    $sql .= ' WHERE activo = 1';
}
$sql .= ' ORDER BY id_producto';

try {
    $filas = db()->query($sql)->fetchAll();
} catch (PDOException $e) {
    error_servidor($e);
}

responder(['ok' => true, 'productos' => $filas]);
