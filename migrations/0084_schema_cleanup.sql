-- Schema cleanup: drop dead columns, add tutorialSeenAt

-- 1. Drop Teacher.status (added in 0015 but never enforced/read)
ALTER TABLE Teacher DROP COLUMN status;

-- 2. Add tutorialSeenAt to Teacher (replaces localStorage for onboarding tutorial)
ALTER TABLE Teacher ADD COLUMN tutorialSeenAt TEXT;

-- 3. Drop DeviceSession audit columns (inserted but never read by any query)
ALTER TABLE DeviceSession DROP COLUMN ipHash;
ALTER TABLE DeviceSession DROP COLUMN browser;
ALTER TABLE DeviceSession DROP COLUMN os;
