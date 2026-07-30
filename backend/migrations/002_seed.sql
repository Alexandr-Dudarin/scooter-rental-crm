INSERT INTO scooters
  (id, number, model, status, battery_level, latitude, longitude, updated_at)
VALUES
  ('3dbf1c49-0ae8-45ee-876c-020a1f893101', 'S-1001', 'Ninebot Max G30', 'available', 87, 55.7575, 37.6136, NOW() - INTERVAL '2 minutes'),
  ('3dbf1c49-0ae8-45ee-876c-020a1f893102', 'S-1002', 'Ninebot Max G30', 'in_use', 62, 55.7499, 37.6221, NOW() - INTERVAL '5 minutes'),
  ('3dbf1c49-0ae8-45ee-876c-020a1f893103', 'S-1003', 'Xiaomi Electric 4 Pro', 'maintenance', 35, 55.7448, 37.6087, NOW() - INTERVAL '12 minutes'),
  ('3dbf1c49-0ae8-45ee-876c-020a1f893104', 'S-1004', 'Ninebot F2 Plus', 'offline', 0, 55.7609, 37.6298, NOW() - INTERVAL '28 minutes'),
  ('3dbf1c49-0ae8-45ee-876c-020a1f893105', 'S-1005', 'Xiaomi Electric 4 Pro', 'available', 91, 55.7534, 37.6401, NOW() - INTERVAL '32 minutes'),
  ('3dbf1c49-0ae8-45ee-876c-020a1f893106', 'S-1006', 'Ninebot Max G2', 'in_use', 74, 55.7389, 37.6199, NOW() - INTERVAL '4 minutes'),
  ('3dbf1c49-0ae8-45ee-876c-020a1f893107', 'S-1007', 'Ninebot Max G2', 'available', 58, 55.7652, 37.6051, NOW() - INTERVAL '9 minutes'),
  ('3dbf1c49-0ae8-45ee-876c-020a1f893108', 'S-1008', 'Xiaomi Mi 3', 'maintenance', 46, 55.7471, 37.6492, NOW() - INTERVAL '18 minutes'),
  ('3dbf1c49-0ae8-45ee-876c-020a1f893109', 'S-1009', 'Ninebot F2 Plus', 'available', 80, 55.7336, 37.6329, NOW() - INTERVAL '21 minutes'),
  ('3dbf1c49-0ae8-45ee-876c-020a1f893110', 'S-1010', 'Xiaomi Electric 4', 'in_use', 51, 55.7693, 37.6261, NOW() - INTERVAL '7 minutes'),
  ('3dbf1c49-0ae8-45ee-876c-020a1f893111', 'S-1011', 'Ninebot Max G30', 'available', 68, 55.7422, 37.5968, NOW() - INTERVAL '15 minutes'),
  ('3dbf1c49-0ae8-45ee-876c-020a1f893112', 'S-1012', 'Xiaomi Mi 3', 'available', 76, 55.7557, 37.6538, NOW() - INTERVAL '11 minutes')
ON CONFLICT (id) DO NOTHING;

INSERT INTO rentals
  (id, scooter_id, user_name, user_phone, started_at, ended_at, status)
VALUES
  ('ab8baf81-7fe4-436c-97ce-f8f2ee900201', '3dbf1c49-0ae8-45ee-876c-020a1f893102', 'Иван Болтенко', '+7 999 418-32-71', NOW() - INTERVAL '28 minutes', NULL, 'active'),
  ('ab8baf81-7fe4-436c-97ce-f8f2ee900202', '3dbf1c49-0ae8-45ee-876c-020a1f893106', 'Анастасия Болтенко', '+7 916 572-48-30', NOW() - INTERVAL '17 minutes', NULL, 'active'),
  ('ab8baf81-7fe4-436c-97ce-f8f2ee900203', '3dbf1c49-0ae8-45ee-876c-020a1f893110', 'Фёдор Слуцкий', '+7 903 641-27-95', NOW() - INTERVAL '41 minutes', NULL, 'active'),
  ('ab8baf81-7fe4-436c-97ce-f8f2ee900204', '3dbf1c49-0ae8-45ee-876c-020a1f893105', 'Елизавета Марценюк', '+7 985 263-79-14', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 24 minutes', 'completed'),
  ('ab8baf81-7fe4-436c-97ce-f8f2ee900205', '3dbf1c49-0ae8-45ee-876c-020a1f893107', 'Антон Зорин', '+7 926 704-36-82', NOW() - INTERVAL '1 day 2 hours', NOW() - INTERVAL '1 day 1 hour 18 minutes', 'completed'),
  ('ab8baf81-7fe4-436c-97ce-f8f2ee900206', '3dbf1c49-0ae8-45ee-876c-020a1f893109', 'Ангелина Трегубова', '+7 901 835-42-67', NOW() - INTERVAL '2 days 4 hours', NOW() - INTERVAL '2 days 3 hours 12 minutes', 'completed')
ON CONFLICT (id) DO NOTHING;
