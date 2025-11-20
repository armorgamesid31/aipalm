// ============================================
// SUBWORKFLOW: availability_checker (GROUP BOOKING SUPPORT)
// CODE NODE - Kombinasyon Üretimi ve Puanlama
// ✅ GRUP RANDEVU DESTEĞİ EKLENDİ
// ✅ PARALEL/SEQUENTIAL ALGILAMA
// ✅ AYNI UZMAN OTOMATİK TESPİT
// ============================================

// ============================================
// BÖLÜM 1: YARDIMCI FONKSİYONLAR (Mevcut - Değişiklik Yok)
// ============================================

function parseTurkishDate(dateStr) {
  const [day, month, year] = (dateStr || '').split('/').map(Number);
  return new Date(year, month - 1, day);
}

function formatTurkishDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function getDayName(date) {
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  return days[date.getDay()];
}

function timeToMinutes(time) {
  const [h, m] = (time || '00:00').split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function addMinutes(time, minutes) {
  return minutesToTime(timeToMinutes(time) + minutes);
}

function normalizeExpertName(name) {
  if (!name) return '';
  const first = name.trim().split(' ')[0];
  return first.toLowerCase()
    .replace('ı', 'i').replace('ğ', 'g').replace('ü', 'u')
    .replace('ş', 's').replace('ö', 'o').replace('ç', 'c');
}

function normalizeServiceName(name) {
  if (!name) return "";
  let n = String(name).trim();
  n = n.replace(/Tırnak Çıkartma/gi, "Tırnak Çıkarma");
  n = n.replace(/Ayak Kalıcı$/gi, "Ayak Kalıcı Oje");
  return n;
}

function canonicalExpert(name){
  if (!name) return '';
  const norm = normalizeExpertName(name);
  const matchKey = Object.keys(EXPERT_RULES || {})
    .find(k => normalizeExpertName(k) === norm);
  return matchKey || (name?.split(' ')[0] || name);
}

function getServiceDetails(serviceInfo, serviceName, expertName){
  const dict = serviceInfo?.[serviceName] || {};
  if (dict[expertName]) return dict[expertName];
  const norm = normalizeExpertName(expertName);
  const key = Object.keys(dict).find(k => normalizeExpertName(k) === norm);
  if (key) return dict[key];
  
  if (SERVICE_CAPABILITIES[serviceName]) {
    const canDo = SERVICE_CAPABILITIES[serviceName].some(ex => normalizeExpertName(ex) === norm);
    if (canDo && Object.keys(dict).length > 0) {
      const fallbackExpert = Object.keys(dict)[0];
      console.warn(`⚠️ ${serviceName} - ${expertName} bilgisi eksik, ${fallbackExpert} bilgisi kullanılıyor`);
      return dict[fallbackExpert];
    }
  }
  
  return null;
}

function conflictsWithScheduled(dateStr, timeSlot, scheduled) {
  const s = timeToMinutes(timeSlot.start);
  const e = timeToMinutes(timeSlot.end);
  return scheduled.some(a => a.date === dateStr && s < timeToMinutes(a.end) && e > timeToMinutes(a.start));
}

function hintMinFromTimeHint(timeHint) {
  if (!timeHint) return null;
  const map = { "sabah": 6*60, "öğle": 12*60+30, "öğleden sonra": 14*60, "akşam": 18*60, "18:00+": 18*60 };
  if (map[timeHint] != null) return map[timeHint];
  if (String(timeHint).includes(':')) return timeToMinutes(timeHint);
  return null;
}

// ============================================
// BÖLÜM 2: STATİK KONFIGÜRASYON (Mevcut - Değişiklik Yok)
// ============================================

const MIN_NEAR_DUP_GAP_MIN = 10;
const MIN_PRESENT_GAP_MIN = 60;
const MIN_PARALLEL_OVERLAP_MIN = 15;  // ✅ YENİ: Minimum çakışma süresi

const TIME_WINDOWS = {
  MORNING: { start: 10*60, end: 13*60 },
  NOON: { start: 13*60, end: 16*60 },
  AFTERNOON: { start: 16*60, end: 18*60 },
  EVENING: { start: 18*60, end: 20*60 }
};

function getTimeWindow(timeStr) {
  const mins = timeToMinutes(timeStr);
  if (mins >= TIME_WINDOWS.MORNING.start && mins < TIME_WINDOWS.MORNING.end) return "morning";
  if (mins >= TIME_WINDOWS.NOON.start && mins < TIME_WINDOWS.NOON.end) return "noon";
  if (mins >= TIME_WINDOWS.AFTERNOON.start && mins < TIME_WINDOWS.AFTERNOON.end) return "afternoon";
  if (mins >= TIME_WINDOWS.EVENING.start && mins < TIME_WINDOWS.EVENING.end) return "evening";
  return "other";
}

function getTimeWindowName(timeStr) {
  const mins = timeToMinutes(timeStr);
  if (mins >= TIME_WINDOWS.MORNING.start && mins < TIME_WINDOWS.MORNING.end) return "morning";
  if (mins >= TIME_WINDOWS.NOON.start && mins < TIME_WINDOWS.NOON.end) return "noon";
  if (mins >= TIME_WINDOWS.AFTERNOON.start && mins < TIME_WINDOWS.AFTERNOON.end) return "afternoon";
  if (mins >= TIME_WINDOWS.EVENING.start) return "evening";
  return "morning";
}

function calculateTimeWindowPenalty(slotStartTime, requestedTimeWindow) {
  // Eğer time_window tercihi yoksa veya strict modda ise penalty yok
  if (!requestedTimeWindow || !requestedTimeWindow.start) return 0;

  const slotWindow = getTimeWindow(slotStartTime);
  const requestedWindow = getTimeWindowName(requestedTimeWindow.start);

  // Eğer tam eşleşme varsa penalty yok
  if (slotWindow === requestedWindow) return 0;

  // Window'lar arası uzaklığı hesapla
  const windowOrder = ['morning', 'noon', 'afternoon', 'evening'];
  const slotIndex = windowOrder.indexOf(slotWindow);
  const requestedIndex = windowOrder.indexOf(requestedWindow);

  if (slotIndex === -1 || requestedIndex === -1) return 0;

  // Her window uzaklığı için 2 puan penalty
  const distance = Math.abs(slotIndex - requestedIndex);
  return distance * 2;
}

/**
 * Window içindeki slotlardan en uygun olanı seçer
 * @param {Array} windowSlots - Window içindeki tüm slotlar
 * @param {Object} requestedTimeWindow - İstenen time window (örn: {start: "19:00", end: "20:00"})
 * @param {string} currentWindow - Şu anki window adı ("morning", "noon", "afternoon", "evening")
 * @returns {Object} En uygun slot
 */
function selectBestSlotFromWindow(windowSlots, requestedTimeWindow, currentWindow) {
  if (!windowSlots || windowSlots.length === 0) return null;

  // Eğer requested time yoksa, ilk slot'u döndür
  if (!requestedTimeWindow || !requestedTimeWindow.start) {
    return windowSlots[0];
  }

  const requestedMin = timeToMinutes(requestedTimeWindow.start);
  const requestedWindow = getTimeWindowName(requestedTimeWindow.start);

  // Eğer AYNI window içindeyse, requested time'a en yakın slot'u seç
  if (currentWindow === requestedWindow) {
    let bestSlot = windowSlots[0];
    let bestDiff = Math.abs(timeToMinutes(windowSlots[0].start) - requestedMin);

    for (const slot of windowSlots) {
      const slotMin = timeToMinutes(slot.start);
      const diff = Math.abs(slotMin - requestedMin);

      if (diff < bestDiff) {
        bestDiff = diff;
        bestSlot = slot;
      }
    }

    return bestSlot;
  }

  // Eğer FARKLI window ise, ilk slot'u döndür
  return windowSlots[0];
}

function isTimeGapSufficient(time1, time2, minGap = MIN_PRESENT_GAP_MIN) {
  return Math.abs(timeToMinutes(time1) - timeToMinutes(time2)) >= minGap;
}

const EXPERT_RULES = {
  "Pınar": {
    fixed_slots: [10, 12, 14, 16, 18],  // Varsayılan (geriye dönük uyumluluk)
    service_slots: {
      "Protez Tırnak": ["10:00", "12:00", "14:00", "16:00", "18:00"],
      "Kalıcı Oje": ["10:00", "10:30", "12:00", "12:30", "14:00", "14:30", "16:00", "16:30", "18:00", "18:30"]
    },
    services: [
      "Protez Tırnak", "Medikal Manikür", "Islak Manikür",
      "Kalıcı Oje", "Kalıcı Oje + Jel Güçlendirme",
      "Tırnak Çıkarma", "Kalıcı Oje Çıkarma"
    ]
  },
  "Ceren": {
    fixed_slots: [10, 13, 16],  // Varsayılan (geriye dönük uyumluluk)
    service_slots: {
      "Protez Tırnak": ["11:00", "14:00", "17:00"],
      "Kalıcı Oje": ["11:00", "12:00", "14:00", "15:00", "17:00", "18:00"]
    },
    services: [
      "Protez Tırnak", "Medikal Manikür",
      "Kalıcı Oje", "Kalıcı Oje + Jel Güçlendirme",
      "Tırnak Çıkarma", "Kalıcı Oje Çıkarma"
    ]
  },
  "Sevcan": {
    fixed_slots: null,
    service_slots: {},
    services: [
      "Islak Manikür", "Lazer Epilasyon", "Ağda",
      "Kaş Alımı", "Kaş Lifting", "Kaş Laminasyon",
      "Manikür", "Pedikür", "Ayak Kalıcı Oje",
      "G5 Masaj Göbek", "G5 Masaj Bacak", "G5 Masaj Sırt",
      "Cilt Bakımı", "Kalıcı Oje Çıkarma"
    ]
  }
};

const GAP_FILLABLE_SERVICES = {
  "Medikal Manikür": { min_duration: 20, max_duration: 45 },
  "Islak Manikür": { min_duration: 30, max_duration: 45 },
  "Kalıcı Oje Çıkarma": { min_duration: 10, max_duration: 20 },
  "Tırnak Çıkarma": { min_duration: 10, max_duration: 20 },
  "Kalıcı Oje": { min_duration: 20, max_duration: 45 },
  "Kalıcı Oje + Jel Güçlendirme": { min_duration: 30, max_duration: 60 }
};

function isGapFillableService(serviceName) {
  const normalized = normalizeServiceName(serviceName);
  return GAP_FILLABLE_SERVICES.hasOwnProperty(normalized);
}

const SERVICE_CAPABILITIES = {
  "Protez Tırnak": ["Pınar", "Ceren"],
  "Kalıcı Oje": ["Pınar", "Ceren"],
  "Kalıcı Oje + Jel Güçlendirme": ["Pınar", "Ceren"],
  "Islak Manikür": ["Pınar", "Sevcan"],
  "Medikal Manikür": ["Pınar", "Ceren"],
  "Tırnak Çıkarma": ["Pınar", "Ceren", "Sevcan"],
  "Kalıcı Oje Çıkarma": ["Pınar", "Ceren", "Sevcan"],
  "Kaş Alımı": ["Sevcan"],
  "Kaş Laminasyon": ["Sevcan"],
  "Kaş + Bıyık": ["Sevcan"],
  "Lifting": ["Sevcan"],
  "Cilt Bakımı": ["Sevcan"],
  "G5 Masaj Göbek": ["Sevcan"],
  "G5 Masaj Bacak": ["Sevcan"],
  "G5 Masaj Sırt": ["Sevcan"],
  "Lazer Tüm Bacak": ["Sevcan"],
  "Lazer Yarım Bacak": ["Sevcan"],
  "Lazer Tüm Kol": ["Sevcan"],
  "Lazer Yarım Kol": ["Sevcan"],
  "Lazer Genital": ["Sevcan"],
  "Lazer Koltuk Altı": ["Sevcan"],
  "Lazer Tüm Sırt": ["Sevcan"],
  "Lazer Tüm Göbek Göğüs": ["Sevcan"],
  "Lazer Popo": ["Sevcan"],
  "Lazer Yüz Bıyık": ["Sevcan"],
  "Lazer Alın Hariç Yüz": ["Sevcan"],
  "Lazer Komple Yüz": ["Sevcan"],
  "Ağda Tüm Bacak": ["Sevcan"],
  "Ağda Tüm Kol": ["Sevcan"],
  "Ağda Genital": ["Sevcan"],
  "Ağda Koltuk Altı": ["Sevcan"],
  "Ağda Göbek": ["Sevcan"],
  "Ağda Sırt": ["Sevcan"],
  "Ağda Popo": ["Sevcan"],
  "Ağda Yüz Komple": ["Sevcan"],
  "Ağda Bıyık": ["Sevcan"],
  "Ağda Alın Hariç Yüz": ["Sevcan"],
  "Pedikür": ["Sevcan"],
  "Medikal Pedikür": ["Sevcan"],
  "Islak Pedikür": ["Sevcan"],
  "Ayak Kalıcı Oje": ["Sevcan"]
};

const SERVICE_CATEGORIES = [
  { match: n => n.startsWith("Lazer"), experts: ["Sevcan"] },
  { match: n => n.startsWith("Ağda"), experts: ["Sevcan"] },
  { match: n => n.startsWith("Kaş"), experts: ["Sevcan"] },
  { match: n => n.startsWith("G5 Masaj"), experts: ["Sevcan"] },
  { match: n => n === "Cilt Bakımı", experts: ["Sevcan"] },
  { match: n => n.includes("Pedikür"), experts: ["Sevcan"] },
  { match: n => n === "Manikür", experts: ["Sevcan"] }
];

function categoryExperts(serviceName){
  const hit = SERVICE_CATEGORIES.find(c => c.match(serviceName));
  return hit ? hit.experts : [];
}

const WORKING_HOURS = { start: "10:00", end: "20:00", closed_day: 0 };
const MAX_EXPERT_CHANGE_GAP_MIN = 15;  // ✅ Uzman değişikliğinde max boşluk (dakika)

function isNailAnchor(serviceName){
  const s = normalizeServiceName(serviceName);
  return ["Protez Tırnak", "Kalıcı Oje", "Kalıcı Oje + Jel Güçlendirme"].includes(s);
}

function isLaserService(serviceName){
  const s = normalizeServiceName(serviceName);
  return s.startsWith("Lazer");
}

// ✅ YENİ: Servisleri gruplandır - Lazer hizmetleri bir blok halinde arka arkaya
function groupLaserServices(services) {
  const laserServices = [];
  const nonLaserServices = [];

  for (const service of services) {
    if (isLaserService(service.name)) {
      laserServices.push(service);
    } else {
      nonLaserServices.push(service);
    }
  }

  // Lazer hizmetlerini sonuna ekle (arka arkaya blok halinde)
  return [...nonLaserServices, ...laserServices];
}

function eligibleExpertsForService(serviceName, serviceInfo) {
  const s = normalizeServiceName(serviceName);
  const listedRaw = Object.keys(serviceInfo?.[s] || {});
  
  const fromServiceInfo = listedRaw.length ? [...new Set(listedRaw.map(canonicalExpert))] : [];
  const fromCapabilities = SERVICE_CAPABILITIES[s] ? SERVICE_CAPABILITIES[s].map(canonicalExpert) : [];
  
  const combined = [...new Set([...fromServiceInfo, ...fromCapabilities])];
  
  if (combined.length) return combined;
  
  const cat = categoryExperts(s);
  if (cat.length) return cat.map(canonicalExpert);
  
  return Object.keys(EXPERT_RULES).filter(ex => (EXPERT_RULES[ex].services || []).includes(s)).map(canonicalExpert);
}

function isServiceAllowedForExpert(serviceName, expertName, serviceInfo){
  const s = normalizeServiceName(serviceName);
  if (getServiceDetails(serviceInfo, s, expertName)) return true;
  if (SERVICE_CAPABILITIES[s]) {
    return SERVICE_CAPABILITIES[s].some(ex => normalizeExpertName(ex) === normalizeExpertName(expertName));
  }
  if (categoryExperts(s).some(ex => normalizeExpertName(ex) === normalizeExpertName(expertName))) return true;
  return (EXPERT_RULES[canonicalExpert(expertName)]?.services || []).includes(s);
}

// ============================================
// BÖLÜM 2B: ✨ YENİ - GRUP RANDEVU FONKSİYONLARI
// ============================================

function isGroupBooking(services) {
  const uniquePersons = [...new Set(services.map(s => s.for_person).filter(Boolean))];
  return uniquePersons.length > 1;
}

function detectSameExpert(services) {
  // Sadece expert_preference belirtilmiş olanları al
  const experts = services
    .map(s => s.expert_preference)
    .filter(Boolean)
    .map(canonicalExpert);
  
  if (experts.length === 0) return { sameExpert: false };
  
  const uniqueExperts = [...new Set(experts)];
  
  // Tüm hizmetler aynı uzmandan mı?
  if (uniqueExperts.length === 1 && experts.length === services.length) {
    return {
      sameExpert: true,
      expert: uniqueExperts[0],
      forceSequential: true  // Paralel OLAMAZ
    };
  }
  
  return { sameExpert: false };
}

function calculateOverlap(slot1, slot2) {
  const start1 = timeToMinutes(slot1.start);
  const end1 = timeToMinutes(slot1.end);
  const start2 = timeToMinutes(slot2.start);
  const end2 = timeToMinutes(slot2.end);
  
  return Math.max(0, Math.min(end1, end2) - Math.max(start1, start2));
}

function getArrangement(appointments) {
  if (appointments.length < 2) return "single";
  
  // İki randevu arasındaki çakışmayı kontrol et
  for (let i = 0; i < appointments.length - 1; i++) {
    for (let j = i + 1; j < appointments.length; j++) {
      const apt1 = appointments[i];
      const apt2 = appointments[j];
      
      // Aynı gün değilse sequential
      if (apt1.date !== apt2.date) continue;
      
      const overlap = calculateOverlap(apt1, apt2);
      
      // 15+ dk çakışma varsa parallel
      if (overlap >= MIN_PARALLEL_OVERLAP_MIN) {
        return "parallel";
      }
    }
  }
  
  return "sequential";
}

function calculateTotalDuration(appointments, arrangement) {
  if (appointments.length === 0) return 0;
  
  if (arrangement === "parallel") {
    // Paralel: En erken başlama - en geç bitiş
    const allSameDays = appointments.every(a => a.date === appointments[0].date);
    
    if (allSameDays) {
      const earliestStart = Math.min(...appointments.map(a => timeToMinutes(a.start)));
      const latestEnd = Math.max(...appointments.map(a => timeToMinutes(a.end)));
      return latestEnd - earliestStart;
    }
  }
  
  // Sequential: Toplam süre
  return appointments.reduce((sum, a) => sum + (a.duration || 0), 0);
}

// ============================================
// BÖLÜM 3-7: TARİH, İZİN, ÇAKIŞMA, GAP, UZMAN, MÜSAİTLİK
// (Mevcut kod - Değişiklik Yok)
// ============================================

function parseDateInfo(dateInfo) {
  let dates = [];
  if (dateInfo.type === "specific") {
    dates = [parseTurkishDate(dateInfo.value)];
  } else if (dateInfo.type === "range") {
    const [start, end] = dateInfo.search_range.split(' to ');
    const startDate = parseTurkishDate(start);
    const endDate = parseTurkishDate(end);
    let current = new Date(startDate);
    while (current <= endDate) { dates.push(new Date(current)); current.setDate(current.getDate() + 1); }
  } else if (dateInfo.type === "specific_days") {
    const [start, end] = dateInfo.search_range.split(' to ');
    const startDate = parseTurkishDate(start);
    const endDate = parseTurkishDate(end);
    const dayMapping = { "Pazartesi":1, "Salı":2, "Çarşamba":3, "Perşembe":4, "Cuma":5, "Cumartesi":6 };
    const targetDays = (dateInfo.days || []).map(d => dayMapping[d]);
    let current = new Date(startDate);
    while (current <= endDate) { if (targetDays.includes(current.getDay())) dates.push(new Date(current)); current.setDate(current.getDate() + 1); }
  } else if (dateInfo.type === "urgent") {
    dates = [parseTurkishDate(dateInfo.value)];
  }
  return dates;
}

function isExpertOnLeave(expertName, checkDate, timeSlot, staffLeaves) {
  const checkDateObj = typeof checkDate === 'string' ? parseTurkishDate(checkDate) : checkDate;
  const normalizedExpert = normalizeExpertName(expertName);

  for (const leave of staffLeaves || []) {
    if (!leave || !leave.uzman_adi) continue;
    if (normalizeExpertName(leave.uzman_adi) !== normalizedExpert) continue;
    const leaveStart = parseTurkishDate(leave.baslangic_tarihi);
    const leaveEnd = parseTurkishDate(leave.bitis_tarihi);
    if (checkDateObj < leaveStart || checkDateObj > leaveEnd) continue;
    if (leave.durum === "Tam Gün") return true;

    if (leave.durum === "Yarım Gün" && leave.baslangic_saat && leave.bitis_saat && timeSlot) {
      const leaveStartMin = timeToMinutes(leave.baslangic_saat);
      const leaveEndMin = timeToMinutes(leave.bitis_saat);
      const checkStartMin = timeToMinutes(timeSlot.start);
      const checkEndMin = timeToMinutes(timeSlot.end);
      if (checkStartMin < leaveEndMin && checkEndMin > leaveStartMin) return true;
    }
  }
  return false;
}

function hasAppointmentConflict(date, expert, timeSlot, existingAppointments) {
  const checkDateStr = typeof date === 'string' ? date : formatTurkishDate(date);
  const checkStartMin = timeToMinutes(timeSlot.start);
  const checkEndMin = timeToMinutes(timeSlot.end);
  const normalizedExpert = normalizeExpertName(expert);

  for (const apt of existingAppointments || []) {
    if (!apt.uzman_adi) continue;
    if (normalizeExpertName(apt.uzman_adi) !== normalizedExpert) continue;
    if (apt.tarih !== checkDateStr) continue;
    if (apt.baslangic_saat && apt.bitis_saat) {
      const aptStartMin = timeToMinutes(apt.baslangic_saat);
      const aptEndMin = timeToMinutes(apt.bitis_saat);
      if (checkStartMin < aptEndMin && checkEndMin > aptStartMin) return true;
    }
  }
  return false;
}

function findGapSlots(dateStr, expert, serviceDuration, existingAppointments, staffLeaves, filters=null, currentTime=null) {
  const gaps = [];
  const normalizedExpert = normalizeExpertName(expert);
  
  const expertApts = (existingAppointments || [])
    .filter(a => a.uzman_adi && normalizeExpertName(a.uzman_adi) === normalizedExpert && a.tarih === dateStr)
    .filter(a => a.baslangic_saat && a.bitis_saat)
    .sort((a, b) => timeToMinutes(a.baslangic_saat) - timeToMinutes(b.baslangic_saat));
  
  if (expertApts.length === 0) return gaps;
  
  const dateObj = parseTurkishDate(dateStr);
  const today = new Date();
  const isToday = dateObj.getDate() === today.getDate() && 
                  dateObj.getMonth() === today.getMonth() && 
                  dateObj.getFullYear() === today.getFullYear();
  
  const minStartTimeMinutes = (isToday && currentTime) ? timeToMinutes(currentTime) : 0;
  
  for (let i = 0; i < expertApts.length - 1; i++) {
    const current = expertApts[i];
    const next = expertApts[i + 1];
    
    const gapStartMin = timeToMinutes(current.bitis_saat);
    const gapEndMin = timeToMinutes(next.baslangic_saat);
    const gapSize = gapEndMin - gapStartMin;
    
    if (isToday && gapStartMin <= minStartTimeMinutes) continue;
    
    if (gapSize >= serviceDuration) {
      const slotStart = current.bitis_saat;
      const slotEnd = addMinutes(slotStart, serviceDuration);
      const timeSlot = { start: slotStart, end: slotEnd };
      
      if (timeToMinutes(slotEnd) > timeToMinutes(WORKING_HOURS.end)) continue;
      if (filters && !withinTimeWindow(timeSlot, filters)) continue;
      if (isExpertOnLeave(expert, dateStr, timeSlot, staffLeaves)) continue;
      
      gaps.push(timeSlot);
    }
  }
  
  return gaps;
}

function assignExpert(service, serviceInfo) {
  const sname = normalizeServiceName(service.name);
  if (isNailAnchor(sname) && service.expert_preference) {
    return canonicalExpert(service.expert_preference);
  }
  const availableExperts = eligibleExpertsForService(sname, serviceInfo)
    .filter(ex => getServiceDetails(serviceInfo, sname, ex));
  if (availableExperts.length === 0) return null;
  return availableExperts[0];
}

function withinTimeWindow(slot, filters) {
  const fw = filters?.time_window;
  const strict = !!filters?.time_window_strict;
  if (!fw || !fw.start || !fw.end || !strict) return true;
  const s = timeToMinutes(slot.start);
  const e = timeToMinutes(slot.end);
  const ws = timeToMinutes(fw.start);
  const we = timeToMinutes(fw.end);
  return s >= ws && e <= we;
}

function datePassesBounds(dateStr, filters) {
  if (!filters) return true;
  const d = parseTurkishDate(dateStr);
  if (filters.earliest_date && d < parseTurkishDate(filters.earliest_date)) return false;
  if (filters.latest_date && d > parseTurkishDate(filters.latest_date)) return false;
  return true;
}

function findAvailableSlots(date, expert, service, existingAppointments, staffLeaves, serviceInfo, filters=null, currentTime=null) {
  const dateStr = typeof date === 'string' ? date : formatTurkishDate(date);
  const dateObj = typeof date === 'string' ? parseTurkishDate(date) : date;
  if (dateObj.getDay() === WORKING_HOURS.closed_day) return [];
  if (!datePassesBounds(dateStr, filters)) return [];

  const expertRules = EXPERT_RULES[canonicalExpert(expert)];
  if (!expertRules) return [];

  const sname = normalizeServiceName(service.name);
  if (!isServiceAllowedForExpert(sname, expert, serviceInfo)) return [];
  const serviceDetails = getServiceDetails(serviceInfo, sname, expert);
  if (!serviceDetails) return [];

  const duration = parseInt(serviceDetails.sure);
  const availableSlots = [];

  const today = new Date();
  const isToday = dateObj.getDate() === today.getDate() && 
                  dateObj.getMonth() === today.getMonth() && 
                  dateObj.getFullYear() === today.getFullYear();
  
  const minStartTimeMinutes = (isToday && currentTime) ? timeToMinutes(currentTime) : 0;

  // Servise özel slot'ları kontrol et
  let slotsToUse = null;
  if (expertRules.service_slots && expertRules.service_slots[sname]) {
    slotsToUse = expertRules.service_slots[sname];  // ["10:00", "12:00", ...] formatında
  } else if (expertRules.fixed_slots) {
    slotsToUse = expertRules.fixed_slots.map(h => `${String(h).padStart(2, '0')}:00`);  // [10, 12, ...] -> ["10:00", "12:00", ...]
  }

  if (slotsToUse && slotsToUse.length > 0) {
    for (const startTime of slotsToUse) {
      if (isToday && timeToMinutes(startTime) <= minStartTimeMinutes) continue;

      const endTime = addMinutes(startTime, duration);
      if (timeToMinutes(endTime) > timeToMinutes(WORKING_HOURS.end)) continue;

      const timeSlot = { start: startTime, end: endTime };
      if (!withinTimeWindow(timeSlot, filters)) continue;
      if (isExpertOnLeave(expert, dateStr, timeSlot, staffLeaves)) continue;
      if (hasAppointmentConflict(dateStr, expert, timeSlot, existingAppointments)) continue;
      availableSlots.push(timeSlot);
    }
    
    if (isGapFillableService(sname)) {
      const gapSlots = findGapSlots(dateStr, expert, duration, existingAppointments, staffLeaves, filters, currentTime);
      
      for (const gap of gapSlots) {
        const isDuplicate = availableSlots.some(slot => 
          timeToMinutes(slot.start) === timeToMinutes(gap.start) && 
          timeToMinutes(slot.end) === timeToMinutes(gap.end)
        );
        
        if (!isDuplicate) {
          availableSlots.push(gap);
        }
      }
    }
  } else {
    let currentMin = timeToMinutes(WORKING_HOURS.start);
    const endMin = timeToMinutes(WORKING_HOURS.end);
    const STEP = 5;
    
    while (currentMin < endMin) {
      const startTime = minutesToTime(currentMin);
      
      if (isToday && currentMin <= minStartTimeMinutes) {
        currentMin += STEP;
        continue;
      }
      
      const endTime = addMinutes(startTime, duration);
      if (timeToMinutes(endTime) > endMin) break;

      const timeSlot = { start: startTime, end: endTime };
      if (!withinTimeWindow(timeSlot, filters)) { currentMin += STEP; continue; }
      if (isExpertOnLeave(expert, dateStr, timeSlot, staffLeaves)) { currentMin += STEP; continue; }
      if (hasAppointmentConflict(dateStr, expert, timeSlot, existingAppointments)) { currentMin += STEP; continue; }
      availableSlots.push(timeSlot);
      currentMin += STEP;
    }
  }
  
  availableSlots.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  
  return availableSlots;
}

function findSlotsEndingAt(dateStr, expert, serviceName, existingAppointments, staffLeaves, serviceInfo, filters, targetEndTime, currentTime=null) {
  const slots = findAvailableSlots(dateStr, expert, { name: serviceName }, existingAppointments, staffLeaves, serviceInfo, filters, currentTime);
  return slots.filter(sl => timeToMinutes(sl.end) === timeToMinutes(targetEndTime));
}

// ============================================
// BÖLÜM 8: CONSTRAINTS NORMALİZASYONU (Güncellenmiş)
// ============================================

function buildEffectiveConstraints(dateInfo, constraints, services) {
  const eff = { ...(constraints || {}) };
  
  // Grup randevu tespiti
  const isGroup = isGroupBooking(services);
  const sameExpertInfo = detectSameExpert(services);

  eff.same_day_required = (typeof eff.same_day_required !== 'undefined') ? eff.same_day_required : (isGroup || dateInfo?.type === 'specific');
  eff.chain_adjacent_only = sameExpertInfo.forceSequential ? true : (typeof eff.chain_adjacent_only !== 'undefined') ? eff.chain_adjacent_only : true;

  eff.filters = eff.filters || {};
  eff.filters.nail_expert_strict = !!eff.filters.nail_expert_strict;
  eff.filters.time_window_strict  = !!eff.filters.time_window_strict;

  if (!eff.anchor_window) {
    eff.anchor_window = { mode: 'reference', before_buffer_min: 0, after_buffer_min: 0 };
  }

  eff.service_groups = (constraints?.service_groups || []).map(g => ({
    services: (g.services || []).map(normalizeServiceName),
    same_day: !!g.same_day,
    chain_adjacent_only: (typeof g.chain_adjacent_only !== 'undefined') ? g.chain_adjacent_only : true,
    time_hint: g.time_hint || null
  }));

  const hasTimeWindow = !!(eff.filters.time_window && eff.filters.time_window.start && eff.filters.time_window.end);
  const hintedMin = hintMinFromTimeHint(dateInfo?.time_hint);

  if (!dateInfo.target_time && hasTimeWindow) {
    dateInfo.target_time = eff.filters.time_window.start;
  } else if (!dateInfo.target_time && hintedMin != null) {
    dateInfo.target_time = minutesToTime(hintedMin);
  }
  
  // ✅ Grup bilgisi ekle
  eff.is_group = isGroup;
  eff.same_expert_info = sameExpertInfo;

  return eff;
}

// ============================================
// BÖLÜM 9: GRUP PLANLAMA (Mevcut - Değişiklik Yok)
// ============================================

function scheduleServiceGroupOnSameDay(group, allDates, existingAppointments, staffLeaves, serviceInfo, scheduledSoFar, filters, currentTime=null) {
  if (!group?.services || group.services.length < 2) return null;
  const seq = [...group.services];

  for (const tryDate of allDates) {
    if (tryDate.getDay() === WORKING_HOURS.closed_day) continue;
    const dateStr = formatTurkishDate(tryDate);
    if (!datePassesBounds(dateStr, { ...filters })) continue;

    const minStart = hintMinFromTimeHint(group.time_hint);

    const s1 = seq[0];
    const e1Candidates = eligibleExpertsForService(s1, serviceInfo).filter(ex => getServiceDetails(serviceInfo, s1, ex));
    for (const e1 of e1Candidates) {
      const s1Slots = findAvailableSlots(dateStr, e1, { name: s1 }, existingAppointments, staffLeaves, serviceInfo, filters, currentTime)
        .filter(sl => (minStart == null) ? true : timeToMinutes(sl.start) >= minStart)
        .filter(sl => !conflictsWithScheduled(dateStr, sl, scheduledSoFar));

      for (const sl1 of s1Slots) {
        const s2 = seq[1];
        const e2Candidates = eligibleExpertsForService(s2, serviceInfo).filter(ex => getServiceDetails(serviceInfo, s2, ex));
        for (const e2 of e2Candidates) {
          const s2Slots = findAvailableSlots(dateStr, e2, { name: s2 }, existingAppointments, staffLeaves, serviceInfo, filters, currentTime)
            .filter(sl => !conflictsWithScheduled(dateStr, sl, scheduledSoFar));
          const sl2 = s2Slots.find(sl => timeToMinutes(sl.start) === timeToMinutes(sl1.end));
          if (!sl2) continue;

          if (isExpertOnLeave(e1, dateStr, sl1, staffLeaves) || hasAppointmentConflict(dateStr, e1, sl1, existingAppointments)) continue;
          if (isExpertOnLeave(e2, dateStr, sl2, staffLeaves) || hasAppointmentConflict(dateStr, e2, sl2, existingAppointments)) continue;

          const det1 = getServiceDetails(serviceInfo, s1, e1);
          const det2 = getServiceDetails(serviceInfo, s2, e2);
          if (!det1 || !det2) continue;

          return [
            { date: dateStr, service: s1, expert: canonicalExpert(e1), start: sl1.start, end: sl1.end,
              price: parseInt(det1.fiyat), duration: parseInt(det1.sure) },
            { date: dateStr, service: s2, expert: canonicalExpert(e2), start: sl2.start, end: sl2.end,
              price: parseInt(det2.fiyat), duration: parseInt(det2.sure) },
          ];
        }
      }
    }
  }
  return null;
}

// ============================================
// BÖLÜM 10: ✨ TÜM İŞLEMLERİ YERLEŞTİR (GRUP DESTEĞİ EKLENDİ)
// ============================================

function tryScheduleAllServices(referenceSlot, remainingServices, dateInfo, existingAppointments, staffLeaves, serviceInfo, constraints, currentTime=null) {
  const scheduled = [referenceSlot];
  let currentDate = typeof referenceSlot.date === 'string' ? parseTurkishDate(referenceSlot.date) : referenceSlot.date;
  let currentTimeSlot = referenceSlot.end;
  const missingServices = [];

  const allDates = parseDateInfo(dateInfo);
  const filters = constraints?.filters || {};

  const strictSameDay = constraints?.same_day_required === true;
  const strictChainAdjacent = constraints?.chain_adjacent_only !== false;
  const isGroup = constraints?.is_group || false;
  const sameExpertInfo = constraints?.same_expert_info || { sameExpert: false };

  // ✅ GRUP RANDEVU MANTIK
  if (isGroup && remainingServices.length > 0) {
    const dateStr = referenceSlot.date;
    console.log('🔵 GRUP RANDEVU BAŞLIYOR');
    console.log('📅 Tarih:', dateStr);
    console.log('👥 İlk slot:', referenceSlot.expert, referenceSlot.start + '-' + referenceSlot.end, 'for:', referenceSlot.for_person);
    console.log('📋 Yerleştirilecek servisler:', remainingServices.map(s => `${s.name} (${s.for_person})`).join(', '));

    // ✅ YENİ: Lazer hizmetlerini gruplandır (arka arkaya blok halinde)
    const orderedServices = groupLaserServices(remainingServices);

    // Paralel veya arka arkaya yerleştirme
    for (const service of orderedServices) {
      const sname = normalizeServiceName(service.name);
      console.log('\n🔸 Servis yerleştiriliyor:', sname, 'for:', service.for_person);

      // ✅ FİX: Aynı servisi farklı kişiler için ayırt et
      if (scheduled.some(a => a.service === sname && a.for_person === service.for_person)) {
        console.log('  ⏭️  Zaten yerleştirilmiş, atlanıyor');
        continue;
      }

      let eligible = eligibleExpertsForService(sname, serviceInfo).filter(ex => getServiceDetails(serviceInfo, sname, ex));
      console.log('  👤 Eligible uzmanlar:', eligible.join(', '));

      if (eligible.length === 0) {
        console.log('  ❌ Hiç eligible uzman yok - GRUP İPTAL');
        return null;  // Grup = hepsi veya hiçbiri
      }

      // ✅ IMPROVED: Tercih edilen uzmanı önceliklendir (ama diğerlerini de dahil et - kullanıcı deneyimi)
      if (sameExpertInfo.sameExpert && sameExpertInfo.expert) {
        const preferredExpert = sameExpertInfo.expert;
        const normalized = normalizeExpertName(preferredExpert);
        // Tercih edilen uzmanı başa al
        eligible = [
          ...eligible.filter(ex => normalizeExpertName(ex) === normalized),
          ...eligible.filter(ex => normalizeExpertName(ex) !== normalized)
        ];
      }

      let placed = false;

      // 1. PARALEL DENEME (Aynı uzman değilse)
      if (!sameExpertInfo.sameExpert) {
        console.log('  🔄 PARALEL DENEME başlıyor...');

        for (const ex of eligible) {
          // Referans slot ile çakışan slotlar bul
          const allSlots = findAvailableSlots(dateStr, ex, { name: sname }, existingAppointments, staffLeaves, serviceInfo, filters, currentTime);
          console.log(`    👤 ${ex}: ${allSlots.length} slot bulundu`);

          for (const slot of allSlots) {
            const overlap = calculateOverlap(referenceSlot, slot);

            // 15+ dk çakışma var mı?
            if (overlap >= MIN_PARALLEL_OVERLAP_MIN) {
              console.log(`      ⏱️  Slot ${slot.start}-${slot.end} (overlap: ${overlap}dk)`);

              const onLeave = isExpertOnLeave(ex, dateStr, slot, staffLeaves);
              const hasConflict = hasAppointmentConflict(dateStr, ex, slot, existingAppointments);

              // ✅ FİX: Aynı uzman + aynı kişi için çakışan slotta olamaz
              // Ama aynı uzman + farklı kişi için çakışabilir (grup randevu)
              const conflictsScheduled = scheduled.some(s => {
                if (s.date !== dateStr) return false;

                // Aynı uzman için kontrol et
                if (canonicalExpert(ex) === s.expert) {
                  // Aynı kişi için mi? (self vs other_1 vs other_2 etc.)
                  if (s.for_person === service.for_person) {
                    // AYNI kişi + aynı uzman → Zaman çakışması olamaz
                    const sStart = timeToMinutes(s.start);
                    const sEnd = timeToMinutes(s.end);
                    const slotStart = timeToMinutes(slot.start);
                    const slotEnd = timeToMinutes(slot.end);
                    const conflicts = slotStart < sEnd && slotEnd > sStart;
                    if (conflicts) {
                      console.log(`      ⛔ Çakışma: Aynı kişi (${service.for_person}) + aynı uzman (${s.expert})`);
                    }
                    return conflicts;
                  }
                  // FARKLI kişi + aynı uzman → Çakışabilir (paralel randevu OK)
                  console.log(`      ✅ OK: Farklı kişi (${service.for_person} vs ${s.for_person}) + aynı uzman`);
                  return false;
                }
                // Farklı uzmanlar → Çakışabilir (paralel OK)
                return false;
              });

              if (onLeave) {
                console.log(`      ⛔ Uzman izinli`);
              } else if (hasConflict) {
                console.log(`      ⛔ Randevu çakışması var`);
              } else if (conflictsScheduled) {
                console.log(`      ⛔ Scheduled ile çakışıyor`);
              }

              if (!onLeave && !hasConflict && !conflictsScheduled) {
                const det = getServiceDetails(serviceInfo, sname, ex);
                if (!det) continue;

                console.log(`      ✅ PARALEL YERLEŞTİRİLDİ: ${ex} ${slot.start}-${slot.end}`);

                scheduled.push({
                  date: dateStr,
                  expert: canonicalExpert(ex),
                  service: sname,
                  start: slot.start,
                  end: slot.end,
                  duration: parseInt(det.sure),
                  price: parseInt(det.fiyat),
                  for_person: service.for_person || null
                });

                placed = true;
                break;
              }
            }
          }
          if (placed) break;
        }
      }
      
      // 2. ARKA ARKAYA DENEME (Paralel bulunamadıysa veya aynı uzman)
      if (!placed) {
        console.log('  🔄 SEQUENTIAL (ARKA ARKAYA) DENEME başlıyor...');
        const targetStartMin = timeToMinutes(currentTimeSlot);
        console.log(`    ⏰ Hedef başlangıç: ${currentTimeSlot} (${targetStartMin} dk)`);

        // ✅ YENİ: Önceki uzmanı kontrol et
        const previousExpert = scheduled.length > 0 ? scheduled[scheduled.length - 1].expert : null;
        console.log(`    👤 Önceki uzman: ${previousExpert || 'yok'}`);

        for (const ex of eligible) {
          const canonicalEx = canonicalExpert(ex);
          const isSameExpert = previousExpert && canonicalEx === previousExpert;
          console.log(`    🔍 Deneniyor: ${ex} (${isSameExpert ? 'AYNI uzman' : 'FARKLI uzman'})`);

          // ✅ YENİ: Aynı uzman ise tam bitişik, farklı uzman ise 15 dk'ya kadar boşluk OK
          const allSlots = findAvailableSlots(dateStr, ex, { name: sname }, existingAppointments, staffLeaves, serviceInfo, filters, currentTime);
          console.log(`      📍 Tüm slotlar: ${allSlots.length}`);

          const slots = allSlots
            .filter(s => {
              const slotStartMin = timeToMinutes(s.start);
              if (isSameExpert) {
                // Aynı uzman: Tam bitişik olmalı
                const ok = slotStartMin === targetStartMin;
                if (!ok) console.log(`      ⛔ ${s.start} RED: Aynı uzman, tam bitişik değil (${slotStartMin} != ${targetStartMin})`);
                return ok;
              } else {
                // Farklı uzman: 15 dakikaya kadar boşluk kabul edilebilir
                const ok = slotStartMin >= targetStartMin && slotStartMin <= targetStartMin + MAX_EXPERT_CHANGE_GAP_MIN;
                if (!ok) console.log(`      ⛔ ${s.start} RED: Farklı uzman, 15dk aralığında değil (${slotStartMin} vs ${targetStartMin}-${targetStartMin + MAX_EXPERT_CHANGE_GAP_MIN})`);
                return ok;
              }
            })
            .filter(s => {
              const conflict = conflictsWithScheduled(dateStr, s, scheduled);
              if (conflict) console.log(`      ⛔ ${s.start} RED: Scheduled ile çakışıyor`);
              return !conflict;
            })
            .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));  // ✅ En erken slotu önce

          console.log(`      ✅ Uygun slotlar: ${slots.length}`);

          const slot = slots[0];
          if (slot) {
            console.log(`      🎯 İlk uygun slot: ${slot.start}-${slot.end}`);

            if (isExpertOnLeave(ex, dateStr, slot, staffLeaves)) {
              console.log(`      ⛔ ${ex} izinli`);
              continue;
            }

            if (hasAppointmentConflict(dateStr, ex, slot, existingAppointments)) {
              console.log(`      ⛔ ${ex} randevusu var`);
              continue;
            }

            const det = getServiceDetails(serviceInfo, sname, ex);
            if (!det) {
              console.log(`      ⛔ ${ex} için ${sname} detayı yok`);
              continue;
            }

            scheduled.push({
              date: dateStr,
              expert: canonicalExpert(ex),
              service: sname,
              start: slot.start,
              end: slot.end,
              duration: parseInt(det.sure),
              price: parseInt(det.fiyat),
              for_person: service.for_person || null
            });

            console.log(`      ✅ SEQUENTIAL YERLEŞTİRİLDİ: ${ex} ${slot.start}-${slot.end} (${service.for_person})`);
            currentTimeSlot = slot.end;
            placed = true;
            break;
          } else {
            console.log(`      ⛔ ${ex}: Uygun slot yok`);
          }
        }
      }

      if (!placed) {
        console.log(`  ❌ ${sname} YERLEŞTİRİLEMEDİ - Grup randevu iptal ediliyor`);
        return null;  // Grup = hepsi veya hiçbiri
      }
    }

    const totalPrice = scheduled.reduce((sum, a) => sum + (a.price || 0), 0);
    const arrangement = getArrangement(scheduled);
    const totalDuration = calculateTotalDuration(scheduled, arrangement);

    console.log('');
    console.log('✅ GRUP RANDEVU BAŞARIYLA TAMAMLANDI');
    console.log('📋 Yerleştirilen randevular:');
    scheduled.forEach((apt, idx) => {
      console.log(`  ${idx + 1}. ${apt.service} (${apt.for_person}) | ${apt.expert} | ${apt.date} ${apt.start}-${apt.end}`);
    });
    console.log(`💰 Toplam: ${totalPrice}₺, ${totalDuration} dk, ${arrangement}`);
    console.log('═'.repeat(70));

    return {
      complete: true,
      appointments: scheduled,
      missing_services: [],
      total_price: totalPrice,
      total_duration: totalDuration,
      arrangement: arrangement
    };
  }

  // ✅ TEK KİŞİ MANTIK (Mevcut kod devam ediyor...)
  if (strictSameDay) {
    const dateStr = referenceSlot.date;

    const forwardFailed = [];
    for (const service of remainingServices) {
      const sname = normalizeServiceName(service.name);
      if (scheduled.some(a => a.service === sname)) continue;

      const eligible = eligibleExpertsForService(sname, serviceInfo).filter(ex => getServiceDetails(serviceInfo, sname, ex));
      if (eligible.length === 0) { return null; }

      let placed = false;
      const targetStartMin = timeToMinutes(currentTimeSlot);

      for (const ex of eligible) {
        const slots = findAvailableSlots(dateStr, ex, { name: sname }, existingAppointments, staffLeaves, serviceInfo, filters, currentTime)
          .filter(s => timeToMinutes(s.start) === targetStartMin)
          .filter(s => !conflictsWithScheduled(dateStr, s, scheduled));

        const slot = slots[0];
        if (slot &&
            !isExpertOnLeave(ex, dateStr, slot, staffLeaves) &&
            !hasAppointmentConflict(dateStr, ex, slot, existingAppointments)) {
          const det = getServiceDetails(serviceInfo, sname, ex);
          if (!det) continue;

          scheduled.push({
            date: dateStr,
            expert: canonicalExpert(ex),
            service: sname,
            start: slot.start,
            end: slot.end,
            duration: parseInt(det.sure),
            price: parseInt(det.fiyat),
            for_person: service.for_person || null
          });

          currentTimeSlot = slot.end;
          placed = true;
          break;
        }
      }

      if (!placed && !strictChainAdjacent) {
        for (const ex of eligible) {
          const slots = findAvailableSlots(dateStr, ex, { name: sname }, existingAppointments, staffLeaves, serviceInfo, filters, currentTime)
            .filter(s => timeToMinutes(s.start) >= targetStartMin)
            .filter(s => !conflictsWithScheduled(dateStr, s, scheduled));

          const slot = slots[0];
          if (slot &&
              !isExpertOnLeave(ex, dateStr, slot, staffLeaves) &&
              !hasAppointmentConflict(dateStr, ex, slot, existingAppointments)) {
            const det = getServiceDetails(serviceInfo, sname, ex);
            if (!det) continue;

            scheduled.push({
              date: dateStr,
              expert: canonicalExpert(ex),
              service: sname,
              start: slot.start,
              end: slot.end,
              duration: parseInt(det.sure),
              price: parseInt(det.fiyat),
              for_person: service.for_person || null
            });

            currentTimeSlot = slot.end;
            placed = true;
            break;
          }
        }
      }

      if (!placed) {
        forwardFailed.push(service);
      }
    }

    forwardFailed.sort((a,b) => {
      const dur = (svc) => {
        const sname = normalizeServiceName(svc.name);
        const durs = eligibleExpertsForService(sname, serviceInfo)
          .map(ex => parseInt(getServiceDetails(serviceInfo, sname, ex)?.sure || 0));
        return Math.max(...durs, 0);
      };
      return dur(b) - dur(a);
    });

    let headStart = referenceSlot.start;

    for (const service of forwardFailed) {
      const sname = normalizeServiceName(service.name);
      if (scheduled.some(a => a.service === sname)) continue;

      const eligible = eligibleExpertsForService(sname, serviceInfo).filter(ex => getServiceDetails(serviceInfo, sname, ex));
      if (eligible.length === 0) { return null; }

      let placed = false;
      for (const ex of eligible) {
        const slots = findSlotsEndingAt(dateStr, ex, sname, existingAppointments, staffLeaves, serviceInfo, filters, headStart, currentTime)
          .filter(s => !conflictsWithScheduled(dateStr, s, scheduled));
        const slot = slots[0];

        if (slot &&
            !isExpertOnLeave(ex, dateStr, slot, staffLeaves) &&
            !hasAppointmentConflict(dateStr, ex, slot, existingAppointments)) {
          const det = getServiceDetails(serviceInfo, sname, ex);
          if (!det) continue;

          scheduled.unshift({
            date: dateStr, expert: canonicalExpert(ex), service: sname,
            start: slot.start, end: slot.end,
            duration: parseInt(det.sure), price: parseInt(det.fiyat),
            for_person: service.for_person || null
          });
          headStart = slot.start;
          placed = true;
          break;
        }
      }
      if (!placed) return null;
    }

    const totalPrice = scheduled.reduce((sum, a) => sum + (a.price || 0), 0);
    const arrangement = getArrangement(scheduled);
    const totalDuration = calculateTotalDuration(scheduled, arrangement);

    return {
      complete: true,
      appointments: scheduled,
      missing_services: [],
      total_price: totalPrice,
      total_duration: totalDuration,
      arrangement: arrangement
    };
  }

  const flexChainAdjacent = constraints?.chain_adjacent_only !== false;
  
  for (const service of remainingServices) {
    const sname = normalizeServiceName(service.name);
    if (scheduled.some(a => a.service === sname)) continue;

    const eligible = eligibleExpertsForService(sname, serviceInfo).filter(ex => getServiceDetails(serviceInfo, sname, ex));
    if (eligible.length === 0) { 
      missingServices.push(sname); 
      continue; 
    }

    let placed = false;

    const dateStrSame = formatTurkishDate(currentDate);
    const notBefore = timeToMinutes(currentTimeSlot);

    for (const ex of eligible) {
      const sameDaySlots = findAvailableSlots(dateStrSame, ex, { name: sname }, existingAppointments, staffLeaves, serviceInfo, constraints?.filters || {}, currentTime)
        .filter(s => timeToMinutes(s.start) === notBefore)
        .filter(s => !conflictsWithScheduled(dateStrSame, s, scheduled));
      const slot = sameDaySlots[0];
      if (slot &&
          !isExpertOnLeave(ex, dateStrSame, slot, staffLeaves) &&
          !hasAppointmentConflict(dateStrSame, ex, slot, existingAppointments)) {
        const det = getServiceDetails(serviceInfo, sname, ex);
        if (!det) continue;
        scheduled.push({
          date: dateStrSame, expert: canonicalExpert(ex), service: sname,
          start: slot.start, end: slot.end, duration: parseInt(det.sure),
          price: parseInt(det.fiyat),
          for_person: service.for_person || null
        });
        currentTimeSlot = slot.end;
        placed = true;
        break;
      }
    }

    if (!placed && !flexChainAdjacent) {
      for (const ex of eligible) {
        const sameDaySlots = findAvailableSlots(dateStrSame, ex, { name: sname }, existingAppointments, staffLeaves, serviceInfo, constraints?.filters || {}, currentTime)
          .filter(s => timeToMinutes(s.start) >= notBefore)
          .filter(s => !conflictsWithScheduled(dateStrSame, s, scheduled));
        const slot = sameDaySlots[0];
        if (slot &&
            !isExpertOnLeave(ex, dateStrSame, slot, staffLeaves) &&
            !hasAppointmentConflict(dateStrSame, ex, slot, existingAppointments)) {
          const det = getServiceDetails(serviceInfo, sname, ex);
          if (!det) continue;
          scheduled.push({
            date: dateStrSame, expert: canonicalExpert(ex), service: sname,
            start: slot.start, end: slot.end, duration: parseInt(det.sure),
            price: parseInt(det.fiyat),
            for_person: service.for_person || null
          });
          currentTimeSlot = slot.end;
          placed = true;
          break;
        }
      }
    }

    if (placed) continue;

    for (const tryDate of allDates) {
      if (tryDate < currentDate) continue;
      const dateStr = formatTurkishDate(tryDate);
      if (!datePassesBounds(dateStr, constraints?.filters || {})) continue;

      const startMin = timeToMinutes(WORKING_HOURS.start);

      for (const ex of eligible) {
        const slots = findAvailableSlots(dateStr, ex, { name: sname }, existingAppointments, staffLeaves, serviceInfo, constraints?.filters || {}, currentTime)
          .filter(s => timeToMinutes(s.start) >= startMin)
          .filter(s => !conflictsWithScheduled(dateStr, s, scheduled));
        const slot = slots[0];
        if (!slot) continue;

        if (!isExpertOnLeave(ex, dateStr, slot, staffLeaves) &&
            !hasAppointmentConflict(dateStr, ex, slot, existingAppointments)) {
          const det = getServiceDetails(serviceInfo, sname, ex);
          if (!det) continue;
          scheduled.push({
            date: dateStr, expert: canonicalExpert(ex), service: sname,
            start: slot.start, end: slot.end, duration: parseInt(det.sure),
            price: parseInt(det.fiyat),
            for_person: service.for_person || null
          });
          currentDate = tryDate;
          currentTimeSlot = slot.end;
          placed = true;
          break;
        }
      }
      if (placed) break;
    }

    if (!placed) missingServices.push(sname);
  }

  const totalPrice = scheduled.reduce((sum, a) => sum + (a.price || 0), 0);
  const arrangement = getArrangement(scheduled);
  const totalDuration = calculateTotalDuration(scheduled, arrangement);

  return {
    complete: missingServices.length === 0,
    appointments: scheduled,
    missing_services: missingServices,
    total_price: totalPrice,
    total_duration: totalDuration,
    arrangement: arrangement
  };
}

// ============================================
// BÖLÜM 11: ✨ PUANLAMA (PARALEL BONUS EKLENDİ)
// ============================================

function dayScore(deltaDays) {
  if (deltaDays < 0) { const absDD = Math.abs(deltaDays); if (absDD === 1) return 12; if (absDD === 2) return 8; if (absDD <= 5) return 3; return 0; }
  if (deltaDays === 0) return 25;
  if (deltaDays === 1) return 20;
  if (deltaDays === 2) return 15;
  if (deltaDays === 3 || deltaDays === 4) return 10;
  if (deltaDays >= 5 && deltaDays <= 7) return 6;
  return 0;
}

function hourScore(absHourDiff) {
  const map = {0:25,1:23,2:21,3:19,4:17,5:15,6:13,7:11,8:9,9:7,10:5};
  return map[Math.min(10, absHourDiff)] || 0;
}

function expertScoreForCombo(combo, services) {
  let totalScore = 0;
  let matchCount = 0;
  let totalPrefs = 0;

  // Her randevu için tercih kontrolü yap
  for (const apt of combo.appointments) {
    const matchingService = services.find(s =>
      normalizeServiceName(s.name) === apt.service &&
      (s.for_person === apt.for_person || !s.for_person)
    );

    if (matchingService?.expert_preference) {
      totalPrefs++;
      const preferredExpert = canonicalExpert(matchingService.expert_preference);
      if (apt.expert === preferredExpert) {
        matchCount++;
        totalScore += 15;  // Tercih edilen uzmana bonus
      } else {
        totalScore += 5;   // Tercih edilmeyen ama uygun uzman
      }
    } else {
      totalScore += 10;  // Tercih yok, herhangi bir uzman
    }
  }

  // Tüm tercihler tutturulduysa ekstra bonus
  if (totalPrefs > 0 && matchCount === totalPrefs) {
    totalScore += 10;
  }

  return totalScore;
}

function parallelScore(combo) {
  // ✅ YENİ: Paralel randevu bonus puanı
  return (combo.arrangement === "parallel") ? 10 : 0;
}

function computeScoresForAll(combos, dateInfo, services) {
  const pmax = Math.max(...combos.map(c => c.total_price || 0), 1);
  const pmin = Math.min(...combos.map(c => c.total_price || 0), 1);

  let targetDate;
  if (dateInfo.type === 'specific' || dateInfo.type === 'urgent') {
    targetDate = parseTurkishDate(dateInfo.value);
  } else if (dateInfo.type === 'range') {
    const [start, end] = dateInfo.search_range.split(' to ');
    targetDate = (dateInfo.preference === 'earliest') ? parseTurkishDate(start) : parseTurkishDate(end);
  } else if (dateInfo.type === 'specific_days') {
    targetDate = parseTurkishDate(dateInfo.search_range.split(' to ')[0]);
  } else {
    targetDate = parseTurkishDate(dateInfo.search_range.split(' to ')[0]);
  }

  const targetTimeMin = (dateInfo.target_time && String(dateInfo.target_time).includes(':'))
    ? timeToMinutes(dateInfo.target_time)
    : (dateInfo.time_hint && hintMinFromTimeHint(dateInfo.time_hint) != null ? hintMinFromTimeHint(dateInfo.time_hint) : null);

  return combos.map(c => {
    const first = c.appointments[0];
    const firstDate = parseTurkishDate(first.date);
    const dd = Math.round((firstDate - targetDate) / (1000*60*60*24));
    const scoreDay = dayScore(dd);

    let scoreHour = 0;
    if (targetTimeMin != null) {
      const hdiff = Math.abs(timeToMinutes(first.start) - targetTimeMin) / 60;
      scoreHour = hourScore(Math.floor(hdiff));
    }

    const scoreExpert = expertScoreForCombo(c, services);
    const scoreParallel = parallelScore(c);  // ✅ YENİ
    
    const priceRange = pmax - pmin;
    const scoreValue = priceRange > 0 
      ? Math.round(20 * (pmax - (c.total_price || 0)) / priceRange)
      : 10;

    const timeWindow = getTimeWindow(first.start);
    
    return { 
      ...c, 
      score: scoreDay + scoreHour + scoreExpert + scoreParallel + scoreValue,  // ✅ Paralel bonus eklendi
      time_window: timeWindow
    };
  });
}

// ============================================
// BÖLÜM 12-15: DEDUPE, ALTERNATİFLER, FOLLOW-UP
// (Mevcut kod - Değişiklik Yok)
// ============================================

function serviceMultisetSignature(combo){
  const parts = combo.appointments.map(a => `${a.service}|${a.expert}|${a.duration}`);
  parts.sort();
  return parts.join('||');
}

function comboWindowSignature(combo, bucket=MIN_NEAR_DUP_GAP_MIN){
  const date = combo.appointments[0].date;
  const startMin = timeToMinutes(combo.appointments[0].start);
  const endMin   = timeToMinutes(combo.appointments[combo.appointments.length-1].end);
  const rs = Math.round(startMin / bucket) * bucket;
  const re = Math.round(endMin / bucket) * bucket;
  return `${date}#${rs}-${re}`;
}

function areWindowsNear(ca, cb, gap=MIN_NEAR_DUP_GAP_MIN){
  const aStart = timeToMinutes(ca.appointments[0].start);
  const aEnd   = timeToMinutes(ca.appointments[ca.appointments.length-1].end);
  const bStart = timeToMinutes(cb.appointments[0].start);
  const bEnd   = timeToMinutes(cb.appointments[cb.appointments.length-1].end);
  return Math.abs(aStart - bStart) <= gap && Math.abs(aEnd - bEnd) <= gap &&
         ca.appointments[0].date === cb.appointments[0].date;
}

function dedupeCombosByWindowAndServices(scoredCombos){
  const buckets = new Map();
  for (const c of scoredCombos){
    const day = c.appointments[0].date;
    const svcKey = serviceMultisetSignature(c);
    const key = `${day}::${svcKey}`;
    const prev = buckets.get(key);
    if (!prev){
      buckets.set(key, c);
      continue;
    }
    if (areWindowsNear(prev, c, MIN_NEAR_DUP_GAP_MIN)){
      buckets.set(key, (c.score > prev.score) ? c : prev);
    }else{
      const altKey = `${key}::${comboWindowSignature(c)}`;
      const existing = buckets.get(altKey);
      if (!existing || c.score > existing.score) buckets.set(altKey, c);
    }
  }
  return Array.from(buckets.values());
}

function nearestByStart(slots, targetMin){
  return [...slots].sort((a,b)=>{
    const da=Math.abs(timeToMinutes(a.start)-targetMin);
    const db=Math.abs(timeToMinutes(b.start)-targetMin);
    if (da!==db) return da-db;
    return timeToMinutes(a.start)-timeToMinutes(b.start);
  });
}

function pickDistinctByGap(candidates, minGapMin=MIN_PRESENT_GAP_MIN, limit=3){
  const byTimeWindow = {
    morning: [],
    noon: [],
    afternoon: [],
    evening: []
  };
  
  for (const c of candidates) {
    const startTime = c.start || c.appointments?.[0]?.start;
    if (startTime) {
      const window = getTimeWindow(startTime);
      if (byTimeWindow[window]) {
        byTimeWindow[window].push(c);
      }
    }
  }
  
  const picked = [];
  
  for (const window of Object.keys(byTimeWindow)) {
    if (byTimeWindow[window].length > 0) {
      picked.push(byTimeWindow[window][0]);
      if (picked.length >= limit) break;
    }
  }
  
  if (picked.length < limit) {
    for (const c of candidates) {
      if (picked.some(p => p === c)) continue;
      
      const cTime = c.start || c.appointments?.[0]?.start;
      const cDate = c.date || c.appointments?.[0]?.date;
      
      const clash = picked.some(p => {
        const pTime = p.start || p.appointments?.[0]?.start;
        const pDate = p.date || p.appointments?.[0]?.date;
        
        return pDate === cDate && Math.abs(timeToMinutes(pTime) - timeToMinutes(cTime)) < minGapMin;
      });
      
      if (!clash) {
        picked.push(c);
        if (picked.length >= limit) break;
      }
    }
  }
  
  return picked;
}

function generateSingleServiceAlternatives(serviceName, preferredExpert, dateStr, targetTime, existingAppointments, staffLeaves, serviceInfo, filters, currentTime=null) {
  const candidates = [];
  const targetMin = timeToMinutes(targetTime);
  
  let allExperts = eligibleExpertsForService(serviceName, serviceInfo);
  
  if (filters?.nail_expert_strict && Array.isArray(filters.allowed_nail_experts) && filters.allowed_nail_experts.length) {
    const allowedCanon = filters.allowed_nail_experts.map(canonicalExpert);
    allExperts = allExperts.filter(ex => allowedCanon.some(a => normalizeExpertName(a) === normalizeExpertName(ex)));
  }

  for (const ex of allExperts.filter(e => !preferredExpert || normalizeExpertName(e) !== normalizeExpertName(preferredExpert))) {
    const slots = findAvailableSlots(dateStr, ex, { name: serviceName }, existingAppointments, staffLeaves, serviceInfo, filters, currentTime);
    const hit = slots.find(sl => timeToMinutes(sl.start) === targetMin);
    if (hit) {
      const det = getServiceDetails(serviceInfo, serviceName, ex);
      if (!det) continue;
      const basePriority = 1;
      const timeWindowPenalty = calculateTimeWindowPenalty(hit.start, filters?.time_window);
      candidates.push({
        date: dateStr,
        start: hit.start,
        end: hit.end,
        service: serviceName,
        expert: canonicalExpert(ex),
        price: parseInt(det.fiyat),
        duration: parseInt(det.sure),
        reason: "Aynı saat – farklı uzman",
        priority: basePriority + timeWindowPenalty,
        time_window: getTimeWindow(hit.start)
      });
    }
  }

  if (preferredExpert) {
    const pSlots = findAvailableSlots(dateStr, preferredExpert, { name: serviceName }, existingAppointments, staffLeaves, serviceInfo, filters, currentTime);
    
    const timeWindows = ["morning", "noon", "afternoon", "evening"];
    for (const window of timeWindows) {
      const windowSlots = pSlots.filter(sl => getTimeWindow(sl.start) === window);
      
      if (windowSlots.length > 0) {
        const sorted = nearestByStart(windowSlots, targetMin);
        const slotsWithDifferentTimes = sorted.filter(sl => timeToMinutes(sl.start) !== targetMin);
        
        if (slotsWithDifferentTimes.length > 0) {
          const selected = slotsWithDifferentTimes[0];
          const det = getServiceDetails(serviceInfo, serviceName, preferredExpert);
          if (!det) continue;

          const windowName = window === 'morning' ? 'Sabah' :
                             window === 'noon' ? 'Öğle' :
                             window === 'afternoon' ? 'Öğleden sonra' : 'Akşam';

          const basePriority = 2;
          const timeWindowPenalty = calculateTimeWindowPenalty(selected.start, filters?.time_window);

          candidates.push({
            date: dateStr,
            start: selected.start,
            end: selected.end,
            service: serviceName,
            expert: preferredExpert,
            price: parseInt(det.fiyat),
            duration: parseInt(det.sure),
            reason: `${windowName} saati – tercih edilen uzman`,
            priority: basePriority + timeWindowPenalty,
            time_window: window
          });
        }
      }
    }
  }

  if (preferredExpert) {
    const base = parseTurkishDate(dateStr);
    const latestDate = filters?.latest_date ? parseTurkishDate(filters.latest_date) : null;
    const maxDays = latestDate 
      ? Math.ceil((latestDate - base) / (1000 * 60 * 60 * 24))
      : 7;
    
    for (let i = 1; i <= Math.min(maxDays, 14); i++) {
      const next = new Date(base);
      next.setDate(next.getDate() + i);
      if (next.getDay() === WORKING_HOURS.closed_day) continue;
      const nd = formatTurkishDate(next);
      
      const targetWindows = filters?.time_window
        ? [getTimeWindowName(filters.time_window.start)]
        : ["morning", "afternoon"];
      
      for (const window of targetWindows) {
        const nSlots = findAvailableSlots(nd, preferredExpert, { name: serviceName }, existingAppointments, staffLeaves, serviceInfo, filters, null)
          .filter(sl => getTimeWindow(sl.start) === window);
        
        if (nSlots.length > 0) {
          const selected = nSlots[0];
          const det = getServiceDetails(serviceInfo, serviceName, preferredExpert);
          if (!det) continue;

          const windowName = window === 'morning' ? 'sabah' :
                            window === 'noon' ? 'öğle' :
                            window === 'afternoon' ? 'öğleden sonra' : 'akşam';

          const basePriority = 3 + i;
          const timeWindowPenalty = calculateTimeWindowPenalty(selected.start, filters?.time_window);

          candidates.push({
            date: nd,
            start: selected.start,
            end: selected.end,
            service: serviceName,
            expert: preferredExpert,
            price: parseInt(det.fiyat),
            duration: parseInt(det.sure),
            reason: i === 1 ? `Ertesi gün – ${windowName}` : `${i} gün sonra – ${windowName}`,
            priority: basePriority + timeWindowPenalty,
            time_window: window
          });

          break;
        }
      }
      
      if (candidates.length >= 3) break;
    }
  }

  return pickDistinctByGap(candidates, MIN_PRESENT_GAP_MIN, 3);
}

function generateMultiServiceAlternatives(services, dateStr, targetTime, existingAppointments, staffLeaves, serviceInfo, constraints, currentTime=null) {
  const candidates = [];
  const filters = constraints?.filters || {};
  const sameDayRequired = constraints?.same_day_required !== false;

  const mainService = services.find(s => isNailAnchor(s.name)) || services[0];
  const otherServices = services.filter(s => s !== mainService);
  const preferredExpert = mainService.expert_preference ? canonicalExpert(mainService.expert_preference) : null;

  let allExperts = eligibleExpertsForService(mainService.name, serviceInfo);

  const originalStrict = filters?.nail_expert_strict;
  const softFilters = { ...filters, nail_expert_strict: false };

  // ✅ FIX: Strict mode kontrolü - Eğer strict ise sadece requested window ara
  const isStrictMode = filters?.time_window_strict === true;
  const requestedTimeWindow = filters?.time_window;

  let timeWindowsToSearch = ["morning", "noon", "afternoon", "evening"];

  if (isStrictMode && requestedTimeWindow && requestedTimeWindow.start) {
    // Strict mode: Sadece requested window'u ara
    const requestedWindow = getTimeWindowName(requestedTimeWindow.start);
    timeWindowsToSearch = [requestedWindow];
  }

  // ✅ FIX: time_window field'ını kaldır, strict mode göre ayarla
  const { time_window, ...filtersWithoutTimeWindow } = softFilters;
  const flexibleFilters = {
    ...filtersWithoutTimeWindow,
    time_window_strict: false  // Manual filtering yapıyoruz
  };

  for (const timeWindow of timeWindowsToSearch) {
    const windowStart = timeWindow === "morning" ? TIME_WINDOWS.MORNING.start :
                         timeWindow === "noon" ? TIME_WINDOWS.NOON.start :
                         timeWindow === "afternoon" ? TIME_WINDOWS.AFTERNOON.start :
                         TIME_WINDOWS.EVENING.start;

    const windowEnd = timeWindow === "morning" ? TIME_WINDOWS.MORNING.end :
                       timeWindow === "noon" ? TIME_WINDOWS.NOON.end :
                       timeWindow === "afternoon" ? TIME_WINDOWS.AFTERNOON.end :
                       TIME_WINDOWS.EVENING.end;

    // Her window için slot ara (SOFT filter ile)
    if (preferredExpert) {
      const allSlots = findAvailableSlots(
        dateStr,
        preferredExpert,
        mainService,
        existingAppointments,
        staffLeaves,
        serviceInfo,
        flexibleFilters,  // 👈 Soft filter
        currentTime
      );

      // Bu window'a ait slotları filtrele
      const windowSlots = allSlots.filter(slot => {
        const slotMin = timeToMinutes(slot.start);
        return slotMin >= windowStart && slotMin < windowEnd;
      });

      if (windowSlots.length > 0) {
        const mainDet = getServiceDetails(serviceInfo, mainService.name, preferredExpert);
        if (!mainDet) continue;

        // En uygun slot'u seç (aynı window ise requested time'a yakın, farklı ise ilk slot)
        const bestSlot = selectBestSlotFromWindow(windowSlots, constraints?.filters?.time_window, timeWindow);

        const refSlot = {
          date: dateStr,
          expert: preferredExpert,
          service: mainService.name,
          start: bestSlot.start,
          end: bestSlot.end,
          duration: parseInt(mainDet.sure),
          price: parseInt(mainDet.fiyat),
          for_person: mainService.for_person || null
        };

        const combo = tryScheduleAllServices(
          refSlot,
          otherServices,
          { type: 'specific', value: dateStr, search_range: `${dateStr} to ${dateStr}` },
          existingAppointments,
          staffLeaves,
          serviceInfo,
          { ...constraints, filters: softFilters, same_day_required: sameDayRequired },
          currentTime
        );

        if (combo && combo.complete) {
          const windowName = timeWindow === 'morning' ? 'Sabah' :
                             timeWindow === 'noon' ? 'Öğle' :
                             timeWindow === 'afternoon' ? 'Öğleden sonra' : 'Akşam';

          const basePriority = 1;
          const timeWindowPenalty = calculateTimeWindowPenalty(refSlot.start, constraints?.filters?.time_window);

          candidates.push({
            ...combo,
            reason: `${windowName} saati – tercih edilen uzman`,
            priority: basePriority + timeWindowPenalty,
            time_window: timeWindow
          });

          continue;
        }
      }
    }

    for (const ex of allExperts.filter(e => e !== preferredExpert)) {
      const allSlots = findAvailableSlots(
        dateStr,
        ex,
        mainService,
        existingAppointments,
        staffLeaves,
        serviceInfo,
        flexibleFilters,  // 👈 Soft filter
        currentTime
      );

      // Bu window'a ait slotları filtrele
      const windowSlots = allSlots.filter(slot => {
        const slotMin = timeToMinutes(slot.start);
        return slotMin >= windowStart && slotMin < windowEnd;
      });

      if (windowSlots.length > 0) {
        const mainDet = getServiceDetails(serviceInfo, mainService.name, ex);
        if (!mainDet) continue;

        // En uygun slot'u seç (aynı window ise requested time'a yakın, farklı ise ilk slot)
        const bestSlot = selectBestSlotFromWindow(windowSlots, constraints?.filters?.time_window, timeWindow);

        const refSlot = {
          date: dateStr,
          expert: canonicalExpert(ex),
          service: mainService.name,
          start: bestSlot.start,
          end: bestSlot.end,
          duration: parseInt(mainDet.sure),
          price: parseInt(mainDet.fiyat),
          for_person: mainService.for_person || null
        };

        const combo = tryScheduleAllServices(
          refSlot,
          otherServices,
          { type: 'specific', value: dateStr, search_range: `${dateStr} to ${dateStr}` },
          existingAppointments,
          staffLeaves,
          serviceInfo,
          { ...constraints, filters: softFilters, same_day_required: sameDayRequired },
          currentTime
        );

        if (combo && combo.complete) {
          const windowName = timeWindow === 'morning' ? 'Sabah' :
                             timeWindow === 'noon' ? 'Öğle' :
                             timeWindow === 'afternoon' ? 'Öğleden sonra' : 'Akşam';

          const basePriority = 2;
          const timeWindowPenalty = calculateTimeWindowPenalty(refSlot.start, constraints?.filters?.time_window);

          candidates.push({
            ...combo,
            reason: `${windowName} saati – alternatif uzman`,
            priority: basePriority + timeWindowPenalty,
            time_window: timeWindow
          });

          break;
        }
      }
    }
  }

  // ✅ YENİ: Future days logic - preferred yoksa ilk expert'i kullan
  const expertForFutureDays = preferredExpert || allExperts[0];

  if (expertForFutureDays && candidates.length < 10) {
    const base = parseTurkishDate(dateStr);
    const latestDate = filters?.latest_date ? parseTurkishDate(filters.latest_date) : null;
    const maxDays = latestDate
      ? Math.ceil((latestDate - base) / (1000 * 60 * 60 * 24))
      : 7;

    for (let i = 1; i <= Math.min(maxDays, 14); i++) {
      const next = new Date(base);
      next.setDate(next.getDate() + i);
      if (next.getDay() === WORKING_HOURS.closed_day) continue;
      const nd = formatTurkishDate(next);

      // ✅ Tüm time windows'ları ara
      for (const timeWindow of ["morning", "noon", "afternoon", "evening"]) {
        const windowStart = timeWindow === "morning" ? TIME_WINDOWS.MORNING.start :
                             timeWindow === "noon" ? TIME_WINDOWS.NOON.start :
                             timeWindow === "afternoon" ? TIME_WINDOWS.AFTERNOON.start :
                             TIME_WINDOWS.EVENING.start;

        const windowEnd = timeWindow === "morning" ? TIME_WINDOWS.MORNING.end :
                           timeWindow === "noon" ? TIME_WINDOWS.NOON.end :
                           timeWindow === "afternoon" ? TIME_WINDOWS.AFTERNOON.end :
                           TIME_WINDOWS.EVENING.end;

        const windowFilters = {
          ...softFilters,
          time_window: {
            start: minutesToTime(windowStart),
            end: minutesToTime(windowEnd)
          },
          time_window_strict: true
        };

        const slots = findAvailableSlots(
          nd,
          expertForFutureDays,
          mainService,
          existingAppointments,
          staffLeaves,
          serviceInfo,
          windowFilters,
          null
        );

        if (slots.length > 0) {
          const mainDet = getServiceDetails(serviceInfo, mainService.name, expertForFutureDays);
          if (!mainDet) continue;

          const bestSlot = selectBestSlotFromWindow(slots, constraints?.filters?.time_window, timeWindow);

          const refSlot = {
            date: nd,
            expert: expertForFutureDays,
            service: mainService.name,
            start: bestSlot.start,
            end: bestSlot.end,
            duration: parseInt(mainDet.sure),
            price: parseInt(mainDet.fiyat),
            for_person: mainService.for_person || null
          };

          const combo = tryScheduleAllServices(
            refSlot,
            otherServices,
            { type: 'specific', value: nd, search_range: `${nd} to ${nd}` },
            existingAppointments,
            staffLeaves,
            serviceInfo,
            { ...constraints, filters: softFilters, same_day_required: sameDayRequired },
            null
          );

          if (combo && combo.complete) {
            const windowName = timeWindow === 'morning' ? 'sabah' :
                               timeWindow === 'noon' ? 'öğle' :
                               timeWindow === 'afternoon' ? 'öğleden sonra' : 'akşam';

            const basePriority = 3 + i;
            const timeWindowPenalty = calculateTimeWindowPenalty(refSlot.start, constraints?.filters?.time_window);

            const reasonPrefix = preferredExpert ? 'tercih edilen uzman' : 'müsait uzman';

            candidates.push({
              ...combo,
              reason: i === 1 ? `Ertesi gün ${windowName} – ${reasonPrefix}` : `${i} gün sonra ${windowName} – ${reasonPrefix}`,
              priority: basePriority + timeWindowPenalty,
              time_window: timeWindow
            });

            // ✅ FIX: Kaldırıldı - tüm time windows için alternatif üretilsin
            if (candidates.length >= 10) break;  // Toplam 10'a ulaştıysak bu window loop'undan çık
          }
        }
      }

      if (candidates.length >= 10) break;  // ✅ 10 senaryoya kadar devam et
    }
  }

  if (originalStrict && preferredExpert) {
    candidates.forEach(c => {
      const mainApt = c.appointments.find(a => a.service === mainService.name);
      if (mainApt && normalizeExpertName(mainApt.expert) !== normalizeExpertName(preferredExpert)) {
        c.priority += 10;
        c.reason = `${c.reason} (alternatif uzman)`;
      }
    });
  }
  
  // ✅ YENİ: 10 farklı senaryo seç (AI'a göndermek için)
  // Çeşitlilik stratejisi: farklı time windows, farklı experts, farklı dates

  // Kategorize scenarios
  const sameDay = candidates.filter(c => c.appointments[0].date === dateStr);
  const otherDays = candidates.filter(c => c.appointments[0].date !== dateStr);

  let sameDayPreferred = [];
  let sameDayAlternative = [];
  let otherDaysPreferred = [];
  let otherDaysAlternative = [];

  if (preferredExpert) {
    const preferredExpertName = preferredExpert;
    sameDayPreferred = sameDay.filter(c =>
      c.appointments.some(a => normalizeExpertName(a.expert) === normalizeExpertName(preferredExpertName))
    );
    sameDayAlternative = sameDay.filter(c =>
      !c.appointments.some(a => normalizeExpertName(a.expert) === normalizeExpertName(preferredExpertName))
    );
    otherDaysPreferred = otherDays.filter(c =>
      c.appointments.some(a => normalizeExpertName(a.expert) === normalizeExpertName(preferredExpertName))
    );
    otherDaysAlternative = otherDays.filter(c =>
      !c.appointments.some(a => normalizeExpertName(a.expert) === normalizeExpertName(preferredExpertName))
    );
  } else {
    // Eğer preferred expert yoksa, tümü "preferred" sayılır
    sameDayPreferred = sameDay;
    otherDaysPreferred = otherDays;
  }

  // Sort each category by priority
  sameDayPreferred.sort((a, b) => a.priority - b.priority);
  sameDayAlternative.sort((a, b) => a.priority - b.priority);
  otherDaysPreferred.sort((a, b) => a.priority - b.priority);
  otherDaysAlternative.sort((a, b) => a.priority - b.priority);

  const selected = [];

  // 1. Aynı gün + Preferred expert + İstenen time window (EN ÖNCELİKLİ - 1 senaryo)
  if (sameDayPreferred.length > 0) {
    selected.push(sameDayPreferred[0]);
  }

  // 2. Aynı gün + Preferred expert + Diğer time windows (max 3 senaryo)
  // Her window'dan farklı bir tane al
  const windowsSeen = new Set();
  for (const scenario of sameDayPreferred) {
    if (selected.includes(scenario)) continue;
    if (selected.length >= 4) break; // 1 + 3 = 4

    const window = scenario.time_window;
    if (!windowsSeen.has(window)) {
      windowsSeen.add(window);
      selected.push(scenario);
    }
  }

  // 3. Aynı gün + Alternative experts (max 2 senaryo)
  for (const scenario of sameDayAlternative) {
    if (selected.length >= 6) break; // 4 + 2 = 6

    // Çakışma kontrolü
    const conflict = selected.some(s =>
      s.appointments[0].date === scenario.appointments[0].date &&
      Math.abs(timeToMinutes(s.appointments[0].start) - timeToMinutes(scenario.appointments[0].start)) < MIN_PRESENT_GAP_MIN
    );

    if (!conflict) {
      selected.push(scenario);
    }
  }

  // 4. Farklı günler + Preferred expert (max 2 senaryo)
  for (const scenario of otherDaysPreferred) {
    if (selected.length >= 8) break; // 6 + 2 = 8
    selected.push(scenario);
  }

  // 5. Farklı günler + Alternative experts (max 2 senaryo)
  for (const scenario of otherDaysAlternative) {
    if (selected.length >= 10) break; // 8 + 2 = 10
    selected.push(scenario);
  }

  // Eğer hala 10'a ulaşmadıysa, kalan candidates'tan en iyi priority'leri ekle
  if (selected.length < 10) {
    const remaining = candidates
      .filter(c => !selected.includes(c))
      .sort((a, b) => a.priority - b.priority);

    for (const scenario of remaining) {
      if (selected.length >= 10) break;
      selected.push(scenario);
    }
  }

  return selected;
}

function generateFollowUpQuestion(options) {
  if (options.length === 0) return "Koşullarınıza uygun boşluk bulamadım. Saat aralığını veya uzman tercihini esnetmemi ister misiniz?";
  if (options.length === 1) return "Bu seçeneği onaylıyor musunuz?";
  return "Hangisini tercih edersiniz?";
}

// ============================================
// BÖLÜM 16: ✨ ANA FONKSİYON (OUTPUT FORMATI GÜNCELLENDİ)
// ============================================

function main() {
  const input = $input.all()[0].json;

  const services = (input.services || []).map(s => ({ ...s, name: normalizeServiceName(s.name) }));
  const serviceInfoRaw = input.service_info || {};
  const serviceInfo = Object.fromEntries(Object.entries(serviceInfoRaw).map(([k,v]) => [normalizeServiceName(k), v]));
  const dateInfo = input.date_info;
  const constraints = input.constraints || {};
  const existingAppointments = input.existing_appointments || [];
  const staffLeaves = input.staff_leaves || [];
  
  const currentTime = input.current_time || null;
  
  if (dateInfo.type === 'urgent' && currentTime) {
    const urgentDate = parseTurkishDate(dateInfo.value);
    const today = new Date();
    const isToday = urgentDate.getDate() === today.getDate() && 
                    urgentDate.getMonth() === today.getMonth() && 
                    urgentDate.getFullYear() === today.getFullYear();
    
    if (isToday) {
      const currentTimeMin = timeToMinutes(currentTime);
      const closingTimeMin = timeToMinutes(WORKING_HOURS.end);
      const minServiceDuration = 30;
      
      if (currentTimeMin >= closingTimeMin - minServiceDuration) {
        console.log('⚠️ Urgent: Çalışma saati bitmiş veya çok az kaldı, otomatik olarak yarını da dahil ediyorum');
        const tomorrow = new Date(urgentDate);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(urgentDate);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        dateInfo.search_range = `${dateInfo.value} to ${formatTurkishDate(nextWeek)}`;
        dateInfo.type = 'range';
        dateInfo.preference = 'earliest';
      }
    }
  }

  const effectiveConstraints = buildEffectiveConstraints(dateInfo, constraints, services);
  const filters = effectiveConstraints.filters || {};

  const dates = parseDateInfo(dateInfo);
  const nonSundayDates = dates.filter(d => d.getDay() !== WORKING_HOURS.closed_day);
  if (nonSundayDates.length === 0) {
    return [{ json: { status: "closed_day", message: "Salonumuz Pazar günleri kapalıdır. Lütfen başka bir gün seçiniz.", options: [] } }];
  }

  const singleService = (services.length === 1);
  const isSpecificDate = (dateInfo?.type === 'specific');
  const targetTime = dateInfo?.target_time || null;
  
  if (singleService && isSpecificDate && targetTime) {
    const sName = services[0].name;
    const preferred = services[0]?.expert_preference ? canonicalExpert(services[0].expert_preference) : null;
    const dateStr = formatTurkishDate(parseTurkishDate(dateInfo.value));
    const targetMin = timeToMinutes(targetTime);

    let exactMatch = false;
    if (preferred) {
      const prefSlots = findAvailableSlots(dateStr, preferred, { name: sName }, existingAppointments, staffLeaves, serviceInfo, filters, currentTime);
      exactMatch = prefSlots.some(sl => timeToMinutes(sl.start) === targetMin);
      
      if (exactMatch) {
        const slot = prefSlots.find(sl => timeToMinutes(sl.start) === targetMin);
        const det = getServiceDetails(serviceInfo, sName, preferred);
        if (det) {
          const option = {
            id: 1,
            score: 100,
            complete: true,
            group_appointments: [{  // ✅ Nested format
              for_person: services[0].for_person || "self",
              appointment: {
                date: dateStr,
                day_name: getDayName(parseTurkishDate(dateStr)),
                start_time: slot.start,
                end_time: slot.end,
                service: sName,
                expert: preferred,
                price: parseInt(det.fiyat),
                duration: parseInt(det.sure)
              }
            }],
            total_price: parseInt(det.fiyat),
            total_duration: parseInt(det.sure),
            arrangement: "single",
            missing_services: []
          };
          
          return [{ json: { status: "success", options: [option], follow_up_question: generateFollowUpQuestion([option]) } }];
        }
      }
    }

    if (!exactMatch) {
      const alternatives = generateSingleServiceAlternatives(sName, preferred, dateStr, targetTime, existingAppointments, staffLeaves, serviceInfo, filters, currentTime);
      
      if (alternatives.length) {
        const options = alternatives.map((c, idx) => ({
          id: idx + 1,
          score: null,
          complete: true,
          group_appointments: [{  // ✅ Nested format
            for_person: services[0].for_person || "self",
            appointment: {
              date: c.date,
              day_name: getDayName(parseTurkishDate(c.date)),
              start_time: c.start,
              end_time: c.end,
              service: c.service,
              expert: c.expert,
              price: c.price,
              duration: c.duration
            }
          }],
          total_price: c.price,
          total_duration: c.duration,
          arrangement: "single",
          missing_services: [],
          alternative_reason: c.reason
        }));

        return [{ json: { status: "alternatives", options, follow_up_question: generateFollowUpQuestion(options) } }];
      }
    }
  }

  if (services.length > 1 && isSpecificDate) {
    const mainService = services.find(s => isNailAnchor(s.name)) || services[0];
    const preferred = mainService.expert_preference ? canonicalExpert(mainService.expert_preference) : null;
    const dateStr = formatTurkishDate(parseTurkishDate(dateInfo.value));
    const targetMin = targetTime ? timeToMinutes(targetTime) : null;

    let exactMatch = false;
    if (preferred) {
      const mainSlots = findAvailableSlots(dateStr, preferred, mainService, existingAppointments, staffLeaves, serviceInfo, filters, currentTime);
      const targetSlot = targetMin ? mainSlots.find(sl => timeToMinutes(sl.start) === targetMin) : mainSlots[0];
      
      if (targetSlot) {
        const mainDet = getServiceDetails(serviceInfo, mainService.name, preferred);
        if (mainDet) {
          const refSlot = {
            date: dateStr,
            expert: preferred,
            service: mainService.name,
            start: targetSlot.start,
            end: targetSlot.end,
            duration: parseInt(mainDet.sure),
            price: parseInt(mainDet.fiyat),
            for_person: mainService.for_person || null
          };
          
          const combo = tryScheduleAllServices(
            refSlot,
            services.filter(s => s !== mainService),
            dateInfo,
            existingAppointments,
            staffLeaves,
            serviceInfo,
            effectiveConstraints,
            currentTime
          );
          
          if (combo && combo.complete) {
            exactMatch = true;
            const option = {
              id: 1,
              score: 100,
              complete: true,
              group_appointments: combo.appointments.map(apt => ({  // ✅ Nested format
                for_person: apt.for_person || "self",
                appointment: {
                  date: apt.date,
                  day_name: getDayName(parseTurkishDate(apt.date)),
                  start_time: apt.start,
                  end_time: apt.end,
                  service: apt.service,
                  expert: apt.expert,
                  price: apt.price,
                  duration: apt.duration
                }
              })),
              total_price: combo.total_price,
              total_duration: combo.total_duration,
              arrangement: combo.arrangement,
              missing_services: []
            };
            
            return [{ json: { status: "success", options: [option], follow_up_question: generateFollowUpQuestion([option]) } }];
          }
        }
      }
    }

    if (!exactMatch) {
      const alternatives = generateMultiServiceAlternatives(services, dateStr, targetTime, existingAppointments, staffLeaves, serviceInfo, effectiveConstraints, currentTime);

      if (alternatives.length) {
        const options = alternatives.map((combo, idx) => ({
          id: idx + 1,
          score: combo.priority,  // Priority score (düşük = daha iyi)
          complete: combo.complete,
          group_appointments: combo.appointments.map(apt => ({  // ✅ Nested format
            for_person: apt.for_person || "self",
            appointment: {
              date: apt.date,
              day_name: getDayName(parseTurkishDate(apt.date)),
              start_time: apt.start,
              end_time: apt.end,
              service: apt.service,
              expert: apt.expert,
              price: apt.price,
              duration: apt.duration
            }
          })),
          total_price: combo.total_price,
          total_duration: combo.total_duration,
          arrangement: combo.arrangement,
          missing_services: combo.missing_services || [],
          alternative_reason: combo.reason
        }));

        // ✅ FIX: Eğer istenen tarihte tam randevular bulunduysa "success" döndür
        const allOnRequestedDate = options.every(opt =>
          opt.complete && opt.group_appointments.every(ga => ga.appointment.date === dateStr)
        );

        const status = allOnRequestedDate ? "success" : "alternatives";
        return [{ json: { status, options, follow_up_question: generateFollowUpQuestion(options) } }];
      }
    }
  }

  const referenceService = services.find(s => isNailAnchor(s.name)) || services[0];

  let referenceExperts = eligibleExpertsForService(referenceService.name, serviceInfo);

  // ✅ IMPROVED: Tercih edilen uzmanı önceliklendir (filtrele değil)
  const sameExpertInfo = effectiveConstraints?.same_expert_info || { sameExpert: false };

  if (isNailAnchor(referenceService.name)) {
    if (filters?.nail_expert_strict && Array.isArray(filters.allowed_nail_experts) && filters.allowed_nail_experts.length) {
      const allowedCanon = filters.allowed_nail_experts.map(canonicalExpert);
      referenceExperts = referenceExperts.filter(ex => allowedCanon.some(a => normalizeExpertName(a) === normalizeExpertName(ex)));
    }

    // Tercih edilen uzmanı en başa al (ama diğerlerini eleme - kullanıcı deneyimi için)
    const pref = referenceService.expert_preference ? canonicalExpert(referenceService.expert_preference) : null;
    if (pref) {
      referenceExperts = [pref, ...referenceExperts.filter(e => normalizeExpertName(e) !== normalizeExpertName(pref))];
    }
  }

  if (!referenceExperts.length) {
    return [{ json: { status: "error", message: "Seçilen hizmet için uygun uzman bulunamadı." } }];
  }

  const allCombinations = [];

  for (const date of nonSundayDates) {
    const dateStr = formatTurkishDate(date);
    if (!datePassesBounds(dateStr, filters)) continue;

    for (const refExpert of referenceExperts) {
      const availableSlots = findAvailableSlots(dateStr, refExpert, referenceService, existingAppointments, staffLeaves, serviceInfo, filters, currentTime);

      for (const slot of availableSlots) {
        const serviceDetails = getServiceDetails(serviceInfo, referenceService.name, refExpert);
        if (!serviceDetails) continue;

        const combo = tryScheduleAllServices(
          { date: dateStr, expert: canonicalExpert(refExpert), service: referenceService.name,
            start: slot.start, end: slot.end, duration: parseInt(serviceDetails.sure), price: parseInt(serviceDetails.fiyat),
            for_person: referenceService.for_person || null },
          services.filter(s => s !== referenceService),
          dateInfo, existingAppointments, staffLeaves, serviceInfo, effectiveConstraints, currentTime
        );
        if (!combo) continue;

        const allPass = combo.appointments.every(apt => {
          if (!datePassesBounds(apt.date, filters)) return false;
          return withinTimeWindow({ start: apt.start, end: apt.end }, filters);
        });
        if (!allPass) continue;

        allCombinations.push(combo);
      }
    }
  }

  if (allCombinations.length === 0) {
    return [{ json: { status: "no_availability", message: "Belirttiğiniz koşullara uygun boşluk bulunamadı. Uzman ve saat tercihini esnetmemi ister misiniz?", options: [] } }];
  }

  let scored = computeScoresForAll(allCombinations, dateInfo, services);
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if ((a.total_price||0) !== (b.total_price||0)) return (a.total_price||0) - (b.total_price||0);
    const aStart = timeToMinutes(a.appointments[0].start);
    const bStart = timeToMinutes(b.appointments[0].start);
    return aStart - bStart;
  });

  const deduped = dedupeCombosByWindowAndServices(scored);

  const topPicked = (function selectDiverseCombinations(sortedCombos, limit = 3) {
    const selected = [];
    const usedExperts = new Set();
    
    // 1. AŞAMA: Her uzmandan en iyi 1 seçenek al
    for (const combo of sortedCombos) {
      const expert = combo.appointments[0].expert;
      
      if (!usedExperts.has(expert)) {
        selected.push(combo);
        usedExperts.add(expert);
        
        if (selected.length >= limit) break;
      }
    }
    
    // 2. AŞAMA: Hala limit dolmadıysa, farklı saatlerden ekle
    if (selected.length < limit) {
      for (const combo of sortedCombos) {
        // Zaten seçilmiş mi?
        if (selected.some(sel => sel === combo)) continue;
        
        // Mevcut seçeneklerle zaman çakışması var mı?
        const conflict = selected.some(sel => {
          if (sel.appointments[0].date !== combo.appointments[0].date) return false;
          return Math.abs(
            timeToMinutes(sel.appointments[0].start) - 
            timeToMinutes(combo.appointments[0].start)
          ) < MIN_PRESENT_GAP_MIN;
        });
        
        if (!conflict) {
          selected.push(combo);
          if (selected.length >= limit) break;
        }
      }
    }
    
    return selected;
  })(deduped, 5);  // ✅ 3 yerine 5 seçenek

  const top5 = topPicked;

  // ✅ En iyi 10 seçeneği de al (sıralı liste)
  const top10All = deduped.slice(0, 10).map((combo, index) => ({
    id: index + 1,
    score: combo.score,
    complete: combo.complete,
    group_appointments: combo.appointments.map(apt => ({
      for_person: apt.for_person || "self",
      appointment: {
        date: apt.date,
        day_name: getDayName(parseTurkishDate(apt.date)),
        start_time: apt.start,
        end_time: apt.end,
        service: apt.service,
        expert: apt.expert,
        price: apt.price,
        duration: apt.duration
      }
    })),
    total_price: combo.total_price,
    total_duration: combo.total_duration,
    arrangement: combo.arrangement || "single",
    missing_services: combo.missing_services || [],
    alternative_message: combo.missing_services?.length > 0 ? `${combo.missing_services.join(", ")} için farklı tarihte müsaitlik kontrolü yapabilirim.` : null
  }));

  // ✅ OUTPUT FORMATI: Nested group_appointments
  const options = top5.map((combo, index) => ({
    id: index + 1,
    score: combo.score,
    complete: combo.complete,
    group_appointments: combo.appointments.map(apt => ({
      for_person: apt.for_person || "self",
      appointment: {
        date: apt.date,
        day_name: getDayName(parseTurkishDate(apt.date)),
        start_time: apt.start,
        end_time: apt.end,
        service: apt.service,
        expert: apt.expert,
        price: apt.price,
        duration: apt.duration
      }
    })),
    total_price: combo.total_price,
    total_duration: combo.total_duration,
    arrangement: combo.arrangement || "single",
    missing_services: combo.missing_services || [],
    alternative_message: combo.missing_services?.length > 0 ? `${combo.missing_services.join(", ")} için farklı tarihte müsaitlik kontrolü yapabilirim.` : null
  }));

  return [{ json: {
    status: "success",
    options,
    top_10_all_options: top10All,  // ✅ En iyi 10 seçenek (ayrı field)
    follow_up_question: generateFollowUpQuestion(options)
  } }];
}

// Support both n8n and Node.js module usage
if (typeof $input !== 'undefined') {
  // When $input exists (n8n or Node.js test with mocked $input)
  const result = main();

  // For Node.js: explicitly set module.exports
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = result;
  }

  // For n8n: return the result to the workflow
  return result;
} else if (typeof module !== 'undefined' && module.exports) {
  // Node.js module context without $input - export the function
  module.exports = main;
}
