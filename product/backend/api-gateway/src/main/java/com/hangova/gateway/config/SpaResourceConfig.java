package com.hangova.gateway.config;

import java.io.IOException;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.reactive.config.ResourceHandlerRegistry;
import org.springframework.web.reactive.config.WebFluxConfigurer;
import org.springframework.web.reactive.resource.PathResourceResolver;

import reactor.core.publisher.Mono;

/**
 * Serves the built React application alongside the API on the same port.
 *
 * This keeps the whole system on a single origin and a single public URL, which
 * is what a review or a deployment needs. Requests that match an API route are
 * handled by the gateway first; anything else falls through to the static
 * bundle, and unknown paths fall back to index.html so client-side routes such
 * as /bookings work on a hard refresh.
 */
@Configuration
public class SpaResourceConfig implements WebFluxConfigurer {

    private static final String INDEX = "static/index.html";

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Mono<Resource> getResource(String resourcePath, Resource location) {
                        Resource requested;
                        try {
                            requested = location.createRelative(resourcePath);
                        } catch (IOException e) {
                            return Mono.empty();
                        }
                        if (requested.exists() && requested.isReadable()) {
                            return Mono.just(requested);
                        }
                        // a client-side route, not a missing file: serve the shell
                        Resource index = new ClassPathResource(INDEX);
                        return index.exists() ? Mono.just(index) : Mono.empty();
                    }
                });
    }
}
