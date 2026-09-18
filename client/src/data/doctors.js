import maleImg from '../assets/male-rnicTsFa.webp';
import femaleImg from '../assets/female2-BB8VFyZ1.jpg';

export const doctorsData = [
  { id: 1, name: "DR. K. GANESAN", specialty: "Founder", consults: "MBBS, AMA", gender: "male" },
  { id: 2, name: "DR. G. SHIVARAJ BABU", specialty: "Paediatrics", consults: "MD, DCH, APGPN", gender: "male" },
  { id: 3, name: "DR. KUMAR RAMAMOORTHY", specialty: "Paediatrics", consults: "MBBS., DNB.,PGPN.,(BOSTON)", gender: "male" },
  { id: 4, name: "DR. N.SATHYA", specialty: "OBS/Gynaecology", consults: "MBBS, MS (OBG)", gender: "female" },
  { id: 5, name: "DR. G. RAJESHKUMAR", specialty: "Anaesthesiology", consults: "MD (Anaesthesia)", gender: "male" },
  { id: 6, name: "DR. J.VIJAYAKUMAR", specialty: "Anaesthesiology", consults: "MBBS, MD (Anaesthesia)", gender: "male" },
  { id: 7, name: "DR. LAVANYAKUMAR", specialty: "Anaesthesiology", consults: "DNB (Anaesthesiology)", gender: "male" },
  { id: 8, name: "DR. M.G. DEEPAPRIYA", specialty: "General Medicine & Diabetology", consults: "MBBS, DNB (General Medicine), FID (UK), FICM, AMA", gender: "female" },
  { id: 9, name: "DR. C.NANDAKUMAR", specialty: "General Medicine & Diabetology", consults: "MBBS, MD, PGDDM", gender: "male" },
  { id: 10, name: "DR. VIJAYAPRABHU", specialty: "ENT", consults: "MBBS, DLO, MS (ENT & Throat Surgeon)", gender: "male" },
  { id: 11, name: "DR. S.JAWAHAR", specialty: "ICU Consultant", consults: "MBBS, MD, FICM (Anesthesia & Critical Care)", gender: "male" },
  { id: 12, name: "DR. J.MANIKANDAN", specialty: "Anaesthesia & Critical Care", consults: "MBBS., M.D.", gender: "male" },
  { id: 13, name: "DR. SANJAI ABRAHAM", specialty: "Emergency Medicine", consults: "CMD., (CCM)", gender: "male" },
  { id: 14, name: "DR. RANJITH", specialty: "Emergency Medicine", consults: "MBBS., MEM.", gender: "male" },
  { id: 15, name: "DR. ANAND PRASHANTH", specialty: "Plastic Surgeon", consults: "MS (Gen Surgeon), MCh (Plastic)", gender: "male" },
  { id: 16, name: "DR. SARAVANA BAVAN", specialty: "Paediatric Surgery", consults: "MS, MCh", gender: "male" },
  { id: 17, name: "DR. RAGHU", specialty: "Paediatric Surgery", consults: "MS, MCh", gender: "male" },
  { id: 18, name: "DR. GANAPATHY", specialty: "Orthopaedic Surgery", consults: "MBBS, MS (Ortho), MCh Ortho (UK)", gender: "male" },
  { id: 19, name: "DR. PETER PONNIAH", specialty: "Orthopaedic Surgery", consults: "MBBS, D.Ortho", gender: "male" },
  { id: 20, name: "DR. SATHISH ANAND", specialty: "Neuro Surgery", consults: "MBBS, DNB, MNAMS", gender: "male" },
  { id: 21, name: "MRS. SHOBHANA", specialty: "Physiotherapy", consults: "BPT, MIAP", gender: "female" },
  { id: 22, name: "DR. PREMKUMAR", specialty: "Cardiology", consults: "MBBS, MD (GENERAL MEDICINE), DM (CARDIOLOGY)", gender: "male" },
  { id: 23, name: "DR. NARENDRAN", specialty: "Cardiology", consults: "MBBS, MD (EM), DM (CARDIOLOGY)", gender: "male" },
  { id: 24, name: "DR. P. M. RAMESH", specialty: "Pulmonology", consults: "MD (RESPIRATORY MEDICINE)", gender: "male" },
  { id: 25, name: "DR. VELMURUGAN", specialty: "Urology", consults: "MS, MCh - Urology", gender: "male" },
  { id: 26, name: "DR. SELVAN", specialty: "Neurology", consults: "MBBS, DM - Neurology", gender: "male" },
  { id: 27, name: "DR. S.M. SIVARAJ", specialty: "Gastroenterology", consults: "MS, MCh - Surgical Gastroenterology", gender: "male" },
  { id: 28, name: "DR. SYED NAAZEER", specialty: "Dermatology", consults: "MBBS, MD, DVL", gender: "male" },
  { id: 29, name: "DR. D. RAJIV RAJ", specialty: "General Surgery", consults: "MS - General Surgery", gender: "male" },
  { id: 30, name: "DR. SRIVIDHYA", specialty: "General Surgery", consults: "MS - General Surgery, DCP - General & Laparoscopic Surgeon", gender: "female" },
  { id: 31, name: "DR. S. SANTHOSH KUMAR", specialty: "General Surgery", consults: "MBBS, DNB, FAIS, FIAGES, DIP, Laparoscopic&Laser Surgeon", gender: "male" }
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://localhost:5000';

export const getDoctorImage = (gender, customUrl) => {
  if (customUrl && typeof customUrl === 'string' && customUrl.trim() !== '') {
    if (customUrl.startsWith('http://') || customUrl.startsWith('https://') || customUrl.startsWith('data:')) {
      return customUrl;
    }
    return `${API_BASE_URL}${customUrl.startsWith('/') ? '' : '/'}${customUrl}`;
  }
  return gender === 'female' ? femaleImg : maleImg;
};

