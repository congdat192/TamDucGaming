# Audio Assets Download Guide

## Quick Start - Free Christmas Music & SFX

### BGM (Background Music) - Christmas Themed

**Recommended Sources:**

1. **Pixabay Music** (No attribution required)
   - https://pixabay.com/music/search/christmas/
   - Search: "christmas instrumental", "jingle bells", "santa"
   - Download as MP3, rename to:
     - `homepage.mp3` - Calm, cheerful Christmas music
     - `gameplay.mp3` - Upbeat, energetic Christmas music
     - `leaderboard.mp3` - Triumphant, celebratory Christmas music

2. **YouTube Audio Library** (Free, no attribution)
   - https://studio.youtube.com/channel/UC.../music
   - Filter: Genre > Holiday
   - Download and rename accordingly

3. **Incompetech** (Attribution required in credits)
   - https://incompetech.com/music/royalty-free/music.html
   - Search: "Christmas" or "Holiday"
   - Recommended tracks:
     - "Jingle Bells" variations
     - "Carol of the Bells"

### SFX (Sound Effects)

**Freesound.org** (Free, check individual licenses)

1. **Jump Sound** → `jump.mp3`
   - Search: "jump", "boing", "hop"
   - Example: https://freesound.org/search/?q=jump

2. **Collect Gift** → `collect-gift.mp3`
   - Search: "coin", "pickup", "collect"
   - Light, pleasant "ding" sound

3. **Collect Glasses** → `collect-glasses.mp3`
   - Search: "glass", "chime", "bell"
   - Slightly higher pitch than gift

4. **Collect Star** → `collect-star.mp3`
   - Search: "power up", "star", "achievement"
   - Magical, sparkly sound

5. **Hit Bomb** → `hit-bomb.mp3`
   - Search: "explosion", "bomb", "impact"
   - Short, punchy explosion

6. **Game Over** → `game-over.mp3`
   - Search: "game over", "fail", "lose"
   - Sad trombone or descending notes

7. **Button Click** → `button-click.mp3`
   - Search: "click", "button", "ui"
   - Short, crisp click

8. **Modal Open** → `modal-open.mp3`
   - Search: "whoosh", "open", "pop"
   - Soft whoosh or pop

9. **Achievement** → `achievement.mp3`
   - Search: "achievement", "success", "fanfare"
   - Triumphant, celebratory sound

## File Placement

After downloading, place files in:
```
public/
  audio/
    bgm/
      homepage.mp3
      gameplay.mp3
      leaderboard.mp3
    sfx/
      jump.mp3
      collect-gift.mp3
      collect-glasses.mp3
      collect-star.mp3
      hit-bomb.mp3
      game-over.mp3
      button-click.mp3
      modal-open.mp3
      achievement.mp3
```

## Audio Optimization

If files are too large, use online tools to compress:

1. **Online Audio Converter**
   - https://online-audio-converter.com/
   - Convert to MP3, 128kbps (BGM) or 96kbps (SFX)

2. **MP3 Smaller**
   - https://www.mp3smaller.com/
   - Compress without quality loss

## Temporary Workaround

If you want to test the code without audio files, the system will gracefully handle missing files (no errors, just no sound). You can add audio files later.

## License Compliance

- **Pixabay**: No attribution required
- **YouTube Audio Library**: No attribution required
- **Freesound**: Check individual sound licenses (most require attribution)
- **Incompetech**: Requires attribution: "Music by Kevin MacLeod (incompetech.com)"

Add attributions to your game credits or footer if required.
