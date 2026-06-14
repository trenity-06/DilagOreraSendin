import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type { InventoryItem } from "../../interfaces/InventoryInterface";
import type { PosSaleApiResponse } from "../../interfaces/PosInterface";

const INVENTORY_STORAGE_KEY = "inventory-items";

// Use the same localStorage key as Dashboard/Inventory so POS has inventory to sell.
const loadInitialInventory = (): InventoryItem[] => {
  if (typeof window === "undefined") return [] as InventoryItem[];

  try {
    const storedItems = window.localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (!storedItems) return [] as InventoryItem[];

    const parsed = JSON.parse(storedItems);
    return Array.isArray(parsed) ? (parsed as InventoryItem[]) : ([] as InventoryItem[]);
  } catch {
    return [] as InventoryItem[];
  }
};

const initialInventory: InventoryItem[] = loadInitialInventory();

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 2,
});

const POSMainPage = () => {
  const [selectedItemId, setSelectedItemId] = useState<number>(initialInventory[0]?.id ?? 0);
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<{ itemId: number; name: string; quantity: number; unitPrice: number }[]>([]);

  // DB-driven sales
  const [sales, setSales] = useState<PosSaleApiResponse[]>([]);
  const [isLoadingSales, setIsLoadingSales] = useState(false);

  useEffect(() => {
    document.title = "POS";
  }, []);

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
      // IMPORTANT: preserve existing sales in case of empty array during transition.
      setSales(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("fetchSalesFromDB error:", e);
      setSales([]);
    } finally {
      setIsLoadingSales(false);
    }
  };

  useEffect(() => {
    fetchSalesFromDB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeItem = useMemo(() => {
    return initialInventory.find((item) => item.id === selectedItemId) ?? initialInventory[0];
  }, [selectedItemId]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, entry) => sum + entry.quantity * entry.unitPrice, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, entry) => sum + entry.quantity, 0);
  }, [cart]);

  const handleAddToCart = () => {
    if (!activeItem || quantity <= 0) return;

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

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Checkout failed: ${res.status} ${errText}`);
      }

      // Refresh sales from DB so the table reflects SQL data.
      await fetchSalesFromDB();
    } catch (e) {
      console.error(e);
      // Don’t modify sales UI locally; DB is source of truth.
    }

    setCart([]);
  };

  const handleItemChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedItemId(Number(event.target.value));
  };

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
          <h2 className="text-lg font-semibold text-slate-900">Add to cart</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Item</label>
              <select
                value={selectedItemId}
                onChange={handleItemChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              >
                {initialInventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} — {currencyFormatter.format(item.unitPrice)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              />
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">{activeItem?.name ?? ""}</p>
              <p className="mt-1">Price: {currencyFormatter.format(activeItem?.unitPrice ?? 0)}</p>
              <p className="mt-1">Available stock: {activeItem?.quantity ?? 0}</p>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
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
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
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
              className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
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
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                    No sales yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default POSMainPage;

