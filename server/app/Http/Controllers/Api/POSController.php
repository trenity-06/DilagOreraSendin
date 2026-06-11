<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class POSController extends Controller
{
    /**
     * Checkout endpoint.
     * Creates a sale, creates OUT inventory transactions, and reduces inventory stock.
     */
    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => ['nullable', 'string', 'max:255'],
            'line_items' => ['required', 'array', 'min:1'],
            'line_items.*.item_id' => ['required', 'integer', 'min:1'],
            'line_items.*.quantity' => ['required', 'integer', 'min:1'],
            'line_items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $user = $request->user();

        $customerName = $validated['customer_name'] ?? null;
        $lineItems = $validated['line_items'];

        $totalAmount = 0;
        foreach ($lineItems as $li) {
            $totalAmount += (float) $li['quantity'] * (float) $li['unit_price'];
        }

        $sale = null;

        DB::transaction(function () use (&$sale, $user, $customerName, $totalAmount, $lineItems) {
            $sale = Sale::create([
                'created_by' => $user?->user_id ?? null,
                'customer_name' => $customerName,
                'total_amount' => $totalAmount,
                'sold_at' => now(),
                'is_deleted' => false,
            ]);

            foreach ($lineItems as $li) {
                $item = InventoryItem::where('item_id', $li['item_id'])
                    ->where('is_deleted', false)
                    ->lockForUpdate()
                    ->first();

                if (!$item) {
                    throw new \RuntimeException('Inventory item not found: ' . $li['item_id']);
                }

                $qty = (int) $li['quantity'];
                $item->current_stock = (int) $item->current_stock - $qty;
                $item->save();

                $unitPrice = (float) $li['unit_price'];
                $totalPrice = $unitPrice * $qty;

                InventoryTransaction::create([
                    'item_id' => $item->item_id,
                    'transaction_type' => 'OUT',
                    'quantity' => $qty,
                    'unit_price' => $unitPrice,
                    'total_price' => $totalPrice,
                    'sale_id' => $sale->sale_id,
                    'reference' => 'POS',
                    'created_by' => $user?->user_id ?? null,
                ]);
            }
        });

        return response()->json([
            'message' => 'Sale recorded successfully.',
            'sale' => $sale,
        ], 200);
    }

    /**
     * List POS sales from DB (tbl_sales).
     * Shows latest sales first.
     */
    public function listSales(Request $request)
    {
        $limit = (int) $request->query('limit', 20);
        $limit = max(1, min(100, $limit));

        $sales = Sale::query()
            ->where('is_deleted', false)
            ->orderBy('sold_at', 'desc')
            ->limit($limit)
            ->get([
                'sale_id',
                'customer_name',
                'total_amount',
                'sold_at',
            ]);

        return response()->json([
            'message' => 'POS sales fetched successfully.',
            'data' => $sales->map(function ($s) {
                return [
                    'sale_id' => $s->sale_id,
                    'customer_name' => $s->customer_name,
                    'total_amount' => (float) $s->total_amount,
                    'sold_at' => $s->sold_at,
                ];
            }),
        ], 200);
    }
}

