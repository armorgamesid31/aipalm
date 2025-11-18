# Availability Checker Subworkflow

**Amaç:** Randevu müsaitlik kontrolü, alternatif üretimi, temporary lock sistemi

---

## Dosyalar

- `README.md` - Bu dosya (genel bakış)
- `workflow.json` - n8n workflow (kopyala-yapıştır)
- `availability-logic.js` - Ana JavaScript kodu (kopyala-yapıştır)
- `testcases.md` - Test senaryoları

---

## Ne Yapar?

### 1. Müsaitlik Kontrolü
- Mevcut randevularla çakışma kontrolü
- Çalışan izin kontrolü
- Çalışma saati kontrolü (10:00-20:00)
- Temporary lock kontrolü (5 dk)
- Pazar kapalı kontrolü

### 2. Alternatif Üretimi
- En uygun 5 seçenek döner
- Farklı uzmanlardan seçenekler
- Farklı zaman dilimlerinden seçenekler
- Puanlama sistemi (tarih, saat, uzman, fiyat)

### 3. Grup Randevu Desteği
- 2+ kişi için aynı anda randevu
- **Paralel:** 15+ dk çakışma
- **Sequential:** Tam bitişte başlama
- Aynı gün zorunlu

### 4. Lock Sistemi
- Gösterilen seçenekleri 5 dakika kilitle
- Başka müşteriler aynı slotu görmesin
- Timeout sonrası otomatik serbest bırak
- Session bazlı (telefon numarası)

---

## Giriş Parametreleri
```javascript
{
  "services": [
    {
      "name": "Protez Tırnak",
      "expert_preference": "Pınar",  // veya null
      "for_person": "self"  // veya "other_1", "other_2"
    }
  ],
  "service_info": {
    "Protez Tırnak": {
      "Pınar": {"fiyat": "1000", "sure": "120"},
      "Ceren": {"fiyat": "1000", "sure": "180"}
    }
  },
  "date_info": {
    "type": "specific",  // "range", "urgent", "specific_days"
    "value": "20/11/2025",
    "search_range": "20/11/2025 to 27/11/2025",
    "target_time": "10:00",
    "time_hint": "sabah"
  },
  "constraints": {
    "booking_type": "single",  // veya "group"
    "same_day_required": true,
    "chain_adjacent_only": true,
    "filters": {
      "allowed_nail_experts": ["Pınar", "Ceren"],
      "nail_expert_strict": false,  // SOFT mode
      "time_window": {"start": "10:00", "end": "20:00"},
      "time_window_strict": false,
      "earliest_date": "20/11/2025",
      "latest_date": "27/11/2025"
    }
  },
  "current_time": "14:04",
  "telefon": "905054280747"
}
```

---

## Çıkış Formatı

### Success (Tam Eşleşme)
```json
{
  "status": "success",
  "options": [
    {
      "id": 1,
      "score": 100,
      "complete": true,
      "group_appointments": [
        {
          "for_person": "self",
          "appointment": {
            "date": "20/11/2025",
            "day_name": "Çarşamba",
            "start_time": "10:00",
            "end_time": "12:00",
            "service": "Protez Tırnak",
            "expert": "Pınar",
            "price": 1000,
            "duration": 120
          }
        }
      ],
      "total_price": 1000,
      "total_duration": 120,
      "arrangement": "single",
      "missing_services": []
    }
  ],
  "top_10_all_options": [...],
  "follow_up_question": "Onaylıyor musunuz?"
}
```

### Alternatives (Yakın Seçenekler)
```json
{
  "status": "alternatives",
  "options": [
    {
      "id": 1,
      "alternative_reason": "Sabah saati – tercih edilen uzman",
      ...
    },
    {
      "id": 2,
      "alternative_reason": "Aynı saat – farklı uzman",
      ...
    }
  ],
  "follow_up_question": "Hangisi uygun?"
}
```

### No Availability (Müsaitlik Yok)
```json
{
  "status": "no_availability",
  "message": "Belirttiğiniz koşullara uygun boşluk bulunamadı.",
  "options": []
}
```

---

## Puanlama Sistemi

### 1. Tarih Puanı (max 25)
- Bugün: 25
- Yarın: 20
- 2 gün sonra: 15
- 3-4 gün sonra: 10
- 5-7 gün sonra: 6

### 2. Saat Puanı (max 25)
- Hedef saatle aynı: 25
- 1 saat fark: 23
- 2 saat fark: 21
- ...
- 10+ saat fark: 0

### 3. Uzman Puanı (max 25)
- Tercih edilen uzman: 15
- Diğer uzmanlar: 5
- Tüm tercihler tutturulursa +10 bonus

### 4. Paralel Bonus (max 10)
- Grup randevuda paralel yerleşim: +10

### 5. Fiyat Puanı (max 20)
- En ucuz: 20
- En pahalı: 0
- Arası: Linear interpolasyon

**Toplam Max:** 100 puan

---

## Özel Kurallar

### Uzman Slot Sistemi

**Pınar:**
- **Protez Tırnak:** 10:00, 12:00, 14:00, 16:00, 18:00 (sabit)
- **Kalıcı Oje:** 10:00, 10:30, 12:00, 12:30, 14:00, 14:30, 16:00, 16:30, 18:00, 18:30

**Ceren:**
- **Protez Tırnak:** 11:00, 14:00, 17:00 (sabit)
- **Kalıcı Oje:** 11:00, 12:00, 14:00, 15:00, 17:00, 18:00

**Sevcan:**
- Esnek slot sistemi (5 dk adımlarla her saat)
- Gap-filling destekli

### Gap-Filling Hizmetler

Sadece **Sevcan** için:
- Medikal Manikür (20-45 dk)
- Islak Manikür (30-45 dk)
- Tırnak Çıkarma (10-20 dk)
- Kalıcı Oje (20-45 dk)

**Nasıl Çalışır:**
İki randevu arasındaki boşluklara kısa süreli hizmetler yerleştirilebilir.

---

## Grup Randevu Mantığı

### 1. Paralel Yerleşim
- Minimum 15 dk çakışma gerekli
- Farklı uzmanlardan
- Aynı gün zorunlu

**Örnek:**
```
18:00-20:00 Protez Tırnak (Pınar) - Müşteri
18:00-18:30 Manikür (Sevcan) - Anne
→ Paralel (15+ dk çakışma var)
```

### 2. Sequential Yerleşim
- Bir randevu bitince diğeri başlar
- Boşluk OLMAMALI
- Aynı gün zorunlu

**Örnek:**
```
18:00-20:00 Protez Tırnak (Pınar) - Müşteri
20:00-20:30 Manikür (Sevcan) - Anne
→ Sequential (tam bitişte)
```

### 3. Aynı Uzman Kontrolü
Eğer tüm hizmetler aynı uzman tercihi belirtilmişse:
- Paralel OLAMAZ
- Sadece sequential dene

---

## Lock Sistemi Detayları

### 1. Lock Oluşturma
Seçenekler gösterildiğinde:
```sql
INSERT INTO palm.temporary_locks 
  (session_id, option_id, uzman_adi, tarih, baslangic_saat, bitis_saat, hizmet, is_shown, expires_at)
VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, NOW() + INTERVAL '5 minutes');
```

### 2. Lock Kontrolü
Müsaitlik kontrolünde:
```sql
SELECT * FROM palm.temporary_locks
WHERE expires_at > NOW()
  AND (session_id != ? OR is_shown = TRUE)
```

**Mantık:**
- Başka müşterinin lock'ları: Çakışma sayılır
- Kendi lock'larım ama `is_shown=false`: Çakışma sayılmaz (yeni seçenekler üretilebilir)
- Kendi lock'larım ve `is_shown=true`: Çakışma sayılır (zaten gösterilmiş)

### 3. Lock Temizleme
Randevu kaydedildiğinde:
```sql
DELETE FROM palm.temporary_locks 
WHERE session_id = ?;
```

### 4. Otomatik Timeout
5 dakika sonra lock'lar otomatik düşer (expires_at kontrolü ile)

---

## Önemli Notlar

1. ✅ İlk sorgu HER ZAMAN SOFT mode
2. ✅ Müşteri "SADECE Pınar" derse HARD mode
3. ✅ Grup randevuda `same_day_required: true` ZORUNLU
4. ✅ `service_info`'ya TÜM uzmanları ekle
5. ✅ Pazar günü KAPALI
6. ✅ Lock süresi: 5 dakika
7. ✅ En fazla 5 seçenek döner (top_10_all_options'da 10 seçenek)

---

## İlgili Dosyalar

- **Workflow JSON:** `workflow.json`
- **Ana Kod:** `availability-logic.js`
- **Test Cases:** `testcases.md`
- **Hizmet Kataloğu:** `../../service-catalog.md`
- **Çalışan Bilgileri:** `../../staff-info.md`
