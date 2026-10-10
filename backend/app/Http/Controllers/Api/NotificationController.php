<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /** GET /api/notifications?filter=unread&limit=30 */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $limit = min(100, max(1, (int) $request->query('limit', 30)));

        $query = $request->query('filter') === 'unread' ? $user->unreadNotifications() : $user->notifications();

        $items = $query->latest()->limit($limit)->get()->map(fn ($n) => [
            'id' => $n->id,
            ...$n->data,
            'read_at' => $n->read_at,
            'created_at' => $n->created_at,
        ]);

        return response()->json([
            'data' => $items,
            'unread_count' => $user->unreadNotifications()->count(),
        ]);
    }

    public function read(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->whereKey($id)->firstOrFail();
        $notification->markAsRead();

        return response()->json(['unread_count' => $request->user()->unreadNotifications()->count()]);
    }

    public function readAll(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->json(['unread_count' => 0]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $request->user()->notifications()->whereKey($id)->delete();

        return response()->json(['unread_count' => $request->user()->unreadNotifications()->count()]);
    }
}