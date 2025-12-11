-- AlterEnum - Add AD to RegistrationSource enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'AD' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'RegistrationSource')) THEN
        ALTER TYPE "RegistrationSource" ADD VALUE 'AD';
    END IF;
END$$;

-- AlterEnum - Add OUTER_PAYMENT to RegistrationSource enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'OUTER_PAYMENT' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'RegistrationSource')) THEN
        ALTER TYPE "RegistrationSource" ADD VALUE 'OUTER_PAYMENT';
    END IF;
END$$;
