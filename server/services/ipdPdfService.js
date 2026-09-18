import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const uploadsPdfDir = path.join(process.cwd(), 'uploads', 'pdf');
if (!fs.existsSync(uploadsPdfDir)) {
  fs.mkdirSync(uploadsPdfDir, { recursive: true });
}

function cleanPdfText(text) {
  if (!text) return '';
  return String(text)
    .replace(/[^\x00-\x7F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function generateDischargeSummaryPdf(admission, dischargeSummary, patient, doctor, wardName) {
  const fileName = `discharge-summary-${admission.id}-${Date.now()}.pdf`;
  const filePath = path.join(uploadsPdfDir, fileName);
  const pdfUrl = `/uploads/pdf/${fileName}`;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 35 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // LETTERHEAD
    doc.rect(35, 35, doc.page.width - 70, 60).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold')
       .text('G.J.S Multi-Speciality Hospital', 45, 48);
    doc.fontSize(10).font('Helvetica')
       .text('24x7 Multi-Speciality Care | Ph: +91 94431 23456', 45, 72);

    doc.fillColor('#0284c7').fontSize(16).font('Helvetica-Bold')
       .text('DISCHARGE SUMMARY', doc.page.width - 240, 52);

    // PATIENT & ADMISSION INFO BOX
    doc.rect(35, 110, doc.page.width - 70, 95).fillAndStroke('#f8fafc', '#e2e8f0');
    
    doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold')
       .text(`Patient: ${cleanPdfText(patient.name || 'N/A')}`, 45, 120);
    doc.fontSize(10).font('Helvetica')
       .text(`Age/Gender: ${cleanPdfText(String(patient.age || 'N/A'))} yrs / ${cleanPdfText(patient.gender || 'N/A')}`, 45, 138);
    doc.text(`UHID: ${cleanPdfText(patient.uhid || 'N/A')}`, 45, 154);
    doc.text(`Mobile: ${cleanPdfText(patient.mobile || 'N/A')}`, 45, 170);

    doc.fontSize(11).font('Helvetica-Bold')
       .text(`Admitting Doctor: ${cleanPdfText(doctor.name || 'N/A')}`, 320, 120);
    doc.fontSize(10).font('Helvetica')
       .text(`Ward / Bed: ${cleanPdfText(wardName || 'N/A')} / ${cleanPdfText(admission.bed_number || 'N/A')}`, 320, 138);
    doc.text(`Admission Date: ${new Date(admission.admission_date || Date.now()).toLocaleDateString()}`, 320, 154);
    doc.text(`Discharge Date: ${new Date(admission.actual_discharge_date || Date.now()).toLocaleDateString()}`, 320, 170);
    
    let y = 225;
    
    // DIAGNOSIS
    doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold')
       .text(`Diagnosis:`, 35, y);
    doc.fontSize(11).font('Helvetica')
       .text(cleanPdfText(dischargeSummary.diagnosis || 'N/A'), 110, y);
    y += 40;

    // TREATMENT SUMMARY
    doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold')
       .text(`Treatment Summary:`, 35, y);
    doc.fontSize(11).font('Helvetica')
       .text(cleanPdfText(dischargeSummary.treatment_summary || 'N/A'), 35, y + 20, { width: doc.page.width - 70 });
    y += 100;

    // DISCHARGE INSTRUCTIONS
    doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold')
       .text(`Discharge Instructions:`, 35, y);
    doc.fontSize(11).font('Helvetica')
       .text(cleanPdfText(dischargeSummary.discharge_instructions || 'N/A'), 35, y + 20, { width: doc.page.width - 70 });
    y += 100;

    // FOLLOW UP
    if (dischargeSummary.follow_up_date) {
      const followUpStr = new Date(dischargeSummary.follow_up_date).toLocaleDateString();
      doc.rect(35, y, doc.page.width - 70, 30).fillAndStroke('#f0fdf4', '#bbf7d0');
      doc.fillColor('#15803d').fontSize(11).font('Helvetica-Bold')
         .text(`Recommended Follow-Up Date: ${followUpStr}`, 45, y + 8);
      y += 50;
    }

    // SIGNATURE FOOTER
    doc.fillColor('#64748b').fontSize(10).font('Helvetica')
       .text('Doctor Signature / Stamp', doc.page.width - 180, doc.page.height - 70, { align: 'right' });
       
    doc.fontSize(9).text('G.J.S Multi-Speciality Hospital | Ph: +91 94431 23456', 35, doc.page.height - 50);

    doc.end();
    stream.on('finish', () => resolve(pdfUrl));
    stream.on('error', (err) => reject(err));
  });
}
