import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.info('=== VERIFY_OTP_PHONE FUNCTION STARTED ===');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// MAIN HANDLER
Deno.serve(async (req) => {
  console.log('\n========== VERIFY OTP PHONE REQUEST ==========');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ========== STEP 1: GET PHONE & OTP ==========
    console.log('📱 STEP 1: Get Phone & OTP');
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Vui lòng nhập số điện thoại và mã OTP'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Phone: ${phone}`);
    console.log(`OTP: ${otp}`);

    // ========== STEP 2: CONNECT DB ==========
    console.log('\n🔌 STEP 2: Connect Database');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const now = new Date();

    // ========== STEP 3: FIND OTP RECORD ==========
    console.log('\n🔍 STEP 3: Find OTP Record');

    // Find the most recent unverified OTP for this phone
    const { data: otpRecord, error: findError } = await supabase
      .from('otp_login_vihat')
      .select('*')
      .eq('phone', phone)
      .eq('verified', false)
      .gt('expires_at', now.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (findError || !otpRecord) {
      console.log('❌ No valid OTP found');
      return new Response(JSON.stringify({
        success: false,
        error: 'Mã OTP không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu mã mới.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found OTP record: ${otpRecord.id}`);
    console.log(`Attempts: ${otpRecord.attempts}/5`);

    // ========== STEP 4: CHECK MAX ATTEMPTS ==========
    console.log('\n🛡️ STEP 4: Check Max Attempts');

    if (otpRecord.attempts >= 5) {
      console.log('❌ Max attempts exceeded');
      return new Response(JSON.stringify({
        success: false,
        error: 'Đã thử sai 5 lần. Vui lòng yêu cầu mã OTP mới.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ========== STEP 5: VERIFY OTP CODE ==========
    console.log('\n🔐 STEP 5: Verify OTP Code');

    if (otpRecord.otp_code !== otp) {
      console.log('❌ Wrong OTP');

      // Increment attempts
      await supabase
        .from('otp_login_vihat')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id);

      const remaining = 4 - otpRecord.attempts;
      return new Response(JSON.stringify({
        success: false,
        error: `Mã OTP không chính xác. Còn ${remaining} lần thử.`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ========== STEP 6: MARK AS VERIFIED ==========
    console.log('\n✅ STEP 6: OTP Correct! Marking as verified');

    await supabase
      .from('otp_login_vihat')
      .update({
        verified: true,
        verified_at: now.toISOString()
      })
      .eq('id', otpRecord.id);

    // SUCCESS RESPONSE
    console.log('\n✅ verify_otp_phone COMPLETED SUCCESSFULLY');
    console.log('========================================\n');

    return new Response(JSON.stringify({
      success: true,
      message: 'Xác thực OTP thành công',
      record_id: otpRecord.id,
      phone: phone
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Đã xảy ra lỗi. Vui lòng thử lại.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
