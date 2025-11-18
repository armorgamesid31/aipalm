# Çalışan Bilgileri

**Son Güncelleme:** 18 Kasım 2025

## Çalışma Saatleri

- **Açık Günler:** Pazartesi - Cumartesi
- **Çalışma Saatleri:** 10:00 - 20:00
- **Kapalı:** Pazar

---

## Çalışan Profilleri

### 👩 Pınar Demir (ID: 1111)

**Uzmanlık Alanları:**
- ⭐ Protez Tırnak (Ana uzmanlık)
- ⭐ Kalıcı Oje (Ana uzmanlık)
- ⭐ Kalıcı Oje + Jel Güçlendirme
- Medikal Manikür
- Islak Manikür
- Tırnak Çıkarma

**Çalışma Sistemi:**
- **Sabit Slot Sistemi** (Önceden belirlenmiş saatler)
- **Protez Tırnak Slotları:** 10:00, 12:00, 14:00, 16:00, 18:00
- **Kalıcı Oje Slotları:** 10:00, 10:30, 12:00, 12:30, 14:00, 14:30, 16:00, 16:30, 18:00, 18:30

**Fiyatlandırma:**
- Protez Tırnak: 1.000₺ (120 dk)
- Kalıcı Oje: 850₺ (90 dk)
- Kalıcı Oje + Jel: 850₺ (90 dk)
- Medikal Manikür: 450₺ (20 dk)
- Islak Manikür: 450₺ (20 dk)
- Tırnak Çıkarma: 250₺ (25 dk)

---

### 👩 Sevcan Yılmaz (ID: 1112)

**Uzmanlık Alanları:**
- Islak Manikür
- Tüm Lazer Epilasyon Hizmetleri
- Tüm Ağda Hizmetleri
- Kaş Alımı & Kaş Laminasyon
- Lifting & Cilt Bakımı
- G5 Masaj
- Tüm Pedikür Hizmetleri
- Ayak Kalıcı Oje
- Tırnak Çıkarma

**Çalışma Sistemi:**
- **Esnek Slot Sistemi** (5 dakikalık adımlarla her saat)
- Randevular 10:00-20:00 arası esnek ayarlanabilir

**Önemli Notlar:**
- En geniş hizmet yelpazesine sahip
- Lazer ve ağda hizmetlerinde tek uzman
- Gap-filling (boşluk doldurma) randevular alabilen tek uzman

---

### 👩 Ceren Kaçıral (ID: 1113)

**Uzmanlık Alanları:**
- ⭐ Protez Tırnak (Ana uzmanlık)
- ⭐ Kalıcı Oje (Ana uzmanlık)
- ⭐ Kalıcı Oje + Jel Güçlendirme
- Medikal Manikür
- Tırnak Çıkarma

**Çalışma Sistemi:**
- **Sabit Slot Sistemi** (Önceden belirlenmiş saatler)
- **Protez Tırnak Slotları:** 11:00, 14:00, 17:00
- **Kalıcı Oje Slotları:** 11:00, 12:00, 14:00, 15:00, 17:00, 18:00

**Fiyatlandırma:**
- Protez Tırnak: 1.000₺ (180 dk) ⚠️ Pınar'dan 60 dk uzun
- Kalıcı Oje: 850₺ (120 dk)
- Kalıcı Oje + Jel: 850₺ (120 dk)
- Medikal Manikür: 450₺ (45 dk)
- Tırnak Çıkarma: 250₺ (40 dk)

**Özel Notlar:**
- Protez tırnak işlemleri daha uzun sürer (3 saat)
- Daha az slot sayısı (günde 3 ana randevu)

---

### 👩 İlayda Kaya (ID: 1114)

**Durum:** ⚠️ Henüz aktif değil
**Planlanan Uzmanlık:** Tırnak hizmetleri

---

## Kapasite Kuralları

### Eşzamanlı Randevu Limitleri

1. **Tırnak Hizmetleri (Protez/Kalıcı Oje):**
   - Maksimum 2 eşzamanlı randevu
   - Uzmanlar: Pınar + Ceren (veya Pınar + Pınar farklı slotlarda)

2. **Lazer Epilasyon:**
   - Maksimum 1 randevu (Sevcan tek başına)

3. **Diğer Hizmetler:**
   - Kapasite kısıtı yok (Sevcan farklı hizmetleri üst üste yapabilir)

---

## İzin Sistemi

### İzin Türleri
1. **Tam Gün İzni:** O gün hiç randevu alınamaz
2. **Yarım Gün İzni:** Belirli saatler arası randevu alınamaz

### İzin Kontrolü
- Her availability check'te `staff_leaves` kontrol edilir
- İzinli olan uzmandan o tarihte randevu alınamaz
- Sistem otomatik alternatif uzman önerir

---

## Uzman Tercihi Kuralları

### Tercih Sorulmalı (Uzman seçimi önemli)
✅ **Protez Tırnak**
✅ **Kalıcı Oje**
✅ **Kalıcı Oje + Jel**

**Neden?**
- Hem Pınar hem Ceren yapıyor
- Fiyat aynı ama süre farklı
- Müşteri slot tercihine göre seçim yapmalı

### Tercih Sorulmamalı (Tek uzman)
❌ Tüm Lazer Hizmetleri → Sevcan
❌ Tüm Ağda Hizmetleri → Sevcan
❌ Tüm Yüz & Cilt Hizmetleri → Sevcan
❌ Tüm Pedikür Hizmetleri → Sevcan
❌ G5 Masaj → Sevcan

---

## Örnek Senaryo: Randevu Planlama

### Senaryo 1: Protez Tırnak + Lazer
**Müşteri:** "Yarın protez tırnak ve lazer tüm bacak istiyorum"

**AI Düşünce Süreci:**
1. Protez Tırnak → Uzman tercihi sor (Pınar/Ceren)
2. Lazer → Sevcan (otomatik)
3. Aynı gün mi? → Evet (constraints: same_day_required)
4. Arka arkaya mı? → Evet (chain_adjacent_only)

**Örnek Çözüm:**
- 10:00-12:00: Protez Tırnak (Pınar) - 1.000₺
- 12:00-12:40: Lazer Tüm Bacak (Sevcan) - 800₺
- **Toplam:** 1.800₺

---

### Senaryo 2: Grup Randevu
**Müşteri:** "Annemle birlikte yarın kalıcı oje almak istiyoruz"

**AI Düşünce Süreci:**
1. Grup tespit (2 kişi)
2. Aynı hizmet ama farklı kişiler
3. Same day ZORUNLU
4. Paralel slot ara (15+ dk çakışma)

**Örnek Çözüm:**
- 14:00-15:30: Kalıcı Oje (Pınar) - Müşteri için
- 14:00-15:30: Kalıcı Oje (Ceren) - Anne için
- **Arrangement:** Parallel
- **Toplam:** 1.700₺

---

## Önemli Hatırlatmalar

1. ✅ Pazar günü KAPALI - asla randevu önerme
2. ✅ Lazer = TEK kapasite (Sevcan)
3. ✅ Tırnak = 2 kapasite (Pınar + Ceren)
4. ✅ Gap-filling sadece Sevcan
5. ✅ Uzman tercihi sadece 3 hizmette
6. ✅ İzin kontrolü her availability check'te
7. ✅ Grup randevuda same_day ZORUNLU
