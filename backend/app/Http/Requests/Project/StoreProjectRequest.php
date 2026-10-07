<?php

namespace App\Http\Requests\Project;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Only students create projects (they become the leader). Supervisors are invited.
        return $this->user()->role === 'student';
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:3', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'course' => ['nullable', 'string', 'max:100'],
            'deadline' => ['nullable', 'date', 'after:today'],
            'color' => ['nullable', Rule::in(config('squadboard.project_colors'))],
        ];
    }

    public function messages(): array
    {
        return ['deadline.after' => 'The deadline must be a future date.'];
    }
}