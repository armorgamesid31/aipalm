# WhatsApp Output Formatter - Workflow Documentation

**Son Güncelleme:** 18 Kasım 2025

---

## 📋 Genel Bakış

Ana agent'ın ürettiği output'u analiz eder ve WhatsApp formatına çevirir.

**Giriş:** `output` (ana agent'tan)  
**Çıkış:** Formatlanmış mesaj (List veya Text)

---

## 🏗️ Workflow Yapısı

### Node Listesi

1. **AI Agent (Output Formatter)**
   - Type: `@n8n/n8n-nodes-langchain.agent`
   - Model: Google Gemini Chat Model
   - **Memory YOK** (stateless işlem)

2. **Google Gemini Chat Model**
   - Type: `@n8n/n8n-nodes-langchain.lmChatGoogleGemini`
   - Bağlı: AI Agent → Language Model

3. **Check Output (Validator)**
   - Type: `n8n-nodes-base.code`
   - JavaScript validation
   - Output boş mu kontrol
   - Retry mekanizması (max 2)

4. **Switch (Karar Noktası)**
   - Type: `n8n-nodes-base.switch`
   - 3 çıkış:
     - `valid` → Formatter'a gönder
     - `retry` → Ana agent'a geri dön
     - `fallback` → Fallback mesajı gönder

5. **List mi Text mi? (Format Tespiti)**
   - Type: `n8n-nodes-base.if`
   - Condition: `output.includes("__LIST_MESSAGE__")`

6. **Parse List JSON**
   - Type: `n8n-nodes-base.code`
   - List JSON'u parse eder
   - Validation yapar
   - Error durumunda fallback

7. **Code (Text Payload Builder)**
   - Type: `n8n-nodes-base.code`
   - Plain text için WhatsApp payload üretir

---

## 🧠 System Prompt

Formatter agent'ın görevi:

### Kural 1: Ne Zaman List?

✅ **List Kullan:**
- Müsaitlik alternatifleri (2+ seçenek)
- Randevu listesi (2+ randevu)
- Hizmet alt kategorisi (3+ seçenek - Lazer/Ağda bölgeleri)

❌ **List Kullanma:**
- Tek seçenek
- Onay mesajları
- Bilgilendirme/sohbet

---

### Kural 2: WhatsApp API Limitleri

**ZORUNLU:**
- `header.text`: Max 60 karakter
- `rows[].title`: Max 24 karakter (Türkçe: 2 byte/harf)
- `rows[].description`: Max 72 karakter

**Kısaltmalar:**
- ❌ "Pınar Hanım" → ✅ "Pınar"
- ❌ "Ceren Hanım" → ✅ "Ceren"
- ❌ "Sevcan Hanım" → ✅ "Sevcan"

---

### Kural 3: ID Format

**YASAK:**
- `:` karakteri → `10:00` → `1000` (sil)
- Türkçe harfler → `ı→i, ş→s, ğ→g, ü→u, ö→o, ç→c`
- Özel karakterler (sadece `a-z, A-Z, 0-9, _`)

**ID Formatları:**

**Müsaitlik:**
```
alt_{option_id}_{gün}_{saat}_{uzman}
Örnek: alt_1_05_1000_pinar
```

**Randevu:**
```
appt_{gün}_{saat}_{hizmet}_{uzman}
Örnek: appt_05_1700_pt_pinar
```

**Hizmet:**
```
svc_{kategori}_{hizmet}
Örnek: svc_lazer_tum_bacak
```

---

### Kural 4: List Output Format
```
__LIST_MESSAGE__
{"header":"✨ Başlık","body":"Mesaj","footer":"Palm","button":"Seç","sections":[{"title":"Kategori","rows":[{"id":"unique_id","title":"Başlık (max 24)","description":"Açıklama (max 72)"}]}]}
```

**Önemli:**
- JSON tek satır, compact
- Boşluk/newline YOK
- `__LIST_MESSAGE__` prefix ZORUNLU

---

## 🔧 Validator (Check Output)

**JavaScript Kodu Mantığı:**
```javascript
const output = $input.item.json.output;
const retryCount = $input.item.json.retry_count || 0;
const MAX_RETRIES = 2;

// Validation
function isValidOutput(output) {
  if (output === null || output === undefined) return false;
  const str = String(output).trim();
  if (str === '' || str.length === 0) return false;
  return true;
}

const isValid = isValidOutput(output);

if (isValid) {
  return { status: 'valid', output, retry_count: retryCount };
} else if (retryCount < MAX_RETRIES) {
  return { status: 'retry', retry_count: retryCount + 1 };
} else {
  return { 
    status: 'fallback', 
    output: 'Üzgünüm, bir sorun oluştu. Lütfen tekrar dener misiniz? 🌴'
  };
}
```

**Akış:**
1. Output boş mu?
2. Boşsa retry count < 2 mi?
3. Evet → Ana agent'a geri dön
4. Hayır → Fallback mesajı

---

## 🔧 Parse List JSON

**JavaScript Kodu Mantığı:**
```javascript
const output = $input.item.json.output;

try {
  // 1. Prefix'i temizle
  const jsonStr = output.replace('__LIST_MESSAGE__', '').trim();
  
  // 2. JSON parse
  const listData = JSON.parse(jsonStr);
  
  // 3. Validation
  if (!listData.header || !listData.body) {
    // Defaults ekle
  }
  
  if (!listData.sections || listData.sections.length === 0) {
    throw new Error('No sections');
  }
  
  // 4. WhatsApp formatına çevir
  const payload = {
    "messaging_product": "whatsapp",
    "to": user_id,
    "type": "interactive",
    "interactive": {
      "type": "list",
      "header": { "type": "text", "text": listData.header },
      "body": { "text": listData.body },
      "footer": { "text": listData.footer },
      "action": {
        "button": listData.button,
        "sections": listData.sections
      }
    }
  };
  
  return { payload, success: true };
  
} catch (error) {
  // Fallback to text
  const textPayload = {
    "messaging_product": "whatsapp",
    "to": user_id,
    "type": "text",
    "text": {
      "body": "Seçenekleri düzgün görüntüleyemiyorum. İşte alternatifler:\n\n" + 
              output.replace('__LIST_MESSAGE__', '').substring(0, 800)
    }
  };
  
  return { payload: textPayload, success: false, fallback: true };
}
```

**Akış:**
1. `__LIST_MESSAGE__` prefix'i sil
2. JSON parse et
3. Validation (sections var mı?)
4. WhatsApp payload oluştur
5. Hata varsa → Text mesaj fallback

---

## 🔧 Text Payload Builder

**JavaScript Kodu Mantığı:**
```javascript
const to = user_id;
const bodyText = String($json.output ?? '').slice(0, 4000);

const payload = {
  messaging_product: 'whatsapp',
  to,
  type: 'text',
  text: {
    body: bodyText,
    preview_url: false
  }
};

return [{ json: { payload } }];
```

**Basit:**
- Output'u al
- Maksimum 4000 karakter
- WhatsApp text payload formatına koy

---

## 📊 Örnek Akışlar

### Örnek 1: Müsaitlik Alternatifleri

**Ana Agent Output:**
```
27 Ekim saat 17:00'de Pınar Hanım müsait değil 😔
En yakın seçenekler:

1️⃣ 27 Ekim, 14:00 - 1.000₺ (Pınar Hanım)
2️⃣ 27 Ekim, 17:00 - 1.000₺ (Ceren Hanım)
3️⃣ 28 Ekim, 17:00 - 1.000₺ (Pınar Hanım)

Hangisi uygun? 🌴
```

**Formatter Tespiti:**
- 3 seçenek var
- "1️⃣", "2️⃣", "3️⃣" pattern
- → List kullan

**Formatter Output:**
```
__LIST_MESSAGE__
{"header":"✨ Müsaitlik Seçenekleri","body":"27 Ekim 17:00'de Pınar Hanım müsait değil 😔 En yakın seçenekler:","footer":"Palm Nail&Beauty Bar","button":"Seç","sections":[{"title":"27 Ekim Pazartesi","rows":[{"id":"alt_1_27_1400_pinar","title":"14:00-16:00 - Pınar","description":"Protez Tırnak - 1.000₺"},{"id":"alt_2_27_1700_ceren","title":"17:00-20:00 - Ceren","description":"Protez Tırnak - 1.000₺"}]},{"title":"28 Ekim Salı","rows":[{"id":"alt_3_28_1700_pinar","title":"17:00-19:00 - Pınar","description":"Protez Tırnak - 1.000₺"}]}]}
```

---

### Örnek 2: Tek Seçenek (Plain Text)

**Ana Agent Output:**
```
✨ Randevunuz hazır!

📅 27 Ekim Pazartesi
🕐 17:00 - 19:00
💅 Protez Tırnak (Pınar Hanım)
💰 1.000₺

Onaylıyor musunuz? 🌴
```

**Formatter Tespiti:**
- Tek seçenek
- Onay sorusu
- → Plain text kullan

**Formatter Output:**
```
✨ Randevunuz hazır!

📅 27 Ekim Pazartesi
🕐 17:00 - 19:00
💅 Protez Tırnak (Pınar Hanım)
💰 1.000₺

Onaylıyor musunuz? 🌴
```
(Aynen geçer)

---

### Örnek 3: Randevu Listesi

**Ana Agent Output:**
```
Randevularınız:

1) 5 Kasım, 17:00 - Protez Tırnak (Pınar)
2) 8 Kasım, 10:00 - Lazer Tüm Bacak (Sevcan)

Hangisini iptal istersiniz?
```

**Formatter Tespiti:**
- 2 randevu
- Seçim gerekli
- → List kullan

**Formatter Output:**
```
__LIST_MESSAGE__
{"header":"📅 Randevularınız","body":"Hangi randevunuzu iptal veya değiştirmek istersiniz?","footer":"Palm Nail&Beauty Bar","button":"Seç","sections":[{"title":"Yaklaşan Randevular","rows":[{"id":"appt_05_1700_pt_pinar","title":"5 Kasım, 17:00","description":"Protez Tırnak - Pınar"},{"id":"appt_08_1000_lb_sevcan","title":"8 Kasım, 10:00","description":"Lazer Tüm Bacak - Sevcan"}]}]}
```

---

## ⚠️ Kritik Hatırlatmalar

1. **List sadece 2+ seçenek varsa**
2. **ID'lerde özel karakter YASAK**
3. **`:` karakterini sil** (`10:00` → `1000`)
4. **Türkçe harfleri çevir** (`ı→i, ş→s, ğ→g`)
5. **Title max 24 karakter**
6. **"Hanım" kelimesini ÇIKAR**
7. **JSON tek satır, compact**
8. **Validation hata verirse → Text fallback**

---

## 🔗 İlgili Dosyalar

- **Ana Agent:** `whatsapp/main-agent/`
- **System Prompt:** Bu dosyanın içinde (Workflow JSON'da)
