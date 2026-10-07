<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Account type chosen at signup. Project-level roles live in project_members.
            $table->enum('role', ['student', 'supervisor'])->default('student')->after('email');
            $table->string('google_id')->nullable()->unique()->after('password');
            $table->string('avatar')->nullable()->after('google_id');
            // Google-only users have no password
            $table->string('password')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'google_id', 'avatar']);
        });
    }
};
