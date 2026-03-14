from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Media, Collection
from .serializers import MediaSerializer
from .upload_handler import OptimizedMediaUploadHandler

class MediaUploadViewSet(viewsets.ViewSet):
    """
    Handle optimized media uploads using multipart form data.
    No Base64 encoding - direct binary upload for best performance.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)
    
    @action(detail=False, methods=['post'], url_path='upload')
    def upload_media(self, request):
        """
        Upload image file using multipart form data.
        
        Request format:
        - Method: POST
        - Content-Type: multipart/form-data
        - Body: file (binary image data) + collection_id (optional)
        
        Response: {
            'id': media_id,
            'url': image_url,
            'thumbnail_url': thumbnail_url,
            'filename': filename,
            'size': file_size,
            'width': image_width,
            'height': image_height
        }
        """
        try:
            if 'file' not in request.FILES:
                return Response(
                    {'error': 'No file provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            file_obj = request.FILES['file']
            collection_id = request.data.get('collection_id', None)
            
            # Process image
            image_data = OptimizedMediaUploadHandler.process_image(file_obj)
            
            # Create Media object
            media = Media.objects.create(
                user=request.user,
                title=request.data.get('title', file_obj.name),
                description=request.data.get('description', ''),
                image_path=image_data['original_path'],
                thumbnail_path=image_data['thumbnail_path'],
                file_size=image_data['size'],
                width=image_data['width'],
                height=image_data['height'],
            )
            
            # Add to collection if provided
            if collection_id:
                try:
                    collection = Collection.objects.get(id=collection_id, user=request.user)
                    collection.media.add(media)
                except Collection.DoesNotExist:
                    return Response(
                        {'error': 'Collection not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            serializer = MediaSerializer(media)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Upload failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='batch-upload')
    def batch_upload(self, request):
        """
        Batch upload multiple files.
        
        Request format:
        - Method: POST
        - Content-Type: multipart/form-data
        - Body: files[] (multiple binary files) + collection_id (optional)
        
        Response: List of uploaded media objects
        """
        try:
            files = request.FILES.getlist('files')
            
            if not files:
                return Response(
                    {'error': 'No files provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            collection_id = request.data.get('collection_id', None)
            uploaded_media = []
            errors = []
            
            for file_obj in files:
                try:
                    # Process each image
                    image_data = OptimizedMediaUploadHandler.process_image(file_obj)
                    
                    # Create Media object
                    media = Media.objects.create(
                        user=request.user,
                        title=file_obj.name,
                        image_path=image_data['original_path'],
                        thumbnail_path=image_data['thumbnail_path'],
                        file_size=image_data['size'],
                        width=image_data['width'],
                        height=image_data['height'],
                    )
                    
                    # Add to collection if provided
                    if collection_id:
                        try:
                            collection = Collection.objects.get(id=collection_id, user=request.user)
                            collection.media.add(media)
                        except Collection.DoesNotExist:
                            pass
                    
                    uploaded_media.append(MediaSerializer(media).data)
                
                except Exception as e:
                    errors.append({
                        'filename': file_obj.name,
                        'error': str(e)
                    })
            
            return Response({
                'uploaded': uploaded_media,
                'errors': errors,
                'total_uploaded': len(uploaded_media),
                'total_errors': len(errors)
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response(
                {'error': f'Batch upload failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def list_media(self, request):
        """List all user media with pagination"""
        media = Media.objects.filter(user=request.user).order_by('-created_at')
        
        # Pagination
        page = request.query_params.get('page', 1)
        page_size = 20
        start = (int(page) - 1) * page_size
        end = start + page_size
        
        serializer = MediaSerializer(media[start:end], many=True)
        
        return Response({
            'count': media.count(),
            'page': page,
            'page_size': page_size,
            'results': serializer.data
        })
