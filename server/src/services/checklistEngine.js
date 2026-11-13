function generateDivorceChecklist(profile = {}, progress = {}) {
  const items = [
    {
      id: 'fl-100',
      title: 'Petition - Marriage/Domestic Partnership (FL-100)',
      formCode: 'FL-100',
      actionType: 'Fill & File',
      whoSigns: 'You',
      description: 'Asks the court to start your divorce or legal separation case.',
      category: 'Initial Filing',
      status: progress['fl-100']?.status || 'not_started'
    },
    {
      id: 'fl-110',
      title: 'Summons (FL-110)',
      formCode: 'FL-110',
      actionType: 'Fill & File',
      whoSigns: 'Court Clerk',
      description: 'Notifies your spouse that a case has been started and contains automatic temporary restraining orders.',
      category: 'Initial Filing',
      status: progress['fl-110']?.status || 'not_started'
    },
    {
      id: 'fl-140',
      title: 'Declaration of Disclosure (FL-140)',
      formCode: 'FL-140',
      actionType: 'Fill & Serve',
      whoSigns: 'You',
      description: 'Cover sheet for mandatory preliminary financial disclosures.',
      category: 'Financial Disclosure',
      status: progress['fl-140']?.status || 'not_started'
    },
    {
      id: 'fl-150',
      title: 'Income and Expense Declaration (FL-150)',
      formCode: 'FL-150',
      actionType: 'Fill & Serve',
      whoSigns: 'You',
      description: 'Itemizes monthly income, tax deductions, and living expenses.',
      category: 'Financial Disclosure',
      status: progress['fl-150']?.status || 'not_started'
    }
  ];

  const completedCount = items.filter(i => i.status === 'completed' || i.status === 'signed_ready').length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return {
    items,
    completedCount,
    totalCount: items.length,
    progressPercent
  };
}

module.exports = {
  generateDivorceChecklist
};
