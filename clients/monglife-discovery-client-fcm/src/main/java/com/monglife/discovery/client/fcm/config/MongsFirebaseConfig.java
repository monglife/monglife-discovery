package com.monglife.discovery.client.fcm.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;

@Configuration
public class MongsFirebaseConfig {

    private static final String APP_NAME                = "mongs";
    private static final String FIREBASE_APP_NAME       = APP_NAME + "FirebaseApp";
    private static final String FIREBASE_MESSAGING_NAME = APP_NAME + "FirebaseMessaging";

    @Value("${firebase." + APP_NAME + ".package-name}")
    private String FIREBASE_PACKAGE_NAME;

    @Value("${firebase." + APP_NAME + ".account.filepath}")
    private String FIREBASE_ACCOUNT_FILE_PATH;

    @Bean(FIREBASE_APP_NAME)
    @ConditionalOnMissingBean(name = FIREBASE_APP_NAME)
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

    @Bean(FIREBASE_MESSAGING_NAME)
    public FirebaseMessaging firebaseMessaging(@Qualifier(FIREBASE_APP_NAME) FirebaseApp firebaseApp) {
        return FirebaseMessaging.getInstance(firebaseApp);
    }
}
