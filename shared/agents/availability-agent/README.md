# Availability Agent

## Amaç

Bu agent, ana conversational agent ile availability checker subworkflow arasında bir **teknik translation layer** görevi görür.

Ana agent'tan gelen basit, doğal dil formatındaki müsaitlik taleplerini alır ve availability checker'ın beklediği kompleks JSON formatına dönüştürür.

## Sorumluluklar

1. **Tarih Dönüşümü**: "yarın sabah" → `{type: "specific", value: "19/11/2025", ...}`
2. **Hizmet Bilgisi Toplama**: `hizmetler` tool'u çağırarak service_info oluşturma
3. **Constraint Oluşturma**: SOFT/HARD mod, zaman pencereleri, uzman filtreleri
4. **Validation**: Tarih geçmişte mi, Pazar mı, format doğru mu
5. **Hata Yönetimi**: Anlaşılır hata mesajları döndürme

## Kullanım

### Input (Ana Agent'tan - Doğal Dil)

```
Yarın sabah, Pınar'dan protez tırnak. Tek kişi için. Sabah saatleri tercih ediliyor. Tarih ve saat esnekliği var, uzman değiştirilebilir.

Şu an: 18/11/2025 14:04
```

**Başka bir örnek:**
```
SADECE 27 Kasım, KESINLIKLE akşam saatleri, Pınar'dan protez tırnak ve Sevcan'dan lazer tüm bacak. Tek kişi için. Tarih değiştirilemez, saat değiştirilemez, uzman değişebilir.

Şu an: 18/11/2025 14:04
```

### Output (Availability Checker için)

```json
{
  "services": [...],
  "service_info": {...},
  "booking_type": "single",
  "date_info": {
    "type": "specific",
    "value": "19/11/2025",
    "search_range": "19/11/2025 to 26/11/2025"
  },
  "constraints": {...},
  "current_time": "14:04",
  "staff_leaves": [],
  "existing_appointments": []
}
```

## Avantajlar

- **Separation of Concerns**: Conversational vs teknik mantık ayrımı
- **Yeniden Kullanılabilirlik**: Instagram agent de aynı agent'ı kullanabilir
- **Kolay Bakım**: Format değişikliği sadece bu agent'ta yapılır
- **Daha İyi Test**: Her katman bağımsız test edilebilir

## n8n Workflow Yapısı

```
1. Webhook/Tool Call Input
   ↓
2. Agent (AI Chat Model)
   - System Prompt: /shared/agents/availability-agent/system-prompt.md
   ↓
3. hizmetler Tool (DB Query)
   ↓
4. JSON Output Builder
   ↓
5. Response
```

## Kurulum

1. n8n'de yeni workflow oluştur
2. AI Chat Model node ekle
3. System prompt'u `/shared/agents/availability-agent/system-prompt.md`'den yükle
4. `hizmetler` tool'unu ekle
5. Ana agent'a bu workflow'u tool olarak ekle

## Test

```bash
# Test input (doğal dil)
Yarın akşam, Pınar'dan protez tırnak. Tek kişi için. Akşam saatleri tercih ediliyor. Tarih ve saat esnekliği var, uzman değiştirilebilir.

Şu an: 18/11/2025 14:04

# Expected: Valid JSON with date_info.type: "specific", date_info.value: "19/11/2025",
# constraints.filters.time_window: {"start": "18:00", "end": "20:00"},
# constraints.filters.nail_expert_strict: false
```

## Dosyalar

- `system-prompt.md`: Agent talimatları ve kuralları
- `README.md`: Bu dosya
- `workflow.json`: n8n workflow (sizin tarafınızdan eklenecek)
