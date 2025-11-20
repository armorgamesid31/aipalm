// Test: İki kişi için Protez Tırnak - Paralel randevu
global.$input = {
  all: () => [{
    json: {
      services: [
        { name: 'Protez Tırnak', expert_preference: null, for_person: 'self' },
        { name: 'Protez Tırnak', expert_preference: null, for_person: 'other_1' }
      ],
      service_info: {
        'Protez Tırnak': {
          'Pınar': { fiyat: '1000', sure: '120' },
          'Ceren': { fiyat: '1000', sure: '180' }
        }
      },
      date_info: {
        type: 'specific',
        value: '21/11/2025',
        search_range: '14/11/2025 to 28/11/2025'
      },
      constraints: {
        same_day_required: true,
        chain_adjacent_only: true,
        filters: {
          nail_expert_strict: false,
          time_window_strict: false,
          earliest_date: '21/11/2025',
          latest_date: '21/11/2025'
        }
      },
      current_time: '10:05',
      staff_leaves: [
        { uzman_adi: 'Ceren Kaçıral', baslangic_tarihi: '21/11/2025', bitis_tarihi: '22/11/2025', durum: 'Tam Gün' }
      ],
      existing_appointments: [
        { uzman_adi: 'Pınar', tarih: '21/11/2025', baslangic_saat: '12:00', bitis_saat: '13:30' },
        { uzman_adi: 'Pınar', tarih: '21/11/2025', baslangic_saat: '14:00', bitis_saat: '16:00' },
        { uzman_adi: 'Sevcan', tarih: '21/11/2025', baslangic_saat: '16:00', bitis_saat: '17:10' },
        { uzman_adi: 'Pınar', tarih: '21/11/2025', baslangic_saat: '18:30', bitis_saat: '20:00' }
      ]
    }
  }]
};

console.log('🧪 TEST: Paralel Grup Randevu (Farklı Kişiler - Aynı Uzman)');
console.log('═'.repeat(70));
console.log('');
console.log('📋 Senaryo:');
console.log('  • 2 kişi için Protez Tırnak (self + other_1)');
console.log('  • Tarih: 21/11/2025');
console.log('  • Pınar: 120 dk/kişi, Ceren: 180 dk/kişi (izinli)');
console.log('');
console.log('📅 Pınar müsaitliği:');
console.log('  • 10:00-12:00 (120 dk) ✓');
console.log('  • 12:00-13:30 DOLU');
console.log('  • 13:30-14:00 (30 dk)');
console.log('  • 14:00-16:00 DOLU');
console.log('  • 16:00-18:30 (150 dk) ✓');
console.log('  • 18:30-20:00 DOLU');
console.log('');

delete require.cache[require.resolve('./shared/subworkflows/availability-checker/availability-logic.js')];

try {
  const result = require('./shared/subworkflows/availability-checker/availability-logic.js');

  console.log('📊 SONUÇ:', result[0]?.json?.status);
  console.log('');

  if (result[0]?.json?.status === 'success') {
    const options = result[0].json.options;
    console.log(`✅ BAŞARILI: ${options.length} seçenek bulundu`);
    console.log('');

    options.slice(0, 3).forEach((opt, idx) => {
      console.log(`Seçenek ${idx + 1}: (${opt.arrangement})`);
      opt.group_appointments.forEach(apt => {
        const person = apt.for_person === 'self' ? '👤 Ben' : '👥 Diğer kişi';
        console.log(`  ${person}: ${apt.appointment.date} ${apt.appointment.start_time}-${apt.appointment.end_time} | ${apt.appointment.expert}`);
      });
      console.log(`  Toplam: ${opt.total_price}₺, ${opt.total_duration} dk, Score: ${opt.score || 'N/A'}`);
      console.log('');
    });

    console.log('✅ PARALEL RANDEVU DÜZELTMESİ ÇALIŞIYOR!');

  } else if (result[0]?.json?.status === 'no_availability') {
    console.log('❌ NO AVAILABILITY');
    console.log('Mesaj:', result[0].json.message);
    console.log('');
    console.log('⚠️  SORUN: Hala müsaitlik bulunamadı');
    console.log('');
    console.log('Olası nedenler:');
    console.log('  1. chain_adjacent_only: true → Arka arkaya gerekli');
    console.log('  2. 10:00-12:00 + 12:00-14:00 → 12:00-13:30 dolu!');
    console.log('  3. Alternatif: Farklı slotlar denenmeli');

  } else if (result[0]?.json?.status === 'alternatives') {
    console.log('⚠️  ALTERNATİF STATÜSÜ (success olmalıydı!)');
    const options = result[0].json.options;
    console.log(`📊 ${options.length} seçenek var:`);
    options.slice(0, 3).forEach((opt, idx) => {
      console.log(`\nSeçenek ${idx + 1}:`);
      opt.group_appointments.forEach(apt => {
        const person = apt.for_person === 'self' ? '👤 Ben' : '👥 Diğer';
        console.log(`  ${person}: ${apt.appointment.date} ${apt.appointment.start_time}-${apt.appointment.end_time} | ${apt.appointment.expert}`);
      });
      console.log(`  Toplam: ${opt.total_price}₺, ${opt.total_duration} dk, ${opt.arrangement}`);
    });

  } else {
    console.log('⚠️  Beklenmeyen durum:', result[0]?.json?.status);
  }

} catch (error) {
  console.error('❌ HATA:', error.message);
  console.error(error.stack.split('\n').slice(0, 10).join('\n'));
}
