# Flutter WebSocket Integration Guide

## การเชื่อมต่อ WebSocket สำหรับ Real-time Notifications

### 1. ติดตั้ง Dependencies

```yaml
dependencies:
  socket_io_client: ^2.0.0
  jwt_decoder: ^2.0.1
```

### 2. WebSocket Service Class

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class NotificationWebSocketService {
  static final NotificationWebSocketService _instance = NotificationWebSocketService._internal();
  factory NotificationWebSocketService() => _instance;
  NotificationWebSocketService._internal();

  IO.Socket? _socket;
  Function(Map<String, dynamic>)? onNewNotification;
  Function(Map<String, dynamic>)? onNotificationRead;
  Function()? onConnected;
  Function(String)? onError;

  void connect(String token) {
    _socket = IO.io(
      'http://your-backend-url:3000/notifications',
      IO.OptionBuilder()
        .setTransports(['websocket'])
        .setAuth({'token': token})
        .setReconnectionAttempts(5)
        .setReconnectionDelay(1000)
        .build(),
    );

    _socket!.onConnect((_) {
      print('Connected to notification server');
      onConnected?.call();
    });

    _socket!.on('connected', (data) {
      print('Server confirmed: ${data['message']}');
    });

    _socket!.on('new_notification', (data) {
      print('New notification: $data');
      onNewNotification?.call(data);
    });

    _socket!.on('notification_read', (data) {
      print('Notification marked as read: $data');
      onNotificationRead?.call(data);
    });

    _socket!.onError((error) {
      print('WebSocket error: $error');
      onError?.call(error.toString());
    });

    _socket!.onDisconnect((_) {
      print('Disconnected from notification server');
    });
  }

  void markAsRead(String notificationId) {
    _socket?.emit('mark_as_read', {'notificationId': notificationId});
  }

  void ping() {
    _socket?.emit('ping');
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }

  bool get isConnected => _socket?.connected ?? false;
}
```

### 3. ใช้งานใน Flutter App

```dart
class _HomePageState extends State<HomePage> {
  final NotificationWebSocketService _webSocketService = NotificationWebSocketService();
  List<Map<String, dynamic>> _notifications = [];

  @override
  void initState() {
    super.initState();
    _connectWebSocket();
  }

  void _connectWebSocket() {
    // ดึง token จากที่เก็บ (SharedPreferences, secure storage, etc.)
    final token = 'your-jwt-token-here';
    
    _webSocketService.onConnected = () {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('เชื่อมต่อ notification server สำเร็จ')),
      );
    };

    _webSocketService.onNewNotification = (data) {
      // แสดง notification แบบ real-time
      final message = data['data']['message'];
      final meetingDate = data['data']['meetingDate'];
      
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: Text('แจ้งเตือนใหม่'),
          content: Text('$message\nวันที่: $meetingDate'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('ตกลง'),
            ),
          ],
        ),
      );

      setState(() {
        _notifications.add(data['data']);
      });
    };

    _webSocketService.onError = (error) {
      print('WebSocket error: $error');
    };

    _webSocketService.connect(token);
  }

  @override
  void dispose() {
    _webSocketService.disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Notifications')),
      body: ListView.builder(
        itemCount: _notifications.length,
        itemBuilder: (context, index) {
          final notification = _notifications[index];
          return ListTile(
            title: Text(notification['message'] ?? ''),
            subtitle: Text(notification['meetingDate'] ?? ''),
            trailing: IconButton(
              icon: Icon(Icons.check),
              onPressed: () {
                _webSocketService.markAsRead(notification['id']);
              },
            ),
          );
        },
      ),
    );
  }
}
```

### 4. Events ที่รองรับ

| Event | Direction | Description |
|-------|-----------|-------------|
| `connect` | Client → Server | เชื่อมต่อ WebSocket |
| `connected` | Server → Client | ยืนยันการเชื่อมต่อ |
| `new_notification` | Server → Client | ได้รับ notification ใหม่ |
| `notification_read` | Server → Client | Notification ถูก mark ว่าอ่านแล้ว |
| `mark_as_read` | Client → Server | บอก server ว่าอ่านแล้ว |
| `ping` | Client → Server | ตรวจสอบการเชื่อมต่อ |
| `pong` | Server → Client | ตอบกลับ ping |

### 5. ข้อมูลที่ส่งมา (new_notification)

```json
{
  "type": "meeting_reminder",
  "data": {
    "id": "uuid",
    "notificationId": "uuid",
    "message": "ມື້ອື່ນມີການປະຊຸມທະນາຄານບ້ານ",
    "meetingDate": "2026-05-16",
    "vbCode": "0101001",
    "createdAt": "2026-05-15T18:00:00.000Z"
  },
  "timestamp": "2026-05-15T18:00:00.000Z"
}
```

### 6. Connection URL

```
ws://your-backend-url:3000/notifications

ตัวอย่าง:
ws://localhost:3000/notifications
ws://10.0.2.2:3000/notifications (Android emulator)
ws://192.168.1.100:3000/notifications (Local network)
```

### 7. Authentication

ส่ง JWT token ใน `auth` header:

```dart
IO.OptionBuilder()
  .setAuth({'token': 'your-jwt-token-here'})
  .build()
```

Token ต้องมี `username` ใน payload

### 8. Error Handling

```dart
_webSocketService.onError = (error) {
  // ถ้าเกิด error ให้ fallback ไปใช้ HTTP polling
  _startHttpPolling();
};

void _startHttpPolling() {
  // เรียก API ทุก 30 วินาที
  Timer.periodic(Duration(seconds: 30), (timer) async {
    final response = await http.get(
      Uri.parse('http://your-backend/notifications/unread?username=testuser'),
    );
    // อัพเดท UI
  });
}
```

## Backend API Endpoints (HTTP Fallback)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/notifications?username=xxx` | GET | ดึง notification ทั้งหมด |
| `/notifications/unread?username=xxx` | GET | ดึงเฉพาะที่ยังไม่ได้อ่าน |
| `/notifications/:id/read` | POST | Mark as read |
