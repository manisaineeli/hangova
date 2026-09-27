package com.hangova.trip.config;

import java.util.List;

import com.hangova.trip.catalog.DestinationCatalog;
import com.hangova.trip.model.Destination;
import com.hangova.trip.repo.DestinationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Seeds the destination catalogue on first start. Existing records are left
 * alone so administrator edits are never overwritten.
 */
@Configuration
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    @Bean
    CommandLineRunner seedDestinations(DestinationRepository repo) {
        return args -> {
            List<Destination> catalogue = DestinationCatalog.all();
            int created = 0;
            for (Destination d : catalogue) {
                if (repo.findBySlugIgnoreCase(d.getSlug()).isEmpty()) {
                    repo.save(d);
                    created++;
                }
            }
            if (created > 0) {
                log.info("Seeded {} destinations into the catalogue ({} already existed)", created,
                        catalogue.size() - created);
            }
            log.info("Destination catalogue ready with {} active destinations",
                    repo.findByActiveTrue().size());
        };
    }
}
