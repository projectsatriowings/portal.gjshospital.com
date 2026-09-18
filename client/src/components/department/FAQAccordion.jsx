import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQAccordion = ({ department }) => {
  const departmentName = department?.name || 'Department';
  const [openIdx, setOpenIdx] = useState(0);

  const rawFaqs = Array.isArray(department?.faqs)
    ? department.faqs
    : (department.faqs && Array.isArray(department.faqs.items) ? department.faqs.items : []);

  const faqsList = rawFaqs.length > 0 ? rawFaqs : null;

  if (!faqsList) return null;

  const toggleAccordion = (idx) => {
    setOpenIdx(openIdx === idx ? -1 : idx);
  };

  return (
    <section style={{ maxWidth: '1000px', margin: '70px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '45px' }}>
        <span style={{ color: '#0070c0', fontWeight: '800', fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase' }}>FREQUENTLY ASKED QUESTIONS</span>
        <h2 style={{ fontSize: '36px', color: '#1a3a6e', margin: '6px 0 12px', fontWeight: '800' }}>
          Got Questions? We Have Answers
        </h2>
        <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
          Find answers to common queries regarding treatments, timings & appointments in {departmentName}.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {faqsList.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div 
              key={idx}
              style={{
                background: '#fff',
                borderRadius: '16px',
                border: '1px solid #cbd5e1',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}
            >
              <button
                onClick={() => toggleAccordion(idx)}
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: '17px',
                  fontWeight: '700',
                  color: isOpen ? '#0070c0' : '#1a3a6e'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <HelpCircle size={20} color="#0070c0" />
                  <span>{faq.question}</span>
                </div>
                <ChevronDown 
                  size={20} 
                  color="#64748b" 
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} 
                />
              </button>

              {isOpen && (
                <div style={{ padding: '0 24px 22px 56px', fontSize: '15px', color: '#475569', lineHeight: '1.7', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FAQAccordion;
