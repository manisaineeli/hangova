package com.hangova.user.config;

import java.util.List;

import com.hangova.user.model.User;
import com.hangova.user.repo.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Creates the two accounts needed to review the system:
 * an administrator (who acts as the nominee for the borrowing feature) and a
 * demo traveller. Runs only when the accounts do not already exist.
 */
@Configuration
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    @Bean
    CommandLineRunner seedAccounts(UserRepository users, PasswordEncoder encoder) {
        return args -> {
            if (!users.existsByEmailIgnoreCase("admin@hangova.ai")) {
                User admin = new User();
                admin.setEmail("admin@hangova.ai");
                admin.setFullName("System Administrator");
                admin.setPasswordHash(encoder.encode("admin123"));
                admin.setRole("ADMIN");
                admin.setPhone("9000000000");
                admin.setHomeCity("Hyderabad");
                admin.setInterests(List.of("Heritage", "Food"));
                admin.setLoanEligible(true);
                users.save(admin);
                log.info("Seeded administrator account admin@hangova.ai / admin123");
            }

            if (!users.existsByEmailIgnoreCase("demo@hangova.ai")) {
                User demo = new User();
                demo.setEmail("demo@hangova.ai");
                demo.setFullName("Demo Traveller");
                demo.setPasswordHash(encoder.encode("demo123"));
                demo.setRole("USER");
                demo.setPhone("9812345670");
                demo.setHomeCity("Hyderabad");
                demo.setInterests(List.of("Mountains", "Heritage"));
                demo.setDefaultTravellers(2);
                demo.setDefaultBudget(60000);
                demo.setDefaultDays(4);
                users.save(demo);
                log.info("Seeded demo traveller demo@hangova.ai / demo123");
            }
        };
    }
}
