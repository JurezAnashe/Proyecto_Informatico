<?php
require __DIR__ . '/config.php';

$idUsuario = requerir_sesion();
$d = leer_json();

$items = $d['items'] ?? null;
if (!is_array($items) || count($items) === 0) {
    error_json('El carrito está vacío.');
}

$pedido = [];
foreach ($items as $it) {
    $id  = filter_var($it['id'] ?? null, FILTER_VALIDATE_INT);
    $cant = filter_var($it['cantidad'] ?? null, FILTER_VALIDATE_INT);
    if ($id === false || $cant === false || $id < 1 || $cant < 1 || $cant > 50) {
        error_json('Hay un producto inválido en el carrito.');
    }
    $pedido[$id] = ($pedido[$id] ?? 0) + $cant;
}
ksort($pedido);  

try {
    $pdo = db();
    $pdo->beginTransaction();

    $sel = $pdo->prepare('SELECT nombre_producto, precio, stock FROM Producto WHERE id_producto = ? FOR UPDATE');
    $upd = $pdo->prepare('UPDATE Producto SET stock = stock - ? WHERE id_producto = ?');
    $ins = $pdo->prepare(
        'INSERT INTO Venta (id_producto, id_usuario, cantidad_productos, precioTotal) VALUES (?, ?, ?, ?)'
    );

    $total = 0.0;
    $unidades = 0;
    foreach ($pedido as $id => $cant) {
        $sel->execute([$id]);
        $p = $sel->fetch();
        if (!$p) {
            $pdo->rollBack();
            error_json('Un producto del carrito ya no existe.');
        }
        if ((int) $p['stock'] < $cant) {
            $pdo->rollBack();
            error_json('No hay stock suficiente de "' . $p['nombre_producto'] . '" (quedan ' . (int) $p['stock'] . ').', 409);
        }
        $subtotal = round((float) $p['precio'] * $cant, 2);
        $upd->execute([$cant, $id]);
        $ins->execute([$id, $idUsuario, $cant, $subtotal]);
        $total += $subtotal;
        $unidades += $cant;
    }

    $nom = $pdo->prepare('SELECT Nombre FROM Usuarios WHERE id_usuario = ?');
    $nom->execute([$idUsuario]);
    $nombre = (string) $nom->fetchColumn();

    $pdo->commit();
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    error_servidor($e);
}

responder(['ok' => true, 'cantidad' => $unidades, 'total' => $total, 'nombre' => $nombre]);
