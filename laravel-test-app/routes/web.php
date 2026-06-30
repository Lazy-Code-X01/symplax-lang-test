<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'Laravel on Symplax',
        'status' => 'ok',
        'framework' => 'Laravel ' . app()->version(),
        'php_version' => PHP_VERSION,
    ]);
});

Route::get('/health', function () {
    return response()->json(['status' => 'healthy']);
});
