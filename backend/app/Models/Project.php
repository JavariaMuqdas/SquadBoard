<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use HasFactory;

    protected $fillable = ['owner_id', 'name', 'description', 'course', 'color', 'deadline', 'status'];

    protected function casts(): array
    {
        return ['deadline' => 'date'];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_members')
            ->withPivot(['role', 'joined_at']);
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function activity(): HasMany
    {
        return $this->hasMany(TaskUpdate::class);
    }

    /** Leader + members (people who can be assigned tasks). */
    public function workers(): BelongsToMany
    {
        return $this->members()->wherePivotIn('role', ['leader', 'member']);
    }

    /** Users with a given project role, e.g. ->usersWithRole('leader'). */
    public function usersWithRole(string ...$roles)
    {
        return $this->members()->wherePivotIn('role', $roles)->get();
    }
}
