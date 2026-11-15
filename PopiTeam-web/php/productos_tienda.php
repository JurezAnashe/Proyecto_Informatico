<?php
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error_json('Método no permitido.', 405);
}

try {
    $filas = db()->query(
        'SELECT id_producto, nombre_producto, precio, categoria, stock, imagen
         FROM Producto
         WHERE activo = 1
         ORDER BY id_producto'
    )->fetchAll();
} catch (PDOException $e) {
    error_servidor($e);
}

responder(['ok' => true, 'productos' => $filas]);