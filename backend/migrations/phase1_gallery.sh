#!/bin/bash

# Deckoviz Backend - Phase 1 Database Migration Script
# Creates GeneratedImage, ImageFeedback, and GalleryCollection tables

echo "Running Phase 1 Database Migrations..."

# Navigate to backend directory
cd "$(dirname "$0")"

# Run Django migrations
python manage.py makemigrations api
python manage.py migrate api

echo "Phase 1 migrations complete!"
echo ""
echo "Created tables:"
echo "  - GeneratedImage: Store all generated images with metadata"
echo "  - ImageFeedback: AI-generated feedback on images"
echo "  - GalleryCollection: Collections for organizing generated images"
echo "  - GalleryImage: Many-to-many relationship for collection membership"
