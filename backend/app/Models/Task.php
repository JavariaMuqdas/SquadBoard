<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    public const STATUSES = ['todo', 'in_progress', 'review', 'done'];
    public const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
    public const EFFORTS = [1, 2, 3, 5, 8];

    protected $fillable = [
        'project_id', 'title', 'description', 'status', 'priority', 'effort',
        'assigned_to', 'created_by', 'due_date', 'progress', 'position',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'submitted_at' => 'datetime',
            'completed_at' => 'datetime',
            'effort' => 'integer',
            'progress' => 'integer',
            'position' => 'integer',
            // Integer casts so strict checks like `assigned_to === $user->id` work on every MySQL driver
            'project_id' => 'integer',
            'assigned_to' => 'integer',
            'created_by' => 'integer',
            'approved_by' => 'integer',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updates(): HasMany
    {
        return $this->hasMany(TaskUpdate::class);
    }

    public function isOverdue(): bool
    {
        return $this->due_date !== null && $this->status !== 'done' && $this->due_date->endOfDay()->isPast();
    }

    /** Writes one row to the activity log. */
    public function logUpdate(User $user, string $type, array $attributes = []): TaskUpdate
    {
        return TaskUpdate::create([
            'task_id' => $this->id,
            'project_id' => $this->project_id,
            'user_id' => $user->id,
            'type' => $type,
            ...$attributes,
        ]);
    }
}
