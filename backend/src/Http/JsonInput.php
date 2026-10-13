<?php

namespace App\Http;

use Symfony\Component\HttpFoundation\Request;

final class JsonInput
{
    public static function read(Request $request): array
    {
        try {
            $object = json_decode($request->getContent(), false, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            throw new InvalidApiInput('Invalid JSON body');
        }
        if (!$object instanceof \stdClass) {
            throw new InvalidApiInput('JSON body must be an object');
        }
        $data = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $nullable = ['firstName', 'lastName', 'phone', 'birthDate', 'gender'];
        $strings = ['email'=>180, 'password'=>4096, 'current_password'=>4096, 'currentPassword'=>4096,
            'new_password'=>4096, 'newPassword'=>4096, 'firstName'=>100, 'lastName'=>100,
            'phone'=>20, 'gender'=>20, 'label'=>255, 'name'=>255, 'icon'=>255, 'color'=>50,
            'type'=>20, 'status'=>20, 'token'=>512, 'code'=>512, 'date'=>10, 'birthDate'=>10];
        foreach ($strings as $field => $limit) {
            if (!array_key_exists($field, $data)) continue;
            if ($data[$field] === null && in_array($field, $nullable, true)) continue;
            if (!is_string($data[$field]) || mb_strlen($data[$field]) > $limit) {
                throw new InvalidApiInput($field.' must be a string of at most '.$limit.' characters');
            }
        }
        foreach (['date', 'birthDate'] as $field) {
            if (!isset($data[$field]) || ($field === 'birthDate' && $data[$field] === '')) continue;
            $date = \DateTimeImmutable::createFromFormat('!Y-m-d', $data[$field]);
            if (!$date || $date->format('Y-m-d') !== $data[$field] || substr($data[$field], 0, 4) === '0000') {
                throw new InvalidApiInput($field.' must be a valid date in YYYY-MM-DD format');
            }
        }
        foreach (['amount', 'monthly_limit'] as $field) {
            if (!array_key_exists($field, $data)) continue;
            $value = $data[$field];
            if ((!is_int($value) && !is_float($value) && !is_string($value)) || !is_numeric($value)
                || !is_finite((float) $value) || (float) $value < 0.01
                || (float) $value > 999999999.99
                || abs((float) $value * 100 - round((float) $value * 100)) > 0.00001) {
                throw new InvalidApiInput($field.' must be positive, finite and have at most two decimal places (maximum 999999999.99)');
            }
        }
        if (array_key_exists('category_id', $data)) {
            $id = $data['category_id'];
            if ((!is_int($id) && !is_string($id)) || !preg_match('/^[1-9][0-9]*$/D', (string) $id)
                || filter_var($id, FILTER_VALIDATE_INT) === false) {
                throw new InvalidApiInput('category_id must be a positive integer');
            }
        }
        if (array_key_exists('roles', $data) && (!is_array($object->roles) || !is_array($data['roles']) || !array_is_list($data['roles'])
            || count(array_filter($data['roles'], 'is_string')) !== count($data['roles']))) {
            throw new InvalidApiInput('Roles must be an array of strings');
        }
        return $data;
    }
}
