package com.monglife;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class GatewayApplication {

	public static void main(String[] args) {

		System.setProperty("spring.config.name", "application,client,domain");

		SpringApplication.run(GatewayApplication.class, args);
	}

}
