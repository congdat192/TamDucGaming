# Claude Code Workflow

Quy trình làm việc với Claude Code để hạn chế sai sót và maintain project.

---

## 🚀 Quy Trình Cơ Bản

### 1️⃣ Trước Mỗi Task Quan Trọng

```
"Đọc file .claude/claude.md, sau đó [task của bạn]"
```

**Tại sao?**
- ✅ Claude hiểu đúng conventions
- ✅ Tránh lặp lại lỗi cũ
- ✅ Follow đúng architecture

**Ví dụ:**
```
❌ Sai: "Thêm API endpoint mới"
✅ Đúng: "Đọc .claude/claude.md, sau đó thêm API endpoint /api/rewards/claim"
```

---

### 2️⃣ Trong Khi Làm Task

**A. Tasks Phức Tạp (>3 bước):**
- Yêu cầu Claude dùng TodoWrite để plan
- Track progress từng bước
- Dễ pause/resume

**B. Claude Phải:**
- ✅ Đọc code hiện tại TRƯỚC KHI edit
- ✅ Tuân thủ conventions trong claude.md
- ✅ Hỏi lại nếu không chắc
- ✅ Mark todos completed ngay

---

### 3️⃣ Khi Phát Hiện Lỗi (QUAN TRỌNG!)

**Quy trình 4 bước:**

**Bước 1 - Document Bug:**
```
"Cập nhật Bug Prevent Log trong .claude/claude.md:
- Bug: [Mô tả cụ thể]
- Root cause: [Nguyên nhân]
- Fix: [Cách đã sửa]
- Rule: [Quy tắc để không lặp lại]"
```

**Bước 2 - Claude Update File:**
Claude sẽ thêm vào section 6 của `claude.md`:
```markdown
### Bug Prevent Log

- [2025-01-25] [BUG] Email không gửi được
  - Root cause: Resend rate limit
  - Prevention: Thêm Gmail fallback
  - Rule: Luôn có backup provider
```

**Bước 3 - Review:**
Xem lại entry vừa thêm có đủ chi tiết không

**Bước 4 - Commit:**
```bash
git add .claude/claude.md
git commit -m "docs: Add bug log for [issue]"
git push
```

---

### 4️⃣ Sau Khi Hoàn Thành Task

**A. Có pattern mới?**
```
"Cập nhật Coding Conventions trong .claude/claude.md
 với pattern: [mô tả]"
```

**B. Có forbidden pattern mới?**
```
"Thêm vào Forbidden Mistakes:
 Không [X] vì [lý do], phải dùng [Y]"
```

**C. Commit:**
```bash
git add .claude/claude.md
git commit -m "docs: Update conventions"
git push
```

---

## 📋 Workflow Checklist

### ✅ Trước Mỗi Coding Session:

```markdown
□ Đọc .claude/claude.md để refresh context
□ Review Bug Prevent Log - có lỗi nào cần nhớ?
□ Pull latest từ GitHub (có update mới không?)
```

### ✅ Trong Khi Code:

```markdown
□ Bắt đầu với "Đọc .claude/claude.md..."
□ Dùng TodoWrite cho tasks phức tạp
□ Test thoroughly trước khi commit
□ Review code theo conventions
```

### ✅ Khi Gặp Bug:

```markdown
□ Fix bug
□ Document vào Bug Prevent Log
□ Thêm rule để prevent
□ Commit both code + docs
```

### ✅ Cuối Tuần/Sprint:

```markdown
□ Review .claude/claude.md - còn accurate?
□ Có bugs mới cần add vào log?
□ Có conventions mới cần document?
□ README.md còn đúng không?
□ Team mới đã đọc docs chưa?
```

---

## 🎯 Ví Dụ Thực Tế

### Scenario: Thêm Feature "Mua Lượt Chơi"

**1. Bắt đầu:**
```
Bạn: "Đọc .claude/claude.md, sau đó thêm API
      để mua lượt chơi bằng điểm (100 điểm = 1 lượt)"
```

**2. Claude làm:**
- Đọc claude.md
- Plan với TodoWrite (5-6 tasks)
- Read relevant files
- Implement step by step
- Mark todos completed

**3. Bạn test:**
```bash
npm run dev
# Test feature...
# Phát hiện: User spam request → mua nhiều lần!
```

**4. Document bug:**
```
Bạn: "Cập nhật Bug Prevent Log:
- Bug: User spam purchase API
- Root cause: No transaction lock
- Fix: Dùng Supabase transaction
- Rule: Mọi balance change phải dùng transaction"
```

**5. Claude update `.claude/claude.md`**

**6. Commit:**
```bash
git add .
git commit -m "feat: Add purchase plays with transaction lock

- Add /api/plays/purchase endpoint
- Implement Supabase transaction
- Update bug prevention log"
git push
```

---

## 📚 File Structure

```
.claude/
├── settings.json      # Claude permissions
├── claude.md          # Rules, conventions, bug log
└── WORKFLOW.md        # This file
```

---

## ⚠️ Common Mistakes

### ❌ Không Nên:

1. **Bỏ qua claude.md:**
   ```
   ❌ "Thêm feature X"
   ✅ "Đọc .claude/claude.md, sau đó thêm feature X"
   ```

2. **Không document bugs:**
   - Fix bug xong → Không ghi lại
   - Lần sau lặp lại lỗi tương tự

3. **Để claude.md lỗi thời:**
   - Conventions thay đổi → Không update
   - Claude sẽ follow conventions cũ

4. **Tin 100% AI review:**
   - ChatGPT/Claude review → Không verify code
   - Luôn verify bằng code thực tế

5. **Skip TodoWrite cho tasks lớn:**
   - Task phức tạp → Không plan
   - Dễ bỏ sót bước

### ✅ Nên Làm:

1. **Luôn đọc claude.md trước**
2. **Document MỌI bug ngay khi phát hiện**
3. **Commit docs cùng code**
4. **Review và update conventions định kỳ**
5. **Share workflow với team mới**

---

## 💡 Pro Tips

### 1. Quick Commands

Tạo alias trong shell:
```bash
# ~/.bashrc hoặc ~/.zshrc
alias claude-start="echo '📖 Nhớ: Đọc .claude/claude.md trước khi bắt đầu!'"
alias claude-bug="git add .claude/claude.md && git commit -m 'docs: Update bug log'"
```

### 2. Git Hooks

Pre-commit reminder (`.git/hooks/pre-commit`):
```bash
#!/bin/bash
if git diff --cached --name-only | grep -qE "bug|fix"; then
  echo "⚠️  Bug fix detected. Updated .claude/claude.md?"
  read -p "Press enter to continue..."
fi
```

### 3. Team Sync

**Daily standup:**
- Ai gặp bug mới? → Document ngay

**Sprint review:**
- Review Bug Prevent Log together
- Update conventions nếu cần
- Share learnings

### 4. New Team Members

**Onboarding checklist:**
```markdown
□ Đọc README.md
□ Đọc .claude/claude.md (toàn bộ!)
□ Đọc .claude/WORKFLOW.md (file này)
□ Review Bug Prevent Log
□ Setup Claude Code extension
□ Test workflow với 1 small task
```

---

## 🔗 Related Files

- **[claude.md](claude.md)** - Rules, conventions, architecture
- **[../README.md](../README.md)** - Project overview
- **[settings.json](settings.json)** - Claude permissions

---

## 📞 Getting Help

**Khi gặp vấn đề:**

1. **Check claude.md first** - Có rule về vấn đề này không?
2. **Search Bug Prevent Log** - Đã gặp lỗi tương tự chưa?
3. **Ask Claude:**
   ```
   "Theo .claude/claude.md, tôi nên làm thế nào để [task]?"
   ```
4. **Verify với code** - Đọc code thực tế để confirm
5. **Update docs** - Thêm solution vào claude.md

---

**Last Updated:** 2025-01-25
**Next Review:** 2025-02-01 (hoặc khi có changes lớn)

---

💡 **Remember:** Good documentation = Fewer bugs = Faster development
