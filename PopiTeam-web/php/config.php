<?php
declare(strict_types=1);

const DB_HOST = 'localhost';
const DB_NAME = 'popiteam';
const DB_USER = 'root';
const DB_PASS = 'usbw';

const CUOTA_SOCIO  = 12000;
const TIPO_SOCIO   = 'Pleno';
const SECTORES     = [       
    'Popular'      => 20000,
    'Platea'       => 80000,
    'Preferencial' => 120000,
];
const MAX_ENTRADAS_POR_COMPRA = 10;

header('Content-Type: application/json; charset=utf-8');

session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );
    }
    return $pdo;
}

function responder(array $datos, int $codigo = 200): void
{
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

function error_json(string $mensaje, int $codigo = 400): void
{
    responder(['ok' => false, 'mensaje' => $mensaje], $codigo);
}

function leer_json(): array
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        error_json('Método no permitido.', 405);
    }
    $tipo = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($tipo, 'application/json') !== 0) {
        error_json('Formato de pedido inválido.', 415);
    }
    $datos = json_decode(file_get_contents('php://input') ?: '', true);
    if (!is_array($datos)) {
        error_json('Datos inválidos.');
    }
    return $datos;
}

function texto(array $d, string $clave, int $max = 100): string
{
    $v = $d[$clave] ?? '';
    return is_string($v) ? mb_substr(trim($v), 0, $max) : '';
}

function requerir_sesion(): int
{
    if (empty($_SESSION['id_usuario'])) {
        error_json('Tenés que iniciar sesión.', 401);
    }
    return (int) $_SESSION['id_usuario'];
}

function validar_tarjeta(array $d): void
{
    $tipo   = mb_strtolower(texto($d, 'tipo_tarjeta', 20));
    $nombre = texto($d, 'nombre_tarjeta', 60);
    $numero = preg_replace('/[\s-]/', '', texto($d, 'numero_tarjeta', 30));
    $codigo = texto($d, 'codigo_seguridad', 4);

    if (!in_array($tipo, ['credito', 'credito', 'debito', 'debito'], true)) {
        error_json('Indica si la tarjeta es de credito o debito.');
    }
    if ($nombre === '') {
        error_json('Ingresa el nombre que figura en la tarjeta.');
    }
    if (!preg_match('/^\d{13,19}$/', $numero)) {
        error_json('El numero de tarjeta no es valido.');
    }
    if (!preg_match('/^\d{3,4}$/', $codigo)) {
        error_json('El codigo de seguridad no es valido.');
    }
}

function error_servidor(Throwable $e): void
{
    error_log('PopiTeam: ' . $e->getMessage());
    error_json('Ocurrio un error en el servidor. Proba de nuevo en un momento.', 500);
}
