-- Fix demo data issues:
-- 1. Change Academy name from "Academia Demo AKADEMO" to "Academia Demo"
-- 2. Fix Payment receiverName from "Academia Demo AKADEMO" to "Academia Demo"  
-- 3. Change assignment maxScores to 100 for consistency

-- Fix Academy name
UPDATE Academy 
SET name = 'Academia Demo'
WHERE id = 'demo-academy-id' AND name = 'Academia Demo AKADEMO';

-- Fix Payment receiverName (from 0053 migration)
UPDATE Payment
SET receiverName = 'Academia Demo'
WHERE receiverAcademyId = 'demo-academy-id' AND receiverName = 'Academia Demo AKADEMO';

-- Fix Assignment maxScores to 100
UPDATE Assignment SET maxScore = 100 WHERE id = 'demo-assign-math-1' AND maxScore = 50;
UPDATE Assignment SET maxScore = 100 WHERE id = 'demo-assign-physics-1' AND maxScore = 75;
