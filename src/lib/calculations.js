// Calculate how much each user paid in total
export function calculateTotalPaidPerUser(expenses) {
  const paid = {};
  
  expenses.forEach(expense => {
    const payer = expense.paidBy;
    paid[payer] = (paid[payer] || 0) + expense.amount;
  });
  
  return paid;
}

// Calculate how much each user owes (their share)
export function calculateSharePerUser(expenses) {
  const shares = {};
  
  expenses.forEach(expense => {
    const { amount, includedMembers } = expense;
    const sharePerPerson = amount / includedMembers.length;
    
    includedMembers.forEach(memberId => {
      shares[memberId] = (shares[memberId] || 0) + sharePerPerson;
    });
  });
  
  return shares;
}

// Calculate net balance for each user (positive = owed money, negative = owes money)
export function calculateNetBalances(expenses) {
  const paid = calculateTotalPaidPerUser(expenses);
  const shares = calculateSharePerUser(expenses);
  
  // Get all unique user IDs
  const allUsers = new Set([...Object.keys(paid), ...Object.keys(shares)]);
  
  const balances = {};
  allUsers.forEach(userId => {
    const paidAmount = paid[userId] || 0;
    const shareAmount = shares[userId] || 0;
    balances[userId] = paidAmount - shareAmount;
  });
  
  return balances;
}

// Generate settlement transactions (who owes whom)
export function generateSettlements(balances) {
  // Separate into creditors (positive balance) and debtors (negative balance)
  const creditors = [];
  const debtors = [];
  
  Object.entries(balances).forEach(([userId, balance]) => {
    if (balance > 0.01) {
      creditors.push({ userId, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ userId, amount: -balance });
    }
  });
  
  // Sort by amount (largest first)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);
  
  const settlements = [];
  
  // Match debtors to creditors
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    
    const amount = Math.min(debtor.amount, creditor.amount);
    
    if (amount > 0.01) {
      settlements.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
      });
    }
    
    debtor.amount -= amount;
    creditor.amount -= amount;
    
    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }
  
  return settlements;
}

// Format currency in INR
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Get expense type label
export function getExpenseTypeLabel(type) {
  const labels = {
    rent: 'Rent',
    rashan: 'Rashan',
    electricity: 'Electricity',
  };
  return labels[type] || type;
}

// Get expense type icon
export function getExpenseTypeIcon(type) {
  const icons = {
    rent: '🏠',
    rashan: '🛒',
    electricity: '⚡',
  };
  return icons[type] || '💰';
}
