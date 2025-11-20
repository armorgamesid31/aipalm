// Test with real user input
global.$input = {
  all: () => [{
    json: {
      "services": [
        {
          "name": "Protez Tırnak",
          "expert_preference": null,
          "for_person": "self"
        },
        {
          "name": "Protez Tırnak",
          "expert_preference": null,
          "for_person": "other_1"
        }
      ],
      "service_info": {
        "Protez Tırnak": {
          "Pınar": {
            "fiyat": "1000",
            "sure": "120"
          },
          "Ceren": {
            "fiyat": "1000",
            "sure": "180"
          }
        }
      },
      "date_info": {
        "type": "specific",
        "value": "21/11/2025",
        "search_range": "14/11/2025 to 28/11/2025"
      },
      "constraints": {
        "same_day_required": true,
        "chain_adjacent_only": true,
        "filters": {
          "nail_expert_strict": false,
          "time_window_strict": false,
          "earliest_date": "21/11/2025",
          "latest_date": "21/11/2025"
        }
      },
      "current_time": "10:05",
      "staff_leaves": [
        {
          "uzman_adi": "Ceren Kaçıral",
          "baslangic_tarihi": "21/11/2025",
          "bitis_tarihi": "22/11/2025",
          "durum": "Tam Gün"
        },
        {
          "uzman_adi": "İlayda Kaya",
          "baslangic_tarihi": "11/10/2025",
          "bitis_tarihi": "25/10/2026",
          "durum": "Tam Gün"
        }
      ],
      "existing_appointments": [
        {"uzman_adi": "Pınar", "tarih": "21/11/2025", "baslangic_saat": "12:00", "bitis_saat": "13:30"},
        {"uzman_adi": "Pınar", "tarih": "21/11/2025", "baslangic_saat": "14:00", "bitis_saat": "16:00"},
        {"uzman_adi": "Sevcan", "tarih": "21/11/2025", "baslangic_saat": "16:00", "bitis_saat": "17:10"},
        {"uzman_adi": "Pınar", "tarih": "21/11/2025", "baslangic_saat": "18:30", "bitis_saat": "20:00"},
        {"uzman_adi": "Pınar", "tarih": "22/11/2025", "baslangic_saat": "10:00", "bitis_saat": "12:00"},
        {"uzman_adi": "Pınar", "tarih": "22/11/2025", "baslangic_saat": "12:00", "bitis_saat": "14:00"},
        {"uzman_adi": "Pınar", "tarih": "22/11/2025", "baslangic_saat": "14:00", "bitis_saat": "14:20"},
        {"uzman_adi": "Sevcan", "tarih": "22/11/2025", "baslangic_saat": "14:20", "bitis_saat": "15:20"},
        {"uzman_adi": "Sevcan", "tarih": "22/11/2025", "baslangic_saat": "16:00", "bitis_saat": "17:00"},
        {"uzman_adi": "Sevcan", "tarih": "22/11/2025", "baslangic_saat": "18:50", "bitis_saat": "20:00"}
      ]
    }
  }]
};

delete require.cache[require.resolve('./shared/subworkflows/availability-checker/availability-logic.js')];

try {
  const result = require('./shared/subworkflows/availability-checker/availability-logic.js');

  console.log('📊 STATUS:', result[0]?.json?.status);
  console.log('📋 OPTIONS:', result[0]?.json?.options?.length || 0);

  if (result[0]?.json?.options?.length > 0) {
    result[0].json.options.slice(0, 5).forEach((opt, idx) => {
      console.log(`\n✅ Seçenek ${idx + 1}:`);
      opt.group_appointments.forEach(apt => {
        console.log(`  ${apt.for_person}: ${apt.appointment.date} ${apt.appointment.start_time}-${apt.appointment.end_time} | ${apt.appointment.expert}`);
      });
      console.log(`  ${opt.total_price}₺, ${opt.total_duration}dk, ${opt.arrangement}`);
    });
  } else {
    console.log('\n❌ Hiç seçenek bulunamadı!');
  }
} catch (error) {
  console.error('ERROR:', error.message);
}
