<?php

namespace App\Jobs;

use App\Models\Task;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

/**
 * Stands in for real background work (sending an email, resizing an image).
 * Records which container ran it, so the page proves the worker did, not the web server.
 */
class ProcessTask implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(public Task $task)
    {
    }

    public function handle(): void
    {
        sleep(2);
        $this->task->update([
            'processed_by' => gethostname(),
            'processed_at' => now(),
        ]);
        Log::info('Processed task', ['id' => $this->task->id, 'host' => gethostname()]);
    }
}
