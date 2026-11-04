<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Laravel Tasks</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
    <main class="mx-auto max-w-xl px-4 py-12">
        <h1 class="text-2xl font-semibold">Laravel Tasks</h1>
        <p class="mt-1 text-sm text-zinc-500">
            PHP {{ PHP_VERSION }}, Laravel {{ app()->version() }}, {{ DB::connection()->getDriverName() }}, served by {{ $host }}
        </p>

        @if (session('status'))
            <div class="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{{ session('status') }}</div>
        @endif
        @error('title')
            <div class="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ $message }}</div>
        @enderror

        <form method="POST" action="/tasks" class="mt-6 flex gap-2">
            @csrf
            <input name="title" placeholder="Something to do" class="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm" autofocus>
            <button class="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white">Add</button>
        </form>

        <ul class="mt-6 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
            @forelse ($tasks as $task)
                <li class="flex items-center justify-between gap-3 px-4 py-3">
                    <form method="POST" action="/tasks/{{ $task->id }}/toggle" class="flex items-center gap-3">
                        @csrf
                        <button class="h-4 w-4 rounded border border-zinc-400 {{ $task->done ? 'bg-zinc-900' : '' }}" aria-label="Toggle"></button>
                        <span class="text-sm {{ $task->done ? 'text-zinc-400 line-through' : '' }}">{{ $task->title }}</span>
                    </form>
                    <span class="text-xs {{ $task->processed_at ? 'text-emerald-600' : 'text-amber-600' }}">
                        {{ $task->processed_at ? 'processed by '.$task->processed_by : 'waiting for worker' }}
                    </span>
                </li>
            @empty
                <li class="px-4 py-6 text-center text-sm text-zinc-500">No tasks yet.</li>
            @endforelse
        </ul>

        <p class="mt-4 text-xs text-zinc-400"><a href="/api/stats" class="underline">/api/stats</a></p>
    </main>
</body>
</html>
