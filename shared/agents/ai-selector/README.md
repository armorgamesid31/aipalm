# AI Alternatif Seçici

## Amaç

Availability checker'dan gelen 10 farklı randevu senaryosunu analiz edip, müşteri ihtiyacına en uygun 3 tanesini seçmek.

## Workflow Yapısı

```
┌─────────────────────────┐
│  Availability Checker   │
│  (10 senaryo üretir)    │
└───────────┬─────────────┘
            │
            │ status: "ai_selection_required"
            │ needs_ai_selection: true
            │ options: [10 senaryo]
            │ customer_request: {...}
            │
            ▼
┌─────────────────────────┐
│    IF Node              │
│  needs_ai_selection?    │
└───────────┬─────────────┘
            │
       YES  │  NO
      ┌─────┴─────┐
      │           │
      ▼           ▼
┌─────────┐  ┌──────────────┐
│ AI Seç  │  │ Direkt Döndür│
│ (Gemini)│  │ (3 alternatif)│
└────┬────┘  └──────────────┘
     │
     │ En iyi 3 senaryo
     ▼
┌─────────────────────────┐
│  Output Formatter       │
│  (Follow-up soru ekle)  │
└─────────────────────────┘
```

## Input Format (AI Node'a)

```json
{
  "status": "ai_selection_required",
  "needs_ai_selection": true,
  "options": [
    {
      "id": 1,
      "complete": true,
      "group_appointments": [
        {
          "for_person": "self",
          "appointment": {
            "date": "22/11/2025",
            "day_name": "Cumartesi",
            "start_time": "19:00",
            "end_time": "19:40",
            "service": "Lazer Genital",
            "expert": "Sevcan",
            "price": 550,
            "duration": 40
          }
        }
      ],
      "total_price": 800,
      "total_duration": 40,
      "arrangement": "sequential",
      "missing_services": [],
      "alternative_reason": "Akşam saati – tercih edilen uzman",
      "priority": 2
    }
    // ... 9 more scenarios
  ],
  "customer_request": {
    "services": ["Lazer Genital", "Kaş + Bıyık Alımı"],
    "date": "22/11/2025",
    "time_window": {"start": "19:00", "end": "20:00"},
    "expert_preference": null
  }
}
```

## AI Prompt (Gemini)

```markdown
Sen bir güzellik salonu randevu asistanısın. Müşteriye en uygun 3 randevu seçeneğini seçmen gerekiyor.

# Müşteri Talebi:
- Hizmetler: {{customer_request.services}}
- Tercih edilen tarih: {{customer_request.date}}
- Tercih edilen saat aralığı: {{customer_request.time_window.start}} - {{customer_request.time_window.end}}
- Uzman tercihi: {{customer_request.expert_preference || "Belirtilmedi"}}

# Seçenekler (10 senaryo):
{{#each options}}
## Seçenek {{id}}:
- Tarih: {{group_appointments.0.appointment.date}} ({{group_appointments.0.appointment.day_name}})
- Saat: {{group_appointments.0.appointment.start_time}}
- Uzman: {{group_appointments.0.appointment.expert}}
- Fiyat: {{total_price}} TL
- Sebep: {{alternative_reason}}
- Priority Score: {{priority}} (düşük = daha iyi)
- Tam randevu: {{#if complete}}Evet{{else}}Hayır (bazı hizmetler eksik){{/if}}
{{/each}}

# Görevin:
Müşteri ihtiyacına en uygun 3 seçeneği seç. Seçerken şu kriterlere dikkat et:

1. **Priority Score** (en önemli): Düşük priority daha iyi (0 = mükemmel eşleşme)
2. **Müşteri tercihi**: Tarih ve saat tercihi dikkate al
3. **Çeşitlilik**: 3 seçenek birbirinden farklı olmalı (aynı saat olmasın)
4. **Uzman tercihi**: Müşteri belirttiyse tercih edilen uzmanı öne çıkar
5. **Completeness**: Tam randevuları eksik olanlara tercih et

# Output Format (JSON):
{
  "selected_options": [1, 5, 8],  // En iyi 3 seçeneğin id'leri
  "reasoning": "Seçim gerekçesi (Türkçe, 2-3 cümle)"
}
```

## AI Node Konfigürasyonu (n8n)

1. **Node Type**: HTTP Request veya Google Gemini
2. **Method**: POST
3. **URL**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
4. **Headers**:
   - `Content-Type`: `application/json`
   - `x-goog-api-key`: `{{$env.GOOGLE_GEMINI_API_KEY}}`

5. **Body**:
```json
{
  "contents": [{
    "parts": [{
      "text": "{{AI_PROMPT}}"  // Yukarıdaki prompt template
    }]
  }],
  "generationConfig": {
    "temperature": 0.3,  // Düşük = daha deterministik
    "topK": 1,
    "topP": 1,
    "maxOutputTokens": 500,
    "response_mime_type": "application/json"
  }
}
```

6. **Output Processing**:
```javascript
// Gemini response'u parse et
const aiResponse = JSON.parse($json.candidates[0].content.parts[0].text);
const selectedIds = aiResponse.selected_options;

// Original options'tan seç
const allOptions = $('Availability Checker').item.json.options;
const selectedOptions = allOptions.filter(opt => selectedIds.includes(opt.id));

// Yeni output oluştur
return {
  status: "alternatives",
  options: selectedOptions,
  follow_up_question: "Hangisini tercih edersiniz?",
  ai_reasoning: aiResponse.reasoning
};
```

## Örnek AI Response

```json
{
  "selected_options": [1, 4, 7],
  "reasoning": "Müşteri akşam saati (19:00) tercih ettiği için 1. seçenek en uygun (priority: 2). 4. seçenek öğleden sonra alternatifi olarak çeşitlilik sağlıyor (priority: 4). 7. seçenek farklı gün alternatifi sunuyor (priority: 6)."
}
```

## Test Senaryosu

**Input** (Availability Checker'dan):
- 10 senaryo
- Müşteri: Akşam 19:00-20:00 istiyor

**Beklenen AI Çıktısı**:
1. Akşam 19:00 (priority: 2) - İSTENEN SAAT
2. Öğleden sonra 17:00 (priority: 4) - YAKIN SAT
3. Öğle 13:00 (priority: 6) - FARKLI ALTERNATİF

## Hata Durumları

1. **AI yanıt vermezsе**: 3'ten az seçenek döner
   - Fallback: Priority'ye göre ilk 3'ünü al

2. **AI geçersiz ID seçerse**: Olmayan ID'ler
   - Fallback: Geçerli olanları al + eksikleri priority ile doldur

3. **API hatası**: Timeout, rate limit
   - Fallback: Direkt priority sorting ile 3 seçenek döndür

## Performans

- **Gemini 1.5 Flash**: ~500ms response time
- **Token usage**: ~1000 input + 100 output = 1100 tokens
- **Cost**: ~$0.0001 per request (çok düşük)

## Avantajlar

✅ Müşteri ihtiyacına daha uygun seçim
✅ Doğal dil anlayışı ile esnek değerlendirme
✅ Çeşitlilik garantisi
✅ Gerekçeli seçim (müşteriye açıklanabilir)
✅ Düşük maliyet ve hızlı yanıt
