<?php
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error_json('Método no permitido.', 405);
}

try {
    $filas = db()->query('SELECT id_producto, stock FROM Producto WHERE activo = 1')->fetchAll();
} catch (PDOException $e) {
    error_servidor($e);
}

$stock = [];
foreach ($filas as $f) {
    $stock[(int) $f['id_producto']] = (int) $f['stock'];
}

responder(['ok' => true, 'stock' => $stock]);