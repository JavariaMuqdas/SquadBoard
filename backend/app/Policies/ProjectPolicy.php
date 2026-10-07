<?php

namespace App\Policies;

use App\Models\Project;
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
}