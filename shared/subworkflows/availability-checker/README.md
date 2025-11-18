# Availability Checker Subworkflow

**Amaç:** Randevu müsaitlik kontrolü yapar, alternatifler üretir, temporary lock sistemi ile çakışmaları önler.

---

## Ne Yapar?

1. **Müsaitlik Kontrolü**
   - Mevcut randevularla çakışma kontrolü
   - İzinli uzman kontrolü
   - Çalışma saati kontrolü
   - Temporary lock kontrolü

2. **Alternatif Üretme**
   - En uygun 5 seçenek
   - Farklı uzmanlardan
   - Farklı zaman dilimlerinden
   - Puanlama sistemi ile sıralama

3. **Grup Randevu Desteği**
   - Paralel randevu (15+ dk çakışma)
   - Arka arkaya randevu (tam bitişte)
   - Aynı gün zorunlu

4. **Lock Sistemi**
   - Seçenekleri 5 dakika kilitle
   - Başka müşteriler aynı slotu görmesin
   - Timeout sonrası otomatik serbest bırak

---

## Giriş/Çıkış

**Giriş Parametreleri:**
- `services` (array)
- `service_info` (object)
- `date_info` (object)
- `constraints` (object)
- `current_time` (string)
- `telefon` (string)

**Çıkış:**
```json
{
  "status": "success",
  "options": [...],
  "top_10_all_options": [...],
  "follow_up_question": "..."
}
```

---

## Dosyalar
- `workflow-docs.md` - Workflow JSON + Açıklamalar
- `availability-logic.md` - JavaScript kod detayları
- `README.md` - Bu dosya
