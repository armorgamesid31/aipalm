# WhatsApp Main Agent

Ana randevu yönetim AI agent'ı.

## Dosyalar
- `workflow-docs.md` - Workflow JSON + System Prompt
- `README.md` - Bu dosya (genel açıklama)

## Ne Yapar?
- Müşterilerle WhatsApp üzerinden konuşur
- Randevu oluşturur, değiştirir, iptal eder
- Grup randevu yönetir (2+ kişi)
- Müşteri kaydı kontrol eder

## Tool'lar
- `musteri_listesi` - Müşteri sorgu
- `musteri_ekle` - Yeni kayıt
- `hizmetler` - Hizmet bilgisi
- `musteri_randevu_listesi` - Randevuları listele
- `musteri_randevu_ekle` - Yeni randevu
- `musteri_randevu_guncelle` - İptal/değiştir
- `availability_checker` - Müsaitlik kontrolü (subworkflow)

## Önemli Notlar
1. Tool çağrılarında ara mesaj gönderme
2. Her hizmet = ayrı `randevu_ekle` çağrısı
3. Grup randevuda bilgi toplama SONRA
4. List message 2+ seçenek varsa
