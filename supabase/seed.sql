-- Bigex Cars demo listings
-- Run this once in the Supabase SQL Editor after schema.sql.

insert into public.listings
  (name, year, type, fuel, price, mileage, location, description, image_url, status)
values
  ('Toyota Land Cruiser', 2023, 'SUV', 'Petrol', 82000000, 18400, 'Lagos',
   '2023 Toyota Land Cruiser J300. Demo marketplace listing.',
   'https://commons.wikimedia.org/wiki/Special:Redirect/file/2023_Toyota_Land_Cruiser_J300_3.4_VX_V6_2023.jpg', 'approved'),

  ('Lexus RX 350', 2024, 'SUV', 'Petrol', 67500000, 8200, 'Abuja',
   '2024 Lexus RX 350. Demo marketplace listing.',
   'https://commons.wikimedia.org/wiki/Special:Redirect/file/2023_Lexus_RX350,_front_1.25.23.jpg', 'approved'),

  ('BMW M4 Competition', 2024, 'Coupe', 'Petrol', 95000000, 4600, 'Lagos',
   '2024 BMW M4 Competition. Demo marketplace listing.',
   'https://commons.wikimedia.org/wiki/Special:Redirect/file/2024_BMW_M4_(G82)_Competition_IMG_9370.jpg', 'approved'),

  ('Mercedes-Benz C300', 2023, 'Sedan', 'Petrol', 58000000, 21000, 'Port Harcourt',
   '2023 Mercedes-Benz C300. Demo marketplace listing.',
   'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mercedes-Benz_C-Klasse_(W206)_C_300_(2023)_(53491181737).jpg', 'approved'),

  ('Tesla Model 3', 2024, 'Electric', 'Electric', 72000000, 5100, 'Lagos',
   '2024 Tesla Model 3. Demo marketplace listing.',
   'https://commons.wikimedia.org/wiki/Special:Redirect/file/2024_Tesla_Model_3.jpg', 'approved'),

  ('Range Rover Sport', 2022, 'SUV', 'Petrol', 115000000, 31200, 'Lagos',
   '2022 Range Rover Sport. Demo marketplace listing.',
   'https://commons.wikimedia.org/wiki/Special:Redirect/file/2022_Range_Rover_Sport.jpg', 'approved');
