package com.roamstead;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class RoamsteadApplication {

    public static void main(String[] args) {
        SpringApplication.run(RoamsteadApplication.class, args);
    }
}
