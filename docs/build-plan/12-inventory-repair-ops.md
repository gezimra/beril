# Phase 12: Inventory And Repair Operations

## Goal

Strengthen internal operations with stock control, purchasing workflows, and deeper repair workshop management.

## In Scope

- Add stock reservation and release rules tied to checkout and order status.
- Add supplier, purchase order, and receiving workflows.
- Add low-stock, dead-stock, and margin reporting.
- Add technician assignment and internal repair board.
- Track repair parts usage, estimate approvals, and completion KPIs.

## Out Of Scope

- Warehouse robotics or barcode hardware integrations.
- Multi-location inventory transfer.
- Full ERP replacement.

## Routes

- Existing:
  - `/admin/products`
  - `/admin/orders`
  - `/admin/repairs`
- New:
  - `/admin/inventory`
  - `/admin/purchasing`
  - `/admin/suppliers`
  - `/admin/repairs/board`

## Data And Types

- Add inventory tables:
  - `stock_movements`
  - `stock_reservations`
  - `suppliers`
  - `purchase_orders`
  - `purchase_order_items`
- Add repair ops tables:
  - `repair_work_orders`
  - `repair_parts_used`
  - `repair_estimates`
  - `technician_assignments`
- Add enums:
  - `StockMovementType`
  - `PurchaseOrderStatus`
  - `WorkOrderStatus`
  - `TechnicianRole`

## Components

- `InventoryTable`.
- `StockMovementLedger`.
- `PurchaseOrderEditor`.
- `SupplierManager`.
- `RepairBoard`.
- `WorkOrderPanel`.

## Analytics

- Add internal KPI events:
  - `stock_reserved`
  - `stock_released`
  - `purchase_order_created`
  - `repair_assigned`
  - `repair_completed`

## SEO

- No direct public SEO scope.
- Keep all operational routes protected and non-indexed.

## Acceptance

- Stock reservation prevents overselling under concurrent checkout load.
- Purchase orders support creation, receiving, and reconciliation.
- Low-stock alerts are reliable and configurable.
- Repair board supports assignment, status flow, and estimate approval tracking.
- Management can report inventory turn, gross margin, and repair turnaround.

## Deferred

- Demand forecasting.
- Automatic replenishment rules.
- Multi-store operations.
