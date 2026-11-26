package com.roamstead.service;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.function.Predicate;

/**
 * Creates booking references such as {@code RS-K7Q4M9PX}.
 * <p>
 * 8 random characters from a 31-symbol alphabet give ~852 billion combinations,
 * so references cannot be guessed. Look-alike characters (0/O, 1/I/L) are left
 * out because guests often read references aloud or type them from a phone.
 */
@Component
public class ReferenceGenerator {

    static final String PREFIX = "RS-";
    private static final char[] ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789".toCharArray();
    private static final int LENGTH = 8;
    private static final int MAX_ATTEMPTS = 10;

    private final SecureRandom random = new SecureRandom();

    /** Returns a reference for which {@code taken} is false. */
    public String next(Predicate<String> taken) {
        for (int i = 0; i < MAX_ATTEMPTS; i++) {
            String candidate = randomReference();
            if (!taken.test(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Could not generate a unique booking reference");
    }

    String randomReference() {
        StringBuilder sb = new StringBuilder(PREFIX);
        for (int i = 0; i < LENGTH; i++) {
            sb.append(ALPHABET[random.nextInt(ALPHABET.length)]);
        }
        return sb.toString();
    }
}
