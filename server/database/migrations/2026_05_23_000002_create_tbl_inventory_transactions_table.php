<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tbl_inventory_transactions', function (Blueprint $table) {
            $table->id('transaction_id');

            $table->unsignedBigInteger('item_id')->index();
            $table->foreign('item_id')->references('item_id')->on('tbl_inventory_items');

            // IN = restock, OUT = sale/consumption
            $table->enum('transaction_type', ['IN', 'OUT'])->index();

            $table->unsignedInteger('quantity');

            // For OUT transactions, unit_price may represent sell_price at time of sale.
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->decimal('total_price', 12, 2)->default(0);

            // Link to sale if OUT; allow nullable for manual adjustments.
            $table->unsignedBigInteger('sale_id')->nullable()->index();

            // Reference text for auditing (e.g., POS code)
            $table->string('reference')->nullable()->index();

            $table->unsignedBigInteger('created_by')->nullable()->index();

            $table->timestamps();

            // Note: created_by FK intentionally omitted for flexibility.
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_inventory_transactions');
    }
};

