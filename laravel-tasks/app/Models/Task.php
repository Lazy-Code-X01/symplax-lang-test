<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $fillable = ['title', 'done', 'processed_by', 'processed_at'];

    protected function casts(): array
    {
        return ['done' => 'boolean', 'processed_at' => 'datetime'];
    }
}
