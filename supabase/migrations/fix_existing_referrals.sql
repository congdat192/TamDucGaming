-- Fix existing referrals that should have been rewarded
-- This script processes referrals where the referred user already has a phone number
-- but the referrer hasn't received their bonus yet

DO $$
DECLARE
    v_referral RECORD;
    v_bonus_amount INT := 5;
    v_total_fixed INT := 0;
BEGIN
    -- Find all referrals where:
    -- 1. reward_given = FALSE
    -- 2. referred user has a phone number (meaning they verified)
    FOR v_referral IN 
        SELECT r.id, r.referrer_id, r.referred_id
        FROM referrals r
        JOIN users u ON r.referred_id = u.id
        WHERE r.reward_given = FALSE
        AND u.phone IS NOT NULL
    LOOP
        -- Award bonus plays to referrer
        UPDATE users
        SET bonus_plays = COALESCE(bonus_plays, 0) + v_bonus_amount
        WHERE id = v_referral.referrer_id;

        -- Mark referral as rewarded
        UPDATE referrals
        SET reward_given = TRUE
        WHERE id = v_referral.id;

        v_total_fixed := v_total_fixed + 1;

        RAISE NOTICE 'Fixed referral: % -> %, awarded % plays', 
            v_referral.referrer_id, v_referral.referred_id, v_bonus_amount;
    END LOOP;

    RAISE NOTICE 'Total referrals fixed: %', v_total_fixed;
END $$;
