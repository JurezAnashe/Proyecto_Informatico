<?php
// EDITAR (ABM) - solo admin.
require __DIR__ . '/config.php';

requerir_admin();
$d = leer_json();

$id = filter_var($d['id_producto'] ?? null, FILTER_VALIDATE_INT);
if ($id === false || $id < 1) {
    error_json('Producto inválido.');
}
[$nombre, $precio, $stock] = validar_producto($d);

try {
    $pdo = db();
    $pdo->beginTransaction();

    // Bloqueo la fila para que una compra simultánea no pise el stock mientras se edita
    $st = $pdo->prepare('SELECT 1 FROM Producto WHERE id_producto = ? FOR UPDATE');
    $st->execute([$id]);
    if (!$st->fetch()) {
        $pdo->rollBack();
        error_json('El producto no existe.', 404);
    }

    $st = $pdo->prepare(
        'UPDATE Producto SET nombre_producto = ?, precio = ?, stock = ? WHERE id_producto = ?'
    );
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
