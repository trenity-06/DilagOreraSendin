<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    protected $table = 'tbl_inventory_items';

    protected $primaryKey = 'item_id';

    protected $fillable = [
        'name',
        'category',
        'sku',
        'unit',
        'current_stock',
        'purchase_cost',
        'sell_price',
        'is_deleted',
    ];

    protected $casts = [
        'current_stock' => 'integer',
        'purchase_cost' => 'decimal:2',
        'sell_price' => 'decimal:2',
        'is_deleted' => 'boolean',
    ];
}

