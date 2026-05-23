<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    protected $table = 'tbl_sales';

    protected $primaryKey = 'sale_id';

    protected $fillable = [
        'created_by',
        'customer_name',
        'total_amount',
        'sold_at',
        'is_deleted',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'is_deleted' => 'boolean',
    ];
}

