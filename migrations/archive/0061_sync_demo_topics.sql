-- Sync demo topics to match the frontend demo data (ClassDetailPage demoTopicsMap)
-- This ensures student, teacher, and academy views all see the same topics

-- Web class: Add missing "Routing" topic
INSERT OR IGNORE INTO Topic (id, name, classId, orderIndex, createdAt) VALUES
  ('demo-topic-web-3', 'Routing', 'demo-class-web', 2, datetime('now'));

-- Math class: Add missing "Series" and "Aplicaciones"
INSERT OR IGNORE INTO Topic (id, name, classId, orderIndex, createdAt) VALUES
  ('demo-topic-math-3', 'Series', 'demo-class-math', 2, datetime('now'));
INSERT OR IGNORE INTO Topic (id, name, classId, orderIndex, createdAt) VALUES
  ('demo-topic-math-4', 'Aplicaciones', 'demo-class-math', 3, datetime('now'));

-- Design class: Add missing "Herramientas" and "Tipografía y Color"
INSERT OR IGNORE INTO Topic (id, name, classId, orderIndex, createdAt) VALUES
  ('demo-topic-design-2', 'Herramientas', 'demo-class-design', 1, datetime('now'));
INSERT OR IGNORE INTO Topic (id, name, classId, orderIndex, createdAt) VALUES
  ('demo-topic-design-3', 'Tipografía y Color', 'demo-class-design', 2, datetime('now'));

-- Physics class: Add all topics (none existed before)
INSERT OR IGNORE INTO Topic (id, name, classId, orderIndex, createdAt) VALUES
  ('demo-topic-physics-1', 'Fundamentos Cuánticos', 'demo-class-physics', 0, datetime('now'));
INSERT OR IGNORE INTO Topic (id, name, classId, orderIndex, createdAt) VALUES
  ('demo-topic-physics-2', 'Principios', 'demo-class-physics', 1, datetime('now'));
INSERT OR IGNORE INTO Topic (id, name, classId, orderIndex, createdAt) VALUES
  ('demo-topic-physics-3', 'Aplicaciones', 'demo-class-physics', 2, datetime('now'));
