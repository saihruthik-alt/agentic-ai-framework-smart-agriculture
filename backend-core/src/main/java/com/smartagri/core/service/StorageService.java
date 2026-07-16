package com.smartagri.core.service;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@Slf4j
public class StorageService {

    @Autowired(required = false)
    private MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucketName;

    @Value("${minio.endpoint}")
    private String minioEndpoint;

    private final String localUploadDir = "/Users/saihruthik/.gemini/antigravity/scratch/agentic-ai-framework-smart-agriculture/uploads";

    public String uploadImage(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload empty file");
        }

        // Validate content type is image
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image uploads are allowed");
        }

        String extension = getFileExtension(file.getOriginalFilename());
        String uniqueFilename = UUID.randomUUID().toString() + extension;

        // Try MinIO upload first if available
        if (minioClient != null) {
            try (InputStream is = file.getInputStream()) {
                minioClient.putObject(
                        PutObjectArgs.builder()
                                .bucket(bucketName)
                                .object(uniqueFilename)
                                .stream(is, file.getSize(), -1)
                                .contentType(contentType)
                                .build()
                );
                String objectUrl = minioEndpoint + "/" + bucketName + "/" + uniqueFilename;
                log.info("Uploaded to MinIO: {}", objectUrl);
                return objectUrl;
            } catch (Exception e) {
                log.warn("MinIO upload failed ({}), falling back to local storage...", e.getMessage());
            }
        }

        // Fallback: Local File System storage
        try {
            File uploadFolder = new File(localUploadDir);
            if (!uploadFolder.exists()) {
                uploadFolder.mkdirs();
            }

            Path targetPath = Paths.get(localUploadDir).resolve(uniqueFilename);
            try (InputStream is = file.getInputStream()) {
                Files.copy(is, targetPath, StandardCopyOption.REPLACE_EXISTING);
            }
            // Local serving mock URL (would be resolved via static resources config in production)
            String localUrl = "/api/v1/media/view/" + uniqueFilename;
            log.info("Saved file locally: {}", localUrl);
            return localUrl;
        } catch (Exception e) {
            log.error("Failed to store file locally", e);
            throw new RuntimeException("Could not store the file. Error: " + e.getMessage());
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null) return ".jpg";
        int lastIndex = filename.lastIndexOf('.');
        return lastIndex == -1 ? ".jpg" : filename.substring(lastIndex);
    }
}
