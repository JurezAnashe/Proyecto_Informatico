<?php
require __DIR__ . '/config.php';

requerir_admin();
$d = leer_json();

$id     = filter_var($d['id_producto'] ?? null, FILTER_VALIDATE_INT);
$nombre = texto($d, 'nombre_producto', 100);
$precio = filter_var($d['precio'] ?? null, FILTER_VALIDATE_FLOAT);
$stock  = filter_var($d['stock'] ?? null, FILTER_VALIDATE_INT);

if ($id === false || $id < 1)             error_json('Producto inválido.');
if ($nombre === '')                       error_json('Ingresá el nombre del producto.');
if ($precio === false || $precio <= 0)    error_json('El precio debe ser mayor a 0.');
if ($stock === false || $stock < 0)       error_json('El stock no puede ser negativo.');
$precio = round((float) $precio, 2);

try {
    $pdo = db();
    $pdo->beginTransaction();

    $st = $pdo->prepare('SELECT 1 FROM Producto WHERE id_producto = ? AND activo = 1 FOR UPDATE');
    $st->execute([$id]);
    if (!$st->fetch()) {
        $pdo->rollBack();
        error_json('El producto no existe.', 404);
    }

    $st = $pdo->prepare('UPDATE Producto SET nombre_producto = ?, precio = ?, stock = ? WHERE id_producto = ?');
    $st->execute([$nombre, $precio, $stock, $id]);
    $pdo->commit();
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    if ($e->getCode() === '23000') {
        error_json('Ya existe un producto con ese nombre.', 409);
    }
    error_servidor($e);
}

responder(['ok' => true]);