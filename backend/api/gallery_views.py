from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import GeneratedImage, ImageFeedback, GalleryCollection, GalleryImage
from .serializers import GeneratedImageSerializer, ImageFeedbackSerializer, GalleryCollectionSerializer


class GeneratedImageViewSet(viewsets.ModelViewSet):
    """API endpoints for viewing and managing generated images"""
    serializer_class = GeneratedImageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return images for current user"""
        return GeneratedImage.objects.filter(user=self.request.user).order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def favorites(self, request):
        """Get user's favorited images"""
        favorites = self.get_queryset().filter(is_favorited=True)
        serializer = self.get_serializer(favorites, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def toggle_favorite(self, request, pk=None):
        """Toggle favorite status of an image"""
        image = self.get_object()
        image.is_favorited = not image.is_favorited
        image.save()
        return Response({'is_favorited': image.is_favorited})
    
    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """Like an image"""
        image = self.get_object()
        image.likes_count += 1
        image.save()
        return Response({'likes_count': image.likes_count})
    
    @action(detail=False, methods=['get'])
    def filter_by_aspect_ratio(self, request):
        """Filter images by aspect ratio"""
        aspect_ratio = request.query_params.get('ratio')
        if aspect_ratio:
            images = self.get_queryset().filter(aspect_ratio=aspect_ratio)
            serializer = self.get_serializer(images, many=True)
            return Response(serializer.data)
        return Response({'error': 'aspect_ratio parameter required'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search images by prompt"""
        query = request.query_params.get('q')
        if query:
            images = self.get_queryset().filter(Q(prompt__icontains=query))
            serializer = self.get_serializer(images, many=True)
            return Response(serializer.data)
        return Response({'error': 'q parameter required'}, status=status.HTTP_400_BAD_REQUEST)


class ImageFeedbackViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoints for AI-generated image feedback"""
    serializer_class = ImageFeedbackSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return feedback for user's images"""
        return ImageFeedback.objects.filter(image__user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def generate_feedback(self, request):
        """Generate AI feedback for an image"""
        image_id = request.data.get('image_id')
        if not image_id:
            return Response({'error': 'image_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        image = get_object_or_404(GeneratedImage, id=image_id, user=request.user)
        
        # Check if feedback already exists
        feedback, created = ImageFeedback.objects.get_or_create(image=image)
        
        # TODO: Call Gemini API to generate actual feedback
        # For now, return existing feedback
        
        serializer = self.get_serializer(feedback)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class GalleryCollectionViewSet(viewsets.ModelViewSet):
    """API endpoints for gallery collections"""
    serializer_class = GalleryCollectionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return collections for current user"""
        return GalleryCollection.objects.filter(user=self.request.user).order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create collection for current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_image(self, request, pk=None):
        """Add an image to a collection"""
        collection = self.get_object()
        image_id = request.data.get('image_id')
        
        if not image_id:
            return Response({'error': 'image_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        image = get_object_or_404(GeneratedImage, id=image_id, user=request.user)
        
        # Add image to collection
        gallery_image, created = GalleryImage.objects.get_or_create(
            collection=collection,
            image=image,
            defaults={'order': collection.images.count()}
        )
        
        return Response(
            {'created': created, 'message': 'Image added to collection' if created else 'Image already in collection'},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def remove_image(self, request, pk=None):
        """Remove an image from a collection"""
        collection = self.get_object()
        image_id = request.data.get('image_id')
        
        if not image_id:
            return Response({'error': 'image_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        gallery_image = get_object_or_404(GalleryImage, collection=collection, image_id=image_id)
        gallery_image.delete()
        
        return Response({'message': 'Image removed from collection'})
    
    @action(detail=True, methods=['get'])
    def images(self, request, pk=None):
        """Get all images in a collection"""
        collection = self.get_object()
        gallery_images = collection.images.all().order_by('gallery_images__order')
        
        from .serializers import GalleryImageSerializer
        serializer = GalleryImageSerializer(gallery_images, many=True)
        return Response(serializer.data)
