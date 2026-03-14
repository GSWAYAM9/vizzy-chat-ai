import os
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from PIL import Image
import hashlib
import mimetypes
from io import BytesIO

class OptimizedMediaUploadHandler:
    """
    Handles optimized multipart form data image uploads.
    No Base64 encoding - direct binary upload for better performance.
    """
    
    ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    IMAGE_QUALITY = 85
    THUMBNAIL_SIZE = (300, 300)
    
    @staticmethod
    def validate_image_file(file_obj):
        """Validate image file type and size"""
        # Check file size
        if file_obj.size > OptimizedMediaUploadHandler.MAX_FILE_SIZE:
            raise ValueError(f"File size exceeds maximum allowed size of 50MB")
        
        # Check file extension
        _, ext = os.path.splitext(file_obj.name.lower())
        if ext not in OptimizedMediaUploadHandler.ALLOWED_EXTENSIONS:
            raise ValueError(f"File type {ext} not allowed. Allowed: {OptimizedMediaUploadHandler.ALLOWED_EXTENSIONS}")
        
        # Verify MIME type
        mime_type, _ = mimetypes.guess_type(file_obj.name)
        if not mime_type or not mime_type.startswith('image/'):
            raise ValueError("File is not a valid image")
        
        return True
    
    @staticmethod
    def process_image(file_obj):
        """
        Process uploaded image: convert to optimized format, create thumbnail
        Returns: (processed_image_path, thumbnail_path, image_data)
        """
        try:
            # Validate file
            OptimizedMediaUploadHandler.validate_image_file(file_obj)
            
            # Open and process image
            img = Image.open(file_obj)
            
            # Convert RGBA to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                img = rgb_img
            
            # Generate unique filename
            file_hash = hashlib.md5(file_obj.read()).hexdigest()
            file_obj.seek(0)
            filename = f"{file_hash}.jpg"
            
            # Save optimized image
            img_io = BytesIO()
            img.save(img_io, format='JPEG', quality=OptimizedMediaUploadHandler.IMAGE_QUALITY, optimize=True)
            img_io.seek(0)
            
            # Save to storage
            image_path = f"images/{filename}"
            default_storage.save(image_path, ContentFile(img_io.read()))
            
            # Create and save thumbnail
            img.thumbnail(OptimizedMediaUploadHandler.THUMBNAIL_SIZE)
            thumb_io = BytesIO()
            img.save(thumb_io, format='JPEG', quality=OptimizedMediaUploadHandler.IMAGE_QUALITY, optimize=True)
            thumb_io.seek(0)
            
            thumb_filename = f"{file_hash}_thumb.jpg"
            thumbnail_path = f"thumbnails/{thumb_filename}"
            default_storage.save(thumbnail_path, ContentFile(thumb_io.read()))
            
            return {
                'original_path': image_path,
                'thumbnail_path': thumbnail_path,
                'filename': filename,
                'size': file_obj.size,
                'width': img.width,
                'height': img.height,
            }
        
        except Exception as e:
            raise Exception(f"Image processing failed: {str(e)}")
    
    @staticmethod
    def get_file_url(file_path):
        """Get URL for stored file"""
        return default_storage.url(file_path)
