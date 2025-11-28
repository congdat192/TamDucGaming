import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.info('=== SEND_OTP_PHONE FUNCTION STARTED ===');

// VIHAT API Configuration - hardcoded for security (no env exposure)
const VIHAT_CONFIG = {
  API_KEY: "B70DE56E1A997DF6BB197CEEC85B7A",
  SECRET_KEY: "FCD201C2BEE44E7FB641261801AB94",
  BRANDNAME: "MKTAMDUC",
  ZNS_TEMPLATE_ID: "478665",
  OAID: "939629380721919913",
  API_URL: "https://rest.esms.vn/MainService.svc/json/MultiChannelMessage/"
};

// Rate limits configuration
const RATE_LIMITS = {
  DELAY_BETWEEN_MS: 60000,      // 60s between same phone requests
  MAX_PER_PHONE_HOUR: 5,        // 5 OTP/phone/hour
  MAX_PER_IP_HOUR: 20,          // 20 OTP/IP/hour
  MAX_DAILY_COST_VND: 200000,   // Max 200,000 VND/day
  HOUR_IN_MS: 3600000,
  SMS_COST: 500                 // VND per SMS
};

// Helper: Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper: Validate Vietnamese phone number
function isValidVietnamesePhone(phone: string): boolean {
  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');
  // Vietnamese phone: starts with 0 or +84/84, followed by 9 digits
  const regex = /^(0|\+?84)(3[2-9]|5[2689]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/;
  return regex.test(cleaned);
}

// Helper: Format phone for VIHAT (84xxxxxxxxx format)
function formatPhoneForVihat(phone: string): string {
  let cleaned = phone.replace(/[\s-]/g, '');
  if (cleaned.startsWith('+84')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('0')) {
    cleaned = '84' + cleaned.substring(1);
  }
  return cleaned;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// MAIN HANDLER
Deno.serve(async (req) => {
  console.log('\n========== NEW REQUEST TO send_otp_phone ==========');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ========== STEP 1: GET PHONE ==========
    console.log('\n📱 STEP 1: Get Phone');
    const { phone } = await req.json();

    if (!phone) {
      console.error('❌ Phone missing');
      return new Response(JSON.stringify({
        success: false,
        error: 'Vui lòng nhập số điện thoại'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate Vietnamese phone format
    if (!isValidVietnamesePhone(phone)) {
      console.error('❌ Invalid Vietnamese phone format');
      return new Response(JSON.stringify({
        success: false,
        error: 'Số điện thoại không đúng định dạng Việt Nam'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Phone received: ${phone}`);
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';

    // ========== STEP 2: CONNECT DB ==========
    console.log('\n🔌 STEP 2: Connect Database');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - RATE_LIMITS.HOUR_IN_MS).toISOString();

    // ========== STEP 3: RATE LIMITING ==========
    console.log('\n🛡️ STEP 3: Rate Limiting Checks');

    // 3.1 Check delay between requests for same phone
    console.log('   Checking delay between requests...');
    const { data: lastOTP } = await supabase
      .from('otp_login_vihat')
      .select('created_at')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastOTP) {
      const lastRequestTime = new Date(lastOTP.created_at).getTime();
      const timeSinceLastOTP = now.getTime() - lastRequestTime;
      if (timeSinceLastOTP < RATE_LIMITS.DELAY_BETWEEN_MS) {
        const waitTime = Math.ceil((RATE_LIMITS.DELAY_BETWEEN_MS - timeSinceLastOTP) / 1000);
        console.log(`   ❌ Too fast: Wait ${waitTime} seconds`);
        return new Response(JSON.stringify({
          success: false,
          error: `Vui lòng đợi ${waitTime} giây trước khi gửi lại`
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 3.2 Check max OTP per phone per hour
    console.log('   Checking phone rate limit...');
    const { count: phoneCount } = await supabase
      .from('otp_login_vihat')
      .select('*', { count: 'exact', head: true })
      .eq('phone', phone)
      .gte('created_at', oneHourAgo);

    if (phoneCount && phoneCount >= RATE_LIMITS.MAX_PER_PHONE_HOUR) {
      console.log(`   ❌ Phone limit exceeded: ${phoneCount}/${RATE_LIMITS.MAX_PER_PHONE_HOUR} per hour`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Số điện thoại đã vượt giới hạn 5 lần/giờ. Vui lòng thử lại sau.'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3.3 Check IP rate limit
    console.log('   Checking IP rate limit...');
    const { count: ipCount } = await supabase
      .from('otp_login_vihat')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', clientIP)
      .gte('created_at', oneHourAgo);

    if (ipCount && ipCount >= RATE_LIMITS.MAX_PER_IP_HOUR) {
      console.log(`   ❌ IP limit exceeded: ${ipCount}/${RATE_LIMITS.MAX_PER_IP_HOUR} per hour`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 1 giờ.'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3.4 Check daily cost limit
    console.log('   Checking daily cost limit...');
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);

    const { data: todayOTPs } = await supabase
      .from('otp_login_vihat')
      .select('cost')
      .gte('created_at', todayStart.toISOString());

    const totalCostToday = todayOTPs?.reduce((sum, record) => {
      return sum + parseFloat(String(record.cost) || '0');
    }, 0) || 0;

    if (totalCostToday >= RATE_LIMITS.MAX_DAILY_COST_VND) {
      console.log(`   ❌ Daily cost limit exceeded: ${totalCostToday} VND`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Hệ thống đang quá tải. Vui lòng thử lại sau.'
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ All rate limits passed');

    // ========== STEP 4: GENERATE OTP ==========
    console.log('\n🎲 STEP 4: Generate OTP');
    const otpCode = generateOTP();
    const minute = 5;
    const expiresAt = new Date(now.getTime() + minute * 60 * 1000);
    console.log(`Generated OTP: ${otpCode}`);
    console.log(`Expires in: ${minute} minutes`);

    // ========== STEP 5: INSERT TO DATABASE ==========
    console.log('\n💾 STEP 5: Insert to otp_login_vihat table');

    const { data: otpRecord, error: insertError } = await supabase
      .from('otp_login_vihat')
      .insert({
        phone: phone,
        otp_code: otpCode,
        minute: minute,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        verified: false,
        attempts: 0,
        ip_address: clientIP,
        cost: RATE_LIMITS.SMS_COST,
        campaign_id: 'Game MKTD Phone Bonus',
        brandname: VIHAT_CONFIG.BRANDNAME,
        channel_sent: 'pending'
      })
      .select()
      .single();

    if (insertError || !otpRecord) {
      console.error('❌ Insert failed:', insertError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Không thể gửi OTP. Vui lòng thử lại.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Insert success with ID:', otpRecord.id);

    // ========== STEP 6: CALL VIHAT API ==========
    console.log('\n📞 STEP 6: Call VIHAT API');

    const formattedPhone = formatPhoneForVihat(phone);
    const smsContent = `MKTAMDUC - Ma xac thuc cua ban la ${otpCode}. Tuyet doi KHONG chia se ma xac thuc cho bat ky ai duoi bat ky hinh thuc nao. Ma xac thuc co hieu luc trong ${minute} phut.`;

    const vihatPayload = {
      ApiKey: VIHAT_CONFIG.API_KEY,
      SecretKey: VIHAT_CONFIG.SECRET_KEY,
      Phone: formattedPhone,
      Channels: ["zalo", "sms"],
      Data: [
        {
          TempID: VIHAT_CONFIG.ZNS_TEMPLATE_ID,
          Params: [otpCode, minute.toString()],
          OAID: VIHAT_CONFIG.OAID,
          campaignid: "Game MKTD Phone Bonus",
          CallbackUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/vihat-otp-webhook`,
          RequestId: otpRecord.id,
          Sandbox: "0",
          SendingMode: "1"
        },
        {
          Content: smsContent,
          IsUnicode: "0",
          SmsType: "2",
          Brandname: VIHAT_CONFIG.BRANDNAME,
          CallbackUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/vihat-otp-webhook`,
          RequestId: otpRecord.id,
          Sandbox: "0"
        }
      ]
    };

    console.log('📤 Sending to VIHAT...');
    console.log(`   Phone: ${formattedPhone}`);
    console.log(`   OTP: ${otpCode}`);

    try {
      const vihatResponse = await fetch(VIHAT_CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vihatPayload)
      });

      const vihatResult = await vihatResponse.json();
      console.log('📥 VIHAT Response:', vihatResult);

      if (vihatResult.CodeResult === "100") {
        console.log('✅ VIHAT accepted request');
        await supabase
          .from('otp_login_vihat')
          .update({
            channel_sent: 'pending',
            sms_request_id: vihatResult.SMSID || null,
            zns_request_id: vihatResult.SMSID || null,
            api_response: vihatResult,
            notes: `MultiChannel accepted - SMSID: ${vihatResult.SMSID || 'N/A'}`
          })
          .eq('id', otpRecord.id);
      } else {
        console.error('❌ VIHAT error:', vihatResult.ErrorMessage || `Code: ${vihatResult.CodeResult}`);
        await supabase
          .from('otp_login_vihat')
          .update({
            channel_sent: 'failed',
            api_response: vihatResult,
            notes: `VIHAT error: ${vihatResult.ErrorMessage || vihatResult.CodeResult}`
          })
          .eq('id', otpRecord.id);

        return new Response(JSON.stringify({
          success: false,
          error: 'Không thể gửi OTP. Vui lòng thử lại sau.'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

    } catch (vihatError) {
      console.error('❌ Failed to call VIHAT:', vihatError);
      await supabase
        .from('otp_login_vihat')
        .update({
          channel_sent: 'failed',
          notes: `API call failed: ${vihatError.message}`
        })
        .eq('id', otpRecord.id);

      return new Response(JSON.stringify({
        success: false,
        error: 'Không thể gửi OTP. Vui lòng thử lại sau.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // SUCCESS RESPONSE
    console.log('\n✅ send_otp_phone COMPLETED SUCCESSFULLY');
    console.log('================================\n');

    return new Response(JSON.stringify({
      success: true,
      message: 'OTP đã được gửi đến số điện thoại của bạn',
      record_id: otpRecord.id
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Đã xảy ra lỗi. Vui lòng thử lại.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
