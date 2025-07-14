# Invoice Features Implementation

This document outlines the implementation of enhanced invoice features in the Telehealth application, including subscription plan integration, product selection, and discount functionality.

## Overview

The invoice system has been enhanced with the following features:

1. **Subscription Plan Integration**: Invoices can be linked to subscription plans, automatically populating line items.
2. **Product Selection**: Line items can be linked to products from the product catalog.
3. **Discount Functionality**: Discounts can be applied to invoices, with support for both percentage and fixed amount discounts.
4. **Tax Calculation**: Tax rates can be applied to invoices with automatic calculation of tax amounts.

## Database Changes

A new migration (`20250508000000_add_invoice_features.sql`) has been created to add the necessary columns to the `invoices` table:

- `billing_type`: Type of billing (one-time or recurring)
- `recurring_frequency`: Frequency for recurring invoices (weekly, monthly, quarterly, annually)
- `recurring_duration`: Number of billing cycles for recurring invoices (0 for indefinite)
- `subscription_plan_id`: Reference to subscription plan if invoice is for a subscription
- `discount_id`: Reference to discount applied to this invoice
- `discount_amount`: Amount of discount applied to this invoice
- `tax_rate`: Tax rate percentage applied to this invoice
- `tax_amount`: Amount of tax applied to this invoice

Foreign key constraints have been added to link invoices to subscription plans and discounts, along with appropriate indexes for performance optimization.

## Component Changes

### CreateInvoiceModal Component

A new `CreateInvoiceModal` component has been created in `src/components/invoices/CreateInvoiceModal.jsx` with the following features:

- Customer information section with patient selection and email
- Subscription plan selection
- Line items management with product selection
- Discount code application
- Tax rate input
- Summary section with subtotal, discount, tax, and total calculation

### InvoicePage Component

The `InvoicePage` component has been updated to use the new `CreateInvoiceModal` component instead of the inline modal implementation.

## How to Use

### Creating an Invoice

1. Click "Create Invoice" button on the Invoices page
2. Select a patient
3. Add line items manually or by selecting products
4. Optionally select a subscription plan to auto-populate line items
5. Optionally apply a discount code
6. Set tax rate if applicable
7. Click "Create Invoice"

## Implementation Details

### Discount Application

When a discount code is entered and the "Apply" button is clicked, the system:

1. Verifies the discount code exists and is active
2. Calculates the discount amount based on the discount type (percentage or fixed)
3. Updates the invoice total

### Tax Calculation

Tax is calculated based on the subtotal after discount:

```
taxAmount = (subtotal - discountAmount) * (taxRate / 100)
```

### Subscription Plan Integration

When a subscription plan is selected:

1. The line items are automatically populated with the subscription plan details

## Migration

To apply the database migration, run the following script:

```bash
./apply-invoice-features-migration.sh
```

This will add the necessary columns to the `invoices` table and set up the foreign key constraints.

## Future Enhancements

Potential future enhancements to the invoice system:

1. **Invoice Templates**: Allow creation of invoice templates for common scenarios
2. **Automatic Recurring Billing**: Implement a system to automatically generate and process recurring invoices
3. **Bulk Invoice Creation**: Allow creation of multiple invoices at once
4. **Invoice Customization**: Allow customization of invoice appearance and content
5. **Payment Integration**: Integrate with payment processors for direct payment collection
