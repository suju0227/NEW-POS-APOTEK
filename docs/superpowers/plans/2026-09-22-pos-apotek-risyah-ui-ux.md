# POS Apotek Risyah UI/UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the cashier-first POS workspace described in the approved UI/UX specification, with responsive navigation, product search, cart, cash/QRIS payment states, and transaction success flow.

**Architecture:** Keep the page composition split into focused client components under `components/pos/`, with demo state local to the prototype until backend contracts exist. Keep business rules out of visual components; expose explicit props and callbacks for product selection, quantity changes, payment confirmation, and errors. Use the existing project styles and installed UI primitives rather than adding new dependencies.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, existing shadcn components/icons.

**Spec:** `docs/superpowers/specs/2026-09-22-pos-apotek-risyah-ui-ux-design.md`

## Global Constraints

- Single-branch pharmacy POS.
- Desktop/tablet landscape first; usable at 768px and validated at 842x539.
- V1 payment methods are cash and QRIS dynamic from a static payload; QRIS confirmation is manual.
- Do not use color as the only status signal.
- Do not implement prescription/counseling pages in checkout V1.
- Do not put FEFO or authoritative money calculations only in UI.
- Do not use localStorage as the source of truth for transactions.
- Interactive controls have visible focus states and at least 44px touch targets.

## Review Focus

- Barcode/name search with zero, unique, and ambiguous results keeps focus and explains recovery; tested in Task 2.
- Unavailable, inactive, expired, and zero-stock products cannot enter the cart; tested in Task 2.
- Quantity changes never permit zero/negative values and update totals predictably; tested in Task 3.
- Duplicate payment submission shows processing state and disables CTA; tested in Task 4.
- QRIS explicitly requires manual cash-received confirmation and never claims provider confirmation; tested in Task 5.

---

### Task 1: Shell and responsive navigation

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css` only if existing tokens need POS-specific variables
- Create: `components/pos/app-shell.tsx`
- Create: `components/pos/sidebar-nav.tsx`
- Create: `components/pos/page-header.tsx`
- Test: browser smoke check at 842x539 and desktop width

**Interfaces:**
- `AppShell({ children, activeSection, userName, shiftStatus })` renders navigation and responsive content framing.
- `SidebarNav({ activeSection, collapsed, onNavigate })` exposes navigation labels and mobile drawer trigger.

- [ ] **Step 1: Inspect existing page, layout, CSS tokens, and installed UI components.**
- [ ] **Step 2: Replace the default page composition with an `AppShell` containing the cashier route surface.**
- [ ] **Step 3: Implement desktop sidebar, tablet drawer/collapsed state, header context, shift indicator, and user area using semantic landmarks.**
- [ ] **Step 4: Add responsive CSS so 842x539 keeps the checkout CTA visible and does not clip the navigation.**
- [ ] **Step 5: Run the app and verify keyboard focus, navigation labels, and responsive layout in the browser.**

### Task 2: Product search and product results

**Files:**
- Create: `components/pos/product-search.tsx`
- Create: `components/pos/product-result-card.tsx`
- Create: `components/pos/pos-types.ts`
- Create: `components/pos/pos-demo-data.ts`
- Modify: `app/page.tsx`
- Test: `components/pos/product-search.test.tsx` if the repository has a test runner; otherwise browser interaction checks

**Interfaces:**
- `Product { id, name, genericName, strength, unitLabel, barcode, price, availableStock, status, requiresPrescription }`.
- `ProductSearch({ products, onAddProduct })` handles barcode/name input and result states.
- `ProductResultCard({ product, onSelect })` disables unavailable products and exposes status text.

- [ ] **Step 1: Add representative demo products covering available, low-stock, unavailable, prescription, and ambiguous-search cases.**
- [ ] **Step 2: Write the search behavior test/check for empty input, exact barcode, unique name, ambiguous name, and not-found recovery.**
- [ ] **Step 3: Implement autofocus search input, category filters, keyboard selection, result cards, and inline messages.**
- [ ] **Step 4: Prevent inactive, expired, zero-stock, and unavailable products from being selected.**
- [ ] **Step 5: Verify the full search path with keyboard only and screen-reader-friendly labels.**

### Task 3: Cart and payment summary

**Files:**
- Create: `components/pos/cart-panel.tsx`
- Create: `components/pos/payment-summary.tsx`
- Create: `components/pos/status-badge.tsx`
- Modify: `app/page.tsx`
- Modify: `components/pos/pos-types.ts`
- Test: cart quantity and total behavior through component tests or browser checks

**Interfaces:**
- `CartLine { product, quantity, unitPrice, allocations }`.
- `CartPanel({ lines, onQuantityChange, onRemove, onClear })`.
- `PaymentSummary({ subtotal, discount, total, paymentMethod, processing, onMethodChange, onPay })`.

- [ ] **Step 1: Define cart line and batch allocation types, including FEFO disclosure data.**
- [ ] **Step 2: Add failing checks for quantity boundaries, subtotal, discount, total, empty cart, and multi-batch disclosure.**
- [ ] **Step 3: Implement cart rows with accessible quantity controls, remove/clear actions, and non-editable FEFO disclosure.**
- [ ] **Step 4: Implement sticky payment summary with visible text labels, Rupiah formatting, method selection, and disabled CTA states.**
- [ ] **Step 5: Verify the panel remains visible at 842x539 and updates after add, quantity, remove, and clear actions.**

### Task 4: Cash payment and transaction success

**Files:**
- Create: `components/pos/cash-payment-dialog.tsx`
- Create: `components/pos/transaction-success.tsx`
- Create: `components/pos/payment-utils.ts`
- Modify: `app/page.tsx`
- Test: `components/pos/payment-utils.test.ts` or browser interaction checks

**Interfaces:**
- `calculateChange(total: number, received: number): number` returns change or rejects insufficient payment.
- `CashPaymentDialog({ total, open, processing, onConfirm, onCancel })`.
- `TransactionSuccess({ transactionNumber, total, method, onNewTransaction, onViewDetail })`.

- [ ] **Step 1: Write checks for exact cash, excess cash, insufficient cash, invalid input, and duplicate submit state.**
- [ ] **Step 2: Implement the smallest pure cash calculation helper with Rupiah-safe integer values.**
- [ ] **Step 3: Implement cash dialog with quick amounts, live change, validation, and `Memproses...` disabled state.**
- [ ] **Step 4: Implement success state with receipt actions and reset callback.**
- [ ] **Step 5: Verify modal focus behavior, keyboard submission, insufficient-payment recovery, and success reset in the browser.**

### Task 5: QRIS dynamic payment presentation

**Files:**
- Create: `components/pos/qris-payment-dialog.tsx`
- Create: `components/pos/qris-demo-payload.ts`
- Modify: `app/page.tsx`
- Test: QRIS manual-confirmation browser check; CRC/TLV utility remains outside this UI-only plan and must use the approved database/domain spec

**Interfaces:**
- `QrisPaymentDialog({ total, transactionNumber, qrImageSrc, open, processing, onConfirm, onCancel })`.
- `QrisPaymentViewModel { total, transactionNumber, payloadSnapshot, displayStatus }`.

- [ ] **Step 1: Define demo QR presentation data without claiming provider verification.**
- [ ] **Step 2: Add checks for exact displayed amount, manual confirmation warning, cancel path, and processing lock.**
- [ ] **Step 3: Implement the QRIS dialog with amount, transaction number, QR region, explicit warning, confirm, and cancel actions.**
- [ ] **Step 4: Keep the QRIS panel presentation-only; do not put TLV/CRC parsing or payment truth in the component.**
- [ ] **Step 5: Verify the cashier cannot reach success without clicking manual confirmation and that cancel returns to checkout.**

### Task 6: Global loading, error, permission, and transaction states

**Files:**
- Create: `components/pos/feedback-states.tsx`
- Create: `components/pos/permission-gate.tsx`
- Create: `components/pos/confirm-action.tsx`
- Modify: `app/page.tsx`
- Test: browser smoke checks for loading, server error, permission denied, and stale-stock recovery

**Interfaces:**
- `FeedbackBanner({ tone, title, message, action })`.
- `PermissionGate({ allowed, permission, children })`.
- `ConfirmAction({ title, description, confirmLabel, onConfirm })`.

- [ ] **Step 1: Define explicit UI state values for idle, loading, empty, error, permission denied, processing, and success.**
- [ ] **Step 2: Implement reusable feedback components with text labels and accessible live-region behavior.**
- [ ] **Step 3: Add stale-stock error recovery and ensure no optimistic success appears after server failure.**
- [ ] **Step 4: Add permission-gated discount/void/clear actions with safe confirmation copy.**
- [ ] **Step 5: Verify all failure paths in the browser and remove any debug logging before completion.**

### Task 7: Whole-flow browser verification and metadata

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx` only for final composition fixes
- Modify: `app/globals.css` only for verified visual issues
- Test: browser at 842x539, 768px, and desktop width

- [ ] **Step 1: Update metadata title and description for POS Apotek Risyah.**
- [ ] **Step 2: Run the complete flow: search product → add quantity → inspect batch disclosure → choose cash → confirm → success → new transaction.**
- [ ] **Step 3: Run the QRIS flow: choose QRIS → verify amount/warning → cancel → reopen → manually confirm → success.**
- [ ] **Step 4: Verify keyboard-only navigation, visible focus, touch target sizing, status text, and no clipped CTA at required widths.**
- [ ] **Step 5: Run the project’s available lint/type/build checks and fix actionable failures.**
- [ ] **Step 6: Commit the completed implementation with `feat: build cashier-first POS dashboard`.**

## Self-Review

- **Spec coverage:** Navigation, checkout layout, search, cart, FEFO disclosure, cash, QRIS, success, errors, permission states, responsive behavior, accessibility, and acceptance criteria are assigned to Tasks 1–7. Transaction/stocks/purchasing supporting pages are intentionally not included in the first UI slice; they remain follow-up work because the approved spec identifies checkout as the primary implementation surface.
- **Placeholder scan:** No TBD, TODO, or unspecified implementation steps are used.
- **Type consistency:** Shared `Product`, `CartLine`, payment props, and callback names are defined before dependent tasks.
- **Review focus coverage:** Each listed failure mode has a named test/check in its owning task.

---

**Plan complete.** Review this plan before implementation. Which execution approach do you prefer?

- **Subagent-driven** — a fresh worker implements each task and a reviewer checks it before the next task.
- **Native** — I implement every task in this session, then perform a final review.

I recommend **Native** because the tasks are tightly coupled UI slices with shared TypeScript interfaces, making one implementation context simpler and faster to verify.
