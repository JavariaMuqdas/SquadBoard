
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('title', 150);
            $table->text('description')->nullable();
            $table->enum('status', ['todo', 'in_progress', 'review', 'done'])->default('todo');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->unsignedTinyInteger('effort')->default(1);          // effort points: 1, 2, 3, 5, 8
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->date('due_date')->nullable();
            $table->unsignedTinyInteger('progress')->default(0);       // 0–100
            $table->unsignedInteger('position')->default(0);           // order inside its column
            $table->timestamp('submitted_at')->nullable();             // moved to "review"
            $table->timestamp('completed_at')->nullable();             // approved as "done"
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['project_id', 'status', 'position']);
            $table->index(['assigned_to', 'status']);
        });

        // Activity log — every change is one row. The contribution report is built from this.
        Schema::create('task_updates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 30);   // created, assigned, status, submitted, approved, returned, progress, note, edited
            $table->string('old_status', 20)->nullable();
            $table->string('new_status', 20)->nullable();
            $table->unsignedTinyInteger('progress')->nullable();
            $table->text('note')->nullable();
            $table->string('proof_url', 500)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['project_id', 'user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_updates');
        Schema::dropIfExists('tasks');
    }
};
