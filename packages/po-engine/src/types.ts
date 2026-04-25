/**
 * Supplier-facing projection of an order. Mirrors `supplier_orders_view` SQL view.
 * NEVER contains buyer identity: no company_id, no buyer_order_number, no
 * requested_by, no approved_by, no po_file_url, no po_number.
 */
export interface SupplierOrder {
  id: string;
  supplierOrderNumber: string;
  vendorId: string;
  status:
    | "pending_payment"
    | "paid"
    | "confirmed"
    | "preparing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded"
    | "partially_refunded";
  subtotalHalalas: number;
  vatHalalas: number;
  totalHalalas: number;
  currency: "SAR";
  placedAt: string;
  updatedAt: string;
}

/**
 * Supplier-facing line item. Shipping address is shown (goods must get there)
 * but recipient_name is replaced with `MWRD Logistics — {supplierOrderNumber}`
 * at the view layer so the buyer company name never reaches the supplier.
 */
export interface SupplierOrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPriceHalalas: number;
  vatRate: number;
  lineTotalHalalas: number;
  shippingLabel: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingRegion: string;
  shippingPostalCode: string;
  shippingCountry: "SA";
}

export interface BuyerOrderInput {
  companyId: string;
  vendorId: string;
  requestedBy: string;
  items: {
    productId: string;
    quantity: number;
    unitPriceHalalas: number;
    vatRate: number;
    destinationAddressId: string;
  }[];
  poFileUrl?: string;
  poNumber?: string;
}
