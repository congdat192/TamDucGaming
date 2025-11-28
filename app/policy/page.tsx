'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Snowflakes from '@/components/Snowflakes'
import BottomNavigation from '@/components/BottomNavigation'
import FloatingAudioToggle from '@/components/FloatingAudioToggle'

export default function PolicyPage() {
    const router = useRouter()

    return (
        <main className="min-h-screen relative overflow-hidden pb-20">
            <Snowflakes />

            {/* Header */}
            <header className="relative z-10 py-4 px-4 border-b border-white/10">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => router.push('/')}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 backdrop-blur-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold text-white">Điều kiện & Điều khoản</h1>
                    <div className="w-10"></div>
                </div>
            </header>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center px-4 py-4">
                <div className="glass rounded-3xl p-6 max-w-md w-full space-y-6">
                    {/* Introduction */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <span>📋</span>
                            <span>Giới thiệu</span>
                        </h2>
                        <p className="text-white/80 leading-relaxed">
                            Chào mừng bạn đến với <strong className="text-yellow-400">Santa Jump</strong> - trò chơi Giáng sinh do <strong>Mắt Kính Tâm Đức</strong> phát triển. Bằng việc tham gia trò chơi này, bạn đồng ý tuân thủ các điều khoản và điều kiện dưới đây. Vui lòng đọc kỹ trước khi tham gia.
                        </p>
                    </section>

                    {/* Participation */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <span>🎮</span>
                            <span>Điều kiện tham gia</span>
                        </h2>
                        <ul className="space-y-3 text-white/80">
                            <li className="flex gap-3">
                                <span className="text-yellow-400 flex-shrink-0">•</span>
                                <span>Người chơi phải có địa chỉ email hợp lệ để đăng ký tài khoản</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-yellow-400 flex-shrink-0">•</span>
                                <span>Mỗi người chơi chỉ được sử dụng <strong>một (1) tài khoản duy nhất</strong></span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-yellow-400 flex-shrink-0">•</span>
                                <span>Người chơi phải từ 13 tuổi trở lên hoặc có sự giám sát của phụ huynh</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-yellow-400 flex-shrink-0">•</span>
                                <span>Không sử dụng bot, cheat, hack hoặc bất kỳ phần mềm gian lận nào</span>
                            </li>
                        </ul>
                    </section>

                    {/* Game Rules */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <span>🎯</span>
                            <span>Quy định chơi game</span>
                        </h2>
                        <ul className="space-y-3 text-white/80">
                            <li className="flex gap-3">
                                <span className="text-yellow-400 flex-shrink-0">•</span>
                                <span>Mỗi người chơi có <strong>3 lượt chơi miễn phí mỗi ngày</strong></span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-yellow-400 flex-shrink-0">•</span>
                                <span>Nhận thêm <strong>+4 lượt</strong> khi cập nhật số điện thoại (chỉ áp dụng 1 lần)</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-yellow-400 flex-shrink-0">•</span>
                                <span>Nhận thêm <strong>+5 lượt</strong> khi giới thiệu bạn bè tham gia (mỗi người bạn)</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-yellow-400 flex-shrink-0">•</span>
                                <span>Điểm số được tính dựa trên số ống khói mà Santa vượt qua thành công</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-yellow-400 flex-shrink-0">•</span>
                                <span>Hệ thống sẽ xác thực điểm số tự động để đảm bảo công bằng</span>
                            </li>
                        </ul>
                    </section>

                    {/* Prizes */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <span>🎁</span>
                            <span>Giải thưởng & Quy đổi</span>
                        </h2>
                        <div className="space-y-4">
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <h3 className="text-yellow-400 font-bold mb-2">Voucher theo điểm:</h3>
                                <ul className="space-y-2 text-white/80 text-sm">
                                    <li>• Đạt <strong>≥10 điểm</strong>: Voucher <strong className="text-green-400">50,000 VNĐ</strong></li>
                                    <li>• Đạt <strong>≥20 điểm</strong>: Voucher <strong className="text-yellow-400">100,000 VNĐ</strong></li>
                                    <li>• Đạt <strong>≥30 điểm</strong>: Voucher <strong className="text-red-400">150,000 VNĐ</strong></li>
                                </ul>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <h3 className="text-yellow-400 font-bold mb-2">Giải thưởng lớn:</h3>
                                <ul className="space-y-2 text-white/80 text-sm">
                                    <li>• <strong className="text-yellow-300">TOP 1 Tuần</strong>: Tiền mặt 5,000,000 VNĐ</li>
                                    <li>• <strong className="text-orange-300">TOP 1 Tháng</strong>: iPhone 17 Pro Max</li>
                                </ul>
                            </div>
                            <p className="text-white/70 text-sm italic">
                                * Voucher có thể sử dụng mua sắm tại cửa hàng Mắt Kính Tâm Đức
                            </p>
                        </div>
                    </section>

                    {/* Data Privacy */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <span>🔒</span>
                            <span>Bảo mật thông tin</span>
                        </h2>
                        <ul className="space-y-3 text-white/80">
                            <li className="flex gap-3">
                                <span className="text-yellow-400 flex-shrink-0">•</span>
                                <span>Chúng tôi cam kết bảo mật thông tin cá nhân của người chơi (email, số điện thoại)</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-yellow-400 flex-shrink-0">•</span>
                                <span>Thông tin chỉ được sử dụng cho mục đích xác thực tài khoản và trao giải</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-yellow-400 flex-shrink-0">•</span>
                                <span>Không chia sẻ thông tin với bên thứ ba khi chưa có sự đồng ý</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-yellow-400 flex-shrink-0">•</span>
                                <span>Người chơi có quyền yêu cầu xóa dữ liệu cá nhân bất kỳ lúc nào</span>
                            </li>
                        </ul>
                    </section>

                    {/* Prohibited Actions */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <span>⛔</span>
                            <span>Hành vi bị cấm</span>
                        </h2>
                        <ul className="space-y-3 text-white/80">
                            <li className="flex gap-3">
                                <span className="text-red-400 flex-shrink-0">✖</span>
                                <span>Sử dụng nhiều tài khoản để tăng lượt chơi hoặc gian lận điểm số</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-red-400 flex-shrink-0">✖</span>
                                <span>Sử dụng bot, phần mềm hack, cheat để can thiệp vào game</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-red-400 flex-shrink-0">✖</span>
                                <span>Tấn công, spam hoặc làm quá tải hệ thống</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-red-400 flex-shrink-0">✖</span>
                                <span>Mua bán, trao đổi tài khoản hoặc voucher dưới mọi hình thức</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-red-400 flex-shrink-0">✖</span>
                                <span>Giả mạo danh tính, thông tin cá nhân để nhận giải</span>
                            </li>
                        </ul>
                        <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                            <p className="text-red-300 text-sm font-semibold">
                                ⚠️ Vi phạm các quy định trên sẽ dẫn đến việc tài khoản bị <strong>khóa vĩnh viễn</strong> và mất toàn bộ điểm số, voucher.
                            </p>
                        </div>
                    </section>

                    {/* Prize Claim */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <span>🎫</span>
                            <span>Nhận giải thưởng</span>
                        </h2>
                        <ul className="space-y-3 text-white/80">
                            <li className="flex gap-3">
                                <span className="text-yellow-400 flex-shrink-0">•</span>
                                <span>Voucher được gửi qua email sau khi đạt đủ điểm số yêu cầu</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-yellow-400 flex-shrink-0">•</span>
                                <span>Voucher có thời hạn sử dụng, vui lòng kiểm tra email thường xuyên</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-yellow-400 flex-shrink-0">•</span>
                                <span>Giải thưởng TOP (tiền mặt, iPhone) sẽ được trao trực tiếp tại cửa hàng</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-yellow-400 flex-shrink-0">•</span>
                                <span>Người thắng giải phải xuất trình CMND/CCCD và email đăng ký để nhận giải</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-yellow-400 flex-shrink-0">•</span>
                                <span>Ban tổ chức có quyền xác minh danh tính trước khi trao giải</span>
                            </li>
                        </ul>
                    </section>

                    {/* Liability */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <span>⚖️</span>
                            <span>Trách nhiệm & Quyền hạn</span>
                        </h2>
                        <ul className="space-y-3 text-white/80">
                            <li className="flex gap-3">
                                <span className="text-yellow-400 flex-shrink-0">•</span>
                                <span>Mắt Kính Tâm Đức có quyền thay đổi thể lệ, giải thưởng mà không cần báo trước</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-yellow-400 flex-shrink-0">•</span>
                                <span>Quyết định của ban tổ chức về kết quả chơi game là quyết định cuối cùng</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-yellow-400 flex-shrink-0">•</span>
                                <span>Chúng tôi không chịu trách nhiệm về mất mát dữ liệu do lỗi thiết bị của người chơi</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-yellow-400 flex-shrink-0">•</span>
                                <span>Có quyền tạm ngưng hoặc kết thúc chương trình vì lý do bất khả kháng</span>
                            </li>
                        </ul>
                    </section>

                    {/* Contact */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <span>📞</span>
                            <span>Liên hệ hỗ trợ</span>
                        </h2>
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <p className="text-white/80 mb-3">
                                Nếu bạn có thắc mắc hoặc cần hỗ trợ, vui lòng liên hệ:
                            </p>
                            <ul className="space-y-2 text-white/80">
                                <li className="flex items-center gap-2">
                                    <span className="text-yellow-400">🏢</span>
                                    <span><strong>Mắt Kính Tâm Đức</strong></span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-yellow-400">🌐</span>
                                    <Link href="/" className="text-blue-300 hover:text-blue-200 underline">
                                        matkinhtamduc.com
                                    </Link>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-yellow-400">📧</span>
                                    <a href="mailto:support@matkinhtamduc.com" className="text-blue-300 hover:text-blue-200 underline">
                                        support@matkinhtamduc.com
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Footer */}
                    <section className="pt-6 border-t border-white/10">
                        <p className="text-white/60 text-sm text-center">
                            Bằng việc tham gia trò chơi, bạn xác nhận đã đọc, hiểu và đồng ý với tất cả các điều khoản trên.
                        </p>
                        <p className="text-white/40 text-xs text-center mt-2">
                            Cập nhật lần cuối: Tháng 11/2024
                        </p>
                    </section>
                </div>
            </div>

            {/* Bottom Navigation */}
            <FloatingAudioToggle />
            <BottomNavigation
                onProfileClick={() => { }}
                showProfile={false}
            />
        </main>
    )
}
