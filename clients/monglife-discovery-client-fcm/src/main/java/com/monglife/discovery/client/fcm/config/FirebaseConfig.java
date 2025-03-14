package com.monglife.discovery.client.fcm.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.account.filepath}")
    private String FIREBASE_ACCOUNT_FILE_PATH;

    @Value("${firebase.package-name}")
    private String FIREBASE_PACKAGE_NAME;

    @Bean
    @ConditionalOnMissingBean(FirebaseApp.class)
    public FirebaseApp firebaseApp() throws IOException {

        InputStream inputStream = new ClassPathResource(FIREBASE_ACCOUNT_FILE_PATH).getInputStream();
        GoogleCredentials credentials = GoogleCredentials.fromStream(inputStream);

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(credentials)
                .build();

        FirebaseApp app;

        if (FirebaseApp.getApps().isEmpty()) {
            app = FirebaseApp.initializeApp(options, FIREBASE_PACKAGE_NAME);
        } else {
            app = FirebaseApp.getApps().get(0);
        }

        return app;
    }

    @Bean
    public FirebaseMessaging firebaseMessaging(FirebaseApp firebaseApp) {
        return FirebaseMessaging.getInstance(firebaseApp);
    }
}
