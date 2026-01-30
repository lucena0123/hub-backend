-- Inserir usuários (hashes são para 'admin123' e 'user123')
INSERT INTO users (id, email, name, role, "passwordHash", "createdAt", "updatedAt") VALUES
('user-admin-001', 'admin@bpmnsystem.com', 'Admin User', 'admin', '$2a$10$rE9XaHs3J3rY6KVYm9XxLOJ1f8KMqN7vRwX7nLZ8HwY6tP3nZwLLe', NOW(), NOW()),
('user-trafego-001', 'trafego@bpmnsystem.com', 'Gestor de Tráfego', 'gestor_trafego', '$2a$10$rE9XaHs3J3rY6KVYm9XxLOJ1f8KMqN7vRwX7nLZ8HwY6tP3nZwLLe', NOW(), NOW()),
('user-cs-001', 'cs@bpmnsystem.com', 'Customer Success', 'cs', '$2a$10$rE9XaHs3J3rY6KVYm9XxLOJ1f8KMqN7vRwX7nLZ8HwY6tP3nZwLLe', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Inserir clientes
INSERT INTO clients (id, name, email, tier, status, "contractStart", "contractEnd", budget, "createdAt", "updatedAt") VALUES
('client-a-001', 'Cliente A Corp', 'contato@clientea.com', 'premium', 'active', '2024-01-01', '2025-01-01', 10000.0, NOW(), NOW()),
('client-b-001', 'Cliente B Ltd', 'contato@clienteb.com', 'standard', 'active', '2024-03-15', '2025-03-15', 5000.0, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Inserir campanhas
INSERT INTO campaigns (id, "externalId", platform, name, status, "clientId", budget, spent, "createdAt", "updatedAt") VALUES
('campaign-001', 'meta_12345', 'meta', 'Campanha Black Friday - Cliente A', 'active', 'client-a-001', 3000.0, 1250.5, NOW(), NOW()),
('campaign-002', 'meta_67890', 'meta', 'Campanha Produto X - Cliente A', 'active', 'client-a-001', 2000.0, 850.25, NOW(), NOW()),
('campaign-003', 'meta_11111', 'meta', 'Campanha Awareness - Cliente B', 'active', 'client-b-001', 1500.0, 420.0, NOW(), NOW())
ON CONFLICT ("externalId") DO NOTHING;

SELECT 'Seed data inserted successfully!' as message;
