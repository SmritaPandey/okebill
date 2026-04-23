import React from 'react';

/**
 * OkeBill Brand Name component
 * Renders the brand name with the distinctive small "e" in emerald green
 * to emphasize e-bills and e-transactions.
 *
 * Usage: <BrandName /> or <BrandName className="text-xl" />
 */

interface BrandNameProps {
  className?: string;
  /** Use plain text without the colored "e" (for alt tags, toasts, etc.) */
  plain?: boolean;
}

export const BRAND_NAME = 'OkeBill';
export const BRAND_TAGLINE = 'Simple | Hisab | Accurate';
export const BRAND_DOMAIN = 'okebill.com';
export const BRAND_EMAIL = 'support@okebill.com';

const BrandName: React.FC<BrandNameProps> = ({ className = '', plain }) => {
  if (plain) {
    return <span className={className}>OkeBill</span>;
  }

  return (
    <span className={className}>
      Ok<span className="text-emerald-500">e</span>Bill
    </span>
  );
};

export default BrandName;
