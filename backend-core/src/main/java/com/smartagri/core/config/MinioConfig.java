package com.smartagri.core.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class MinioConfig {

    @Value("${minio.endpoint}")
    private String endpoint;

    @Value("${minio.access-key}")
    private String accessKey;

    @Value("${minio.secret-key}")
    private String secretKey;

    @Value("${minio.bucket}")
    private String bucketName;

    @Bean
    public MinioClient minioClient() {
        try {
            MinioClient client = MinioClient.builder()
                    .endpoint(endpoint)
                    .credentials(accessKey, secretKey)
                    .build();

            // Auto-create bucket on startup if it doesn't exist
            boolean found = client.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (!found) {
                client.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
                log.info("MinIO bucket '{}' successfully created.", bucketName);
            } else {
                log.info("MinIO bucket '{}' already exists.", bucketName);
            }
            return client;
        } catch (Exception e) {
            log.error("Failed to initialize MinIO Client. Storing objects locally or check credentials. Error: {}", e.getMessage());
            // Return null or throw, we'll return client and handle errors gracefully in service
            return null;
        }
    }
}
