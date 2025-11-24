import { supabaseAdmin } from './supabase-admin'

export interface ModalContent {
  addPhoneModal: {
    title: string
    subtitle: string
    buttonText: string
    icon: string
    badge: string
  }
  outOfPlaysModal: {
    title: string
    subtitle: string
    buttonText: string
    icon: string
  }
  gameOverModal: {
    title: string
    playAgainButton: string
    shareButton: string
    homeButton: string
    inviteButton: string
    voucherSectionTitle: string
    progressLabels: {
      label50k: string
      label100k: string
      label150k: string
    }
  }
}

// Default modal content
const DEFAULT_CONTENT: ModalContent = {
  addPhoneModal: {
    title: 'Nhận thêm 3 lượt chơi',
    subtitle: 'Cập nhật số điện thoại của bạn để nhận thêm lượt chơi',
    buttonText: '🎁 CẬP NHẬT SỐ ĐIỆN THOẠI',
    icon: '🎮',
    badge: '+ 3 lượt chơi',
  },
  outOfPlaysModal: {
    title: 'Hết lượt chơi rồi!',
    subtitle: 'Đừng buồn, mời bạn bè chơi cùng để nhận ngay +5 lượt chơi miễn phí nhé!',
    buttonText: 'Mời bạn bè (+5 lượt)',
    icon: '😢',
  },
  gameOverModal: {
    title: 'GAME OVER',
    playAgainButton: 'CHƠI LẠI',
    shareButton: 'CHIA SẺ NHẬN +5 LƯỢT',
    homeButton: 'Về trang chủ',
    inviteButton: 'Mời bạn bè (+5 lượt)',
    voucherSectionTitle: 'Chúc mừng! Bạn đã nhận được voucher',
    progressLabels: {
      label50k: '50K',
      label100k: '100K',
      label150k: '150K',
    },
  },
}

// Cache for modal content
let cachedContent: ModalContent | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 60000 // 1 minute cache

export async function getModalContent(): Promise<ModalContent> {
  const now = Date.now()

  // Return cached content if still valid
  if (cachedContent && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedContent
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('modal_content')
      .select('content')
      .eq('id', 'main')
      .single()

    if (error || !data) {
      console.log('Using default modal content (DB error or not found)')
      return DEFAULT_CONTENT
    }

    // Merge with defaults to ensure all fields exist
    const content: ModalContent = { ...DEFAULT_CONTENT, ...data.content }
    cachedContent = content
    cacheTimestamp = now

    return content
  } catch (error) {
    console.error('Error fetching modal content:', error)
    return DEFAULT_CONTENT
  }
}

// Clear cache (call after content update)
export function clearModalContentCache(): void {
  cachedContent = null
  cacheTimestamp = 0
}
