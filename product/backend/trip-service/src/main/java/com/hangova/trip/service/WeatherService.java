package com.hangova.trip.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import tools.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * Live weather for the chosen destination, from the Open-Meteo forecast API.
 * <p>
 * Open-Meteo needs no API key, so this works out of the box. If the call fails
 * (offline, rate limited, unknown coordinates) the service degrades to a
 * seasonal estimate derived from the destination and the travel dates, so the
 * itinerary is still produced.
 */
@Service
public class WeatherService {

    private static final Logger log = LoggerFactory.getLogger(WeatherService.class);

    private final RestClient http;
    private final boolean enabled;

    public WeatherService(RestClient.Builder builder,
                          @Value("${hangova.weather.enabled:true}") boolean enabled) {
        this.http = builder.build();
        this.enabled = enabled;
    }

    public record DayWeather(LocalDate date, int code, String description,
                             Double tempMin, Double tempMax, Double rainChance, Double windSpeed) {
    }

    public record Forecast(boolean live, String summary, List<DayWeather> days, String note) {
    }

    /**
     * @param fallbackTempC rough typical daytime temperature used when the live
     *                      call is unavailable, from the destination catalogue
     */
    public Forecast forecast(double lat, double lon, LocalDate start, int days, double fallbackTempC) {
        if (enabled && lat != 0 && lon != 0) {
            try {
                String url = "https://api.open-meteo.com/v1/forecast"
                        + "?latitude=" + lat
                        + "&longitude=" + lon
                        + "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max"
                        + "&timezone=auto&forecast_days=" + Math.min(Math.max(days + 1, 2), 16);

                JsonNode root = http.get().uri(url).retrieve().body(JsonNode.class);
                if (root != null && root.has("daily")) {
                    return parse(root, start, days);
                }
                log.warn("Open-Meteo returned no daily block, falling back");
            } catch (Exception e) {
                log.warn("Live weather unavailable ({}), using seasonal estimate", e.getMessage());
            }
        }
        return offlineForecast(start, days, fallbackTempC);
    }

    private Forecast parse(JsonNode root, LocalDate start, int days) {
        JsonNode daily = root.get("daily");
        List<DayWeather> out = new ArrayList<>();
        for (int i = 0; i < days; i++) {
            if (!daily.has("time") || i >= daily.get("time").size()) {
                break;
            }
            LocalDate date = LocalDate.parse(daily.get("time").get(i).asText());
            int code = daily.get("weather_code").get(i).asInt(0);
            out.add(new DayWeather(
                    date,
                    code,
                    describe(code),
                    daily.get("temperature_2m_min").get(i).asDouble(),
                    daily.get("temperature_2m_max").get(i).asDouble(),
                    daily.has("precipitation_probability_max") ? daily.get("precipitation_probability_max").get(i).asDouble() : null,
                    daily.has("wind_speed_10m_max") ? daily.get("wind_speed_10m_max").get(i).asDouble() : null));
        }
        String summary = out.isEmpty() ? "Forecast unavailable"
                : describe(out.get(0).code()) + " around " + Math.round(out.get(0).tempMax()) + "C"
                + (out.get(0).rainChance() != null && out.get(0).rainChance() > 40
                ? ", with a " + Math.round(out.get(0).rainChance()) + "% chance of rain" : "");
        return new Forecast(true, summary, out, "Live forecast from Open-Meteo");
    }

    private Forecast offlineForecast(LocalDate start, int days, double fallbackTempC) {
        List<DayWeather> out = new ArrayList<>();
        String[] seasons = {"cool and clear", "warm with light cloud", "hot and dry", "mild with a chance of rain"};
        for (int i = 0; i < days; i++) {
            out.add(new DayWeather(
                    start.plusDays(i),
                    -1,
                    seasons[Math.floorMod(start.plusDays(i).getMonthValue(), seasons.length)],
                    fallbackTempC - 6,
                    fallbackTempC + 5,
                    null,
                    null));
        }
        return new Forecast(false,
                "Around " + Math.round(fallbackTempC) + "C for this time of year (estimated)",
                out,
                "Live forecast unavailable, so a seasonal estimate is used");
    }

    /** WMO weather interpretation codes used by Open-Meteo. */
    public static String describe(int code) {
        return switch (code) {
            case 0 -> "Clear sky";
            case 1 -> "Mainly clear";
            case 2 -> "Partly cloudy";
            case 3 -> "Overcast";
            case 45, 48 -> "Fog";
            case 51, 53, 55, 56, 57 -> "Drizzle";
            case 61 -> "Light rain";
            case 63 -> "Rain";
            case 65 -> "Heavy rain";
            case 66, 67 -> "Freezing rain";
            case 71 -> "Light snow";
            case 73 -> "Snow";
            case 75 -> "Heavy snow";
            case 77 -> "Snow grains";
            case 80 -> "Rain showers";
            case 81 -> "Heavy showers";
            case 82 -> "Violent showers";
            case 85, 86 -> "Snow showers";
            case 95 -> "Thunderstorm";
            case 96, 99 -> "Thunderstorm with hail";
            default -> "Mixed conditions";
        };
    }
}
