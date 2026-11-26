-- Sample data: six hotels, one room category each.
-- Room counts are deliberately small so availability limits are easy to see.

INSERT INTO hotel (id, name, city, region, address, tagline, description, star_rating, cover_image) VALUES
(1, 'The Saffron Courtyard', 'Jaipur', 'Rajasthan', '14 Chandpole Bazaar Road, Pink City, Jaipur 302001',
 'A restored haveli wrapped around a sunlit courtyard',
 'Set inside a 19th-century merchant haveli, The Saffron Courtyard pairs carved sandstone arches and hand-painted frescoes with quiet, modern rooms. Mornings start with masala chai on the rooftop facing Nahargarh Fort; evenings end with folk music in the central courtyard. The old city bazaars are a five-minute walk away.',
 4, 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1600&q=80'),
(2, 'Tidewater House', 'Goa', 'Goa', 'Beach Road, Candolim, North Goa 403515',
 'Twelve steps from the sand, a breezy Portuguese villa',
 'A whitewashed Indo-Portuguese villa with shuttered windows, a plunge pool shaded by coconut palms and a private path to Candolim beach. Rooms open onto wide verandas, the kitchen serves Goan seafood thalis, and bicycles are free for exploring Aguada Fort and the riverside villages.',
 4, 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1600&q=80'),
(3, 'Cedar & Mist Retreat', 'Manali', 'Himachal Pradesh', 'Old Manali Road, Manali 175131',
 'Timber cabins above the Beas, built for slow mornings',
 'Hand-built from deodar timber and river stone, Cedar & Mist sits in an apple orchard above the Beas river. Every room has a wood-burning stove and a balcony facing the Dhauladhar range. Guides can arrange treks to Jogini Falls, and the café bakes fresh bread every morning.',
 3, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80'),
(4, 'Marine Line Residency', 'Mumbai', 'Maharashtra', '72 Netaji Subhash Road, Marine Drive, Mumbai 400020',
 'Art Deco calm on the Queen''s Necklace',
 'An Art Deco landmark on Marine Drive with sea-facing rooms, a rooftop lounge and a library of Bombay photography. Business travellers get a quiet work desk and fast Wi-Fi; everyone gets the sunset over the Arabian Sea. Churchgate station and the Fort district are a short walk away.',
 5, 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1600&q=80'),
(5, 'Backwater Lantern', 'Alleppey', 'Kerala', 'Punnamada Kayal, Alappuzha 688006',
 'Lantern-lit cottages on the edge of the Kerala backwaters',
 'Thatched cottages stand on stilts along a quiet canal, connected by wooden walkways. Days drift by on a kettuvallam rice-barge cruise, an Ayurvedic massage or a cooking class with the resident chef. At dusk the lanterns are lit along the water and the kingfishers come out.',
 4, 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=80'),
(6, 'Lakeshore Mahal', 'Udaipur', 'Rajasthan', 'Lal Ghat, Near Lake Pichola, Udaipur 313001',
 'Lake Pichola views from every jharokha',
 'A boutique palace hotel on the ghats of Lake Pichola, with marble courtyards, a lakeside dining terrace and carved jharokha windows looking towards the City Palace. Boat rides leave from the hotel jetty at sunset, and the old city lanes are right outside the door.',
 5, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80');

INSERT INTO hotel_amenity (hotel_id, amenity) VALUES
(1, 'Free Wi-Fi'), (1, 'Rooftop Café'), (1, 'Air Conditioning'), (1, 'Airport Transfer'), (1, 'Heritage Walks'),
(2, 'Free Wi-Fi'), (2, 'Plunge Pool'), (2, 'Beach Access'), (2, 'Free Bicycles'), (2, 'Breakfast Included'),
(3, 'Free Wi-Fi'), (3, 'Fireplace'), (3, 'Mountain View'), (3, 'Trek Desk'), (3, 'Free Parking'),
(4, 'Free Wi-Fi'), (4, 'Sea View'), (4, 'Rooftop Lounge'), (4, 'Gym'), (4, 'Work Desk'), (4, '24h Room Service'),
(5, 'Free Wi-Fi'), (5, 'Ayurvedic Spa'), (5, 'Boat Cruise'), (5, 'Breakfast Included'), (5, 'Cooking Class'),
(6, 'Free Wi-Fi'), (6, 'Lake View'), (6, 'Swimming Pool'), (6, 'Spa'), (6, 'Boat Jetty'), (6, 'Fine Dining');

INSERT INTO hotel_image (hotel_id, position, url) VALUES
(1, 0, 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1600&q=80'),
(1, 1, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=80'),
(1, 2, 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1600&q=80'),
(2, 0, 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1600&q=80'),
(2, 1, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1600&q=80'),
(2, 2, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1600&q=80'),
(3, 0, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80'),
(3, 1, 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1600&q=80'),
(3, 2, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1600&q=80'),
(4, 0, 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1600&q=80'),
(4, 1, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1600&q=80'),
(4, 2, 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1600&q=80'),
(5, 0, 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=80'),
(5, 1, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80'),
(5, 2, 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1600&q=80'),
(6, 0, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80'),
(6, 1, 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1600&q=80'),
(6, 2, 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1600&q=80');

INSERT INTO room_type (id, hotel_id, name, description, max_guests, bed_type, size_sqm, price_per_night, total_rooms) VALUES
(1, 1, 'Haveli Courtyard Room', 'Fresco-lined room overlooking the courtyard, with a carved jharokha seat and rain shower.', 2, 'King bed', 28, 6200.00, 5),
(2, 2, 'Veranda Garden Room', 'Opens onto a shaded veranda and the palm garden; a short barefoot walk to the beach.', 3, 'Queen bed + daybed', 32, 7800.00, 4),
(3, 3, 'Deodar Cabin', 'Timber cabin with a wood-burning stove, quilts and a balcony facing the snow peaks.', 2, 'Queen bed', 24, 4500.00, 6),
(4, 4, 'Sea-Facing Deco Room', 'High-ceilinged Art Deco room with a bay window over Marine Drive and the Arabian Sea.', 2, 'King bed', 34, 11500.00, 8),
(5, 5, 'Canal-Side Cottage', 'Thatched stilt cottage with a private sit-out over the canal and an open-air shower.', 2, 'King bed', 30, 8900.00, 3),
(6, 6, 'Jharokha Lake Suite', 'Marble suite with a window seat over Lake Pichola and a view of the City Palace.', 2, 'King bed', 40, 14800.00, 2);
