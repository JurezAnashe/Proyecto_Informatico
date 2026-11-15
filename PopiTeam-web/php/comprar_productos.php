<?php
require __DIR__ . '/config.php';

$idUsuario = requerir_cliente('comprar productos');
$d = leer_json();

$items = $d['items'] ?? null;
if (!is_array($items) || count($items) === 0) {
    error_json('El carrito está vacío.');
}

$pedido = [];
foreach ($items as $it) {
    $id   = filter_var($it['id'] ?? null, FILTER_VALIDATE_INT);
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

    $sel = $pdo->prepare('SELECT nombre_producto, precio, stock FROM Producto WHERE id_producto = ? AND activo = 1 FOR UPDATE');
    $upd = $pdo->prepare('UPDATE Producto SET stock = stock - ? WHERE id_producto = ?');
    $ins = $pdo->prepare(
        'INSERT INTO Venta (id_producto, id_usuario, cantidad_productos, precioTotal) VALUES (?, ?, ?, ?)'
    );

    $total = 0.0;
    $unidades = 0;
    $subtotales = [];
    foreach ($pedido as $id => $cant) {
        $sel->execute([$id]);
        $p = $sel->fetch();
        if (!$p) {
            $pdo->rollBack();
            error_json('Un producto del carrito ya no existe.');
        }
        if ((int) $p['stock'] < $cant) {
            $pdo->rollBack();
            error_json('"' . $p['nombre_producto'] . '" ' . ((int) $p['stock'] === 0 ? 'está sin stock.' : 'no tiene stock suficiente para la cantidad pedida.'), 409);
        }
        $subtotales[$id] = round((float) $p['precio'] * $cant, 2);
        $total += $subtotales[$id];
        $unidades += $cant;
    }

    $stmtTarjeta = $pdo->prepare('SELECT numero_tarjeta, saldo FROM Usuarios WHERE id_usuario = ? FOR UPDATE');
    $stmtTarjeta->execute([$idUsuario]);
    $tarjeta = $stmtTarjeta->fetch();

    if (!$tarjeta || $tarjeta['numero_tarjeta'] === null || $tarjeta['numero_tarjeta'] === '') {
        $pdo->rollBack();
        error_json('Tu cuenta no tiene una tarjeta asociada.');
    }

    $saldo_actual = (float) $tarjeta['saldo'];

    if ($saldo_actual < $total) {
        $pdo->rollBack();
        error_json('Saldo insuficiente en la tarjeta. Saldo disponible: $' . number_format($saldo_actual, 2) . ' | Total de compra: $' . number_format($total, 2) . '.');
    }

    $nuevo_saldo = $saldo_actual - $total;
    $updSaldo = $pdo->prepare('UPDATE Usuarios SET saldo = ? WHERE id_usuario = ?');
    $updSaldo->execute([$nuevo_saldo, $idUsuario]);

    foreach ($pedido as $id => $cant) {
        $upd->execute([$cant, $id]);
        $ins->execute([$id, $idUsuario, $cant, $subtotales[$id]]);
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