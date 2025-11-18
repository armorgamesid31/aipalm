# WhatsApp Main Agent - Workflow Documentation

**Son Güncelleme:** 18 Kasım 2025

---

## 📋 Genel Bakış

Bu workflow, Palm Nail&Beauty Bar'ın WhatsApp üzerinden müşteri randevu yönetimini yapan ana AI agent'ıdır.

**Giriş:** `combined_message` (önceki node'lardan birleştirilmiş mesaj)  
**Çıkış:** AI'ın cevabı (text veya list message formatında)

---

## 🏗️ Workflow Yapısı

### Node Listesi

1. **AI Agent** (Ana düğüm)
   - Type: `@n8n/n8n-nodes-langchain.agent`
   - Model: Google Gemini Chat Model
   - Memory: Buffer Window (15 mesaj)
   
2. **Google Gemini Chat Model**
   - Type: `@n8n/n8n-nodes-langchain.lmChatGoogleGemini`
   - Bağlı: AI Agent → Language Model
   
3. **Simple Memory**
   - Type: `@n8n/n8n-nodes-langchain.memoryBufferWindow`
   - Session Key: `user_id`
   - Context Window: 15 mesaj
   - Bağlı: AI Agent → Memory

4. **musteri_listesi** (Tool)
   - Type: `n8n-nodes-base.postgresTool`
   - Operation: SELECT
   - Schema: palm
   - Table: musteriler
   - WHERE: telefon = ?
   
5. **musteri_ekle** (Tool)
   - Type: `n8n-nodes-base.postgresTool`
   - Operation: INSERT
   - Schema: palm
   - Table: musteriler
   - Columns: ad_soyad, telefon, kayit_tarihi

6. **hizmetler** (Tool)
   - Type: `n8n-nodes-base.postgresTool`
   - Operation: SELECT
   - Schema: palm
   - Table: hizmetler
   - WHERE: hizmet_adi = ANY($1)
   - Query Replacement: `service_names` array

7. **musteri_randevu_listesi** (Tool)
   - Type: `n8n-nodes-base.postgresTool`
   - Operation: SELECT
   - Schema: palm
   - Table: randevular
   - WHERE: telefon = ? AND hizmet_durumu IN ('Bekliyor') AND tarih >= CURRENT_DATE

8. **musteri_randevu_ekle** (Tool)
   - Type: `n8n-nodes-base.postgresTool`
   - Operation: INSERT + DELETE locks
   - Schema: palm
   - Table: randevular
   - Not: Önce temporary_locks temizliği yapar

9. **musteri_randevu_guncelle** (Tool)
   - Type: `n8n-nodes-base.postgresTool`
   - Operation: UPDATE
   - Schema: palm
   - Table: randevular
   - SET: hizmet_durumu, erteleme_iptal_zamani, yeni_randevu

10. **availability_checker** (Subworkflow Tool)
    - Type: `@n8n/n8n-nodes-langchain.toolWorkflow`
    - Workflow ID: `lsmfUSLxpcKiCuJs`
    - Input: services, service_info, date_info, constraints, current_time, telefon
    - Output: Müsaitlik seçenekleri (options array)

---

## 🔧 Tool Detayları

### 1. musteri_listesi

**Amaç:** Telefon numarasıyla müşteri kaydı sorgular

**Parametreler:**
- `telefon` (string, AI'dan): 90XXXXXXXXXX formatında

**Dönen Kolonlar:**
- `ad_soyad`
- `telefon`
- `kayit_tarihi`
- `son_randevu`
- `toplam_harcama`
- `gelmeme_yakin_iptal_erteleme_son3ay` ⚠️ Kritik!
- `toplam_basarili_randevu`
- `guncelleme_zamani`

**AI Kullanım Senaryosu:**
- Randevu oluşturmadan önce müşteri var mı kontrolü
- Gelmeme geçmişi kontrolü (7+ ise randevu verme)
- Başka biri için randevu alınırken o kişinin kaydını bulma

---

### 2. musteri_ekle

**Amaç:** Yeni müşteri kaydı oluşturur

**Parametreler:**
- `ad_soyad` (string, AI'dan): İlk harfler büyük, yazım hatası düzeltilmiş
- `telefon` (string, AI'dan): 90XXXXXXXXXX formatında
- `kayit_tarihi` (string, AI'dan): DD/MM/YYYY formatında bugünün tarihi

**AI Kullanım Senaryosu:**
- `musteri_listesi` kayıt bulamadıysa
- Müşteriden ad soyad alındıktan sonra

**Önemli:**
- Telefon normalize edilmeli (boşluk, tire, parantez temizlensin)
- Ad soyad düzgün formatta (ilk harfler büyük)

---

### 3. hizmetler

**Amaç:** Hizmet bilgilerini getirir (fiyat, süre, uzman, açıklama)

**Parametreler:**
- `service_names` (array, AI'dan): Sorgulanacak hizmet adları listesi

**Örnek:**
```json
{
  "service_names": ["Protez Tırnak", "Lazer Tüm Bacak"]
}
```

**Dönen Kolonlar:**
- `hizmet_adi`
- `uzman_adi`
- `uzman_sorulsun` ("Evet" veya "Hayır")
- `fiyat`
- `sure`
- `aciklama`

**AI Kullanım Senaryosu:**

**Senaryo 1: Spesifik Hizmet**
Müşteri: "Protez tırnak"
→ AI: `hizmetler({service_names: ["Protez Tırnak"]})`
→ Döner: Pınar + Ceren bilgileri
→ AI: Uzman tercihini sorar

**Senaryo 2: Kategori**
Müşteri: "Lazer bacak"
→ AI: `hizmetler({service_names: ["Lazer Tüm Bacak", "Lazer Yarım Bacak"]})`
→ Döner: İki seçenek
→ AI: Hangisini istediğini sorar

**Senaryo 3: Alt Kategori (Bölge Seçimi)**
Müşteri: "Lazer yaptırmak istiyorum"
→ AI: Tüm lazer bölgelerini sorgular (12 hizmet)
→ AI: List message ile seçenekleri gösterir

---

### 4. musteri_randevu_listesi

**Amaç:** Müşterinin gelecek/bugünkü aktif randevularını listeler

**Parametreler:**
- `telefon` (string, AI'dan): 90XXXXXXXXXX formatında

**SQL Filtreler:**
- `hizmet_durumu IN ('Bekliyor')` - Sadece aktif
- `tarih >= CURRENT_DATE` - Geçmiş değil
- ORDER BY tarih, saat

**Dönen Kolonlar:**
- `eventid`
- `tarih`
- `baslangic_saati`
- `bitis_saati`
- `ad_soyad`
- `telefon`
- `hizmet_saglayici_isim`
- `hizmet_saglayici_id`
- `hizmet`
- `hizmet_tutari`
- `hizmet_durumu`

**AI Kullanım Senaryosu:**
- Müşteri "Randevularımı göster" dediğinde
- İptal/değiştirme için liste gösterme
- 2+ randevu varsa List Message kullan

---

### 5. musteri_randevu_ekle

**Amaç:** Yeni randevu kaydı oluşturur

**Önemli:** Her hizmet için AYRI çağrı!

**SQL İşlem:**
```sql
-- 1. Önce lock'ları temizle
DELETE FROM palm.temporary_locks 
WHERE session_id = ?;

-- 2. Randevuyu ekle
INSERT INTO palm.randevular (...) VALUES (...);
```

**Parametreler:**
- `tarih` (string, AI'dan): DD/MM/YYYY
- `baslangic_saati` (string, AI'dan): HH:MM
- `bitis_saati` (string, AI'dan): HH:MM
- `ad_soyad` (string, AI'dan): musteri_listesi'nden alınan
- `telefon` (string, AI'dan): 90XXXXXXXXXX
- `hizmet_saglayici_isim` (string, AI'dan): Pınar / Sevcan / Ceren
- `hizmet_saglayici_id` (string, AI'dan): 1111 / 1112 / 1113
- `hizmet` (string, AI'dan): Tam hizmet adı
- `hizmet_tutari` (number, AI'dan): Sayısal değer (TL işareti YOK)

**AI Kullanım Kuralı:**

❌ **YANLIŞ:**
```javascript
// Tek çağrı ile iki hizmet
musteri_randevu_ekle({
  hizmet: "Protez Tırnak + Lazer Tüm Bacak"
})
```

✅ **DOĞRU:**
```javascript
// İlk hizmet
musteri_randevu_ekle({
  tarih: "20/11/2025",
  baslangic_saati: "10:00",
  bitis_saati: "12:00",
  ad_soyad: "Berkay Karakaya",
  telefon: "905054280747",
  hizmet_saglayici_isim: "Pınar",
  hizmet_saglayici_id: "1111",
  hizmet: "Protez Tırnak",
  hizmet_tutari: 1000
})

// İkinci hizmet (ayrı çağrı)
musteri_randevu_ekle({
  tarih: "20/11/2025",
  baslangic_saati: "12:00",
  bitis_saati: "12:40",
  ad_soyad: "Berkay Karakaya",
  telefon: "905054280747",
  hizmet_saglayici_isim: "Sevcan",
  hizmet_saglayici_id: "1112",
  hizmet: "Lazer Tüm Bacak",
  hizmet_tutari: 800
})
```

---

### 6. musteri_randevu_guncelle

**Amaç:** Randevu durumunu günceller (iptal veya değiştirme)

**SQL İşlem:**
```sql
UPDATE palm.randevular 
SET 
  hizmet_durumu = ?,
  erteleme_iptal_zamani = NOW(),
  yeni_randevu = ?
WHERE telefon = ? 
  AND tarih = ?
  AND baslangic_saati = ?
  AND hizmet = ?
  AND hizmet_saglayici_id = ?
  AND hizmet_durumu IN ('Bekliyor')
RETURNING *;
```

**Parametreler:**
- `telefon` (string, AI'dan): 90XXXXXXXXXX
- `tarih` (string, AI'dan): DD/MM/YYYY
- `baslangic_saati` (string, AI'dan): HH:MM
- `hizmet` (string, AI'dan): Tam hizmet adı
- `hizmet_saglayici_id` (string, AI'dan): 1111/1112/1113
- `hizmet_durumu` (string, AI'dan): "İptal Edildi" veya "Güncellendi"
- `yeni_randevu` (string, AI'dan): Değiştirmede "DD/MM/YYYY HH:mm", iptalse boş

**AI Kullanım Senaryosu:**

**İptal:**
```javascript
musteri_randevu_guncelle({
  telefon: "905054280747",
  tarih: "20/11/2025",
  baslangic_saati: "10:00",
  hizmet: "Protez Tırnak",
  hizmet_saglayici_id: "1111",
  hizmet_durumu: "İptal Edildi",
  yeni_randevu: ""
})
```

**Değiştirme:**
```javascript
musteri_randevu_guncelle({
  telefon: "905054280747",
  tarih: "20/11/2025",
  baslangic_saati: "10:00",
  hizmet: "Protez Tırnak",
  hizmet_saglayici_id: "1111",
  hizmet_durumu: "Güncellendi",
  yeni_randevu: "22/11/2025 14:00"
})
```

---

### 7. availability_checker (Subworkflow)

**Amaç:** Müsaitlik kontrolü yapar, alternatifler üretir

**Bu bir subworkflow!** Detaylar: `shared/subworkflows/availability-checker/`

**Parametreler:**
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
    "type": "specific",  // veya "range", "urgent", "specific_days"
    "value": "20/11/2025",
    "search_range": "20/11/2025 to 27/11/2025",
    "target_time": "10:00",  // opsiyonel
    "time_hint": "sabah"     // opsiyonel
  },
  "constraints": {
    "booking_type": "single",  // veya "group"
    "same_day_required": true,
    "chain_adjacent_only": true,
    "filters": {
      "allowed_nail_experts": ["Pınar", "Ceren"],
      "nail_expert_strict": false,
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

**Output:**
```json
{
  "status": "success",  // veya "alternatives", "no_availability"
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
      "arrangement": "single",  // veya "parallel", "sequential"
      "missing_services": []
    }
  ],
  "follow_up_question": "Onaylıyor musunuz?"
}
```

**AI Kullanım Kuralı:**

1. **İlk sorgu HER ZAMAN SOFT mode**
   - `nail_expert_strict: false`
   - `time_window_strict: false`
   
2. **Müşteri "SADECE Pınar" derse HARD mode**
   - `nail_expert_strict: true`
   - `allowed_nail_experts: ["Pınar"]`

3. **Grup randevuda `same_day_required: true` ZORUNLU**

4. **service_info'ya TÜM uzmanları ekle**

---

## 🧠 System Prompt Özeti

Tam system prompt workflow JSON içinde. Burada sadece ana kurallar:

### Mesajlaşma Kuralları
- ❌ Tool çağrılarında ara mesaj YASAK
- ❌ "Kontrol ediyorum...", "Bakıyorum..." YASAK
- ✅ Sessizce tool çağır, sonucu göster

### Randevu Oluşturma Akışı
1. Müşteri kaydı kontrolü (`musteri_listesi`)
2. Gelmeme geçmişi kontrolü (7+ ise reddet)
3. Hizmet bilgisi (`hizmetler`)
4. Müsaitlik kontrolü (`availability_checker`)
5. Onay al
6. Randevu kaydet (`musteri_randevu_ekle` - HER HİZMET AYRI)

### Grup Randevu Kuralları
1. Hizmet-kişi eşleştirmesi (bilgi toplama YOK)
2. Müsaitlik kontrolü (önce)
3. Onay al
4. Bilgileri al (sonra - telefon, ad soyad)
5. Her kişi için ayrı kaydet

### List Message Kuralları
- 2+ seçenek varsa List kullan
- ID'lerde özel karakter YOK
- `:` karakterini sil (`10:00` → `1000`)
- Türkçe harfleri çevir (`ı→i, ş→s, ğ→g`)
- Maksimum 24 karakter (title)
- "Hanım" kelimesini ÇIKAR

---

## ⚠️ Kritik Hatırlatmalar

1. **Her hizmet = Ayrı randevu_ekle çağrısı**
   - Aynı gün ve arka arkaya bile olsa!

2. **Randevu değiştirmede 2 tool çağrısı**
   - ÖNCE: `randevu_ekle` (yeni)
   - SONRA: `randevu_guncelle` (eski)

3. **Grup randevuda bilgi toplama SONRA**
   - Önce müsaitlik
   - Onay al
   - Sonra telefon/ad sor

4. **service_info'ya TÜM uzmanları ekle**
   - Availability checker için gerekli

5. **Pazar günü KAPALI**
   - Asla Pazar randevusu önerme

6. **Tool çağrılarında ara mesaj YOK**
   - Sessizce çağır, sonucu göster

---

## 📊 Örnek Akışlar

### Örnek 1: Tek Hizmet - Spesifik Tarih

**Müşteri:** "Yarın 10:00'da protez tırnak"

**AI Akışı:**
1. `musteri_listesi` (telefon kontrol)
2. `hizmetler` (Protez Tırnak bilgisi)
3. Uzman tercihi sor
4. `availability_checker` (yarın 10:00)
5. Seçenek göster
6. Onay al
7. `musteri_randevu_ekle`

---

### Örnek 2: Çoklu Hizmet - Aynı Gün

**Müşteri:** "Cumartesi protez tırnak ve lazer bacak"

**AI Akışı:**
1. `musteri_listesi`
2. `hizmetler` (Protez Tırnak)
3. `hizmetler` (Lazer Tüm Bacak / Yarım Bacak) - hangisi?
4. Müşteri: "Tüm bacak"
5. Uzman tercihi sor (Protez için)
6. `availability_checker` (iki hizmet, same_day: true)
7. Seçenekler göster
8. Onay al
9. `musteri_randevu_ekle` (Protez)
10. `musteri_randevu_ekle` (Lazer) - AYRI ÇAĞRI!

---

### Örnek 3: Grup Randevu

**Müşteri:** "Yarın annemle ikimize de kalıcı oje"

**AI Akışı:**
1. "Hangi uzman kim için?" sor
2. Müşteri: "İkimiz de Pınar"
3. `musteri_listesi` (kendisi)
4. `hizmetler` (Kalıcı Oje)
5. `availability_checker` (booking_type: "group", same_day: true)
6. Seçenek göster (paralel veya sequential)
7. Onay al
8. "Annenizin telefonu?" sor
9. `musteri_listesi` (anne)
10. Kayıt yoksa ad sor
11. `musteri_ekle` (anne)
12. `musteri_randevu_ekle` (kendisi)
13. `musteri_randevu_ekle` (anne) - AYRI ÇAĞRI!

---

### Örnek 4: Randevu İptal

**Müşteri:** "Randevumu iptal etmek istiyorum"

**AI Akışı:**
1. `musteri_randevu_listesi`
2. Liste göster (2+ varsa List Message)
3. Müşteri seçer
4. "Emin misiniz?" sor
5. `musteri_randevu_guncelle` (hizmet_durumu: "İptal Edildi")

---

### Örnek 5: Randevu Değiştirme

**Müşteri:** "Protez tırnak randevumu değiştirmek istiyorum"

**AI Akışı:**
1. `musteri_randevu_listesi`
2. Randevuyu göster
3. "Hangi tarihe?" sor
4. `hizmetler` (Protez Tırnak - fiyat/süre bilgisi)
5. `availability_checker` (yeni tarih)
6. Seçenekler göster
7. Onay al
8. `musteri_randevu_ekle` (YENİ randevu) ← ÖNCE!
9. `musteri_randevu_guncelle` (ESKİ randevu, hizmet_durumu: "Güncellendi") ← SONRA!

---

## 🔗 İlgili Dosyalar

- **System Prompt:** Bu dosyanın içinde (Workflow JSON'da)
- **Subworkflow:** `shared/subworkflows/availability-checker/`
- **Hizmet Kataloğu:** `shared/service-catalog.md`
- **Çalışan Bilgileri:** `shared/staff-info.md`
- **Output Formatter:** `whatsapp/output-formatter/`
