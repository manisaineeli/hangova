package com.hangova.booking.web;

import java.util.List;
import java.util.Map;

import com.hangova.booking.security.Caller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Weather for the booking screens, served from the Trip Service so travellers
 * see the forecast for the exact destination and dates they are booking.
 */
@RestController
@RequestMapping("/api/availability")
public class AvailabilityController {

    private final WeatherProxy weather;
    private final Caller caller;

    public AvailabilityController(WeatherProxy weather, Caller caller) {
        this.weather = weather;
        this.caller = caller;
    }

    @GetMapping("/weather")
    public Map<String, Object> weather(@RequestParam String destination,
                                       @RequestParam(required = false, defaultValue = "5") int days) {
        return weather.forDestination(destination, days);
    }

    /** One call that gives the booking screen everything it needs. */
    @GetMapping("/bundle")
    public Map<String, Object> bundle(@RequestParam String destination,
                                      @RequestParam(required = false, defaultValue = "5") int days,
                                      @RequestParam(required = false, defaultValue = "2") int travellers) {
        return Map.of(
                "destination", destination,
                "weather", weather.forDestination(destination, days),
                "note", "Hotels and transport are fetched separately so the UI can show them as they load",
                "suggestedProviders", List.of("catalogue", "open-meteo"),
                "requestedBy", caller.email());
    }
}
