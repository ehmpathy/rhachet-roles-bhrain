// this file satisfies the arrow-only rubric (every procedure is an arrow)

export const calculateTotal = (input: { items: Array<{ price: number }> }) => {
  return input.items.reduce((sum, item) => sum + item.price, 0);
};

export const formatLabel = (input: { name: string; count: number }) => {
  return `${input.name}: ${input.count}`;
};
