<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskUpdate extends Model
{
    public const UPDATED_AT = null;   // log rows are never edited

    protected $fillable = [
        'task_id', 'project_id', 'user_id', 'type', 'old_status', 'new_status', 'progress', 'note', 'proof_url', 'created_at',
    ];

    protected function casts(): array
    {
        return ['created_at' => 'datetime', 'progress' => 'integer'];
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
