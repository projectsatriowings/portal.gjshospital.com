import React from 'react';
import { UserCheck, Award, HeartPulse, ThumbsUp } from 'lucide-react';

const DepartmentStats = ({ department, doctorCount = 15 }) => {
  const dbStats = department?.stats || {};
  const rawStats = Array.isArray(dbStats)
    ? dbStats
    : (dbStats && Array.isArray(dbStats.items) ? dbStats.items : []);

  const stats = rawStats.length > 0
    ? rawStats.map((st) => {
        let IconComp = HeartPulse;
        if (st.icon === 'Users') IconComp = UserCheck;
        else if (st.icon === 'Award') IconComp = Award;
        else if (st.icon === 'Star') IconComp = ThumbsUp;
        return {
          icon: IconComp,
          value: st.value,
          label: st.label
        };
      })
    : [
        { icon: UserCheck, value: dbStats.specialists_count || `${doctorCount}+`, label: "Specialists & Surgeons" },
        { icon: HeartPulse, value: dbStats.treatments_count || "5,000+", label: "Successful Treatments" },
        { icon: Award, value: dbStats.years_excellence || "15+", label: "Years of Excellence" },
        { icon: ThumbsUp, value: dbStats.satisfaction_rate || "98%", label: "Patient Satisfaction" }
      ];

  return (
    <section style={{ backgroundColor: '#1a3a6e', color: '#fff', padding: '60px 20px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '30px', textAlign: 'center' }}>
        {stats.map((st, idx) => {
          const IconComp = st.icon;
          return (
            <div key={idx} style={{ padding: '20px', background: 'rgba(255,255,255,0.06)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(0,163,200,0.2)', color: '#38bdf8', marginBottom: '14px' }}>
                <IconComp size={30} />
              </div>
              <h2 style={{ fontSize: '40px', fontWeight: '800', margin: '0 0 6px 0', color: '#fff' }}>{st.value}</h2>
              <p style={{ fontSize: '15px', color: '#93c5fd', margin: 0, fontWeight: '500' }}>{st.label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default DepartmentStats;
