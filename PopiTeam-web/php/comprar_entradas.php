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

$valor = SECTORES[$sector];

try {
    $pdo = db();
    $pdo->beginTransaction();

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

responder(['ok' => true, 'cantidad' => $cantidad, 'total' => $valor * $cantidad, 'nombre' => $nombre]);
