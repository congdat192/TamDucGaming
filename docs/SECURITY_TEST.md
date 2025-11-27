# Hướng dẫn Test Bảo mật Anti-Cheat

## Tổng quan hệ thống bảo mật mới

### Flow mới:
1. **Game Start**: Server tạo `game_session` với `game_token` unique
2. **Trong game**: Client chỉ giữ `gameToken`
3. **Game End**: Client gửi `{ gameToken, score }`
4. **Server validate**:
   - Kiểm tra session tồn tại và chưa finish
   - Tính `duration` từ server time (không tin client)
   - Tính `maxAllowed` dựa trên config + duration
   - Validate score, apply daily cap
   - Lưu cả `client_score` và `validated_score`
5. **Leaderboard/Voucher**: Chỉ dùng `validated_score`

---

## Test Cases

### Test 1: Chơi bình thường
```javascript
// Chơi game bình thường, kiểm tra:
// - validated_score === client_score
// - suspicion_reason === null
```

### Test 2: Fake score cao
Mở F12 Console sau khi game kết thúc:
```javascript
// Copy gameToken từ network tab khi start game
const gameToken = "copy-token-từ-network"

fetch("/api/game/end", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    gameToken: gameToken,
    score: 9999
  })
}).then(r => r.json()).then(console.log)
```

**Kết quả mong đợi:**
- `validated_score` < 9999 (bị cắt xuống `maxAllowed`)
- `suspicion_reason` có ghi lý do
- Response trả về `score` = validated_score

### Test 3: Reuse token
```javascript
// Chơi xong 1 game, copy gameToken
// Submit lại lần 2 với token cũ

fetch("/api/game/end", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    gameToken: "token-đã-dùng",
    score: 50
  })
}).then(r => r.json()).then(console.log)
```

**Kết quả mong đợi:**
- Error: "Phiên chơi đã kết thúc hoặc không hợp lệ"

### Test 4: Fake token
```javascript
fetch("/api/game/end", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    gameToken: "fake-token-12345",
    score: 100
  })
}).then(r => r.json()).then(console.log)
```

**Kết quả mong đợi:**
- Error: "Không tìm thấy phiên chơi"

### Test 5: Token của user khác
```javascript
// Login user A, start game, copy token
// Login user B, try submit với token của A

fetch("/api/game/end", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    gameToken: "token-của-user-khác",
    score: 50
  })
}).then(r => r.json()).then(console.log)
```

**Kết quả mong đợi:**
- Error: "Phiên chơi không thuộc về bạn"

### Test 6: Daily cap (500 điểm/ngày)
```javascript
// Chơi nhiều game liên tục
// Sau khi vượt 500 điểm, các game tiếp theo:
// - validated_score sẽ = remaining_cap
// - suspicion_reason ghi "Daily cap exceeded"
```

### Test 7: Game quá nhanh
```javascript
// Start game
// Submit ngay lập tức (< 3 giây)
```

**Kết quả mong đợi:**
- `validated_score` = 0
- `suspicion_reason` ghi "Duration too short"

---

## Kiểm tra Database

### Query suspicious sessions:
```sql
SELECT
  gs.id,
  u.email,
  u.phone,
  gs.client_score,
  gs.validated_score,
  gs.client_duration_seconds,
  gs.suspicion_reason,
  gs.start_time
FROM game_sessions gs
JOIN users u ON gs.user_id = u.id
WHERE gs.suspicion_reason IS NOT NULL
ORDER BY gs.start_time DESC
LIMIT 50;
```

### So sánh client vs validated score:
```sql
SELECT
  client_score,
  validated_score,
  client_score - validated_score as score_diff,
  suspicion_reason
FROM game_sessions
WHERE client_score != validated_score
ORDER BY (client_score - validated_score) DESC;
```

---

## Admin Panel

Truy cập: `/admin/suspicious`

Chức năng:
- Xem tất cả phiên chơi nghi vấn
- Filter theo status: suspicious / invalid / all
- Thống kê: tổng nghi vấn, điểm bị giảm, phiên vô hiệu
- Vô hiệu hóa session (trừ điểm khỏi user)

---

## Validation Logic

### computeMaxScoreAllowed(duration, config)
```
1. safeDuration = min(duration, 300s) // max 5 phút
2. avgSpawnInterval = (initialSpawn + minSpawn) / 2
3. estimatedObstacles = duration * 1000 / avgSpawnInterval
4. theoreticalMax = estimatedObstacles
5. withBuffer = theoreticalMax * 1.2 // +20% buffer
6. return min(withBuffer, 200) // hard cap 200 điểm/lượt
```

### Daily cap
- Mỗi user tối đa 500 điểm/ngày
- Phần vượt quá sẽ bị cắt

---

## Constants
```typescript
MAX_GAME_DURATION = 300    // 5 phút
MIN_GAME_DURATION = 3      // 3 giây
BUFFER_MULTIPLIER = 1.2    // +20% buffer
HARD_CAP_PER_GAME = 200    // max/lượt
DAILY_SCORE_CAP = 500      // max/ngày
```
