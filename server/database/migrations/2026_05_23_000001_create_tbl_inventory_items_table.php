<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tbl_inventory_items', function (Blueprint $table) {
            $table->id('item_id');

            $table->string('name');
            $table->string('category')->index(); // e.g., food, snack
            $table->string('sku')->nullable()->unique();

            $table->string('unit')->default('unit'); // e.g., pcs, kg
            $table->unsignedInteger('current_stock')->default(0);

            // Pricing used for revenue/reports. Optional depending on your business.
            $table->decimal('purchase_cost', 12, 2)->default(0);
            $table->decimal('sell_price', 12, 2)->default(0);

            $table->boolean('is_deleted')->default(false)->index();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_inventory_items');
    }
};

