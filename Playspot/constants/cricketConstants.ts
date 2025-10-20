// Cricket-specific constants for the application

// List of major cities in Pakistan
export const PAKISTANI_CITIES = [
  "Islamabad", "Rawalpindi", "Karachi", "Lahore", "Faisalabad",
  "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala",
  "Bahawalpur", "Sargodha", "Sukkur", "Larkana", "Sheikhupura",
  "Rahim Yar Khan", "Jhang", "Dera Ghazi Khan", "Gujrat", "Sahiwal",
  "Wah Cantonment", "Mardan", "Kasur", "Okara", "Mingora",
  "Nawabshah", "Chiniot", "Kotri", "Kāmoke", "Hafizabad",
  "Sadiqabad", "Mirpur Khas", "Burewala", "Kohat", "Khanewal",
  "Dera Ismail Khan", "Turbat", "Muzaffargarh", "Abbottabad", "Mandi Bahauddin",
  "Shikarpur", "Jacobabad", "Jhelum", "Khanpur", "Khairpur",
  "Khuzdar", "Pakpattan", "Hub", "Daska", "Gojra",
  "Muridke", "Bahawalnagar", "Samundri", "Jaranwala", "Chishtian",
  "Attock", "Vehari", "Kot Abdul Malik", "Ferozewala", "Chakwal",
  "Gujar Khan", "Kamalia", "Umerkot", "Ahmedpur East", "Kot Addu",
  "Wazirabad", "Mansehra", "Layyah", "Mirpur", "Swabi",
  "Chaman", "Taxila", "Nowshera", "Khushab", "Shahdadkot",
  "Mianwali", "Kabal", "Lodhran", "Hasilpur", "Charsadda",
  "Bhakkar", "Badin", "Arifwala", "Ghotki", "Sambrial",
  "Jatoi", "Haroonabad", "Daharki", "Narowal", "Tando Adam",
  "Karak", "Mian Channu", "Tando Allahyar", "Ahmadpur Sial", "Pasrur",
  "Khairpur Mir's", "Chichawatni", "Kamoke", "Hasan Abdal", "Muzaffarabad"
];

// Common cricket ground amenities/facilities
export const ALL_AMENITIES = [
  "Parking", "Changing Rooms", "Floodlights", "Cafeteria", "Equipment Rental",
  "Practice Nets", "Scoreboard", "Showers", "First Aid", "Water Dispensers",
  "Seating Areas", "Club House", "Grass Pitch", "Astroturf", "Synthetic Pitch",
  "Cricket Academy", "Coach Available", "Umpire Services", "Wi-Fi", "Power Backup",
  "Security", "Indoor Facilities", "Outdoor Facilities", "Bar", "Restaurant",
  "Pro Shop", "Lockers", "Tournament Organization", "Team Changing Rooms", "Sight Screens"
];

// Venue types with labels and icons
export const VENUE_TYPES = [
  { value: 'outdoor', label: 'Outdoor', icon: 'sunny-outline' },
  { value: 'indoor', label: 'Indoor', icon: 'home-outline' },
  { value: 'gaming_arena', label: 'Gaming Arena', icon: 'game-controller-outline' },
  { value: 'sports_complex', label: 'Sports Complex', icon: 'fitness-outline' },
];

// Default map region (Pakistan center)
export const DEFAULT_MAP_REGION = {
  latitude: 30.3753,
  longitude: 69.3451,
  latitudeDelta: 12,
  longitudeDelta: 12,
};

// Distance calculation constants
export const EARTH_RADIUS_KM = 6371;
export const DEFAULT_DISTANCE_RANGE: [number, number] = [0, 50];
export const DEFAULT_PRICE_RANGE: [number, number] = [0, 10000];

// Filter limits
export const MAX_CITIES_DISPLAY = 10;
export const MAX_AMENITIES_DISPLAY = 15;
