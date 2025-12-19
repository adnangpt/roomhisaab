// Calculate how much each user paid in total
export function calculateTotalPaidPerUser(expenses) {
  const paid = {};
  
  expenses.forEach(expense => {
    const payer = expense.paidBy;
    // Ignore external/unpaid expenses for internal credits
    if (payer === '__EXTERNAL__') return;
    
    paid[payer] = (paid[payer] || 0) + expense.amount;
  });
  
  return paid;
}

// Calculate how much each user owes (their share)
export function calculateSharePerUser(expenses) {
  const shares = {};
  
  expenses.forEach(expense => {
    const { amount, includedMembers } = expense;
    if (!includedMembers || includedMembers.length === 0) return;
    
    const sharePerPerson = amount / includedMembers.length;
    
    includedMembers.forEach(memberId => {
      shares[memberId] = (shares[memberId] || 0) + sharePerPerson;
    });
  });
  
  return shares;
}

// Calculate external shares (unpaid liabilities like Rent/Electricity)
export function calculateExternalShares(expenses) {
  const externalShares = {};
  
  expenses.forEach(expense => {
    if (expense.paidBy !== '__EXTERNAL__') return;
    
    const { amount, includedMembers } = expense;
    if (!includedMembers || includedMembers.length === 0) return;
    
    const sharePerPerson = amount / includedMembers.length;
    
    includedMembers.forEach(memberId => {
      externalShares[memberId] = (externalShares[memberId] || 0) + sharePerPerson;
    });
  });
  
  return externalShares;
}

// Calculate net balance for each user (positive = owed money, negative = owes money)
// This only includes internal peer-to-peer expenses
export function calculateNetBalances(expenses, allMemberIds = []) {
  // Filter out external expenses for internal balance calculation
  const internalExpenses = expenses.filter(e => e.paidBy !== '__EXTERNAL__');
  
  const paid = calculateTotalPaidPerUser(internalExpenses);
  const shares = calculateSharePerUser(internalExpenses);
  
  const balances = {};
  
  // Ensure every member in the period has a balance entry (default 0)
  allMemberIds.forEach(userId => {
    balances[userId] = 0;
  });

  // Get all unique user IDs from expenses as well
  const expenseUsers = new Set([...Object.keys(paid), ...Object.keys(shares)]);
  expenseUsers.forEach(userId => {
    const paidAmount = paid[userId] || 0;
    const shareAmount = shares[userId] || 0;
    balances[userId] = paidAmount - shareAmount;
  });
  
  return balances;
}

// Calculate total liability (Internal Balance + External Shares)
export function calculateTotalLiabilities(balances, externalShares, allMemberIds = []) {
  const totalLiabilities = {};
  
  allMemberIds.forEach(userId => {
    const internalBalance = balances[userId] || 0;
    const externalShare = externalShares[userId] || 0;
    
    // Total Liability = (What you owe others) + (What you owe externally) - (What others owe you)
    // We represent this as a single number: 
    // Negative = You owe this much in total
    // Positive = You are owed this much net (after paying your external shares)
    totalLiabilities[userId] = internalBalance - externalShare;
  });
  
  return totalLiabilities;
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
