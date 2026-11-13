async function generateFilledDocumentPdf({ schema = {}, values = {}, stateJurisdiction = 'California' }) {
  const content = `PDF GENERATED FOR ${schema.title || 'California Form'}\nState: ${stateJurisdiction}\nUser: ${values.fullName || ''}\nSpouse: ${values.spouseName || ''}\nSigned: ${values.signatureName || ''}\nTimestamp: ${new Date().toISOString()}`;
  return Buffer.from(content, 'utf8');
}

module.exports = {
  generateFilledDocumentPdf
};
