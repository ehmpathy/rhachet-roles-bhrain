/**
 * .what = calculates the total price for a list of items
 * .why = centralizes price calculation logic for invoices
 */
export const calculateTotal = (input: { items: Array<{ price: number }> }) => {
  // sum all item prices
  const total = input.items.reduce((sum, item) => sum + item.price, 0);

  return total;
};

/**
 * .what = formats a price as a currency string
 * .why = ensures consistent price display across the app
 */
export const formatPrice = (input: { amount: number; currency: string }) => {
  // format with locale-aware number display
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: input.currency,
  }).format(input.amount);

  return formatted;
};

/**
 * .what = validates that an email address is well-formed
 * .why = prevents invalid emails from reach downstream systems
 */
export const validateEmail = (input: { email: string }) => {
  // check against standard email pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailPattern.test(input.email);

  return { isValid };
};
