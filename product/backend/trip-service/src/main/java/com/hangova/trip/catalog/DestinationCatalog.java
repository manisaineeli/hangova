package com.hangova.trip.catalog;

import java.util.List;

import com.hangova.trip.model.Destination;

/**
 * Built-in destination knowledge seeded into MongoDB on first start.
 * <p>
 * This is what lets the planner produce a genuinely useful itinerary even when no
 * Gemini API key is configured, and it is the dataset the administrator can
 * edit afterwards (Module 4).
 */
public final class DestinationCatalog {

    private DestinationCatalog() {
    }

    public static List<Destination> all() {
        return List.of(
                manali(),
                goa(),
                jaipur(),
                ranthambore(),
                munnar(),
                portBlair(),
                coorg(),
                varanasi(),
                hampi(),
                rishikesh());
    }

    private static Destination base(String slug, String name, String state, double lat, double lon,
                                     List<String> tags, int dailyCost, int idealDays) {
        Destination d = new Destination();
        d.setSlug(slug);
        d.setName(name);
        d.setState(state);
        d.setLatitude(lat);
        d.setLongitude(lon);
        d.setTags(tags);
        d.setAvgDailyCostPerPerson(dailyCost);
        d.setIdealDays(idealDays);
        d.setActive(true);
        return d;
    }

    private static Destination.Highlight h(String name, String category, String area, int cost,
                                           String bestTime, int hours, String desc) {
        return new Destination.Highlight(name, category, area, cost, bestTime, hours, desc);
    }

    private static Destination.Activity a(String name, String category, int cost, String duration, String desc) {
        return new Destination.Activity(name, category, cost, duration, desc);
    }

    private static Destination manali() {
        Destination d = base("manali", "Manali", "Himachal Pradesh", 32.2574, 77.1748,
                List.of("Mountains", "Adventure", "Nature"), 3200, 5);
        d.setSummary("Pine forest valleys, snowline viewpoints and river-side towns in the Kullu valley.");
        d.setBestMonths(List.of("March", "April", "May", "June", "September", "October"));
        d.setClimate("Cool mountain climate. Nights are cold almost year round; December to February is snowy.");
        d.setBestTimeToVisit("March to June for clear weather, September to November for clear post-monsoon views.");
        d.setHowToReach("Fly to Chandigarh or Delhi, then drive roughly 8-9 hours. Direct bus and taxi options from Chandigarh.");
        d.setHighlights(List.of(
                h("Solang Valley", "Nature", "Solang", 0, "Morning", 4,
                        "Wide green meadow and snowline point; paragliding and pony rides in season."),
                h("Hadagani Waterfall", "Nature", "Hadagani", 0, "Morning", 2,
                        "Short forest walk to a tiered waterfall, best just after the monsoon."),
                h("Jogini Falls", "Nature", "Nearer", 0, "Morning", 3,
                        "Forest trail ending in a tall waterfall; quieter than Solang."),
                h("Mall Road", "Nightlife", "Manali town", 0, "Evening", 2,
                        "Main shopping and walking street with river views and restaurants."),
                h("Manali Cable Car", "Adventure", "Old Manali", 500, "Midday", 2,
                        "Ropeway from Old Manali up to Joshimath ridge with wide Himalayan views."),
                h("Vashisht Temple", "Heritage", "Vashisht", 0, "Evening", 1,
                        "Stone temple beside a hot spring, with a small trout farm nearby."),
                h("Kufri", "Adventure", "Kufri", 300, "Afternoon", 3,
                        "Snow point and valley viewpoint; snow activities in winter."),
                h("Hidimba Temple", "Heritage", "Nag-Mansala", 0, "Morning", 1,
                        "Old wooden temple in a deodar grove, local folklore site.")));
        d.setActivities(List.of(
                a("River rafting in Beas", "Adventure", 800, "2-3 hours", "Grade 2-3 rafting from Shimla to Manali."),
                a("Paragliding at Solang", "Adventure", 1200, "20 minutes", "Tandem flight over the Solang meadow."),
                a("Mountain biking", "Adventure", 700, "3 hours", "Guided trail ride through the Kullu valley."),
                a("Trout fishing", "Nature", 500, "1 hour", "Catch-and-release at the Vashisht fish farm."),
                a("Trekking to Hampta Pass", "Adventure", 2500, "Full day", "Guided day trek across the green valley."),
                a("Bonfire and local folk music", "Nightlife", 300, "2 hours", "Evening cultural evening in Old Manali.")));
        return d;
    }

    private static Destination goa() {
        Destination d = base("goa", "Goa", "Goa", 15.2993, 74.1240,
                List.of("Beaches", "Nightlife", "Food"), 3400, 4);
        d.setSummary("Sand beaches, Portuguese-era churches, seafood shacks and a long party coastline.");
        d.setBestMonths(List.of("November", "December", "January", "February", "March"));
        d.setClimate("Tropical, humid and hot. The monsoon from June to September interrupts most beach activity.");
        d.setBestTimeToVisit("November to March for dry weather and lower prices; April for quieter beaches.");
        d.setHowToReach("Direct flights to Dabolim (Goa) airport from all major Indian cities; taxi or bus to the coast.");
        d.setHighlights(List.of(
                h("Palolem Beach", "Beaches", "South Goa", 0, "Sunset", 3,
                        "Curved palm-fringed bay, calm water and huts right on the sand."),
                h("Agonda Beach", "Beaches", "South Goa", 0, "Sunrise", 3,
                        "Long quiet stretch popular for swimming and yoga retreats."),
                h("Baga Beach", "Beaches", "North Goa", 0, "Afternoon", 3,
                        "Busiest beach, with shacks, water sports and a lively evening scene."),
                h("Old Goa Churches", "Heritage", "Old Goa", 100, "Morning", 3,
                        "UNESCO-listed Basilica of Bom Jesus and the tall Se Cathedral."),
                h("Fontainhas Latin Quarter", "Heritage", "Panaji", 0, "Afternoon", 2,
                        "Colourful narrow lanes of the old Portuguese town."),
                h("Dudhsagar Falls", "Nature", "Interior", 600, "Morning", 5,
                        "One of India's tallest waterfalls, best seen between the monsoons."),
                h("Anjuna Flea Market", "Shopping", "Anjuna", 0, "Afternoon", 2,
                        "Saturday market of stalls, music and textiles."),
                h("Chapora Fort", "Heritage", "Vagator", 0, "Sunset", 2,
                        "Laterite ruin on a headland with wide sea views.")));
        d.setActivities(List.of(
                a("Water sports at Baga", "Adventure", 700, "2 hours", "Parasailing, jet ski and banana boat."),
                a("Dolphin trip", "Nature", 900, "2 hours", "Morning boat trip from Sinquerim."),
                a("Casino evening", "Nightlife", 1200, "3 hours", "Late-night gaming at a licensed casino."),
                a("Goan food walk", "Food", 900, "2 hours", "Try fish curry rice, poi and bebinca."),
                a("Mandovi river cruise", "Nature", 500, "1 hour", "Sunset dolphin-spotting cruise."),
                a("Ayurvedic spa treatment", "Relaxation", 1500, "2 hours", "Traditional Kerala-style massage.")));
        return d;
    }

    private static Destination jaipur() {
        Destination d = base("jaipur", "Jaipur", "Rajasthan", 26.9124, 75.7873,
                List.of("Heritage", "Food", "Shopping"), 2800, 3);
        d.setSummary("Pink-walled old city with hilltop forts, stepwells, palaces and bazaars.");
        d.setBestMonths(List.of("October", "November", "December", "January", "February", "March"));
        d.setClimate("Hot and dry. Summer temperatures above 42C make sightseeing difficult; winters are ideal.");
        d.setBestTimeToVisit("October to March, with the famous Jaipur Literature Festival in January.");
        d.setHowToReach("Direct flights to Jaipur from Delhi, Mumbai and Bengaluru; railway hub on the Delhi-Mumbai line.");
        d.setHighlights(List.of(
                h("Amber Fort", "Heritage", "Amer", 500, "Morning", 4,
                        "Hilltop fort with the mirrored Sheesh Mahal and the Maota Lake view."),
                h("Hawa Mahal", "Heritage", "City centre", 200, "Morning", 1,
                        "Five-storey honeycomb facade; best light at sunrise."),
                h("City Palace", "Heritage", "City centre", 400, "Afternoon", 3,
                        "Still-used royal residence with courtyards, gates and an armoury."),
                h("Jantar Mantar", "Heritage", "City centre", 200, "Afternoon", 1,
                        "Eighteenth-century observatory of monumental masonry instruments."),
                h("Albert Hall Museum", "Heritage", "Ram Niwas", 150, "Afternoon", 2,
                        "The oldest museum in Rajasthan, in a striped red and white building."),
                h("Johari Bazaar", "Shopping", "Old city", 0, "Evening", 2,
                        "Gemstone and jewellery bazaar; the traditional heart of the walled city."),
                h("Nahargarh Fort", "Heritage", "Aravalli hills", 300, "Sunset", 2,
                        "Hill fort giving the classic panoramic view over the pink city."),
                h("Chokhi Dhani", "Culture", "Sanganer", 700, "Evening", 3,
                        "Rajasthani village theme park with folk performances and a royal feast.")));
        d.setActivities(List.of(
                a("Block printing workshop", "Culture", 600, "2 hours", "Print your own fabric with natural dyes."),
                a("Rajasthani thali dinner", "Food", 700, "2 hours", "Dal baati churma with folk music."),
                a("Gemstone polishing demo", "Shopping", 400, "1 hour", "Learn how Jaipur stones are cut and set."),
                a("Heritage walk in the walled city", "Culture", 500, "2 hours", "Guided walk through the old bazaars."),
                a("Hot air ballooning", "Adventure", 8500, "3 hours", "Sunrise flight over Amer and the Aravallis."),
                a("Kite flying at rooftop", "Culture", 300, "1 hour", "Join the locals on a Jaipur rooftop.")));
        return d;
    }

    private static Destination ranthambore() {
        Destination d = base("ranthambore", "Ranthambore", "Rajasthan", 26.0173, 76.5026,
                List.of("Wildlife", "Nature", "Photography"), 3100, 4);
        d.setSummary("Tiger reserve forest, ruined fort inside the park and some of India's best wildlife photography.");
        d.setBestMonths(List.of("October", "November", "December", "January", "February", "March", "April"));
        d.setClimate("Extremely hot in summer. Wildlife gathers at waterholes during the dry months.");
        d.setBestTimeToVisit("October to April for sightings; February to April for the clearest light and highest density.");
        d.setHowToReach("Nearest airport Jaipur (about 2 hours); trains to Sawai Madhopur, then a short taxi.");
        d.setHighlights(List.of(
                h("Ranthambore Fort", "Heritage", "Inside the park", 600, "Morning", 2,
                        "Sixteenth-century fort ruins standing inside the reserve."),
                h("Kankaria Lake", "Nature", "Sawai Madhopur", 0, "Evening", 1,
                        "Bird sanctuary lake with large flocks of migratory birds."),
                h("Padmavati area", "Wildlife", "Buffer zone", 0, "Dawn", 3,
                        "Marsh habitat with good birding and occasional tiger movement."),
                h("Bishnupur village", "Culture", "Buffer zone", 0, "Afternoon", 2,
                        "Guided village walk on local crafts and farming life."),
                h("Chittorgarh Fort", "Heritage", "Chittorgarh", 40, "Afternoon", 3,
                        "Massive hill and water fort, an easy stop on the drive."),
                h("Surajkund Mela", "Culture", "Narnaul", 100, "Seasonal", 4,
                        "Craft fair held each February with artisans from across India.")));
        d.setActivities(List.of(
                a("Dawn safari jeep", "Wildlife", 1800, "3 hours", "Core-zone morning drive."),
                a("Afternoon safari jeep", "Wildlife", 1800, "3 hours", "Second jeep slot after lunch."),
                a("Birdwatching hide walk", "Nature", 600, "2 hours", "Binocular walk in the Padmavati area."),
                a("Village craft walk", "Culture", 500, "2 hours", "Meet potters and weavers."),
                a("Nature photography session", "Photography", 1200, "3 hours", "Guided shots of birds and light."),
                a("Camel cart ride at sunset", "Culture", 400, "1 hour", "Short ride near the park boundary.")));
        return d;
    }

    private static Destination munnar() {
        Destination d = base("munnar", "Munnar", "Kerala", 10.0889, 77.0595,
                List.of("Mountains", "Nature", "Food"), 2600, 4);
        d.setSummary("Endless tea terraces, misty hill stations, waterfalls and spice plantations in the Western Ghats.");
        d.setBestMonths(List.of("September", "October", "November", "December", "January", "February", "March"));
        d.setClimate("Cool and misty all year, with heavy monsoon from June to August.");
        d.setBestTimeToVisit("September to March; November to February is clearest and coldest.");
        d.setHowToReach("Drive from Kochi (about 3.5 hours) or Cochin airport; nearest railway Aluva or Ernakulam.");
        d.setHighlights(List.of(
                h("Tea Museum & Nallathanni tea estate", "Nature", "Munnar town", 150, "Morning", 2,
                        "Working factory where plucked leaves are processed."),
                h("Kolukkumalai viewpoint", "Nature", "Kolahalam", 0, "Sunrise", 3,
                        "Highest tea-estate viewpoint in Munnar, above the cloud line."),
                h("Eravikulam National Park", "Wildlife", "Munnar", 150, "Morning", 3,
                        "Home of the endangered Nilgiri tahr, set inside a national park."),
                h("Attukal and Lakkam waterfalls", "Nature", "Munnar", 50, "Afternoon", 2,
                        "Two easy falls a short drive from the town."),
                h("Mattupetty Dam", "Nature", "Suryanelli", 0, "Afternoon", 2,
                        "Boating on a hill lake surrounded by wooded slopes."),
                h("Spice plantation tour", "Culture", "Vannamanam", 300, "Afternoon", 2,
                        "Guided walk through cardamom, pepper and clove beds."),
                h("Echo Point", "Nature", "Road town", 0, "Evening", 1,
                        "Roadside point that literally echoes, with valley views."),
                h("Top Station", "Nature", "Kottayam", 0, "Morning", 2,
                        "Highest motorable point in Munnar on the Kerala-Tamil Nadu border.")));
        d.setActivities(List.of(
                a("Tea plantation walk", "Nature", 500, "2 hours", "Walk the terraces with a guide."),
                a("Spice cooking class", "Food", 800, "3 hours", "Cook with estate-grown spices."),
                a("Camping at an eco-lodge", "Nature", 1200, "overnight", "Tent stay on a plantation edge."),
                a("Ayurvedic massage", "Relaxation", 900, "1 hour", "Kerala-style oil massage."),
                a("Mountain cycling route", "Adventure", 600, "3 hours", "Quiet roads between the estates."),
                a("Elephant camp visit", "Wildlife", 300, "1 hour", "Bathing and feeding at Punnathur Kotta.")));
        return d;
    }

    private static Destination portBlair() {
        Destination d = base("port-blair", "Port Blair", "Andaman and Nicobar Islands", 11.6234, 92.7265,
                List.of("Islands", "Beaches", "Nature"), 6500, 5);
        d.setSummary("Island capital, Cellular Jail history, glass-bottom reef boats and day trips to Havelock and Neil.");
        d.setBestMonths(List.of("October", "November", "December", "January", "February", "March", "April"));
        d.setClimate("Tropical, warm and humid all year with a monsoon season; the sea is swimmable for most of the year.");
        d.setBestTimeToVisit("October to May; December to February has the calmest water and clearest skies.");
        d.setHowToReach("Direct flights from Chennai, Bengaluru and Delhi to Veer Savarkar International Airport.");
        d.setHighlights(List.of(
                h("Cellular Jail", "Heritage", "Ross Island", 50, "Morning", 3,
                        "Colonial prison where India's political prisoners were exiled; night sound-and-light show."),
                h("Radhanagar Beach", "Beaches", "Havelock", 0, "Sunset", 3,
                        "Often ranked among Asia's best beaches, fringed by forest."),
                h("Elephant Beach", "Beaches", "Havelock", 500, "Morning", 3,
                        "Reef snorkelling and glass-bottom boat ride from a wooden jetty."),
                h("Natural Bridge", "Nature", "Neil Island", 0, "Afternoon", 2,
                        "Rock arch over a tidal channel on the quieter Neil Island."),
                h("Ross Island", "Heritage", "Port Blair", 100, "Afternoon", 2,
                        "Abandoned colonial town reachable only by boat from the main pier."),
                h("Marina Beach", "Beaches", "Port Blair", 0, "Evening", 2,
                        "The main promenade, with a well-lit evening road."),
                h("Water sports complex", "Adventure", "Port Blair", 500, "Afternoon", 2,
                        "Kayak, banana ride and jet-ski at the Duck Island complex.")));
        d.setActivities(List.of(
                a("Island-hopping boat tour", "Islands", 3500, "Full day", "Havelock and Neil Island day trip."),
                a("Snorkelling at Elephant Beach", "Adventure", 1800, "2 hours", "Coral reef snorkelling with gear."),
                a("Scuba diving", "Adventure", 4500, "3 hours", "PADI discovery dive for beginners."),
                a("Cellular Jail light and sound show", "Heritage", 300, "1 hour",
                        "Evening projection telling the prison's history."),
                a("Kayaking", "Adventure", 600, "1 hour", "Paddle around the calm harbour waters."),
                a("Island hopping to Neil Island", "Islands", 1500, "Half day", "Ferry ride to the quieter island.")));
        return d;
    }

    private static Destination coorg() {
        Destination d = base("coorg", "Coorg", "Karnataka", 12.3375, 75.8069,
                List.of("Mountains", "Nature", "Food"), 2400, 3);
        d.setSummary("Coffee estates, forest trails, waterfalls and homestays in the Karnataka hill country.");
        d.setBestMonths(List.of("October", "November", "December", "January", "February", "March"));
        d.setClimate("Mild and cool through most of the year; very heavy monsoon from June to September.");
        d.setBestTimeToVisit("October to March, with December to February pleasantly cool and dry.");
        d.setHowToReach("Drive from Bengaluru (about 5 hours) or Mangalore; nearest rail Madikeri.");
        d.setHighlights(List.of(
                h("Abbey Falls", "Nature", "Abbey", 200, "Morning", 2,
                        "Wide waterfall in a coffee-estate setting with a swimming pool below."),
                h("Dubare Elephant Camp", "Wildlife", "Dubare", 300, "Morning", 3,
                        "River-side elephant camp that feeds and bathes the herd."),
                h("Talakaveri", "Heritage", "Talakaveri", 0, "Morning", 2,
                        "Sacred source of the Kaveri river with a small temple tank."),
                h("Namdroling Monastery", "Heritage", " Bylakuppe", 0, "Morning", 2,
                        "Largest Nyingma monastery in India, with golden temple buildings."),
                h("Coffee plantation stay", "Culture", "Madikeri", 0, "Afternoon", 3,
                        "Walk the estate and taste the local Arabica beans."),
                h("Iruppu Falls", "Nature", "Iruppu", 200, "Morning", 2,
                        "Four-tiered waterfall, ideal after the monsoon."),
                h("Madikeri fort", "Heritage", "Madikeri", 100, "Evening", 1,
                        "Hilltop fort with a museum and a view over the Kodagu valley.")));
        d.setActivities(List.of(
                a("Coffee plantation tour and tasting", "Food", 400, "2 hours", "From cherry to cup."),
                a("Estate homestay", "Food", 2200, "per night", "Home-cooked Kodava food."),
                a("Jeep safari at Dubare", "Wildlife", 900, "2 hours", "River crossing to see the herd."),
                a("Coffee plantation trek", "Nature", 600, "3 hours", "Guided walk through the estate."),
                a("Local Kodava food tasting", "Food", 550, "1.5 hours", "Kachampuli and pandi curry."),
                a("River rafting at Barapole", "Adventure", 700, "2 hours", "Grade 2 rapids on the Kaveri.")));
        return d;
    }

    private static Destination varanasi() {
        Destination d = base("varanasi", "Varanasi", "Uttar Pradesh", 25.3176, 82.9739,
                List.of("Heritage", "Pilgrimage", "Food", "Culture"), 1900, 2);
        d.setSummary("One of the world's oldest continuously lived-in cities, on the Ganga, with Ghat rituals at dawn.");
        d.setBestMonths(List.of("October", "November", "December", "January", "February", "March"));
        d.setClimate("Extreme summer heat from April to June; misty and cool in winter.");
        d.setBestTimeToVisit("October to March. The Kumbh Mela in January or February is the busiest period.");
        d.setHowToReach("Direct and frequent flights to Varanasi airport; a major railway junction on the Delhi-Kolkata line.");
        d.setHighlights(List.of(
                h("Dashashwamedh Ghat", "Heritage", "Old city", 0, "Sunrise", 2,
                        "The main bathing ghat, lit by hundreds of oil lamps at dusk."),
                h("Kashi Vishwanath Temple", "Heritage", "Old city", 250, "Early morning", 2,
                        "The city's main Shiva temple; the corridor is busiest before dawn."),
                h("Manikarnika Ghat", "Heritage", "Old city", 0, "Evening", 1,
                        "The cremation ghat, lit by hundreds of flames after dark."),
                h("Sarnath", "Heritage", "Outskirts", 200, "Morning", 3,
                        "Where the Buddha first preached, with the Dhamek and Ashokan pillars."),
                h("Assi Ghat", "Heritage", "South bank", 0, "Sunrise", 1,
                        "Quiet southern ghat popular for sunrise yoga and boat rides."),
                h("Saraswati Temple", "Heritage", "Durga Kund", 0, "Afternoon", 1,
                        "Temple on the edge of a tank said to be the goddess's birthplace."),
                h("Alleppey backwaters", "Culture", "Kerala day trip", 0, "Full day", 8,
                        "Optional overnight houseboat stay on the Kerala backwaters, about 2 hours away.")));
        d.setActivities(List.of(
                a("Sunrise Ganga boat ride", "Culture", 300, "2 hours", "Dawn row past the ghats."),
                a("Ganga evening aarti", "Culture", 0, "1 hour", "Chanting and lamps at dusk."),
                a("Kashi silk and textile walk", "Shopping", 400, "2 hours", "Weaving lanes behind the ghats."),
                a("Banarasi food trail", "Food", 600, "2 hours", "Kachori, chaat and jalebi."),
                a("Sarnath half-day tour", "Heritage", 800, "4 hours", "Buddhist site with a guide."),
                a("Photographic walking tour", "Culture", 900, "3 hours", "Early-morning streets and rooftops.")));
        return d;
    }

    private static Destination hampi() {
        Destination d = base("hampi", "Hampi", "Karnataka", 15.3350, 76.4600,
                List.of("Heritage", "Nature", "Adventure"), 2000, 3);
        d.setSummary("Vast Vijayanagara ruins, giant boulder landscape and Tungabhadra river coracle rides.");
        d.setBestMonths(List.of("October", "November", "December", "January", "February"));
        d.setClimate("Very hot from March to June; clear and comfortable through the winter.");
        d.setBestTimeToVisit("October to February, with early morning and evening light best for photography.");
        d.setHowToReach("Nearest airport Hubli (about 2.5 hours); Hampi village is a 20 minute drive from the ruins.");
        d.setHighlights(List.of(
                h("Virupaksha Temple", "Heritage", "Central group", 0, "Morning", 2,
                        "Still-active temple tower, 50 metres tall, in the centre of the ruins."),
                h("Vittala Temple", "Heritage", "Central group", 0, "Midday", 2,
                        "Famous stone chariot and musical pillars that ring when tapped."),
                h("Matanga Hill", "Nature", "Above the ruins", 0, "Sunrise", 2,
                        "Climb for the classic sunrise panorama over the boulder landscape."),
                h("Lotus Mahal", "Heritage", "Royal enclosure", 25, "Morning", 1,
                        "Lotus-shaped pavilion with two storeys on a raised base."),
                h("Elephant Stables", "Heritage", "Royal enclosure", 25, "Afternoon", 1,
                        "Eleven domed royal stables with domed domes."),
                h("Hampi Bazaar", "Shopping", "South of centre", 0, "Late afternoon", 1,
                        "Long colonnaded market street with a tower at one end."),
                h("Anegundi", "Nature", "Tungabhadra bank", 0, "Evening", 2,
                        "Tranquil village across the river with a quieter view of the ruins.")));
        d.setActivities(List.of(
                a("Coracle ride on the Tungabhadra", "Adventure", 600, "1 hour", "Round coracle with the boatman."),
                a("Matanga Hill sunrise trek", "Adventure", 0, "2 hours", "Rough stone steps to the viewpoint."),
                a("Cliff jump at Tungabhadra", "Adventure", 500, "2 hours", "Seasonal, with guide supervision."),
                a("Kannada cuisine lunch", "Food", 500, "1.5 hours", "Local thali in a heritage building."),
                a("Bouldering and cycling", "Adventure", 800, "3 hours", "Hire a cycle to the boulder fields."),
                a("Temple town heritage walk", "Heritage", 700, "3 hours", "Guide through the five groups.")));
        return d;
    }

    private static Destination rishikesh() {
        Destination d = base("rishikesh", "Rishikesh", "Uttarakhand", 30.0869, 78.2676,
                List.of("Mountains", "Adventure", "Nature", "Pilgrimage"), 2200, 3);
        d.setSummary("Yoga capital on the Ganga, Himalayan foothills, white-water rafting and ashram life.");
        d.setBestMonths(List.of("March", "April", "May", "June", "September", "October", "November"));
        d.setClimate("Pleasant in autumn and spring; smoky and cold in winter, and the river gets dangerously cold in summer.");
        d.setBestTimeToVisit("March to June and September to November for warm rafting weather and clear views.");
        d.setHowToReach("Train or road from Delhi (about 5 hours); nearest airport Dehradun, 1 hour away. Jolly Grant airport is 20 minutes away.");
        d.setHighlights(List.of(
                h("Lakshman Jhula", "Heritage", "Main ghat area", 0, "Sunset", 2,
                        "Suspension bridge over the Ganga, busy with sadhus and pilgrims."),
                h("Triveni Ghat", "Heritage", "Ganga", 0, "Sunrise", 1,
                        "Where the evening Ganga aarti is performed on the riverbank."),
                h("Parmarth Niketan", "Pilgrimage", "Ganga", 0, "Afternoon", 1,
                        "Riverfront ashram with a well-known evening chanting session."),
                h("Beatles Ashram", "Heritage", "Outskirts", 100, "Morning", 2,
                        "Former meditation retreat of the Beatles, now a visitor centre."),
                h("Neelkanth Mahadev Temple", "Pilgrimage", "Hillside", 0, "Morning", 2,
                        "Hilltop Shiva temple reached by a 13 km forest walk or a jeep ride."),
                h("Kunjapuri Sunrise Point", "Nature", "Hillside", 0, "Sunrise", 2,
                        "Panoramic Himalayan sunrise and snow peak views."),
                h("Coriander Batch", "Food", "Tapovan", 0, "Afternoon", 1,
                        "Outdoor cafe and vegan bakery on the river side.")));
        d.setActivities(List.of(
                a("River rafting, 26 km", "Adventure", 1200, "4 hours", "Grade II-IV with camping."),
                a("Morning yoga class", "Pilgrimage", 500, "2 hours", "Sunrise session on the ghat."),
                a("Bungee jumping", "Adventure", 3500, "2 hours", "At the 233 m cliff in Rishikesh."),
                a("Trek to Neelkanth", "Adventure", 700, "5 hours", "Forest walk up to the temple."),
                a("Meditation retreat day", "Pilgrimage", 900, "Full day", "Half-day residential programme."),
                a("Ganga river-side camp", "Nature", 1100, "overnight", "Riverside tent camp with dinner.")));
        return d;
    }
}
