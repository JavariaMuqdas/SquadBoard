<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'oauth/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    // Required so the browser sends the session cookie to the API
    'supports_credentials' => true,
];
