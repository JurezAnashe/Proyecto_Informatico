<?php
require __DIR__ . '/config.php';

requerir_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_json('Método no permitido.', 405);
}

const MAX_IMAGEN_BYTES = 2 * 1024 * 1024;
const TIPOS_IMAGEN = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp'];

if (empty($_POST) && empty($_FILES) && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
    error_json('La imagen es demasiado grande (máximo 2 MB).', 413);
}

[$nombre, $precio, $stock, $categoria] = validar_producto($_POST);

$f = $_FILES['imagen'] ?? null;
if (!$f || $f['error'] === UPLOAD_ERR_NO_FILE) {
    error_json('Elegí una imagen para el producto.');
}
if ($f['error'] === UPLOAD_ERR_INI_SIZE || $f['error'] === UPLOAD_ERR_FORM_SIZE || $f['size'] > MAX_IMAGEN_BYTES) {
    error_json('La imagen es demasiado grande (máximo 2 MB).', 413);
}
if ($f['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) {
    error_json('No se pudo subir la imagen. Probá de nuevo.');
}
$info = @getimagesize($f['tmp_name']);
if (!$info || !isset(TIPOS_IMAGEN[$info[2]])) {
    error_json('La imagen debe ser JPG, PNG o WEBP.');
}

$carpeta = dirname(__DIR__) . '/Fotos/';
if (!is_dir($carpeta) || !is_writable($carpeta)) {
    error_log('PopiTeam: la carpeta Fotos no existe o no tiene permisos de escritura: ' . $carpeta);
    error_json('No se pudo guardar la imagen en el servidor.', 500);
}
$archivo = 'producto_' . bin2hex(random_bytes(6)) . '.' . TIPOS_IMAGEN[$info[2]];
if (!move_uploaded_file($f['tmp_name'], $carpeta . $archivo)) {
    error_json('No se pudo guardar la imagen en el servidor.', 500);
}
$ruta = 'Fotos/' . $archivo;

try {
    $st = db()->prepare(
        'INSERT INTO Producto (nombre_producto, precio, stock, categoria, imagen, activo) VALUES (?, ?, ?, ?, ?, 1)'
    );
    $st->execute([$nombre, $precio, $stock, $categoria, $ruta]);
    $id = (int) db()->lastInsertId();
} catch (PDOException $e) {
    @unlink($carpeta . $archivo);
    if ($e->getCode() === '23000') {
        error_json('Ya existe un producto con ese nombre.', 409);
    }
    error_servidor($e);
}

responder(['ok' => true, 'id_producto' => $id, 'imagen' => $ruta], 201);