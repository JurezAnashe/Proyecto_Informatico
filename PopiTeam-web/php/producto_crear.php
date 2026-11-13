<?php
// CREAR (ABM) - solo admin. Validación en servidor; el cliente valida también en el formulario.
require __DIR__ . '/config.php';

requerir_admin();
$d = leer_json();
[$nombre, $precio, $stock] = validar_producto($d);

try {
    $st = db()->prepare(
        'INSERT INTO Producto (nombre_producto, precio, stock, activo) VALUES (?, ?, ?, 1)'
    );
    $st->execute([$nombre, $precio, $stock]);
    $id = (int) db()->lastInsertId();
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        error_json('Ya existe un producto con ese nombre.', 409);
    }
    error_servidor($e);
}

responder(['ok' => true, 'id_producto' => $id], 201);
