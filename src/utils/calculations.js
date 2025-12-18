export const calculateNetAmount = (rate, discount) => {
  return rate - (rate * discount / 100);
};

export const calculateTotalAmount = (netAmount, qty) => {
  return netAmount * qty;
};