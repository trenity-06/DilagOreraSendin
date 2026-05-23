<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tbl_proof_of_sale', function (Blueprint $table) {
            $table->id('proof_id');

            $table->unsignedBigInteger('sale_id')->index();
            $table->foreign('sale_id')->references('sale_id')->on('tbl_sales');

            $table->string('file_path'); // stored in storage
            $table->string('file_name')->nullable();
            $table->string('mime_type')->nullable();

            $table->unsignedBigInteger('uploaded_by')->nullable()->index();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_proof_of_sale');
    }
};

