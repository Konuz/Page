<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

function cms_validate(array $data, array $rules): array
{
    $errors = [];

    foreach ($rules as $field => $definitions) {
        $value = $data[$field] ?? null;
        foreach ((array) $definitions as $rule) {
            [$name, $param] = array_pad(explode(':', (string) $rule, 2), 2, null);
            $name = trim($name);

            switch ($name) {
                case 'required':
                    if ($value === null || $value === '' || (is_array($value) && count($value) === 0)) {
                        $errors[$field][] = 'Pole jest wymagane.';
                    }
                    break;
                case 'string':
                    if ($value !== null && !is_string($value)) {
                        $errors[$field][] = 'Pole musi być tekstem.';
                    }
                    break;
                case 'integer':
                    if ($value !== null && filter_var($value, FILTER_VALIDATE_INT) === false) {
                        $errors[$field][] = 'Pole musi być liczbą całkowitą.';
                    }
                    break;
                case 'numeric':
                    if ($value !== null && !is_numeric($value)) {
                        $errors[$field][] = 'Pole musi być liczbą.';
                    }
                    break;
                case 'max':
                    $limit = (int) $param;
                    if (is_string($value) && cms_strlen($value) > $limit) {
                        $errors[$field][] = "Pole nie może przekraczać {$limit} znaków.";
                    }
                    break;
                case 'in':
                    $allowed = array_map('trim', explode(',', (string) $param));
                    if ($value !== null && !in_array((string) $value, $allowed, true)) {
                        $errors[$field][] = 'Nieprawidłowa wartość.';
                    }
                    break;
                case 'slug':
                    if ($value !== null && !preg_match('/^[a-z0-9-]+$/', (string) $value)) {
                        $errors[$field][] = 'Dozwolone są tylko małe litery, cyfry i myślniki.';
                    }
                    break;
                case 'regex':
                    if ($value !== null && !preg_match('#' . $param . '#', (string) $value)) {
                        $errors[$field][] = 'Nieprawidłowy format.';
                    }
                    break;
                case 'nullable':
                    // nic nie robimy – pozostawiamy możliwość null
                    break;
            }
        }
    }

    return $errors;
}

function cms_assert_valid(array $data, array $rules): void
{
    $errors = cms_validate($data, $rules);
    if (!empty($errors)) {
        cms_api_error('Nieprawidłowe dane wejściowe.', 422, $errors);
    }
}

if (!function_exists('cms_strlen')) {
    function cms_strlen(string $value): int
    {
        return function_exists('mb_strlen') ? mb_strlen($value) : strlen($value);
    }
}
