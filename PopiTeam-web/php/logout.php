<?php
require __DIR__ . '/config.php';
$_SESSION = [];
session_destroy();
responder(['ok' => true]);
