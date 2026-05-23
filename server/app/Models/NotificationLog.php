<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationLog extends Model
{
    protected $table = 'tbl_notifications';

    protected $primaryKey = 'notification_id';

    protected $fillable = [
        'notification_type',
        'endpoint',
        'payload_json',
        'attempts',
        'max_attempts',
        'status',
        'last_error',
        'created_by',
    ];

    protected $casts = [
        'payload_json' => 'array',
    ];
}

