# Watch Party - Backend Server 🎥

Bu proje, Watch Party uygulamasının backend sunucu kısmıdır. Socket.IO kullanarak gerçek zamanlı video senkronizasyonu ve sohbet özelliklerini sağlar.

## 🚀 Özellikler

- ✨ Gerçek zamanlı oda yönetimi
- 🎮 Video senkronizasyonu
- 💬 Anlık mesajlaşma
- 👥 Kullanıcı yönetimi
- 🔒 Host sistemi

## 🛠️ Teknolojiler

- Node.js
- Express.js
- Socket.IO
- TypeScript
- UUID

## 📦 Gereksinimler

- Node.js (v14 veya üzeri)
- npm veya yarn

## 🚦 Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Geliştirme modunda çalıştırın:
```bash
npm run dev
```

3. Prodüksiyon için derleyin:
```bash
npm run build
```

4. Prodüksiyon modunda çalıştırın:
```bash
npm start
```

## 🔌 Socket.IO Olayları

### Oda İşlemleri

#### `create_room`
- **Gönderilen:** `{ username: string }`
- **Yanıt:** `Room` objesi
- **Açıklama:** Yeni bir izleme odası oluşturur

#### `join_room`
- **Gönderilen:** `{ roomId: string, username: string }`
- **Yanıt:** `Room` objesi veya `null`
- **Açıklama:** Mevcut bir odaya katılım sağlar

#### `leave_room`
- **Gönderilen:** `{ roomId: string, userId: string }`
- **Açıklama:** Odadan ayrılma işlemi gerçekleştirir

### Video İşlemleri

#### `video_state_change`
- **Gönderilen:** `{ roomId: string, videoState: VideoState }`
- **Açıklama:** Video durumunu günceller (oynatma, duraklatma, ilerleme)

#### `video_url_change`
- **Gönderilen:** `{ roomId: string, url: string }`
- **Açıklama:** Odadaki video URL'sini günceller

### Mesajlaşma

#### `send_message`
- **Gönderilen:** `{ roomId: string, message: Message }`
- **Açıklama:** Odaya mesaj gönderir

## 📝 Tip Tanımlamaları

### User
```typescript
{
    id: string;
    username: string;
    isHost: boolean;
}
```

### Room
```typescript
{
    id: string;
    hostId: string;
    users: User[];
    videoUrl: string;
    isPlaying: boolean;
    currentTime: number;
}
```

### VideoState
```typescript
{
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    buffered: number;
}
```

### Message
```typescript
{
    id: string;
    userId: string;
    username: string;
    content: string;
    timestamp: number;
}
```

## 🔧 Ortam Değişkenleri

- `PORT`: Sunucu portu (varsayılan: 3001)

## 📜 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. 