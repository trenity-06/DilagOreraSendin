<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProofOfSale extends Model
{
    protected $table = 'tbl_proof_of_sale';

    protected $primaryKey = 'proof_id';

    protected $fillable = [
        'sale_id',
        'file_path',
        'file_name',
        'mime_type',
        'uploaded_by',
    ];
}

