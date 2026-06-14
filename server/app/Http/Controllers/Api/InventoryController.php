<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $query = InventoryItem::query()
            ->where('is_deleted', false)
            ->orderByDesc('updated_at')
            ->orderByDesc('item_id');

        if ($search = $request->query('search')) {
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('supplier', 'like', "%{$search}%");
            });
        }

        $items = $query->get()->map(fn (InventoryItem $item) => $this->formatItem($item));

        return response()->json([
            'items' => $items,
        ], 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'quantity' => ['required', 'integer', 'min:0'],
            'reorder_point' => ['required', 'integer', 'min:0'],
            'unit_cost' => ['required', 'numeric', 'min:0'],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'supplier' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'string'],
        ]);

        $item = InventoryItem::create([
            'name' => $validated['name'],
            'category' => $validated['category'],
            'current_stock' => $validated['quantity'],
            'reorder_point' => $validated['reorder_point'],
            'purchase_cost' => $validated['unit_cost'],
            'sell_price' => $validated['unit_price'],
            'supplier' => $validated['supplier'] ?? null,
            'image' => $validated['image'] ?? null,
            'is_deleted' => false,
        ]);

        return response()->json([
            'message' => 'Inventory item created successfully.',
            'item' => $this->formatItem($item),
        ], 200);
    }

    public function update(Request $request, InventoryItem $inventoryItem)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'quantity' => ['required', 'integer', 'min:0'],
            'reorder_point' => ['required', 'integer', 'min:0'],
            'unit_cost' => ['required', 'numeric', 'min:0'],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'supplier' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'string'],
        ]);

        $inventoryItem->update([
            'name' => $validated['name'],
            'category' => $validated['category'],
            'current_stock' => $validated['quantity'],
            'reorder_point' => $validated['reorder_point'],
            'purchase_cost' => $validated['unit_cost'],
            'sell_price' => $validated['unit_price'],
            'supplier' => $validated['supplier'] ?? null,
            'image' => $validated['image'] ?? null,
        ]);

        return response()->json([
            'message' => 'Inventory item updated successfully.',
            'item' => $this->formatItem($inventoryItem->fresh()),
        ], 200);
    }

    public function destroy(InventoryItem $inventoryItem)
    {
        $inventoryItem->update(['is_deleted' => true]);

        return response()->json([
            'message' => 'Inventory item deleted successfully.',
        ], 200);
    }

    private function formatItem(InventoryItem $item): array
    {
        $quantity = (int) $item->current_stock;
        $reorderPoint = (int) $item->reorder_point;

        $status = 'In stock';

        if ($quantity <= 0) {
            $status = 'Out of stock';
        } elseif ($quantity <= $reorderPoint) {
            $status = 'Low stock';
        }

        return [
            'item_id' => $item->item_id,
            'id' => $item->item_id,
            'name' => $item->name,
            'category' => $item->category,
            'quantity' => $quantity,
            'reorder_point' => $reorderPoint,
            'unit_cost' => (float) $item->purchase_cost,
            'unit_price' => (float) $item->sell_price,
            'supplier' => $item->supplier,
            'image' => $item->image,
            'status' => $status,
            'last_updated' => $item->updated_at?->toIso8601String() ?? $item->created_at?->toIso8601String(),
        ];
    }
}
