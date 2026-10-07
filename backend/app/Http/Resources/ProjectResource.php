<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $daysLeft = $this->deadline ? (int) now()->startOfDay()->diffInDays($this->deadline, false) : null;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'course' => $this->course,
            'color' => $this->color,
            'status' => $this->status,
            'deadline' => $this->deadline?->toDateString(),
            'days_left' => $daysLeft,
            'my_role' => $this->pivot?->role,
            'members_count' => $this->whenCounted('members'),
            'members' => $this->whenLoaded('members', fn () => $this->members->take(5)->map(fn ($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'avatar' => $m->avatar,
                'role' => $m->pivot->role,
            ])->values()),
            // Filled in when the Tasks module lands
            'tasks_total' => 0,
            'tasks_done' => 0,
            'created_at' => $this->created_at,
        ];
    }
}