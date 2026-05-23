<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryTransaction extends Model
{
    protected $table = 'tbl_inventory_transactions';

    protected $primaryKey = 'transaction_id';

    protected $fillable = [
        'item_id',
        'transaction_type',
        'quantity',
        'unit_price',
        'total_price',
        'sale_id',
        'reference',
        'created_by',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];
}

