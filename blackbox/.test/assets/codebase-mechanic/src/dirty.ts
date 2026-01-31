export function calculateTotal(items: Array<{ price: number }>) {
  let total = 0;
  for (const item of items) {
    total += item.price;
  }
  return total;
}

export function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

function validateEmail(email: string) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

export function processOrder(orderId: string, items: Array<{ price: number }>) {
  const total = calculateTotal(items);
  const formatted = formatPrice(total, 'USD');
  const isValid = validateEmail('test@example.com');
  return { orderId, total, formatted, isValid };
}

export function sendNotification(userId: string, message: string) {
  console.log(`send to ${userId}: ${message}`);
  return { sent: true, userId, message };
}
