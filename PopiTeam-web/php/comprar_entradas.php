<?php
require __DIR__ . '/config.php';

$idUsuario = requerir_sesion();
$d = leer_json();

$sector   = texto($d, 'sector', 30);
$cantidad = filter_var($d['cantidad'] ?? null, FILTER_VALIDATE_INT);

if (!array_key_exists($sector, SECTORES)) {
    error_json('Elegí un sector válido.');
}
if ($cantidad === false || $cantidad < 1 || $cantidad > MAX_ENTRADAS_POR_COMPRA) {
    error_json('Podés comprar entre 1 y ' . MAX_ENTRADAS_POR_COMPRA . ' entradas.');
}
validar_tarjeta($d);  

// Tomar el número de tarjeta ingresado en el formulario web
$numeroTarjeta = preg_replace('/[\s-]/', '', texto($d, 'numero_tarjeta', 30));

$valor = SECTORES[$sector];
$total_compra = $valor * $cantidad;

try {
    $pdo = db();
    $pdo->beginTransaction();

    // La tarjeta y el saldo pertenecen al usuario logueado
    $stmtTarjeta = $pdo->prepare('SELECT numero_tarjeta, saldo FROM Usuarios WHERE id_usuario = ? FOR UPDATE');
    $stmtTarjeta->execute([$idUsuario]);
    $tarjeta = $stmtTarjeta->fetch();

    if (!$tarjeta || $tarjeta['numero_tarjeta'] === null || $tarjeta['numero_tarjeta'] !== $numeroTarjeta) {
        $pdo->rollBack();
        error_json('La tarjeta ingresada no coincide con la de tu cuenta.');
    }

    $saldo_actual = (float) $tarjeta['saldo'];

    if ($saldo_actual < $total_compra) {
        $pdo->rollBack();
        error_json('Saldo insuficiente en la tarjeta. Saldo disponible: $' . number_format($saldo_actual, 2) . ' | Total de compra: $' . number_format($total_compra, 2) . '.');
    }

    $nuevo_saldo = $saldo_actual - $total_compra;
    $updSaldo = $pdo->prepare('UPDATE Usuarios SET saldo = ? WHERE id_usuario = ?');
    $updSaldo->execute([$nuevo_saldo, $idUsuario]);

    $ins = $pdo->prepare('INSERT INTO Entrada (id_usuario, sector, valor_entrada) VALUES (?, ?, ?)');
    for ($i = 0; $i < $cantidad; $i++) {
        $ins->execute([$idUsuario, $sector, $valor]);
    }

    $nom = $pdo->prepare('SELECT Nombre FROM Usuarios WHERE id_usuario = ?');
    $nom->execute([$idUsuario]);
    $nombre = (string) $nom->fetchColumn();

    $pdo->commit();
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    error_servidor($e);
}

responder(['ok' => true, 'cantidad' => $cantidad, 'total' => $total_compra, 'nombre' => $nombre]);