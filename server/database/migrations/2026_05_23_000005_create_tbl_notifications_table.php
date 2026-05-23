<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tbl_notifications', function (Blueprint $table) {
            $table->id('notification_id');

            $table->string('notification_type')->index();
            $table->string('endpoint')->nullable()->index();

            // Payload stored for audit/debug. JSON.
            $table->longText('payload_json')->nullable();

            $table->unsignedSmallInteger('attempts')->default(0);
            $table->unsignedSmallInteger('max_attempts')->default(3);

            $table->string('status')->default('pending')->index(); // pending|success|failed
            $table->text('last_error')->nullable();

            $table->unsignedBigInteger('created_by')->nullable()->index();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_notifications');
    }
};

