<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tbl_inventory_items', function (Blueprint $table) {
            $table->unsignedInteger('reorder_point')->default(0);
            $table->string('supplier')->nullable();
            $table->text('image')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('tbl_inventory_items', function (Blueprint $table) {
            $table->dropColumn(['reorder_point', 'supplier', 'image']);
        });
    }
};
