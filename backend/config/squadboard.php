<?php

return [
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),
    'invite_expiry_days' => (int) env('INVITE_EXPIRY_DAYS', 7),
    'show_invite_links' => (bool) env('SHOW_INVITE_LINKS', false),

    // Free plan limits (paid plans come later)
    'free' => [
        'max_projects' => 3,   // active projects a user can lead
        'max_members' => 5,    // people per project, leader included
    ],

    'project_colors' => ['indigo', 'violet', 'emerald', 'amber', 'rose', 'sky'],
];