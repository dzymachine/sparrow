function getGuidedFormSchema(docItem = {}, profile = {}, agentMemory = {}) {
  return {
    formCode: docItem.formCode || 'FORM',
    title: docItem.title || 'California Court Form',
    sections: [
      {
        title: 'Basic Information',
        fields: [
          { key: 'fullName', label: 'Full Legal Name', type: 'text', required: true },
          { key: 'spouseName', label: "Spouse's Full Legal Name", type: 'text', required: true },
          { key: 'signatureName', label: 'Electronic Signature Name', type: 'text', required: true },
          { key: 'perjuryConfirmed', label: 'I declare under penalty of perjury that the foregoing is true and correct.', type: 'checkbox', required: true }
        ]
      }
    ]
  };
}

function buildDefaultValues(schema = {}) {
  const defaults = {};
  for (const sec of schema.sections || []) {
    for (const f of sec.fields || []) {
      defaults[f.key] = f.type === 'checkbox' ? false : '';
    }
  }
  return defaults;
}

module.exports = {
  getGuidedFormSchema,
  buildDefaultValues
};
