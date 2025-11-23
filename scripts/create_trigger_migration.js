const fs = require('fs');
const path = require('path');

const sql = `
-- Function to handle referral bonus when phone is updated
CREATE OR REPLACE FUNCTION handle_referral_bonus_on_phone_update()
RETURNS TRIGGER AS $$
DECLARE
    v_referral_record RECORD;
    v_referrer_id UUID;
    v_bonus_amount INT := 5; -- Default bonus amount
BEGIN
    -- Only proceed if phone is being set for the first time (or updated from null)
    IF (OLD.phone IS NULL AND NEW.phone IS NOT NULL) THEN
        
        -- Find the pending referral record for this user
        SELECT * INTO v_referral_record
        FROM referrals
        WHERE referred_id = NEW.id
        AND reward_given = FALSE;

        IF FOUND THEN
            v_referrer_id := v_referral_record.referrer_id;

            -- Award bonus plays to referrer
            UPDATE users
            SET bonus_plays = COALESCE(bonus_plays, 0) + v_bonus_amount
            WHERE id = v_referrer_id;

            -- Mark referral as rewarded
            UPDATE referrals
            SET reward_given = TRUE
            WHERE id = v_referral_record.id;

            -- Log the transaction
            INSERT INTO play_logs (user_id, amount, reason, related_user_id)
            VALUES (
                v_referrer_id, 
                v_bonus_amount, 
                'referral_bonus', 
                NEW.id
            );
            
            RAISE NOTICE 'Awarded referral bonus to % for referee %', v_referrer_id, NEW.id;
            
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_user_phone_update ON users;
CREATE TRIGGER on_user_phone_update
AFTER UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION handle_referral_bonus_on_phone_update();
`;

const migrationDir = path.join(__dirname, '../supabase/migrations');
if (!fs.existsSync(migrationDir)) {
    fs.mkdirSync(migrationDir, { recursive: true });
}

const filePath = path.join(migrationDir, '20241123_referral_trigger.sql');
fs.writeFileSync(filePath, sql.trim());

console.log('Migration file created successfully at: ' + filePath);
console.log('Please run this SQL in your Supabase SQL Editor.');
