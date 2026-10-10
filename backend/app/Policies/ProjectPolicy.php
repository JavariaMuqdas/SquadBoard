<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;

class ProjectPolicy
{
    /** Any member (leader, member, supervisor) can open the project. */
    public function view(User $user, Project $project): bool
    {
        return $user->roleIn($project) !== null;
    }

    /** Only the leader invites, revokes and removes people. */
    public function manageMembers(User $user, Project $project): bool
    {
        return $user->roleIn($project) === 'leader';
    }

    /** Only the leader edits, archives or deletes the project. */
    public function update(User $user, Project $project): bool
    {
        return $user->roleIn($project) === 'leader';
    }

    /** Leader and supervisor create, edit, assign, delete and approve tasks. */
    public function manageTasks(User $user, Project $project): bool
    {
        return in_array($user->roleIn($project), ['leader', 'supervisor'], true);
    }

    /** Managers, or the person the task is assigned to, can move it and post progress. */
    public function workOnTask(User $user, Project $project, Task $task): bool
    {
        return $this->manageTasks($user, $project) || $task->assigned_to === $user->id;
    }
}