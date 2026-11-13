function calculatePostDivorceProjection({ profile = {}, agentMemory = {}, wiki = {} }) {
  const userGrossMonthly = Number(profile.userGrossMonthlyIncome || profile.income_self || 0);
  const spouseGrossMonthly = Number(profile.spouseGrossMonthlyIncome || profile.income_spouse || 0);

  let estimatedSpousalSupport = 0;
  if (userGrossMonthly < spouseGrossMonthly) {
    estimatedSpousalSupport = Math.max(0, Math.round((spouseGrossMonthly * 0.4) - (userGrossMonthly * 0.5)));
  }

  const netMonthlyEstimatedIncome = userGrossMonthly + estimatedSpousalSupport;
  const estimatedMonthlyLivingExpenses = Number(profile.monthlyLivingExpenses || 3500);
  const netMonthlySurplusOrDeficit = netMonthlyEstimatedIncome - estimatedMonthlyLivingExpenses;

  return {
    userGrossMonthly,
    spouseGrossMonthly,
    estimatedSpousalSupport,
    netMonthlyEstimatedIncome,
    estimatedMonthlyLivingExpenses,
    netMonthlySurplusOrDeficit,
    isSurplus: netMonthlySurplusOrDeficit >= 0
  };
}

module.exports = {
  calculatePostDivorceProjection
};
