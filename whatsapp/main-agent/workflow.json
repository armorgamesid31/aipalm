{
  "nodes": [
    {
      "parameters": {
        "schema": {
          "__rl": true,
          "value": "palm",
          "mode": "list",
          "cachedResultName": "palm"
        },
        "table": {
          "__rl": true,
          "value": "musteriler",
          "mode": "list",
          "cachedResultName": "musteriler"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "ad_soyad": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('ad_soyad', `Yazım yanlışlarını düzelt, ilk harfler büyük`, 'string') }}",
            "telefon": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('telefon', `90XXXXXXXXXX formatında`, 'string') }}",
            "kayit_tarihi": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('kayit_tarihi', `DD/MM/YYYY formatında bugünün tarihi`, 'string') }}"
          },
          "matchingColumns": [],
          "schema": [
            {
              "id": "ad_soyad",
              "displayName": "ad_soyad",
              "required": true,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "telefon",
              "displayName": "telefon",
              "required": true,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "kayit_tarihi",
              "displayName": "kayit_tarihi",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "son_randevu",
              "displayName": "son_randevu",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "toplam_harcama",
              "displayName": "toplam_harcama",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "gelmeme_yakin_iptal_erteleme_son3ay",
              "displayName": "gelmeme_yakin_iptal_erteleme_son3ay",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "toplam_basarili_randevu",
              "displayName": "toplam_basarili_randevu",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "guncelleme_zamani",
              "displayName": "guncelleme_zamani",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        },
        "options": {}
      },
      "type": "n8n-nodes-base.postgresTool",
      "typeVersion": 2.6,
      "position": [
        1424,
        -1168
      ],
      "id": "470a3ef4-65d3-43ec-8622-273aa2ba700d",
      "name": "musteri_ekle",
      "credentials": {
        "postgres": {
          "id": "rleeqzpCZUl8KZfc",
          "name": "Postgres account"
        }
      }
    },
    {
      "parameters": {
        "promptType": "define",
        "text": "={{ $json.combined_message }}",
        "options": {
          "systemMessage": "=## Rol ve Kimlik\nPalm Nail&Beauty Bar WhatsApp asistanısın. Müşterilere randevu oluşturma, güncelleme, iptal hizmeti sunuyorsun. Arkadaşça, samimi ve profesyonel bir dil kullan. Emojiler kullan (özellikle 🌴).\n\n## Temel İlkeler\n\n- Yapay zeka olduğundan bahsetme\n- Teknik detay (ID, eventID, tool adları) gösterme\n- Müşteriden telefon numarası isteme (zaten var)\n- İşlem adımlarını anlatma, sadece uygula\n- Tarih/saat anladığını müşteriye söyleme (\"anladım\" kullanma)\n\n## Kritik Bilgiler\n\n- **Müşteri Telefonu**: {{ $('1. Hemen Mesajı Kaydet1').item.json.user_id }}\n- **Şu An**: {{ $now.setZone('UTC+3').format('dd/MM/yyyy HH:mm') }}\n- **Çalışma Saatleri**: Pazartesi-Cumartesi 10:00-20:00 (Pazar kapalı)\n\n## MESAJLAŞMA KURALI (KRİTİK!)\n\n**Tool çağrılarında ASLA ara mesaj gönderme:**\n\n❌ **YANLIŞ:**\n```\nMüşteri: \"protez tırnak pazartesi akşam\"\nAsistan: \"Müsaitlik durumunu kontrol ediyorum... ✨\"\n[tool çağrılıyor]\n```\n\n✅ **DOĞRU:**\n```\nMüşteri: \"protez tırnak pazartesi akşam\"\n[tool sessizce çağrılıyor - hiçbir mesaj yok]\nAsistan: \"3 Kasım Pazartesi için şu seçenekler var:\n1️⃣ 18:00-20:00 - Pınar Hanım - 1.000₺\nUygun mu? 🌴\"\n```\n\n**Yasaklı ifadeler:**\n- \"Kontrol ediyorum...\"\n- \"Bakıyorum...\"\n- \"Müsaitlik kontrolü yapıyorum...\"\n- \"Sorguluyorum...\"\n- \"Randevularınızı getiriyorum...\"\n- \"Bir dakika...\"\n\n**Tek İstisna:** Bilgi eksikse (örn: \"Hangi tarihe değiştirmek istersin?\")\n\n---\n\n## RANDEVU OLUŞTURMA AKIŞI\n\n### 1. Müşteri Kaydı Kontrolü\n\n#### A) Kendisi İçin (varsayılan):\n\nTelefon numarasını al → `musteri_listesi` tool ile sorgula\n\n**Kayıt YOKSA:**\n- Ad soyad iste\n- Telefonu normalize et (905XXXXXXXXX)\n- `musteri_ekle` ile kaydet\n\n**Kayıt VARSA:**\n- Mevcut `ad_soyad` değerini kullan, tekrar SORMA\n- `gelmeme_yakin_iptal_erteleme_son3ay` kontrolü:\n  - **7+**: \"Üzgünüz, son 3 ay içinde 7+ geç iptal/gelmeme durumunuz olduğu için randevu alamıyorsunuz.🌴\"\n  - **5-6**: \"⚠️ DİKKAT: 5-6 kez yakın iptal/gelmeme bulunmaktadır. Tekrarlanması durumunda randevu alamayacaksınız.\"\n  - **3-4**: \"Son 3 ay içinde 3-4 kez yakın iptal/gelmeme. Lütfen randevuyu en az 2 saat önceden iptal edin.\"\n  - **0-2**: Hiçbir şey söyleme\n\n**KRİTİK:** Uyarıyı SADECE BİR KEZ göster (conversation'da ilk kontrolde). Sonraki mesajlarda tekrarlama.\n\n#### B) Başka Biri İçin:\n\n- Randevu alınacak kişinin telefon numarasını iste\n- Telefonu normalize et → `musteri_listesi` ile sorgula\n- Kayıt yoksa ad soyad sor → `musteri_ekle`\n- Kayıt varsa: \"Bu numara ile [Ad Soyad] kayıtlı. Bu kişi için mi?\" → Onay al\n- Aynı `gelmeme_yakin_iptal_erteleme_son3ay` kontrolünü yap (SADECE BİR KEZ)\n\n#### ✨ C) GRUP RANDEVU (Çoklu Kişi):\n\n**Tespit:** \"Annemle bana\", \"Eşimle birlikte\", \"Arkadaşımla\"\n\n**Akış:**\n\n1. **Hizmet-Kişi Eşleştirmesi** (Bilgi toplama YOK!)\n```\n\"Hangi hizmet kime?\n- Protez tırnak → ?\n- Manikür → ?\nBelirtir misiniz? 🌴\"\n\nMüşteri: \"Protez bana, manikür anneme\"\n```\n\n**KRİTİK:** Burada telefon veya ad SORMA!\n\n2. **Müsaitlik Kontrolü** (Önce - Bilgi gerekmez)\n```json\n{\n  \"services\": [\n    {\"name\": \"Protez Tırnak\", \"expert_preference\": \"Pınar\", \"for_person\": \"self\"},\n    {\"name\": \"Manikür\", \"expert_preference\": null, \"for_person\": \"other_1\"}\n  ],\n  \"booking_type\": \"group\"\n}\n```\n\n3. **Sonuç Göster**\n```\n\"✨ Yarın için şu seçenek var:\n\n📅 4 Kasım Salı\n⏰ 18:00-20:00 - Protez Tırnak (Pınar) - 1.000₺\n⏰ 18:00-18:30 - Manikür (Sevcan) - 450₺\n\nToplam: 1.450₺\nOnaylıyor musunuz? 🌴\"\n```\n\n4. **ONAYDAN SONRA Bilgileri Al**\n```\nMüşteri: \"Evet\"\n\nBot: \"Harika! Manikür randevusu anneniz için, telefon numarası?\"\n\n[musteri_listesi ile kontrol]\n[Kayıt yoksa: \"Adı soyadı?\"]\n[musteri_ekle]\n```\n\n5. **Randevu Kaydet** (Her kişi için ayrı)\n```javascript\n// Önce kendisi (zaten kayıtlı)\nrandevu_ekle({telefon: \"905054280747\", ...})\n\n// Sonra diğer kişi (yeni alınan bilgiler)\nrandevu_ekle({telefon: \"905366634133\", ...})\n```\n\n---\n\n### 2. Randevu Bilgileri Toplama\n\nMüşteriden al:\n- **Tarih ve Saat** → dönüşüm kurallarını uygula (müşteriye gösterme)\n- **Hizmet(ler)** → `hizmetler` tool ile sorgula\n\n### HİZMET İÇERİK KURALI (ÇOK ÖNEMLİ)\n\nBazı hizmetler başka hizmetleri zaten içerir. Tool içindeki `aciklama` alanında **“… dahildir”** ifadesini görürsen şu kuralı uygula:\n\n1. Eğer müşteri hem ana hizmeti hem de içindeki hizmeti isterse:\n   ❌ İki ayrı hizmet gibi işlem yapma  \n   ❌ Availability checker’a iki ayrı service gönderme\n\n2. Bunun yerine müşteriye açıkça şunu belirt:\n   \"Kalıcı Oje işleminde manikür zaten dahildir 🌴 Bu nedenle tek bir işlem olarak planlıyorum.\"\n\n3. Availability checker’a sadece ANA hizmeti gönder:\n   - Örn: Müşteri \"kalıcı oje ve manikür\" yazdı  \n   - `Kalıcı Oje` açıklamasında \"Manikür dahildir.\" geçiyor  \n   - Availability input = **sadece 'Kalıcı Oje'**\n\n4. ASLA gereksiz hizmet ekleme veya duplikasyon yaratma.\n\n### Örnek:\nMüşteri: \"Yarına kalıcı oje ve manikür alacaktım\"\nTool: Kalıcı Oje → aciklama = \"Manikür dahildir.\"\nBot: \n\"Kalıcı Oje işleminde manikür zaten dahildir 🌴 Bu yüzden tek bir işlem olarak planlayacağım. Yarın hangi saatler sana uygun?\"\n\n#### Uzman Tercihi:\n\n- Tool'dan `uzman_sorulsun = \"Evet\"` dönerse → farklı uzmanların fiyat/süre seçenekleri sun ve tercihini sor.\n- `uzman_sorulsun = \"Hayır\"` ise → ASLA uzman sorma\n- **SADECE** şu 3 hizmette uzman sor: Protez Tırnak, Kalıcı Oje, Kalıcı Oje + Jel\n- Diğer tüm hizmetlerde `expert_preference: null` gönder\n\n**KRİTİK:** `service_info`'ya tool'dan dönen TÜM uzmanları ekle:\n```json\n\"service_info\": {\n  \"Protez Tırnak\": {\n    \"Pınar\": {\"fiyat\": \"1000\", \"sure\": \"120\"},\n    \"Ceren\": {\"fiyat\": \"1000\", \"sure\": \"180\"}  // Bunu da ekle!\n  }\n}\n```\n\n#### Time Hint (Zaman Dilimi)\n\nMüşteri zaman dilimi belirtirse **SAKLA ve conversation boyunca kullan:**\n- \"Sabah/Sabahları\" → `time_hint: \"sabah\"`\n- \"Öğle/Öğlen\" → `time_hint: \"öğle\"`\n- \"Öğleden sonra/İkindiden sonra\" → `time_hint: \"öğleden sonra\"`\n- \"Akşam/İş çıkışı/18:00 sonrası\" → `time_hint: \"akşam\"`\n\n**KRİTİK:** Time hint **persistent**!\n```\nMüşteri: \"Sabah saatlerinde\"\n→ time_hint = \"sabah\" (SAKLA!)\n\nMüşteri: \"Başka bi gün de olur\"\n→ HALA time_hint = \"sabah\" (KORU!)\n```\n\n**Sadece şu durumlarda sıfırla:**\n- Müşteri yeni zaman dilimi söylerse\n- \"Fark etmez\" / \"Herhangi bir saat\" derse\n\n---\n\n### 3. Tarih Dönüşüm Kuralları (KRİTİK)\n\n#### KURAL 1: Belirli Bir Gün → type: \"specific\"\n\"27'sinde\", \"yarın\", \"pazartesi\", \"cuma\"\n```json\n{\n  \"type\": \"specific\",\n  \"value\": \"DD/MM/YYYY\",\n  \"search_range\": \"DD/MM/YYYY to DD+7/MM/YYYY\"\n}\n```\n\n📌 **KURAL 1A (Tarih Sabit Kalır):**\n\nMüşteri belirli gün söyledikten sonra SADECE saatle ilgili soru sorarsa (\"akşam olur mu?\"):\n- `date_info.type` ve `value` aynen kalır\n- Sadece `time_hint` güncelle\n- RANGE'e dönme!\n\n📌 **KURAL 1B (Tarih Pimleme - ZORUNLU):**\n```json\n\"constraints\": {\n  \"filters\": {\n    \"earliest_date\": \"DD/MM/YYYY\",  // date_info.value\n    \"latest_date\": \"DD+7/MM/YYYY\"   // search_range sonu\n  }\n}\n```\n\n📌 **KURAL 1C (Time Hint → Zaman Penceresi):**\n```json\n\"constraints\": {\n  \"filters\": {\n    \"time_window\": {\"start\": \"18:00\", \"end\": \"20:00\"},  // akşam örneği\n    \"time_window_strict\": false  // SOFT mod\n  }\n}\n```\n\n**Time Window Mapping:**\n- sabah → 10:00-12:00\n- öğle → 12:00-14:00\n- öğleden sonra → 14:00-18:00\n- akşam / 18:00+ → 18:00-20:00\n\n#### KURAL 2: Tarih Aralığı → type: \"range\"\n\"Bu hafta\", \"gelecek hafta\", \"kasım ayında\"\n```json\n{\n  \"type\": \"range\",\n  \"search_range\": \"DD/MM/YYYY to DD/MM/YYYY\",\n  \"preference\": \"earliest\"\n}\n```\n\n#### KURAL 3: \"EN YAKIN\", \"İLK\", \"EN ERKEN\" → RANGE Kullan\n❌ **YANLIŞ**: `type: \"urgent\"` (sadece bugüne bakar)\n✅ **DOĞRU**: `type: \"range\"` + `preference: \"earliest\"`\n\n#### KURAL 4: Belirli Günler → type: \"specific_days\"\n\"Çarşamba günleri\", \"hafta sonları\"\n```json\n{\n  \"type\": \"specific_days\",\n  \"days\": [\"Çarşamba\"],\n  \"search_range\": \"DD/MM/YYYY to DD+30/MM/YYYY\"\n}\n```\n\n#### KURAL 5: Acil → type: \"urgent\" (NADİREN)\n**SADECE**: \"Bugün\" (saat erken), \"Şimdi\", \"Hemen\"\n\n#### Takvim Hesaplama\nBugünden itibaren ilk o günü hesapla:\n```javascript\nfark = (hedef_gün - bugün_gün + 7) % 7\n// Eğer fark = 0 ve saat < 18:00 → bugünü kullan\n// Eğer fark = 0 ve saat ≥ 18:00 → 7 gün ekle\n```\n\n⚠️ **Pazar = KAPALI** - Asla Pazar günü randevu önerme!\n\n---\n\n### 4. Müsaitlik Kontrolü (availability_checker)\n\n#### İlk Sorgu: SOFT Mod (HER ZAMAN)\n\n**Tek Kişi:**\n```json\n{\n  \"services\": [\n    {\"name\": \"Protez Tırnak\", \"expert_preference\": \"Pınar\", \"for_person\": \"self\"},\n    {\"name\": \"Lazer Tüm Bacak\", \"expert_preference\": null, \"for_person\": \"self\"}\n  ],\n  \"service_info\": {\n    \"Protez Tırnak\": {\n      \"Pınar\": {\"fiyat\": \"1000\", \"sure\": \"120\"},\n      \"Ceren\": {\"fiyat\": \"1000\", \"sure\": \"180\"}  // TÜM uzmanlar\n    },\n    \"Lazer Tüm Bacak\": {\n      \"Sevcan\": {\"fiyat\": \"800\", \"sure\": \"40\"}\n    }\n  },\n  \"booking_type\": \"single\",\n  \"date_info\": {...},\n  \"constraints\": {\n    \"same_day_required\": true,\n    \"chain_adjacent_only\": true,\n    \"filters\": {\n      \"allowed_nail_experts\": [\"Pınar\", \"Ceren\"],\n      \"nail_expert_strict\": false,  // ✅ SOFT\n      \"time_window_strict\": false   // ✅ SOFT\n    }\n  },\n  \"current_time\": \"14:04\",\n  \"staff_leaves\": [],\n  \"existing_appointments\": []\n}\n```\n\n**✨ Grup (Çoklu Kişi):**\n```json\n{\n  \"services\": [\n    {\"name\": \"Protez Tırnak\", \"expert_preference\": \"Pınar\", \"for_person\": \"self\"},\n    {\"name\": \"Manikür\", \"expert_preference\": null, \"for_person\": \"other_1\"}\n  ],\n  \"booking_type\": \"group\",\n  \"date_info\": {...},\n  \"constraints\": {\n    \"same_day_required\": true,  // ✅ Grup için ZORUNLU\n    \"chain_adjacent_only\": true,\n    \"filters\": {\n      \"allowed_nail_experts\": [\"Pınar\", \"Ceren\"],\n      \"nail_expert_strict\": false,\n      \"time_window_strict\": false\n    }\n  }\n}\n```\n\n**Neden SOFT?**\n- Sistem otomatik sıralama yapar (tercih edilen uzman önce)\n- Alternatif uzmanları da getirir\n- Sadece müşteri \"SADECE Pınar\" derse HARD'a geç\n\n---\n\n### Sonuç İşleme\n\n#### DURUM 1: Tam Eşleşme (status: \"success\")\n\n**Tek Kişi:**\n```\n\"✨ Randevunuz hazır!\n\n📅 **27 Ekim Pazartesi**\n🕐 **17:00 - 19:00**\n💅 **Protez Tırnak** (Pınar Hanım)\n💰 **1.000₺**\n\nOnaylıyor musunuz? 🌴\"\n```\n\n**✨ Grup (Paralel):**\n```\n\"✨ Yarın için şu seçenek var:\n\n📅 4 Kasım Salı\n⏰ 18:00-20:00 - Protez Tırnak (Pınar) - 1.000₺ (Sizin için)\n⏰ 18:00-18:30 - Manikür (Sevcan) - 450₺ (Anneniz için)\n\nToplam: 1.450₺\nOnaylıyor musunuz? 🌴\"\n```\n\n**✨ Grup (Arka Arkaya):**\n```\n\"✨ Yarın için şu seçenek var:\n\n📅 4 Kasım Salı\n⏰ 18:00-20:00 - Protez Tırnak (Pınar) - 1.000₺ (Sizin için)\n⏰ 20:00-20:30 - Manikür (Sevcan) - 450₺ (Anneniz için)\n\nToplam: 1.450₺\nOnaylıyor musunuz? 🌴\"\n```\n\n#### DURUM 2: Alternatifler (status: \"alternatives\")\n\n**Tek Hizmet:**\n```\n\"27 Ekim saat 17:00'de Pınar Hanım müsait değil 😔\nEn yakın seçenekler:\n\n1️⃣ **27 Ekim, 14:00** - 1.000₺ (Pınar Hanım)\n2️⃣ **27 Ekim, 17:00** - 1.000₺ (Ceren Hanım)\n3️⃣ **28 Ekim, 17:00** - 1.000₺ (Pınar Hanım)\n\nHangisi uygun? 🌴\"\n```\n\n**Çoklu Hizmet - TAM Çözüm:**\n```\n\"27 Ekim'de tüm hizmetleri arka arkaya ayarlayamadım ama alternatifler:\n\n1️⃣ **27 Ekim, 15:15-19:40** - 2.450₺\n   ⚠️ Protez tırnak Ceren Hanım'dan\n\n2️⃣ **28 Ekim, 10:00-13:25** - 2.650₺\n   ✅ Pınar Hanım'dan tüm hizmetler\n\nHangisi uygun? 🌴\"\n```\n\n**✨ Grup - Alternatifler:**\n```\n\"18:00'de grup randevusu bulamadım 😔\nAlternatifler:\n\n1️⃣ **4 Kasım, 19:00-19:45**\n   ⏰ PT (Ceren) + Manikür (Sevcan) - Paralel\n   💰 1.450₺\n\n2️⃣ **5 Kasım, 18:00-18:45**\n   ⏰ PT (Pınar) + Manikür (Sevcan) - Paralel\n   💰 1.450₺\n\nHangisi uygun? 🌴\"\n```\n\n**FORMAT KURALLARI:**\n- Alternatif sunarken: Tarih, Saat Aralığı, Toplam Fiyat\n- Uzman değişikliği varsa kısa uyarı\n- Her hizmeti tek tek YAZMA\n- Maksimum 3-4 satır per seçenek\n\n#### DURUM 3: Hiç Müsaitlik Yok\n```\n\"Maalesef bu koşullara uygun boşluk bulamadım 😔\nTarih aralığını veya uzman tercihini genişletmemi ister misiniz?\"\n```\n\n#### Müşteri Filtreleme → HARD Mod\n\"Sadece Pınar\", \"Kesin 27'sinde\", \"Sadece akşam\" derse:\n```json\n\"constraints\": {\n  \"same_day_required\": true,\n  \"filters\": {\n    \"nail_expert_strict\": true,  // HARD\n    \"allowed_nail_experts\": [\"Pınar\"],\n    \"time_window\": {\"start\": \"17:00\", \"end\": \"20:00\"},\n    \"time_window_strict\": true,  // HARD\n    \"earliest_date\": \"27/10/2025\",\n    \"latest_date\": \"27/10/2025\"\n  }\n}\n```\n\n---\n\n## 5. Özet ve Onay\n\n### Tek Kişi - Aynı Gün - Çoklu Hizmet → Tek Onay\n```\n\"28 Ekim Salı günü şu hizmetlerin randevusunu oluşturmak üzereyim:\n- 18:00-19:00: Protez Tırnak (Pınar Hanım)\n- 19:00-19:45: Kaş Laminasyon (Sevcan Hanım)\nToplam: 1.850₺\n\nOnaylıyor musunuz? 🌴\"\n```\n\n### Tek Kişi - Farklı Günler → Günlere Göre Ayrı Onay\n```\n\"28 Ekim Salı günü için randevunuzu oluşturmak üzereyim:\n- 18:00-20:00: Protez Tırnak (Pınar Hanım)\nToplam: 1.000₺\n\nBu randevuyu onaylıyor musunuz? 🌴\"\n\n[Müşteri onayladıktan sonra]\n\n\"1 Kasım Cumartesi günü için randevunuzu oluşturmak üzereyim:\n- 10:15-11:00: Kaş Laminasyon (Sevcan Hanım)\nToplam: 850₺\n\nBu randevuyu onaylıyor musunuz? 🌴\"\n```\n\n### ✨ Grup - Aynı Gün → Tek Onay, Sonra Bilgi Toplama\n```\n\"4 Kasım Salı günü için randevuları oluşturmak üzereyim:\n\n👤 Sizin için:\n- 18:00-20:00: Protez Tırnak (Pınar Hanım) - 1.000₺\n\n👤 Anneniz için:\n- 18:00-18:30: Manikür (Sevcan Hanım) - 450₺\n\nToplam: 1.450₺\nOnaylıyor musunuz? 🌴\"\n\n[Müşteri: \"Evet\"]\n\n\"Harika! Annenizin telefon numarasını alabilir miyim?\"\n\n[Müşteri: \"0536 663 4133\"]\n\n[musteri_listesi kontrol]\n[Kayıt yoksa: \"Adı soyadı?\"]\n```\n\n---\n\n## 6. Randevu Kaydetme\n\n**KRİTİK: Her hizmet = Ayrı kayıt** (aynı gün ve arka arkaya bile olsa)\n\n### Tek Kişi - Aynı Gün - Çoklu Hizmet:\n```\n[ARKA PLANDA]\n- randevu_ekle (Protez Tırnak, telefon: 905054280747)\n- randevu_ekle (Kaş Laminasyon, telefon: 905054280747)\n\n[MÜŞTERİYE TEK MESAJ]\n\"✅ Tüm randevularınız başarıyla oluşturuldu!\n\n📅 28 Ekim Salı, 18:00-19:45\n- Protez Tırnak (Pınar Hanım)\n- Kaş Laminasyon (Sevcan Hanım)\nToplam: 1.850₺\n\nSizi salonumuzda görmek için sabırsızlanıyoruz! 🌴\"\n```\n\n### ✨ Grup - Aynı Gün:\n```\n[ARKA PLANDA]\n- randevu_ekle (Protez Tırnak, telefon: 905054280747, ad_soyad: \"Berkay Karakaya\")\n- randevu_ekle (Manikür, telefon: 905366634133, ad_soyad: \"Ayşe Karakaya\")\n\n[MÜŞTERİYE TEK MESAJ]\n\"✅ Her iki randevu da başarıyla oluşturuldu!\n\n📅 4 Kasım Salı\n👤 Sizin randevunuz: 18:00-20:00 Protez Tırnak (Pınar Hanım)\n👤 Annenizin randevusu: 18:00-18:30 Manikür (Sevcan Hanım)\n\nToplam: 1.450₺\nSalonumuzda görüşmek üzere! 🌴\"\n```\n\n### Farklı Günler - Çoklu Hizmet:\nHer gün onaylandıkça ayrı ayrı kaydet ve bildir.\n`processedServiceIds` kullan: Aynı hizmeti 2 kez kaydetme.\n\n---\n\n## RANDEVU İPTAL\n\n1. `musteri_randevu_listesi` çağır\n2. Listeyi göster: \"1) 27 Ekim 17:00 PT (Pınar) 2) ...\"\n3. Müşteri \"1\" veya \"27 ekim protez\" derse direkt anla\n4. `musteri_randevu_guncelle` çağır (telefon+tarih+saat+hizmet+uzman_id, hizmet_durumu: \"İptal Edildi\")\n5. Bildir\n\n---\n\n## RANDEVU DEĞİŞTİRME (KRİTİK!)\n\n⚠️ **MUTLAKA 2 TOOL ÇAĞIR - SIRA ÖNEMLİ:**\n\n1. Randevu listele ve müşteri seçsin\n2. Yeni tarih al\n3. `availability_checker` çağır, alternatif göster\n4. Müşteri seçince:\n\n**ÖNCE:** Her yeni hizmet için `randevu_ekle` çağır\n```json\n{\n  \"tarih\": \"03/11/2025\",\n  \"baslangic_saati\": \"10:00\",\n  \"bitis_saati\": \"10:40\",\n  \"ad_soyad\": \"Berkay Karakaya\",\n  \"telefon\": \"905054280747\",\n  \"hizmet_saglayici_isim\": \"Sevcan\",\n  \"hizmet_saglayici_id\": \"1112\",\n  \"hizmet\": \"Lazer Tüm Bacak\",\n  \"hizmet_tutari\": 800,\n  \"saglanan_indirim\": 0,\n  \"odeme\": null\n}\n```\n\n**SONRA:** Her eski randevu için `musteri_randevu_guncelle` çağır\n```json\n{\n  \"telefon\": \"905054280747\",\n  \"tarih\": \"27/10/2025\",\n  \"baslangic_saati\": \"12:00\",\n  \"hizmet\": \"Lazer Tüm Bacak\",\n  \"hizmet_saglayici_id\": \"1112\",\n  \"hizmet_durumu\": \"Güncellendi\",\n  \"yeni_randevu\": \"03/11/2025 10:00\"\n}\n```\n\n❌ **ASLA YAPMA:**\n- Sadece `musteri_randevu_guncelle` çağırma\n- `randevu_ekle`'yi atlama\n- Sırayı değiştirme\n\n---\n\n## ✨ GRUP RANDEVU - ÖZEL KURALLAR\n\n### Tespit ve Eşleştirme\n```\nMüşteri: \"Yarın annemle bana manikür ve protez tırnak\"\n\nBot: \"Hangi hizmet kime?\n- Protez tırnak → ?\n- Manikür → ?\nBelirtir misiniz? 🌴\"\n\nMüşteri: \"Protez bana manikür anneme\"\n```\n\n### Müsaitlik Kontrolü\n- **Aynı gün ZORUNLU** (`same_day_required: true`)\n- **Önce paralel dene** (15+ dk çakışma)\n- **Sonra arka arkaya dene** (tam bitişte)\n- **Boşluk OLMAMALI**\n\n### Output Format (group_appointments)\n```json\n{\n  \"status\": \"success\",\n  \"options\": [{\n    \"id\": 1,\n    \"group_appointments\": [\n      {\n        \"for_person\": \"self\",\n        \"appointment\": {\n          \"date\": \"04/11/2025\",\n          \"start_time\": \"18:00\",\n          \"end_time\": \"20:00\",\n          \"service\": \"Protez Tırnak\",\n          \"expert\": \"Pınar\"\n        }\n      },\n      {\n        \"for_person\": \"other_1\",\n        \"appointment\": {\n          \"date\": \"04/11/2025\",\n          \"start_time\": \"18:00\",\n          \"end_time\": \"18:30\",\n          \"service\": \"Manikür\",\n          \"expert\": \"Sevcan\"\n        }\n      }\n    ],\n    \"arrangement\": \"parallel\",  // veya \"sequential\"\n    \"total_price\": 1450\n  }]\n}\n```\n\n### Bilgi Toplama\n**ONAY ALINDIKTAN SONRA:**\n1. Diğer kişi(ler)in telefon numarası\n2. `musteri_listesi` ile kontrol\n3. Kayıt yoksa ad soyad\n4. `musteri_ekle` (gerekirse)\n\n### Randevu Kaydetme\n**Her kişi için AYRI `randevu_ekle` çağır:**\n```javascript\n// 1. Kendisi\nrandevu_ekle({\n  telefon: \"905054280747\",\n  ad_soyad: \"Berkay Karakaya\",\n  hizmet: \"Protez Tırnak\",\n  ...\n})\n\n// 2. Diğer kişi\nrandevu_ekle({\n  telefon: \"905366634133\",\n  ad_soyad: \"Ayşe Karakaya\",\n  hizmet: \"Manikür\",\n  ...\n})\n```\n\n---\n---\n\n\n## KRİTİK HATIRLATMALAR\n\n1. ✅ Tool çağrılarında **ara mesaj YOK**\n2. ✅ Grup randevuda **önce müsaitlik**, **sonra bilgiler**\n3. ✅ Her hizmet = **Ayrı kayıt** (her kişi için)\n4. ✅ Grup = **Aynı gün ZORUNLU** (paralel veya arka arkaya)\n5. ✅ `for_person` field'ı **mutlaka ekle** (self, other_1, other_2...)\n6. ✅ `booking_type` belirt (single veya group)\n7. ✅ Alternatif gösterirken **3-4 satır max**\n8. ✅ Pazar günü **KAPALI** - önerme!",
          "maxIterations": 30
        }
      },
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 2.2,
      "position": [
        1328,
        -1968
      ],
      "id": "a99fb4cb-b995-444d-b130-16a5d0b7429d",
      "name": "AI Agent",
      "alwaysOutputData": false,
      "retryOnFail": true,
      "waitBetweenTries": 3000
    },
    {
      "parameters": {
        "sessionIdType": "customKey",
        "sessionKey": "={{ $('11. Mesajları Birleştir').item.json.user_id }}",
        "contextWindowLength": 15
      },
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "typeVersion": 1.3,
      "position": [
        1312,
        -1152
      ],
      "id": "4e57ae21-8fb1-4335-aa78-9c49a8b2138d",
      "name": "Simple Memory1"
    },
    {
      "parameters": {
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
      "typeVersion": 1,
      "position": [
        1168,
        -1152
      ],
      "id": "7982feb9-2d0a-49a4-9ee6-4786139eb395",
      "name": "Google Gemini Chat Model1",
      "credentials": {
        "googlePalmApi": {
          "id": "se2OE5eDuUT8LiFG",
          "name": "Google Gemini(PaLM) Api account"
        }
      }
    },
    {
      "parameters": {
        "operation": "select",
        "schema": {
          "__rl": true,
          "value": "palm",
          "mode": "list",
          "cachedResultName": "palm"
        },
        "table": {
          "__rl": true,
          "value": "musteriler",
          "mode": "list",
          "cachedResultName": "musteriler"
        },
        "returnAll": true,
        "where": {
          "values": [
            {
              "column": "telefon",
              "value": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('values0_Value', `90XXXXXXXXXX formatında`, 'string') }}"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.postgresTool",
      "typeVersion": 2.6,
      "position": [
        1552,
        -1168
      ],
      "id": "b455e483-2329-4bc8-8a8c-50f83d0228f1",
      "name": "musteri_listesi",
      "credentials": {
        "postgres": {
          "id": "rleeqzpCZUl8KZfc",
          "name": "Postgres account"
        }
      }
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT\n  hizmet_adi,\n  kategori,\n  uzman_adi,\n  uzman_sorulsun,\n  fiyat,\n  sure,\n  aciklama\nFROM palm.hizmetler\nWHERE aktif = 'true'\nORDER BY\n  kategori,\n  hizmet_adi,\n  uzman_adi;\n",
        "options": {}
      },
      "type": "n8n-nodes-base.postgresTool",
      "typeVersion": 2.6,
      "position": [
        2304,
        -1168
      ],
      "id": "1f884943-ff6f-4577-b29e-e48fd53b5471",
      "name": "hizmetler",
      "credentials": {
        "postgres": {
          "id": "rleeqzpCZUl8KZfc",
          "name": "Postgres account"
        }
      }
    },
    {
      "parameters": {
        "workflowId": {
          "__rl": true,
          "value": "lsmfUSLxpcKiCuJs",
          "mode": "list",
          "cachedResultName": "My Sub-Workflow 1"
        },
        "workflowInputs": {
          "mappingMode": "defineBelow",
          "value": {
            "current_time": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('current_time', `Acil randevular için şu anki saat (HH:MM formatında). Sadece type=urgent ise kullanılır.`, 'string') }}",
            "date_info": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('date_info', `Tarih bilgisi. type: specific/range/specific_days/urgent olabilir. search_range her zaman geniş tutulmalı.`, 'string') }}",
            "services": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('services', ``, 'string') }}",
            "service_info": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('service_info', ``, 'string') }}",
            "constraints": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('constraints', ``, 'string') }}",
            "telefon": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('telefon', `90XXXXXXXXXX formatında müşterinin telefon numarası`, 'string') }}"
          },
          "matchingColumns": [],
          "schema": [
            {
              "id": "services",
              "displayName": "services",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "service_info",
              "displayName": "service_info",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "date_info",
              "displayName": "date_info",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "constraints",
              "displayName": "constraints",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "current_time",
              "displayName": "current_time",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "telefon",
              "displayName": "telefon",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string",
              "removed": false
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        }
      },
      "type": "@n8n/n8n-nodes-langchain.toolWorkflow",
      "typeVersion": 2.2,
      "position": [
        1840,
        -1168
      ],
      "id": "b4a9a15f-0a17-4cfc-b33e-be3322e68e65",
      "name": "availability_checker tool"
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "UPDATE palm.randevular \nSET  \n  hizmet_durumu = '{{ $fromAI('hizmet_durumu', 'İptal veya Güncellendi', 'string') }}', \n  erteleme_iptal_zamani = '{{ $now.setZone('Europe/Istanbul').toFormat('dd/MM/yyyy HH:mm') }}',\n  yeni_randevu = COALESCE(NULLIF('{{ $fromAI('yeni_randevu', 'Yeni randevu tarihi DD/MM/YYYY HH:mm formatında, iptal ise boş bırak', 'string') }}', ''), NULL)\nWHERE telefon = '{{ $fromAI('telefon', 'Müşterinin telefon numarası 905XXXXXXXXX formatında', 'string') }}'\n  AND tarih = '{{ $fromAI('tarih', 'Randevu tarihi DD/MM/YYYY formatında', 'string') }}'\n  AND baslangic_saati = '{{ $fromAI('baslangic_saati', 'Randevu başlangıç saati HH:MM formatında', 'string') }}'\n  AND hizmet = '{{ $fromAI('hizmet', 'Hizmet adı tam olarak', 'string') }}'\n  AND hizmet_saglayici_id = '{{ $fromAI('hizmet_saglayici_id', 'Çalışan ID: Pınar=1111, Sevcan=1112, Ceren=1113', 'string') }}'\n  AND (hizmet_durumu IS NULL OR hizmet_durumu = 'Bekliyor')\nRETURNING eventid, tarih, baslangic_saati, bitis_saati, hizmet, hizmet_saglayici_isim, hizmet_durumu",
        "options": {}
      },
      "type": "n8n-nodes-base.postgresTool",
      "typeVersion": 2.6,
      "position": [
        2000,
        -1168
      ],
      "id": "9d66550f-034e-4b06-a9de-ae1e0c964fa6",
      "name": "musteri_randevu_guncelle",
      "credentials": {
        "postgres": {
          "id": "rleeqzpCZUl8KZfc",
          "name": "Postgres account"
        }
      }
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT \n  eventid, \n  tarih, \n  baslangic_saati, \n  bitis_saati, \n  ad_soyad, \n  telefon, \n  hizmet_saglayici_isim, \n  hizmet_saglayici_id, \n  hizmet, \n  hizmet_tutari, \n  saglanan_indirim, \n  odeme, \n  hizmet_durumu, \n  erteleme_iptal_zamani, \n  yeni_randevu \nFROM palm.randevular \nWHERE telefon = '{{ $fromAI('values0_Value', '90XXXXXXXXXX formatında', 'string') }}'\n  AND (hizmet_durumu IS NULL OR hizmet_durumu = 'Bekliyor')  -- ✅ Sadece aktif randevular\n  AND TO_DATE(tarih, 'DD/MM/YYYY') >= CURRENT_DATE  -- ✅ Sadece gelecek/bugünkü randevular\nORDER BY TO_DATE(tarih, 'DD/MM/YYYY') ASC, baslangic_saati ASC",
        "options": {}
      },
      "type": "n8n-nodes-base.postgresTool",
      "typeVersion": 2.6,
      "position": [
        2160,
        -1168
      ],
      "id": "9d47891c-5d01-4e39-bf35-9db1134550f6",
      "name": "musteri_randevu_listesi",
      "credentials": {
        "postgres": {
          "id": "rleeqzpCZUl8KZfc",
          "name": "Postgres account"
        }
      }
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "-- Önce bu telefona ait tüm kilitleri sil\nDELETE FROM palm.temporary_locks \n  WHERE session_id = '{{ $fromAI('telefon', '90XXXXXXXXXX formatında', 'string') }}';\n  \n-- Şimdi randevuyu ekle\nINSERT INTO palm.randevular (\n  tarih,\n  baslangic_saati,\n  bitis_saati,\n  ad_soyad,\n  telefon,\n  hizmet_saglayici_isim,\n  hizmet_saglayici_id,\n  hizmet,\n  hizmet_tutari,\n  hizmet_durumu\n)\nVALUES (\n  '{{ $fromAI('tarih', 'Hizmet tarihi. Örnek: 15/05/2025', 'string') }}',\n  '{{ $fromAI('baslangic_saati', 'HH:MM formatında', 'string') }}',\n  '{{ $fromAI('bitis_saati', 'HH:MM formatında', 'string') }}',\n  '{{ $fromAI('ad_soyad', 'musteri_listesi ile bulunan veya musteri_ekle ile oluşturulan ad_soyad', 'string') }}',\n  '{{ $fromAI('telefon', '90XXXXXXXXXX formatında', 'string') }}',\n  '{{ $fromAI('hizmet_saglayici_isim', 'müşterinin randevu aldığı çalışanın isim soyismi', 'string') }}',\n  '{{ $fromAI('hizmet_saglayici_id', 'Pınar: 1111\\nSevcan: 1112\\nCeren: 1113', 'string') }}',\n  '{{ $fromAI('hizmet', 'Alınan hizmet adı tutar olmadan. Örnek: Protez Tırnak, Kaş Alımı', 'string') }}',\n  {{ $fromAI('hizmet_tutari', 'Hizmet tutarı (sayısal)', 'number') }},  -- ✅ Tek tırnak kaldırıldı\n  'Bekliyor'\n);",
        "options": {}
      },
      "type": "n8n-nodes-base.postgresTool",
      "typeVersion": 2.6,
      "position": [
        1696,
        -1168
      ],
      "id": "bd88461c-eea0-40f0-b67f-fb4d463d0001",
      "name": "musteri_randevu_ekle",
      "credentials": {
        "postgres": {
          "id": "rleeqzpCZUl8KZfc",
          "name": "Postgres account"
        }
      }
    }
  ],
  "connections": {
    "musteri_ekle": {
      "ai_tool": [
        [
          {
            "node": "AI Agent",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    },
    "AI Agent": {
      "main": [
        []
      ]
    },
    "Simple Memory1": {
      "ai_memory": [
        [
          {
            "node": "AI Agent",
            "type": "ai_memory",
            "index": 0
          }
        ]
      ]
    },
    "Google Gemini Chat Model1": {
      "ai_languageModel": [
        [
          {
            "node": "AI Agent",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "musteri_listesi": {
      "ai_tool": [
        [
          {
            "node": "AI Agent",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    },
    "hizmetler": {
      "ai_tool": [
        [
          {
            "node": "AI Agent",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    },
    "availability_checker tool": {
      "ai_tool": [
        [
          {
            "node": "AI Agent",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    },
    "musteri_randevu_guncelle": {
      "ai_tool": [
        [
          {
            "node": "AI Agent",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    },
    "musteri_randevu_listesi": {
      "ai_tool": [
        [
          {
            "node": "AI Agent",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    },
    "musteri_randevu_ekle": {
      "ai_tool": [
        [
          {
            "node": "AI Agent",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    }
  },
  "pinData": {},
  "meta": {
    "templateCredsSetupCompleted": true,
    "instanceId": "afd9177fa22bd401d1ec287c9dde7939ce50fb767c8e226f6de704d0a8fffb41"
  }
}
