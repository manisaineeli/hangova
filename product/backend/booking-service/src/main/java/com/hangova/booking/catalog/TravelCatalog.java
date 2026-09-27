package com.hangova.booking.catalog;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Built-in hotel and transport knowledge used when no live travel API key is
 * configured. Keeping a real catalogue means the booking and cancellation
 * features are fully demonstrable out of the box.
 */
public final class TravelCatalog {

    private TravelCatalog() {
    }

    public record HotelSeed(String name, String area, String tier, int perNight, int rating,
                            String amenities, String note) {
    }

    public record RouteSeed(String mode, String operator, String from, String to,
                            String depart, String arrive, int durationMinutes, int fare, int seatsLeft) {
    }

    private static final Map<String, List<HotelSeed>> HOTELS = new LinkedHashMap<>();

    static {
        HOTELS.put("manali", List.of(
                new HotelSeed("Manali Heights Resort", "Old Manali", "PREMIUM", 7400, 4, "Pool, Spa, Valley view",
                        "Best view rooms face the valley; a short walk from Mall Road."),
                new HotelSeed("Hotel Rajdhani", "Manali town", "MID", 3200, 4, "Restaurant, Parking",
                        "Central option with easy access to both old and new Manali."),
                new HotelSeed("The Himalayan Yard", "Baishti", "MID", 2900, 4, "Garden, Bonfire, Parking",
                        "Popular with groups; arrange pickup from Manali bus stand."),
                new HotelSeed("Snowcrest Guest House", "Vashisht", "BUDGET", 1400, 3, "Hot spring nearby",
                        "Simple rooms close to the Vashisht temple and trout farm."),
                new HotelSeed("Riverstone Cottage", "Saini", "BUDGET", 1100, 3, "Kitchenette, River view",
                        "Quiet cottage by the river, best for longer stays.")));

        HOTELS.put("goa", List.of(
                new HotelSeed("Taj Palace Goa", "Cavelossim", "PREMIUM", 21000, 5, "Private beach, Pool, Spa",
                        "Large beachfront resort with a private stretch of sand."),
                new HotelSeed("Novotel Goa", "Candolim", "PREMIUM", 11500, 5, "Pool, Casino, Beach access",
                        "Central Candolim base for beach and nightlife."),
                new HotelSeed("Cafe Art Hotel", "Baga", "MID", 5200, 4, "Restaurant, Pool, Party area",
                        "Lively option if you want to stay near the Baga scene."),
                new HotelSeed("Palolem Surf Shack", "Palolem", "BUDGET", 1800, 3, "Beach huts, Breakfast",
                        "Simple huts right on Palolem beach; the best budget pick."),
                new HotelSeed("Casa de Goa", "Fontainhas", "MID", 3100, 4, "Heritage building, Breakfast",
                        "Restored Portuguese home in the old Latin quarter.")));

        HOTELS.put("jaipur", List.of(
                new HotelSeed("Taj Rambagh Palace", "Bhawani Singh Road", "PREMIUM", 28000, 5, "Palace, Pool, Spa",
                        "A former royal residence; the address to book for a special trip."),
                new HotelSeed("Rambagh Palace courtyard stay", "Rambagh", "PREMIUM", 18000, 5, "Pool, Butler service",
                        "Splitter option if the full palace is beyond budget."),
                new HotelSeed("Jaipur Heritage House", "Old city", "MID", 3600, 4, "Rooftop, Breakfast",
                        "Family-run haveli in the walled city, walkable to the bazaars."),
                new HotelSeed("Hotel Pearl City", "Rajasthan Road", "MID", 2400, 4, "Restaurant, Parking",
                        "Reliable mid-range option near the railway station."),
                new HotelSeed("Chokhi Dhani village stay", "Sanganer", "BUDGET", 1600, 3, "Folk performances",
                        "Traditional cottages with an evening Rajasthani performance.")));

        HOTELS.put("munnar", List.of(
                new HotelSeed("Windermere Estate", "Munnar town", "PREMIUM", 13500, 5, "Tea estate, Pool, Spa",
                        "Stay inside a working tea estate above the town."),
                new HotelSeed("Tea County Resort", "Kolukkumalai road", "MID", 4600, 4, "Estate view, Restaurant",
                        "Terraced tea gardens run right up to the property."),
                new HotelSeed("Misty Hills Homestay", "Vannamanam", "MID", 2100, 4, "Homestay, Spices",
                        "Genuine Kerala home-cooked meals with the family."),
                new HotelSeed("Valley View Lodge", "Munnar town", "BUDGET", 1200, 3, "Parking, Breakfast",
                        "Simple and central, a short walk to the market.")));

        HOTELS.put("port-blair", List.of(
                new HotelSeed("ITC Grand Maratha", "Port Blair", "PREMIUM", 19000, 5, "Pool, Spa, Bay view",
                        "The best-known full-service hotel in the islands."),
                new HotelSeed("Sea Shell Hotel", "Aberdeen", "MID", 7800, 4, "Marina access, Pool",
                        "Walking distance to the Aberdeen Clock Tower and ferry pier."),
                new HotelSeed("Kala Pani Guesthouse", "Gandamanagar", "BUDGET", 2400, 4, "Breakfast, Trip assistance",
                        "Helpful owners organise island day trips and ferries."),
                new HotelSeed("Radhanagar Beach Resort", "Havelock", "PREMIUM", 16000, 5, "Beachfront, Pool",
                        "Staying on the beach itself saves a daily ferry trip.")));

        HOTELS.put("varanasi", List.of(
                new HotelSeed("Taj Gateway Varanasi", "Akash Ganga", "PREMIUM", 19500, 5, "Ganga view, Pool, Spa",
                        "Step from Dashashwamedh Ghat with a balcony over the river."),
                new HotelSeed("Hotel Varuna", "Darbhanga", "MID", 2600, 4, "Roof restaurant",
                        "Well placed for the ghats, with a well-known rooftop restaurant."),
                new HotelSeed("Krishna Guest House", "Assi", "BUDGET", 1100, 3, "Rooftop",
                        "Simple rooms near Assi Ghat, popular with pilgrims."),
                new HotelSeed("Palace on the Ganges", "Rajghat", "MID", 5400, 4, "River view",
                        "River-facing rooms on a quieter ghat.")));

        HOTELS.put("coorg", List.of(
                new HotelSeed("Evolve Coorg", "Madikeri", "PREMIUM", 14500, 5, "Coffee plantation, Pool, Spa",
                        "A plantation resort spread across 40 acres."),
                new HotelSeed("Coffee County Retreat", "Madikeri", "MID", 4200, 4, "Estate view, Restaurant",
                        "Taste the estate's own Arabica at breakfast."),
                new HotelSeed("Rainforest Retreat", "Abbey", "MID", 5200, 4, "Rainforest, Pool",
                        "Close to Abbey Falls with heavy forest around it."),
                new HotelSeed("Homestay in Madikeri", "Kakkati", "BUDGET", 1000, 3, "Home-cooked meals",
                        "Stay with a Kodava family for the full local experience.")));

        HOTELS.put("rishikesh", List.of(
                new HotelSeed("Ananda in the Himalayas", "Narayanpur", "PREMIUM", 42000, 5, "Spa, Yoga, Mountain view",
                        "A luxury ashram-style resort above the Ganga valley."),
                new HotelSeed("Hotel Ganga Darshan", "Lakshman Jhula", "MID", 2800, 4, "Ganga view, Restaurant",
                        "Right on the river near the suspension bridge."),
                new HotelSeed("Yoga Vashra Ashram Guesthouse", "Swami Lane", "BUDGET", 900, 3, "Simple, Vegetarian",
                        "Very basic rooms in a working ashram; the quietest option."),
                new HotelSeed("Camp Beyond", "Badrinath road", "MID", 3900, 4, "River camp, Adventure",
                        "Riverside camping with activities arranged on site.")));

        HOTELS.put("hampi", List.of(
                new HotelSeed("Moley's Guest House", "Hampi", "MID", 1300, 4, "Rooftop, Vegetarian",
                        "The best-known place to stay while seeing the ruins."),
                new HotelSeed("Hotel Royal Retreat", "Hampi", "MID", 2600, 4, "Pool, Restaurant",
                        "A little outside the bazaar, near Kamalapura."),
                new HotelSeed("Kamalapura Heritage Home", "Kamalapura", "BUDGET", 700, 3, "Village stay",
                        "Simple village guesthouse across the river.")));

        HOTELS.put("ranthambore", List.of(
                new HotelSeed("The Trident Jaipur", "Jaipur", "PREMIUM", 12000, 5, "Pool, Spa",
                        "Base yourself in Jaipur for the drive to the park."),
                new HotelSeed("Sawai Madhopur heritage haveli", "Sawai Madhopur", "MID", 2200, 4, "Courtyard, Restaurant",
                        "A restored haveli a short drive from the park gate."),
                new HotelSeed("Kuna Reserve Camp", "Ranthambore", "PREMIUM", 16000, 4, "Safari included, Forest camp",
                        "Luxury tented camp with the park safari included."),
                new HotelSeed("Budget lodge near gate 2", "Sawai Madhopur", "BUDGET", 700, 3, "Basic",
                        "Cheapest option if you only need a night before a dawn safari.")));
    }

    public static List<HotelSeed> hotelsFor(String destination) {
        String key = slug(destination);
        List<HotelSeed> seeds = HOTELS.get(key);
        if (seeds != null) {
            return seeds;
        }
        // Unknown destination: still return usable, clearly generic options.
        return List.of(
                new HotelSeed("Grand stay in " + destination, "City centre", "PREMIUM", 6500, 4,
                        "Pool, Restaurant, Parking", "A comfortable central option."),
                new HotelSeed("Midtown hotel " + destination, "City centre", "MID", 2800, 4,
                        "Breakfast, Wi-Fi", "Reliable mid-range choice near the main sights."),
                new HotelSeed("Budget lodge " + destination, "Outskirts", "BUDGET", 1100, 3,
                        "Basic rooms", "Simple and cheap, best for a short stay."));
    }

    public static boolean hasDestination(String destination) {
        return HOTELS.containsKey(slug(destination));
    }

    public static String slug(String s) {
        return s == null ? "" : s.trim().toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
    }

    /** Major routes into the catalogue destinations, by mode. */
    public static List<RouteSeed> routesFor(String destination) {
        String d = destination == null ? "" : destination.trim();
        List<RouteSeed> routes = new ArrayList<>();
        switch (slug(d)) {
            case "manali" -> {
                routes.add(new RouteSeed("FLIGHT", "IndiGo", "DEL", "IXM", "06:20", "08:15", 115, 6500, 9));
                routes.add(new RouteSeed("FLIGHT", "Vistara", "BLR", "IXM", "09:40", "11:30", 110, 7200, 5));
                routes.add(new RouteSeed("TRAIN", "Northern Railways", "NDLS", "MLTT", "18:10", "12:35", 1105, 1450, 40));
                routes.add(new RouteSeed("TRAIN", "Himalayan Queen", "CDG", "MLTT", "20:05", "09:15", 790, 1100, 60));
                routes.add(new RouteSeed("BUS", "HRTC Volvo", "CHandigarh", "Manali", "22:00", "06:30", 510, 900, 22));
                routes.add(new RouteSeed("BUS", "HPTDC", "Delhi", "Manali", "19:00", "12:00", 1020, 1400, 30));
            }
            case "goa" -> {
                routes.add(new RouteSeed("FLIGHT", "IndiGo", "BOM", "GOX", "07:10", "08:20", 70, 4200, 14));
                routes.add(new RouteSeed("FLIGHT", "Akasa Air", "DEL", "GOX", "13:25", "14:40", 135, 5600, 8));
                routes.add(new RouteSeed("TRAIN", "Konkan Railway", "MAJN", "MAO", "23:00", "11:20", 740, 800, 70));
                routes.add(new RouteSeed("BUS", "Kadamba Transport", "Bangalore", "Panaji", "21:30", "08:00", 630, 1200, 25));
            }
            case "jaipur", "ranthambore" -> {
                routes.add(new RouteSeed("FLIGHT", "IndiGo", "DEL", "JAI", "06:45", "09:00", 135, 4800, 12));
                routes.add(new RouteSeed("TRAIN", "Rajdhani", "NDLS", "JP", "19:00", "05:40", 640, 2100, 45));
                routes.add(new RouteSeed("TRAIN", "Shatabdi Express", "BCT", "JP", "22:35", "16:50", 1115, 1750, 55));
                routes.add(new RouteSeed("BUS", "RSRTC", "Jaipur", "Sawai Madhopur", "08:00", "09:45", 105, 350, 30));
            }
            case "munnar", "coorg" -> {
                routes.add(new RouteSeed("FLIGHT", "IndiGo", "COK", "COH", "12:30", "13:35", 65, 4800, 9));
                routes.add(new RouteSeed("TRAIN", "Ernakulam-Kollam", "ERS", "COK", "04:10", "08:40", 270, 850, 80));
                routes.add(new RouteSeed("BUS", "KSRTC", "Bangalore", "Munnar", "20:00", "08:30", 750, 1300, 25));
            }
            case "port-blair" -> {
                routes.add(new RouteSeed("FLIGHT", "Air India", "DEL", "IXL", "06:20", "12:35", 345, 11000, 6));
                routes.add(new RouteSeed("FLIGHT", "Indigo", "BLR", "IXL", "04:40", "11:05", 355, 9800, 4));
                routes.add(new RouteSeed("BUS", "Andaman Ferries", "Ferry Point", "Havelock", "08:30", "09:30", 60, 450, 60));
            }
            case "varanasi" -> {
                routes.add(new RouteSeed("FLIGHT", "IndiGo", "DEL", "VNS", "13:00", "15:00", 120, 5200, 10));
                routes.add(new RouteSeed("TRAIN", "Shatabdi Express", "NDLS", "BSB", "20:00", "09:00", 820, 1200, 60));
                routes.add(new RouteSeed("BUS", "UPSRTC", "Lucknow", "Varanasi", "20:30", "07:30", 660, 900, 30));
            }
            case "hampi" -> {
                routes.add(new RouteSeed("TRAIN", "Karnataka Express", "SBC", "BJP", "22:30", "08:00", 570, 650, 90));
                routes.add(new RouteSeed("TRAIN", "Hampi Express", "HYB", "BJP", "19:10", "08:55", 825, 750, 40));
                routes.add(new RouteSeed("BUS", "KSTDC", "Hubli", "Hampi", "09:30", "12:00", 150, 400, 20));
            }
            case "rishikesh" -> {
                routes.add(new RouteSeed("TRAIN", "Doon Express", "NDLS", "RKSH", "22:15", "05:50", 455, 800, 65));
                routes.add(new RouteSeed("BUS", "HRTC", "Delhi", "Rishikesh", "20:00", "06:00", 600, 950, 30));
            }
            default -> {
                routes.add(new RouteSeed("FLIGHT", "IndiGo", "HYD", "TIR", "07:00", "08:25", 85, 4600, 11));
                routes.add(new RouteSeed("TRAIN", "Intercity Express", "SC", "TPTY", "21:30", "12:00", 870, 1050, 60));
                routes.add(new RouteSeed("BUS", "APSRTC", "Hyderabad", d, "22:00", "08:00", 600, 1100, 25));
            }
        }
        return routes;
    }
}
