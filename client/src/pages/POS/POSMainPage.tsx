import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type { InventoryItem } from "../../interfaces/InventoryInterface";
import type { PosSaleApiResponse } from "../../interfaces/PosInterface";
import { InventoryService } from "../../services/InventoryService";
import { useToastMessage } from "../../hooks/useToastMessage";
import ToastMessage from "../../components/ToastMessage/ToastMessage";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 2,
});

const POSMainPage = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number>(0);
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<{ itemId: number; name: string; quantity: number; unitPrice: number }[]>([]);

  const toast = useToastMessage();

  // DB-driven sales
  const [sales, setSales] = useState<PosSaleApiResponse[]>([]);
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);

  useEffect(() => {
    document.title = "POS";
    fetchInventory();
    fetchSalesFromDB();
  }, []);

  const fetchInventory = async () => {
    setIsLoadingInventory(true);
    try {
      const items = await InventoryService.loadItems();
      setInventory(items);
      if (items.length > 0 && selectedItemId === 0) {
        // Find first item with stock if possible
        const firstWithStock = items.find(i => i.quantity > 0);
        if (firstWithStock) {
          setSelectedItemId(firstWithStock.id);
        } else {
          setSelectedItemId(items[0].id);
        }
      }
    } catch (e) {
      console.error("fetchInventory error:", e);
      toast.showError("Failed to load inventory.");
    } finally {
      setIsLoadingInventory(false);
    }
  };

  const fetchSalesFromDB = async () => {
    setIsLoadingSales(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://127.0.0.1:8000/api/pos/sales?limit=50", {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Fetch sales failed: ${res.status} ${errText}`);
      }

      const json = await res.json();
      const data = json?.data;
      setSales(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("fetchSalesFromDB error:", e);
      setSales([]);
    } finally {
      setIsLoadingSales(false);
    }
  };

  const activeItem = useMemo(() => {
    return inventory.find((item) => item.id === selectedItemId);
  }, [inventory, selectedItemId]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, entry) => sum + entry.quantity * entry.unitPrice, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, entry) => sum + entry.quantity, 0);
  }, [cart]);

  const handleAddToCart = () => {
    if (!activeItem) return;
    if (quantity <= 0) {
      toast.showError("Quantity must be at least 1.");
      return;
    }

    if (activeItem.quantity <= 0) {
      toast.showError("Item is out of stock.");
      return;
    }

    const inCart = cart.find(entry => entry.itemId === activeItem.id);
    const totalQtyRequested = (inCart?.quantity ?? 0) + quantity;

    if (totalQtyRequested > activeItem.quantity) {
      toast.showError(`Insufficient stock. Only ${activeItem.quantity} available.`);
      return;
    }

    setCart((current) => {
      const existing = current.find((entry) => entry.itemId === activeItem.id);

      if (existing) {
        return current.map((entry) =>
          entry.itemId === activeItem.id ? { ...entry, quantity: entry.quantity + quantity } : entry
        );
      }

      return [
        ...current,
        {
          itemId: activeItem.id,
          name: activeItem.name,
          quantity,
          unitPrice: activeItem.unitPrice,
        },
      ];
    });

    setQuantity(1);
  };

  const handleCartQuantityChange = (itemId: number, nextQuantity: number) => {
    if (nextQuantity <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }

    const itemInInventory = inventory.find(i => i.id === itemId);
    if (itemInInventory && nextQuantity > itemInInventory.quantity) {
      toast.showError(`Insufficient stock. Only ${itemInInventory.quantity} available.`);
      return;
    }

    setCart((current) => current.map((entry) => (entry.itemId === itemId ? { ...entry, quantity: nextQuantity } : entry)));
  };

  const handleRemoveFromCart = (itemId: number) => {
    setCart((current) => current.filter((entry) => entry.itemId !== itemId));
  };

  const handleCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!cart.length) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://127.0.0.1:8000/api/pos/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          Accept: "application/json",
        },
        body: JSON.stringify({
          line_items: cart.map((entry) => ({
            item_id: entry.itemId,
            quantity: entry.quantity,
            unit_price: entry.unitPrice,
          })),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || json.message || "Checkout failed");
      }

      toast.showSuccess("Sale completed successfully.");
      setCart([]);
      await fetchInventory(); // Refresh inventory stock
      await fetchSalesFromDB();
    } catch (e: any) {
      console.error(e);
      toast.showError(e.message || "Checkout failed.");
    }
  };

  const handleItemChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedItemId(Number(event.target.value));
  };

  const itemsWithStock = useMemo(() => {
    return inventory.filter(i => i.quantity > 0);
  }, [inventory]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Point of sale</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Sell quickly and keep a live record of recent transactions</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Select an item, add it to the cart, and complete a checkout.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Cart items</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{cartCount}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Cart total</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{currencyFormatter.format(cartTotal)}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Recent sales</p>
          <p className="mt-2 text-2xl font-bold text-sky-600">{sales.length}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Add to cart</h2>
            {isLoadingInventory && <span className="text-xs text-slate-400 animate-pulse">Updating...</span>}
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Item</label>
              <select
                value={selectedItemId}
                onChange={handleItemChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 disabled:bg-slate-50"
                disabled={inventory.length === 0}
              >
                {inventory.length === 0 ? (
                  <option value={0}>No items available</option>
                ) : (
                  inventory.map((item) => (
                    <option key={item.id} value={item.id} disabled={item.quantity <= 0}>
                      {item.name} — {currencyFormatter.format(item.unitPrice)} {item.quantity <= 0 ? "(OUT OF STOCK)" : ""}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Quantity</label>
              <input
                type="number"
                min="1"
                max={activeItem?.quantity || 1}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                disabled={!activeItem || activeItem.quantity <= 0}
              />
            </div>

            {activeItem && activeItem.quantity <= 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">Warning: This item is currently out of stock and cannot be sold.</span>
              </div>
            )}

            {activeItem && activeItem.quantity > 0 && activeItem.quantity <= activeItem.reorderPoint && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">Low stock alert: Only {activeItem.quantity} units remaining.</span>
              </div>
            )}

            {activeItem ? (
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">{activeItem.name}</p>
                <p className="mt-1">Price: {currencyFormatter.format(activeItem.unitPrice)}</p>
                <p className={`mt-1 font-medium ${activeItem.quantity <= 0 ? 'text-rose-600' : activeItem.quantity <= activeItem.reorderPoint ? 'text-amber-600' : 'text-emerald-600'}`}>
                  Available stock: {activeItem.quantity}
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-400 text-center italic">
                Select an item to see details
              </div>
            )}

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!activeItem || activeItem.quantity <= 0}
              className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors hover:bg-emerald-700"
            >
              Add to cart
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Checkout</h2>
          <form onSubmit={handleCheckout} className="mt-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Qty</th>
                    <th className="px-3 py-2">Price</th>
                    <th className="px-3 py-2">Total</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cart.map((entry) => (
                    <tr key={entry.itemId} className="text-slate-700">
                      <td className="px-3 py-3 font-semibold">{entry.name}</td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min="1"
                          value={entry.quantity}
                          onChange={(event) => handleCartQuantityChange(entry.itemId, Number(event.target.value))}
                          className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-emerald-400"
                        />
                      </td>
                      <td className="px-3 py-3">{currencyFormatter.format(entry.unitPrice)}</td>
                      <td className="px-3 py-3 font-semibold">{currencyFormatter.format(entry.unitPrice * entry.quantity)}</td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(entry.itemId)}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-700"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cart.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-slate-400 italic">
                        Your cart is empty
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span className="font-bold">Total</span>
                <span className="font-bold">{currencyFormatter.format(cartTotal)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={cart.length === 0}
              className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors hover:bg-slate-800"
            >
              Complete sale
            </button>
          </form>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recent sales</h2>
            <p className="text-sm text-slate-500">Loaded from SQL (tbl_sales).</p>
          </div>
          {isLoadingSales ? <div className="text-sm text-slate-500">Loading...</div> : null}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-base">
            <thead className="bg-slate-50">
              <tr className="text-left text-sm font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-8 py-4">Total</th>
                <th className="px-8 py-4">Items</th>
                <th className="px-8 py-4">Qty</th>
                <th className="px-8 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.map((sale) => (
                <tr key={sale.sale_id} className="text-slate-800 transition-colors hover:bg-slate-50">
                  <td className="px-8 py-6 font-bold text-emerald-600 text-lg">
                    {currencyFormatter.format(sale.total_amount)}
                  </td>
                  <td className="px-8 py-6">
                    {sale.line_items?.length ? (
                      <div className="text-sm text-slate-500">
                        {sale.line_items.map((li, idx) => (
                          <div key={`${sale.sale_id}-${li.item_name}-${idx}`}>{li.item_name}</div>
                        ))}
                      </div>
                    ) : <span className="text-slate-400">No items</span>}
                  </td>
                  <td className="px-8 py-6">
                    {sale.line_items?.length ? (
                      <div className="text-sm text-slate-500">
                        {sale.line_items.map((li, idx) => (
                          <div key={`${sale.sale_id}-${li.item_name}-${idx}`}>{li.quantity}</div>
                        ))}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-8 py-6 text-slate-600 text-sm">
                    {sale.sold_at ? new Date(sale.sold_at).toLocaleString() : ""}
                  </td>
                </tr>
              ))}

              {!isLoadingSales && sales.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No sales yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {toast.toasts.map((t, index) => (
        <ToastMessage
          key={t.id}
          id={t.id}
          message={t.message}
          isFailed={t.isFailed}
          isVisible={true}
          onClose={toast.closeToastMessage}
          index={index}
        />
      ))}
    </div>
  );
};

export default POSMainPage;

