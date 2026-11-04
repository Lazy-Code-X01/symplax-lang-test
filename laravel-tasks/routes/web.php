<?php

use App\Jobs\ProcessTask;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('tasks', [
        'tasks' => Task::latest()->limit(20)->get(),
        'host' => gethostname(),
    ]);
});

Route::post('/tasks', function (Request $request) {
    $data = $request->validate(['title' => 'required|string|max:120']);
    $task = Task::create($data);
    ProcessTask::dispatch($task);

    return redirect('/')->with('status', 'Task added. The worker will pick it up in a moment.');
});

Route::post('/tasks/{task}/toggle', function (Task $task) {
    $task->update(['done' => ! $task->done]);

    return redirect('/');
});

Route::get('/api/stats', function () {
    return response()->json([
        'php' => PHP_VERSION,
        'laravel' => app()->version(),
        'database' => DB::connection()->getDriverName(),
        'queue' => config('queue.default'),
        'tasks' => Task::count(),
        'processed' => Task::whereNotNull('processed_at')->count(),
        'pending_jobs' => DB::table('jobs')->count(),
        'failed_jobs' => DB::table('failed_jobs')->count(),
        'web_host' => gethostname(),
    ]);
});
