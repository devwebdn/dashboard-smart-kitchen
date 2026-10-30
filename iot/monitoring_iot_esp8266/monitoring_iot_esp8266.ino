#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <UniversalTelegramBot.h>
#include <DHT.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// ================= WIFI & SUPABASE =================
const char* WIFI_SSID     = "Parison";   // Masukkan SSID WiFi Anda
const char* WIFI_PASSWORD = "sekdiluk";  // Masukkan Password WiFi Anda

// Konfigurasi Supabase REST API
const char* SUPABASE_URL  = "https://bvapgaftppwukahajein.supabase.co/rest/v1/sensor_readings";
const char* SUPABASE_KEY  = "sb_publishable_kxsDTXXNDSISNq1mmtyhMQ_B9sDaAwk";
const char* DEVICE_ID     = "90812a96-cd50-4b98-b99c-c21a88175d31";

// ================= TELEGRAM (OPSIONAL) =================
#define BOT_TOKEN ""
#define CHAT_ID   ""

const unsigned long INTERVAL_NOTIF_GAS  = 60000;    // 1 menit
const unsigned long INTERVAL_LAPORAN    = 1800000;  // 30 menit
const unsigned long INTERVAL_CEK_BOT    = 2000;

// ================= PIN NODEMCU =================
#define DHT_PIN     D5
#define DHT_TYPE    DHT22
#define MQ2_DO_PIN  D7      // Pin Digital DO
#define MQ2_AO_PIN  A0      // Pin Analog AO
#define BUZZER_PIN  D6      // Pin Buzzer
#define LCD_SDA     D2
#define LCD_SCL     D1

DHT dht(DHT_PIN, DHT_TYPE);
LiquidCrystal_I2C* lcd = nullptr;

WiFiClientSecure clientTelegram;
UniversalTelegramBot bot(BOT_TOKEN, clientTelegram);

// ================= AMBANG BATAS RESPONSIF =================
const float SUHU_ABS_ON    = 38.0;  // Suhu bahaya (°C)
const float SUHU_ABS_OFF   = 35.0;  // Suhu kembali normal
const float SUHU_NAIK_ON   = 3.0;   // Kenaikan suhu mendadak (+3°C)
const float SUHU_NAIK_OFF  = 1.5;

// Parameter AO Adaptif:
// Karena nilai udara normal Anda di Serial Monitor adalah 0 - 2:
const int AO_KENAIKAN_ON   = 40;    // Cukup naik 40 poin dari udara normal -> LANGSUNG BAHAYA
const int AO_AMBANG_MUTLAK = 250;   // Atau jika nilai AO >= 250 -> LANGSUNG BAHAYA

const int  BUZZER_FREKUENSI = 2500;
const unsigned long BUZZER_INTERVAL = 500;

// ================= INTERVAL WAKTU =================
const unsigned long INTERVAL_MQ     = 50;   // Sampling MQ-2 tiap 50 ms (sangat responsif)
const unsigned long INTERVAL_DHT    = 2000;
const unsigned long INTERVAL_LCD    = 500;
const unsigned long INTERVAL_SERIAL = 1000;
const unsigned long INTERVAL_KIRIM  = 10000; // Kirim berkala tiap 10 detik
const unsigned long INTERVAL_WIFI   = 15000;

// ================= VARIABEL SISTEM =================
unsigned long tMQ = 0, tDHT = 0, tLCD = 0, tSerial = 0;
unsigned long tKirim = 0, tWiFi = 0, tBuzzer = 0;

float suhu = NAN, kelembapan = NAN;
float suhuBase = NAN;
bool dataDHTValid = false;
int gagalDHT = 0;

int statusDO = HIGH;
int asapRaw = 0;
float asapAvg = 0;
float baseline = 0;     // Acuan udara normal dinamis

int hitungBahaya = 0;
int hitungAman = 0;

bool gasTerdeteksi = false;
bool suhuNaik = false;
bool alarmAktif = false;

bool polaAktif = false;
bool polaOn = false;

const char* pemicuGas = "-";

// Status sebelumnya untuk update web instan tanpa delay
bool lastGasState = false;
bool lastAlarmState = false;

// Variabel Telegram
unsigned long lastGasNotif = 0;
unsigned long lastLaporan = 0;
unsigned long botLastScan = 0;
bool lastGasStatus = false;

// ================= FUNGSI BANTU =================
byte cariAlamatLCD() {
  byte kandidat[] = {0x27, 0x3F};
  for (byte i = 0; i < 2; i++) {
    Wire.beginTransmission(kandidat[i]);
    if (Wire.endTransmission() == 0) return kandidat[i];
  }
  return 0x27;
}

int bacaAO() {
  long total = 0;
  for (int i = 0; i < 4; i++) {
    total += analogRead(MQ2_AO_PIN);
    delayMicroseconds(100);
  }
  return (int)(total / 4);
}

bool bacaDHT() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if (!isnan(h) && !isnan(t) && t > -40 && t < 80 && h >= 0 && h <= 100) {
    suhu = t;
    kelembapan = h;
    return true;
  }
  return false;
}

void cekWiFi(unsigned long now) {
  if (WiFi.status() == WL_CONNECTED) return;
  if (now - tWiFi >= INTERVAL_WIFI) {
    tWiFi = now;
    Serial.println("[WiFi] Reconnecting...");
    WiFi.reconnect();
  }
}

// ================= BUZZER =================
void kendaliBuzzer(unsigned long now) {
  if (alarmAktif) {
    if (!polaAktif) {
      polaAktif = true;
      polaOn = true;
      tBuzzer = now;
      tone(BUZZER_PIN, BUZZER_FREKUENSI);
    } else if (now - tBuzzer >= BUZZER_INTERVAL) {
      tBuzzer = now;
      polaOn = !polaOn;
      if (polaOn) tone(BUZZER_PIN, BUZZER_FREKUENSI);
      else        noTone(BUZZER_PIN);
    }
  } else if (polaAktif) {
    polaAktif = false;
    polaOn = false;
    noTone(BUZZER_PIN);
    digitalWrite(BUZZER_PIN, LOW);
  }
}

// ================= LCD =================
void tampilkanLCD(unsigned long now) {
  if (!lcd) return;

  // Baris 1: Suhu & Kelembapan
  lcd->setCursor(0, 0);
  if (dataDHTValid) {
    char buf[8];
    dtostrf(suhu, 4, 1, buf);
    lcd->print("T:");
    lcd->print(buf);
    lcd->print((char)223);
    lcd->print("C H:");
    lcd->print((int)kelembapan);
    lcd->print("%   ");
  } else {
    lcd->print("DHT22 ERROR     ");
  }

  // Baris 2: Status
  lcd->setCursor(0, 1);
  if (gasTerdeteksi) {
    lcd->print("ALARM: GAS BOCOR");
  } else if (suhuNaik) {
    lcd->print("WASPADA: SUHU   ");
  } else {
    lcd->print("STATUS: AMAN    ");
  }
}

// ================= KIRIM KE SUPABASE =================
void kirimDataServer() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure();
  client.setBufferSizes(1024, 512);
  client.setTimeout(5000);

  HTTPClient http;
  http.setTimeout(5000);

  if (!http.begin(client, SUPABASE_URL)) return;

  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
  http.addHeader("Prefer", "return=minimal");

  // Kirim nilai ADC real-time (jika AO 0 tapi DO aktif, set minimal 750 agar grafik web terlihat jelas)
  int adcKirim = (int)asapAvg;
  if (gasTerdeteksi && adcKirim < 200) {
    adcKirim = 800; // Visualisasi kenaikan di grafik web
  }

  String payload = "{";
  payload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"temperature\":" + (dataDHTValid ? String(suhu, 2) : "null") + ",";
  payload += "\"humidity\":" + (dataDHTValid ? String(kelembapan, 2) : "null") + ",";
  payload += "\"gas_adc\":" + String(adcKirim) + ",";
  payload += "\"gas_detected\":" + String(gasTerdeteksi ? "true" : "false") + ",";
  payload += "\"suhu_naik\":" + String(suhuNaik ? "true" : "false") + ",";
  payload += "\"alarm_active\":" + String(alarmAktif ? "true" : "false");
  payload += "}";

  Serial.println("[Supabase] Mengirim data: " + payload);
  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    Serial.print("[Supabase] HTTP Response code: ");
    Serial.println(httpCode);
    if (httpCode == 201 || httpCode == 200 || httpCode == 204) {
      Serial.println("[Supabase] BERHASIL! Data masuk ke database & web.");
    }
  } else {
    Serial.print("[Supabase] Gagal kirim: ");
    Serial.println(http.errorToString(httpCode));
  }

  http.end();
}

// ================= TELEGRAM =================
String teksSuhu() {
  return dataDHTValid ? String(suhu, 1) : String("ERROR");
}

String teksHum() {
  return dataDHTValid ? String(kelembapan, 1) : String("ERROR");
}

void kirimTelegram(const String& chatId, const String& pesan) {
  if (strlen(BOT_TOKEN) == 0 || strlen(CHAT_ID) == 0) return;
  if (WiFi.status() != WL_CONNECTED) return;
  bool ok = bot.sendMessage(chatId, pesan, "");
  Serial.println(ok ? "Telegram terkirim." : "Telegram GAGAL kirim.");
}

void cekTelegram(unsigned long now) {
  if (strlen(BOT_TOKEN) == 0 || strlen(CHAT_ID) == 0) return;
  if (WiFi.status() != WL_CONNECTED) return;

  if (gasTerdeteksi && (!lastGasStatus || now - lastGasNotif >= INTERVAL_NOTIF_GAS)) {
    lastGasNotif = now;
    lastGasStatus = true;
    String pesan = "🚨 PERINGATAN DARURAT: KEBOCORAN GAS!\nKebocoran gas terdeteksi di dapur!\n\n";
    pesan += "📊 ADC: " + String((int)asapAvg) + "\n";
    pesan += "🌡️ Suhu: " + teksSuhu() + " °C\n";
    pesan += "⚠️ Segera periksa tabung gas!";
    kirimTelegram(CHAT_ID, pesan);
  }

  if (!gasTerdeteksi && lastGasStatus) {
    lastGasStatus = false;
    String pesan = "✅ [GAS CLEAR] KONDISI KEMBALI AMAN\n📍 Lokasi: Dapur Utama\n";
    kirimTelegram(CHAT_ID, pesan);
  }

  if (now - lastLaporan >= INTERVAL_LAPORAN) {
    lastLaporan = now;
    String status = alarmAktif ? "BAHAYA 🚨" : "NORMAL / AMAN ✅";
    String pesan = "📊 LAPORAN MONITORING SUHU REAL-TIME\n\n";
    pesan += "• Suhu: " + teksSuhu() + " °C 🌡️\n";
    pesan += "• Kelembapan: " + teksHum() + " % 💧\n";
    pesan += "• Status: " + status;
    kirimTelegram(CHAT_ID, pesan);
  }

  if (now - botLastScan >= INTERVAL_CEK_BOT) {
    botLastScan = now;
    int numNewMessages = bot.getUpdates(bot.last_message_received + 1);
    while (numNewMessages) {
      for (int i = 0; i < numNewMessages; i++) {
        if (bot.messages[i].text == "/suhu") {
          String balasan = "📊 CEK REALTIME\n";
          balasan += "Suhu: " + teksSuhu() + " C\n";
          balasan += "Kelembapan: " + teksHum() + " %\n";
          balasan += "Gas: " + String(gasTerdeteksi ? "TERDETEKSI" : "Aman") + "\n";
          balasan += "Alarm: " + String(alarmAktif ? "BUNYI" : "OFF");
          kirimTelegram(bot.messages[i].chat_id, balasan);
        }
      }
      numNewMessages = bot.getUpdates(bot.last_message_received + 1);
    }
  }
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=== MONITORING DAPUR MBG (AO + DO RESPONSIF) ===");

  pinMode(MQ2_DO_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  Wire.begin(LCD_SDA, LCD_SCL);
  lcd = new LiquidCrystal_I2C(cariAlamatLCD(), 16, 2);
  lcd->init();
  lcd->backlight();
  lcd->clear();
  lcd->setCursor(0, 0);
  lcd->print("Monitoring MBG");
  lcd->setCursor(0, 1);
  lcd->print("Memulai...");

  dht.begin();

  // Bip singkat tes buzzer
  tone(BUZZER_PIN, BUZZER_FREKUENSI);
  delay(200);
  noTone(BUZZER_PIN);
  digitalWrite(BUZZER_PIN, LOW);

  // Ambil pembacaan awal AO sebagai baseline udara normal
  asapRaw = bacaAO();
  asapAvg = asapRaw;
  baseline = asapRaw;

  Serial.print("Menghubungkan ke WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  clientTelegram.setInsecure();
  clientTelegram.setBufferSizes(1024, 512);

  delay(1500);

  unsigned long now = millis();
  tDHT = tMQ = tLCD = tSerial = tKirim = tWiFi = now;
  lastLaporan = now;
  botLastScan = now;

  lcd->clear();
  Serial.println("Sistem siap. MQ-02 (AO + DO) aktif!");
}

// ================= LOOP =================
void loop() {
  unsigned long now = millis();

  // ---------- 1. MQ-02 (KOMBINASI AO + DO RESPONSIF) ----------
  if (now - tMQ >= INTERVAL_MQ) {
    tMQ = now;

    statusDO = digitalRead(MQ2_DO_PIN);
    asapRaw = bacaAO();
    // Filter lembut untuk meredam noise jitter
    asapAvg = asapAvg * 0.4 + asapRaw * 0.6;

    float lonjakan = asapAvg - baseline;

    // Evaluasi pemicu:
    // 1. Pin DO aktif (LOW)
    // 2. ATAU Nilai AO melonjak >= 40 poin dari baseline
    // 3. ATAU Nilai AO mencapai batas absolut >= 250
    bool doAktif = (statusDO == LOW);
    bool aoNaik  = (lonjakan >= AO_KENAIKAN_ON);
    bool aoTinggi = (asapAvg >= AO_AMBANG_MUTLAK);

    bool pemicuAktif = doAktif || aoNaik || aoTinggi;

    if (doAktif)       pemicuGas = "DO (Sensor Digital)";
    else if (aoNaik)   pemicuGas = "AO (Kenaikan Analog)";
    else if (aoTinggi) pemicuGas = "AO (Level Tinggi)";

    if (pemicuAktif) {
      hitungBahaya++;
      hitungAman = 0;
      // Cukup 2 sampel (100 ms) langsung picu BAHAYA
      if (hitungBahaya >= 2) {
        gasTerdeteksi = true;
      }
    } else {
      hitungAman++;
      hitungBahaya = 0;
      // 6 sampel (300 ms) aman berturut-turut langsung kembali AMAN (tidak tertahan)
      if (hitungAman >= 6) {
        gasTerdeteksi = false;
        pemicuGas = "-";
      }

      // Update baseline udara bersih dinamis
      if (asapAvg < baseline) {
        baseline = asapAvg; // Turun cepat jika udara lebih bersih
      } else {
        baseline = baseline * 0.995 + asapAvg * 0.005; // Mengikuti suhu ruangan perlahan
      }
    }
  }

  // ---------- 2. DHT22 (SUHU & KELEMBAPAN) ----------
  if (now - tDHT >= INTERVAL_DHT) {
    tDHT = now;

    if (bacaDHT()) {
      dataDHTValid = true;
      gagalDHT = 0;

      if (isnan(suhuBase)) suhuBase = suhu;

      // Deteksi kenaikan suhu
      float naik = suhu - suhuBase;

      if (!suhuNaik) {
        if (suhu >= SUHU_ABS_ON || naik >= SUHU_NAIK_ON) {
          suhuNaik = true;
        }
      } else {
        if (suhu < SUHU_ABS_OFF || naik < SUHU_NAIK_OFF) {
          suhuNaik = false;
        }
      }

      if (!suhuNaik) {
        suhuBase = suhuBase * 0.98 + suhu * 0.02;
      }
    } else {
      gagalDHT++;
      if (gagalDHT >= 3) {
        dataDHTValid = false;
        suhuNaik = false;
      }
    }
  }

  // ---------- 3. LOGIKA ALARM ----------
  alarmAktif = gasTerdeteksi || suhuNaik;
  kendaliBuzzer(now);

  // ---------- 4. LCD ----------
  if (now - tLCD >= INTERVAL_LCD) {
    tLCD = now;
    tampilkanLCD(now);
  }

  // ---------- 5. SERIAL MONITOR ----------
  if (now - tSerial >= INTERVAL_SERIAL) {
    tSerial = now;

    Serial.print("Suhu: ");
    if (dataDHTValid) { Serial.print(suhu, 1); Serial.print(" C"); }
    else Serial.print("ERROR");

    Serial.print(" | RH: ");
    if (dataDHTValid) { Serial.print(kelembapan, 0); Serial.print("%"); }
    else Serial.print("ERROR");

    Serial.print(" | AO: ");       Serial.print((int)asapAvg);
    Serial.print(" | Base: ");     Serial.print((int)baseline);
    Serial.print(" | DO: ");       Serial.print(statusDO == HIGH ? "HIGH" : "LOW");
    Serial.print(" | Gas: ");      Serial.print(gasTerdeteksi ? "YA (BAHAYA)" : "TIDAK (AMAN)");
    Serial.print(" | SuhuNaik: "); Serial.print(suhuNaik ? "YA (BAHAYA)" : "TIDAK");
    Serial.print(" | ALARM: ");    Serial.print(alarmAktif ? "BUNYI" : "OFF");
    if (gasTerdeteksi) { Serial.print(" | Pemicu: "); Serial.print(pemicuGas); }
    Serial.println();
  }

  // ---------- 6. WIFI & SUPABASE ----------
  cekWiFi(now);
  
  // Kirim seketika jika status berubah (AMAN <-> BAHAYA), atau berkala tiap 10 detik
  bool statusBerubah = (gasTerdeteksi != lastGasState) || (alarmAktif != lastAlarmState);
  if (statusBerubah || (now - tKirim >= INTERVAL_KIRIM)) {
    tKirim = now;
    lastGasState = gasTerdeteksi;
    lastAlarmState = alarmAktif;
    kirimDataServer();
  }

  // ---------- 7. TELEGRAM ----------
  cekTelegram(now);

  yield();
}
