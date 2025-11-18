# Availability Checker - Test Senaryoları

**Son Güncelleme:** 18 Kasım 2025

---

## Test Case 1: Tek Hizmet - Spesifik Tarih - Tam Eşleşme

### Input
```json
{
  "services": [
    {"name": "Protez Tırnak", "expert_preference": "Pınar", "for_person": "self"}
  ],
  "service_info": {
    "Protez Tırnak": {
      "Pınar": {"fiyat": "1000", "sure": "120"}
    }
  },
  "date_info": {
    "type": "specific",
    "value": "20/11/2025",
    "search_range": "20/11/2025 to 27/11/2025",
    "target_time": "10:00"
  },
  "constraints": {
    "booking_type": "single",
    "same_day_required": true,
    "filters": {
      "allowed_nail_experts": ["Pınar"],
      "nail_expert_strict": false
    }
  },
  "current_time": "09:00",
  "telefon": "905054280747"
}
```

### Beklenen Çıkış
```json
{
  "status": "success",
  "options": [
    {
      "id": 1,
      "score": 100,
      "group_appointments": [
        {
          "for_person": "self",
          "appointment": {
            "date": "20/11/2025",
            "start_time": "10:00",
            "end_time": "12:00",
            "service": "Protez Tırnak",
            "expert": "Pınar",
            "price": 1000,
            "duration": 120
          }
        }
      ],
      "arrangement": "single"
    }
  ]
}
```

---

## Test Case 2: Çoklu Hizmet - Aynı Gün

### Input
```json
{
  "services": [
    {"name": "Protez Tırnak", "expert_preference": "Pınar", "for_person": "self"},
    {"name": "Lazer Tüm Bacak", "expert_preference": null, "for_person": "self"}
  ],
  "service_info": {
    "Protez Tırnak": {
      "Pınar": {"fiyat": "1000", "sure": "120"}
    },
    "Lazer Tüm Bacak": {
      "Sevcan": {"fiyat": "800", "sure": "40"}
    }
  },
  "date_info": {
    "type": "specific",
    "value": "20/11/2025",
    "search_range": "20/11/2025 to 27/11/2025"
  },
  "constraints": {
    "booking_type": "single",
    "same_day_required": true,
    "chain_adjacent_only": true
  },
  "current_time": "09:00",
  "telefon": "905054280747"
}
```

### Beklenen Çıkış
```json
{
  "status": "success",
  "options": [
    {
      "id": 1,
      "group_appointments": [
        {
          "for_person": "self",
          "appointment": {
            "date": "20/11/2025",
            "start_time": "10:00",
            "end_time": "12:00",
            "service": "Protez Tırnak",
            "expert": "Pınar"
          }
        },
        {
          "for_person": "self",
          "appointment": {
            "date": "20/11/2025",
            "start_time": "12:00",
            "end_time": "12:40",
            "service": "Lazer Tüm Bacak",
            "expert": "Sevcan"
          }
        }
      ],
      "arrangement": "sequential",
      "total_price": 1800
    }
  ]
}
```

---

## Test Case 3: Grup Randevu - Paralel

### Input
```json
{
  "services": [
    {"name": "Protez Tırnak", "expert_preference": "Pınar", "for_person": "self"},
    {"name": "Manikür", "expert_preference": null, "for_person": "other_1"}
  ],
  "service_info": {
    "Protez Tırnak": {
      "Pınar": {"fiyat": "1000", "sure": "120"}
    },
    "Manikür": {
      "Sevcan": {"fiyat": "450", "sure": "30"}
    }
  },
  "date_info": {
    "type": "specific",
    "value": "20/11/2025",
    "search_range": "20/11/2025 to 27/11/2025",
    "target_time": "18:00"
  },
  "constraints": {
    "booking_type": "group",
    "same_day_required": true
  },
  "current_time": "09:00",
  "telefon": "905054280747"
}
```

### Beklenen Çıkış
```json
{
  "status": "success",
  "options": [
    {
      "id": 1,
      "group_appointments": [
        {
          "for_person": "self",
          "appointment": {
            "date": "20/11/2025",
            "start_time": "18:00",
            "end_time": "20:00",
            "service": "Protez Tırnak",
            "expert": "Pınar"
          }
        },
        {
          "for_person": "other_1",
          "appointment": {
            "date": "20/11/2025",
            "start_time": "18:00",
            "end_time": "18:30",
            "service": "Manikür",
            "expert": "Sevcan"
          }
        }
      ],
      "arrangement": "parallel",
      "total_price": 1450
    }
  ]
}
```

---

## Test Case 4: Alternatifler - Tercih Edilen Uzman Müsait Değil

### Input
```json
{
  "services": [
    {"name": "Protez Tırnak", "expert_preference": "Pınar", "for_person": "self"}
  ],
  "service_info": {
    "Protez Tırnak": {
      "Pınar": {"fiyat": "1000", "sure": "120"},
      "Ceren": {"fiyat": "1000", "sure": "180"}
    }
  },
  "date_info": {
    "type": "specific",
    "value": "20/11/2025",
    "search_range": "20/11/2025 to 27/11/2025",
    "target_time": "10:00"
  },
  "constraints": {
    "booking_type": "single",
    "filters": {
      "allowed_nail_experts": ["Pınar", "Ceren"],
      "nail_expert_strict": false
    }
  },
  "current_time": "09:00",
  "telefon": "905054280747",
  "existing_appointments": [
    {
      "uzman_adi": "Pınar",
      "tarih": "20/11/2025",
      "baslangic_saat": "10:00",
      "bitis_saat": "12:00"
    }
  ]
}
```

### Beklenen Çıkış
```json
{
  "status": "alternatives",
  "options": [
    {
      "id": 1,
      "alternative_reason": "Aynı saat – farklı uzman",
      "group_appointments": [
        {
          "for_person": "self",
          "appointment": {
            "date": "20/11/2025",
            "start_time": "10:00",
            "end_time": "13:00",
            "service": "Protez Tırnak",
            "expert": "Ceren"
          }
        }
      ]
    },
    {
      "id": 2,
      "alternative_reason": "Sabah saati – tercih edilen uzman",
      "group_appointments": [
        {
          "for_person": "self",
          "appointment": {
            "date": "20/11/2025",
            "start_time": "12:00",
            "end_time": "14:00",
            "service": "Protez Tırnak",
            "expert": "Pınar"
          }
        }
      ]
    }
  ]
}
```

---

## Test Case 5: No Availability - Koşullara Uygun Slot Yok

### Input
```json
{
  "services": [
    {"name": "Protez Tırnak", "expert_preference": "Pınar", "for_person": "self"}
  ],
  "date_info": {
    "type": "specific",
    "value": "20/11/2025",
    "search_range": "20/11/2025 to 20/11/2025"
  },
  "constraints": {
    "filters": {
      "allowed_nail_experts": ["Pınar"],
      "nail_expert_strict": true,
      "time_window": {"start": "10:00", "end": "12:00"},
      "time_window_strict": true
    }
  },
  "existing_appointments": [
    {
      "uzman_adi": "Pınar",
      "tarih": "20/11/2025",
      "baslangic_saat": "10:00",
      "bitis_saat": "12:00"
    }
  ]
}
```

### Beklenen Çıkış
```json
{
  "status": "no_availability",
  "message": "Belirttiğiniz koşullara uygun boşluk bulunamadı.",
  "options": []
}
```

---

## Test Case 6: İzinli Uzman Kontrolü

### Input
```json
{
  "services": [
    {"name": "Protez Tırnak", "expert_preference": "Pınar", "for_person": "self"}
  ],
  "date_info": {
    "type": "specific",
    "value": "20/11/2025",
    "search_range": "20/11/2025 to 27/11/2025",
    "target_time": "10:00"
  },
  "staff_leaves": [
    {
      "uzman_adi": "Pınar",
      "baslangic_tarihi": "20/11/2025",
      "bitis_tarihi": "20/11/2025",
      "durum": "Tam Gün"
    }
  ]
}
```

### Beklenen Çıkış
```json
{
  "status": "alternatives",
  "options": [
    {
      "id": 1,
      "alternative_reason": "Ertesi gün sabah – tercih edilen uzman",
      "group_appointments": [
        {
          "for_person": "self",
          "appointment": {
            "date": "21/11/2025",
            "start_time": "10:00",
            "end_time": "12:00",
            "service": "Protez Tırnak",
            "expert": "Pınar"
          }
        }
      ]
    }
  ]
}
```

---

## Test Case 7: Lock Sistemi - Aynı Slot Başkası Tarafından Kilitli

### Input
```json
{
  "services": [
    {"name": "Protez Tırnak", "expert_preference": "Pınar", "for_person": "self"}
  ],
  "date_info": {
    "type": "specific",
    "value": "20/11/2025",
    "target_time": "10:00"
  },
  "telefon": "905054280747",
  "existing_appointments": [],
  "active_locks": [
    {
      "session_id": "905366634133",
      "uzman_adi": "Pınar",
      "tarih": "20/11/2025",
      "baslangic_saat": "10:00",
      "bitis_saat": "12:00",
      "expires_at": "2025-11-18 15:00:00"
    }
  ]
}
```

### Beklenen Davranış
- 10:00 slotu çakışma sayılır (başka session)
- Alternatif saatler önerilir

---

## Test Case 8: Pazar Günü Kontrolü

### Input
```json
{
  "date_info": {
    "type": "specific",
    "value": "23/11/2025"
  }
}
```

### Beklenen Çıkış
```json
{
  "status": "closed_day",
  "message": "Salonumuz Pazar günleri kapalıdır.",
  "options": []
}
```

---

## Test Case 9: Time Hint - Akşam Saatleri

### Input
```json
{
  "services": [
    {"name": "Kalıcı Oje", "expert_preference": null, "for_person": "self"}
  ],
  "date_info": {
    "type": "range",
    "search_range": "20/11/2025 to 27/11/2025",
    "time_hint": "akşam"
  },
  "constraints": {
    "filters": {
      "time_window": {"start": "18:00", "end": "20:00"},
      "time_window_strict": false
    }
  }
}
```

### Beklenen Davranış
- Öncelik 18:00-20:00 arası
- Strict değil, alternatifler de gösterilebilir
- Puanlama sisteminde akşam saatleri daha yüksek puan

---

## Test Case 10: Gap-Filling (Sevcan)

### Input
```json
{
  "services": [
    {"name": "Medikal Manikür", "expert_preference": null, "for_person": "self"}
  ],
  "date_info": {
    "type": "specific",
    "value": "20/11/2025"
  },
  "existing_appointments": [
    {
      "uzman_adi": "Sevcan",
      "tarih": "20/11/2025",
      "baslangic_saat": "10:00",
      "bitis_saat": "11:00"
    },
    {
      "uzman_adi": "Sevcan",
      "tarih": "20/11/2025",
      "baslangic_saat": "12:00",
      "bitis_saat": "13:00"
    }
  ]
}
```

### Beklenen Davranış
- 11:00-12:00 arası boşluk (60 dk)
- Medikal Manikür (20 dk) sığar
- Gap-filling slot'u döner: 11:00-11:20

---

## Performans Testleri

### P1: Büyük Tarih Aralığı
- `search_range`: 30 gün
- Beklenen süre: < 3 saniye
- Sonuç: En fazla 10 seçenek

### P2: Çok Sayıda Mevcut Randevu
- 100+ mevcut randevu
- Beklenen süre: < 5 saniye

### P3: Çoklu Hizmet (3+)
- 3+ hizmet aynı anda
- same_day_required: true
- Beklenen süre: < 10 saniye

---

## Edge Cases

### E1: Bugün - Geç Saat
```json
{
  "date_info": {"type": "urgent", "value": "18/11/2025"},
  "current_time": "19:30"
}
```
**Beklenen:** Yarına kayar (çalışma saati bitmek üzere)

### E2: Aynı Uzman - Tüm Hizmetler
```json
{
  "services": [
    {"name": "Kalıcı Oje", "expert_preference": "Pınar", "for_person": "self"},
    {"name": "Kalıcı Oje", "expert_preference": "Pınar", "for_person": "other_1"}
  ]
}
```
**Beklenen:** Paralel OLAMAZ, sadece sequential

### E3: Tüm Slotlar Dolu
**Beklenen:** `status: "no_availability"`

---

## Notlar

- Test case'ler `existing_appointments` ve `staff_leaves` boş olarak varsayılır (aksi belirtilmedikçe)
- `current_time` belirtilmemişse 09:00 kabul edilir
- Tüm testler Pazartesi-Cumartesi günleri için
