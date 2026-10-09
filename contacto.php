<?php
/**
 * PreGen — envío del formulario de contacto.
 *
 * Qué editar:
 *   $TO   → dirección que recibe los mensajes.
 *   $FROM → remitente. Tiene que ser una casilla del dominio pregen.tech
 *           (por ejemplo una creada en Hostinger → Emails), si no, el mail
 *           puede terminar en spam o no salir.
 */
declare(strict_types=1);

$TO = 'oliver@pregen.tech';
$FROM = 'web@pregen.tech';
$SUBJECT_PREFIX = 'Web PreGen';

/* ---------------------------------------------------------------- */

$accept = $_SERVER['HTTP_ACCEPT'] ?? '';
$isAjax = (($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'fetch') || strpos($accept, 'application/json') !== false;
$lang = (($_POST['lang'] ?? 'es') === 'en') ? 'en' : 'es';
$back = $lang === 'en' ? 'en/index.html' : 'index.html';
$anchor = $lang === 'en' ? '#contact' : '#contacto';

function respond(bool $ok, string $code): void
{
    global $isAjax, $back, $anchor;
    if ($isAjax) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code($ok ? 200 : ($code === 'invalid' ? 422 : 500));
        echo json_encode(['ok' => $ok, 'code' => $code]);
    } else {
        header('Location: ' . $back . '?contacto=' . ($ok ? 'ok' : $code) . $anchor, true, 303);
    }
    exit;
}

function clean(string $v): string
{
    return trim(strip_tags($v));
}

function len(string $v): int
{
    return function_exists('mb_strlen') ? mb_strlen($v, 'UTF-8') : strlen($v);
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Location: index.html', true, 303);
    exit;
}

// Anti-spam: campo trampa y envíos demasiado rápidos (se aceptan en silencio).
if (trim((string)($_POST['website'] ?? '')) !== '') {
    respond(true, 'ok');
}
$ts = (int)($_POST['ts'] ?? 0);
if ($ts > 0 && (microtime(true) * 1000 - $ts) < 2500) {
    respond(true, 'ok');
}

$name = clean((string)($_POST['nombre'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));
$role = clean((string)($_POST['rol'] ?? ''));
$msg = clean((string)($_POST['mensaje'] ?? ''));

if ($name === '' || $msg === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'invalid');
}
if (len($name) > 120 || len($email) > 160 || len($role) > 80 || len($msg) > 5000) {
    respond(false, 'invalid');
}
foreach ([$name, $email, $role] as $v) {
    if (preg_match('/[\r\n]/', $v)) {
        respond(false, 'invalid');
    }
}

$subject = $SUBJECT_PREFIX . ': mensaje de ' . $name;
$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$body = "Nombre: {$name}\n"
    . "Email: {$email}\n"
    . "Soy: {$role}\n"
    . "Idioma del sitio: {$lang}\n\n"
    . "Mensaje:\n{$msg}\n\n"
    . "— Enviado desde el formulario de pregen.tech el " . date('d/m/Y H:i') . "\n";

$headers = implode("\r\n", [
    'From: PreGen Web <' . $FROM . '>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
]);

$sent = @mail($TO, $encodedSubject, $body, $headers);
respond($sent, $sent ? 'ok' : 'mail');
