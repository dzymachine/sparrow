import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Download,
  Save,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  FileSignature,
  ExternalLink,
  Lightbulb
} from 'lucide-react';
import { api } from '../services/api';
import { useAgentMemory } from '../context/AgentMemoryContext';

export default function GuidedDocumentModal({ docItem, onClose }) {
  const { activeUserId, refreshChecklist } = useAgentMemory();

  const [schema, setSchema] = useState(null);
  const [defaults, setDefaults] = useState({});
  const [values, setValues] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadForm() {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const res = await api.getDocumentForm(activeUserId, docItem.id);
        if (mounted) {
          setSchema(res.schema);
          setDefaults(res.defaults || {});
          setValues(res.values || {});
          refreshChecklist(activeUserId);
        }
        await refreshChecklist(activeUserId);
      } catch (err) {
        if (mounted) setErrorMessage('Unable to load the guided form. Please check your server connection.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadForm();
    return () => { mounted = false; };
  }, [activeUserId, docItem.id]);

  const requiredStats = useMemo(() => {
    if (!schema?.sections) return { filled: 0, total: 0 };
    let total = 0;
    let filled = 0;
    for (const sec of schema.sections) {
      for (const f of sec.fields) {
        if (f.required) {
          total += 1;
          const v = values[f.key];
          if (f.type === 'checkbox' ? Boolean(v) : String(v ?? '').trim().length > 0) {
            filled += 1;
          }
        }
      }
    }
    return { filled, total };
  }, [schema, values]);

  const handleChange = (key, val) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    setSaveMessage('');
  };

  const handleUseDefault = (key) => {
    if (defaults[key] !== undefined) {
      handleChange(key, defaults[key]);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setSaveMessage('');
    setErrorMessage('');
    try {
      await api.saveDocumentForm(activeUserId, docItem.id, values);
      await refreshChecklist(activeUserId);
      setSaveMessage('Draft saved! Progress tracker updated automatically.');
    } catch (err) {
      setErrorMessage('Could not save draft right now.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    setErrorMessage('');
    try {
      const blob = await api.downloadFilledPdf(activeUserId, docItem.id, values);
      await refreshChecklist(activeUserId);

      const safeCode = String(schema?.formCode || docItem.formCode || docItem.id).replace(/[^a-zA-Z0-9_-]/g, '_');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Sparrow_${safeCode}_Filled.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSaveMessage('Filled PDF downloaded!');
    } catch (err) {
      setErrorMessage('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-[#FAF9F6] rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-brand-200 overflow-hidden animate-fade-in">
        {/* Top DocuSign-style Action Bar */}
        <div className="bg-white border-b border-slate-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-brand-100 text-brand-800">
                {docItem.formCode}
              </span>
              <span className="text-xs font-semibold text-emerald-700">
                {requiredStats.filled}/{requiredStats.total} required fields ready
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-base truncate">
              {docItem.title}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isSaving || isLoading}
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
            </button>

            <button
              type="button"
              disabled={isDownloading || isLoading}
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Generating PDF...' : 'Download Filled PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status / Feedback Banner */}
        {(saveMessage || errorMessage) && (
          <div className={`px-5 py-2 text-xs font-semibold flex items-center gap-2 ${
            errorMessage ? 'bg-rose-50 text-rose-800 border-b border-rose-200' : 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
          }`}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage || saveMessage}</span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {isLoading ? (
            <div className="py-16 text-center text-sm text-slate-500">
              Preparing your guided document with pre-filled profile data...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Guided Form Column */}
              <div className="lg:col-span-2 space-y-6">
                {(schema?.sections || []).map((section) => (
                  <div
                    key={section.id}
                    id={`sec-${section.id}`}
                    className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm"
                  >
                    <div className="border-b border-slate-100 pb-3">
                      <h4 className="font-bold text-slate-900 text-sm">{section.title}</h4>
                      {section.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
                      )}
                    </div>

                    <div className="space-y-5">
                      {section.fields.map((field) => {
                        const val = values[field.key];
                        const hasDefault =
                          defaults[field.key] !== undefined &&
                          defaults[field.key] !== '' &&
                          field.type !== 'checkbox';
                        const isUsingDefault = hasDefault && String(val ?? '') === String(defaults[field.key]);

                        return (
                          <div key={field.key} className="space-y-1.5">
                            {field.type !== 'checkbox' && (
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <label className="text-xs font-bold text-slate-800">
                                  {field.label}
                                  {field.required && <span className="text-rose-600 ml-1">*</span>}
                                </label>
                                <div className="flex items-center gap-2">
                                  {isUsingDefault && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <Sparkles className="w-2.5 h-2.5" />
                                      Pre-filled
                                    </span>
                                  )}
                                  {hasDefault && !isUsingDefault && (
                                    <button
                                      type="button"
                                      onClick={() => handleUseDefault(field.key)}
                                      className="text-[11px] font-semibold text-brand-700 hover:underline"
                                    >
                                      Use suggested default
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Field Input */}
                            {field.type === 'textarea' ? (
                              <textarea
                                rows={3}
                                value={val ?? ''}
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                placeholder={field.placeholder || ''}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                              />
                            ) : field.type === 'select' ? (
                              <select
                                value={val ?? ''}
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                              >
                                {(field.options || []).map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : field.type === 'checkbox' ? (
                              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(val)}
                                  onChange={(e) => handleChange(field.key, e.target.checked)}
                                  className="mt-0.5 h-4 w-4 text-brand-600 focus:ring-brand-500 rounded border-slate-300"
                                />
                                <span className="text-xs font-medium text-slate-800 leading-snug">
                                  {field.label}
                                </span>
                              </label>
                            ) : field.type === 'currency' ? (
                              <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                                <input
                                  type="number"
                                  value={val ?? ''}
                                  onChange={(e) => handleChange(field.key, e.target.value)}
                                  placeholder={field.placeholder || '0'}
                                  className="w-full pl-7 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                              </div>
                            ) : (
                              <input
                                type={field.type || 'text'}
                                value={val ?? ''}
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                placeholder={field.placeholder || ''}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                              />
                            )}

                            {/* DocuSign-style Signature Preview */}
                            {field.key === 'signatureName' && val && String(val).trim() && (
                              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                                <div>
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                    Electronic Signature Preview
                                  </div>
                                  <div className="text-lg italic font-serif text-emerald-950 mt-0.5">
                                    /s/ {val}
                                  </div>
                                </div>
                                <FileSignature className="w-5 h-5 text-emerald-600" />
                              </div>
                            )}

                            {/* Guided "Where to find this" & "Default tip" */}
                            {(field.whereToFind || field.defaultHint) && (
                              <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 space-y-1 text-[11px] text-slate-600">
                                {field.whereToFind && (
                                  <div className="flex items-start gap-1.5">
                                    <HelpCircle className="w-3.5 h-3.5 text-brand-600 flex-shrink-0 mt-0.5" />
                                    <span>
                                      <strong className="text-slate-700">Where to find this:</strong> {field.whereToFind}
                                    </span>
                                  </div>
                                )}
                                {field.defaultHint && (
                                  <div className="flex items-start gap-1.5">
                                    <Lightbulb className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <span>
                                      <strong className="text-slate-700">Tip / Default:</strong> {field.defaultHint}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Sidebar: Filing Guide & Quick Jump */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white border border-brand-200/80 rounded-2xl p-5 space-y-4 shadow-sm sticky top-0">
                  <div className="flex items-center gap-2 text-brand-800 font-bold text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>Ruth’s Guided Filing Help</span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-800">Action Required:</span>{' '}
                      {docItem.actionType}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">Who Signs:</span>{' '}
                      {docItem.whoSigns}
                    </div>
                    <p className="leading-relaxed pt-1">
                      {docItem.description}
                    </p>
                  </div>

                  {(schema?.officialPdfUrl || schema?.officialLink) && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      {schema?.officialPdfUrl && (
                        <a
                          href={schema.officialPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Blank Official Court PDF</span>
                        </a>
                      )}
                      {schema?.officialLink && (
                        <a
                          href={schema.officialLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-brand-700 hover:bg-brand-50 text-xs font-semibold transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Official Court Instructions</span>
                        </a>
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Jump to Section
                    </div>
                    <div className="space-y-1">
                      {(schema?.sections || []).map((sec) => (
                        <a
                          key={sec.id}
                          href={`#sec-${sec.id}`}
                          className="block text-xs text-slate-600 hover:text-brand-700 py-1 font-medium"
                        >
                          {sec.title}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
