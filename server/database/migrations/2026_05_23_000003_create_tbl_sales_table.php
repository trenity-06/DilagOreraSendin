<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tbl_sales', function (Blueprint $table) {
            $table->id('sale_id');

            $table->unsignedBigInteger('created_by')->nullable()->index();

            $table->string('customer_name')->nullable()->index();

            $table->decimal('total_amount', 12, 2)->default(0);

            $table->timestamp('sold_at')->useCurrent();

            $table->boolean('is_deleted')->default(false)->index();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_sales');
    }
};

